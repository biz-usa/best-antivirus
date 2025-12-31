
'use server';

import { z } from 'zod';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import type { Discount } from '@/lib/types';
import { serializeForClient } from '@/lib/serializeForClient';

const adminApp = getFirebaseAdminApp();
const db = getFirestore(adminApp);


const discountSchema = z.object({
  code: z.string().min(3, "Mã code phải có ít nhất 3 ký tự.").toUpperCase(),
  type: z.enum(['percentage', 'fixed']),
  value: z.coerce.number().positive("Giá trị phải là số dương."),
  expiresAt: z.date().optional(),
  usageLimit: z.coerce.number().min(0, "Số lượng phải là số không âm.").optional(),
  isActive: z.boolean().default(true),
});

export async function addDiscount(data: z.infer<typeof discountSchema>) {
  const validatedData = discountSchema.parse(data);

  try {
    const discountsCollection = db.collection('discounts');
    const docRef = await discountsCollection.add({
        ...validatedData,
        timesUsed: 0,
        createdAt: FieldValue.serverTimestamp(),
        expiresAt: validatedData.expiresAt ? Timestamp.fromDate(validatedData.expiresAt) : null,
    });
    revalidatePath('/cms/admin/discounts');
    return { id: docRef.id };
  } catch (error) {
    console.error("Error adding discount: ", error);
    throw new Error("Không thể thêm mã giảm giá.");
  }
}

export async function updateDiscount(id: string, data: z.infer<typeof discountSchema>) {
    const validatedData = discountSchema.parse(data);
    const discountRef = db.collection('discounts').doc(id);

    try {
        await discountRef.update({
            ...validatedData,
            expiresAt: validatedData.expiresAt ? Timestamp.fromDate(validatedData.expiresAt) : null,
        });
        revalidatePath('/cms/admin/discounts');
    } catch (error) {
        console.error("Error updating discount: ", error);
        throw new Error("Không thể cập nhật mã giảm giá.");
    }
}

export async function deleteDiscount(id: string) {
    if (!id) throw new Error('Cần có ID mã giảm giá.');
    const discountRef = db.collection('discounts').doc(id);
    try {
        await discountRef.delete();
        revalidatePath('/cms/admin/discounts');
    } catch (error) {
        console.error("Error deleting discount: ", error);
        throw new Error("Không thể xóa mã giảm giá.");
    }
}

export async function getDiscounts(): Promise<Discount[]> {
    const discountsCol = db.collection('discounts');
    const snapshot = await discountsCol.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Discount));
}

export async function getDiscountById(id: string): Promise<Discount | null> {
    const discountRef = db.collection('discounts').doc(id);
    const docSnap = await discountRef.get();
    if (docSnap.exists) {
        return { id: docSnap.id, ...docSnap.data() } as unknown as Discount;
    }
    return null;
}

export async function applyDiscountCode(code: string): Promise<Discount> {
  try {
    const discountsCol = db.collection('discounts');
    const snapshot = await discountsCol.where('code', '==', code.toUpperCase()).get();
    
    if (snapshot.empty) {
        throw new Error("Mã giảm giá không tồn tại.");
    }
    
    const discountDoc = snapshot.docs[0];
    const discount = { id: discountDoc.id, ...discountDoc.data() } as unknown as Discount;

    if (!discount.isActive) {
        throw new Error("Mã giảm giá này không còn hoạt động.");
    }

    if (discount.expiresAt) {
        // Handle admin Timestamp toDate
        const expiresAtVal = (discount.expiresAt as any).toDate ? (discount.expiresAt as any).toDate() : new Date(discount.expiresAt as any);
        const expiresDate = expiresAtVal;
        expiresDate.setHours(23, 59, 59, 999); // Set to end of day to be safe
        
        const today = new Date();

        if (today > expiresDate) {
            throw new Error("Mã giảm giá đã hết hạn.");
        }
    }

    if (discount.usageLimit !== null && discount.usageLimit !== undefined && discount.usageLimit > 0 && discount.timesUsed >= discount.usageLimit) {
        throw new Error("Mã giảm giá đã hết lượt sử dụng.");
    }

    return serializeForClient(discount);
  } catch (error: any) {
      console.error(`Error applying discount code "${code}":`, error);
      if (error.message.includes("Mã giảm giá")) {
          throw error;
      }
      throw new Error("Không thể áp dụng mã giảm giá. Vui lòng thử lại.");
  }
}


export async function incrementDiscountUsage(discountId: string) {
    if (!discountId) return;
    const discountRef = db.collection('discounts').doc(discountId);
    try {
        await discountRef.update({
            timesUsed: FieldValue.increment(1)
        });
    } catch (error) {
        console.error("Error incrementing discount usage:", error);
    }
}
