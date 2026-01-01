

'use server';

import { z } from 'zod';
import { db } from './firebase';
import { collection, addDoc, serverTimestamp, runTransaction, doc, getDoc, setDoc, increment, updateDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { sendOrderConfirmationEmail } from './email';
import { createZaloPayOrder } from './zalopay';
import { getSiteConfig, getUserProfile } from './data';

const placeOrderSchema = z.object({
  customer: z.object({
    id: z.string().optional(),
    name: z.string(),
    email: z.string().email(),
  }),
  items: z.array(z.object({
    id: z.string(),
    name: z.string(),
    quantity: z.number().int().positive(),
    price: z.number(),
    variantId: z.string(),
    variantName: z.string(),
  })),
  subtotal: z.number(),
  vat: z.number(),
  total: z.number(),
  paymentMethod: z.string(),
  discount: z.object({
    id: z.string(),
    code: z.string(),
    value: z.number(), // The calculated discount amount
  }).optional(),
  loyaltyDiscount: z.number().optional(), // Added field
});

export async function placeOrder(data: z.infer<typeof placeOrderSchema>): Promise<string> {
  const validatedData = placeOrderSchema.parse(data);
  const counterRef = doc(db, 'counters', 'orders');

  try {
     const newOrderId = await runTransaction(db, async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        
        let newOrderNumber;
        if (!counterDoc.exists() || !counterDoc.data()?.lastOrderNumber) {
            newOrderNumber = 120220; // Starting number
        } else {
            newOrderNumber = counterDoc.data().lastOrderNumber + 1;
        }

        const customOrderId = `SGS-${newOrderNumber}`;
        const newOrderRef = doc(db, 'orders', customOrderId);
        
        // Construct the order data object carefully
        const { loyaltyDiscount, ...restOfData } = validatedData;
        
        const orderData: any = {
            ...restOfData,
            id: customOrderId,
            status: 'Chờ thanh toán',
            createdAt: serverTimestamp(),
        };

        // Only add loyaltyDiscount if it exists and is greater than 0
        if (loyaltyDiscount && loyaltyDiscount > 0) {
            orderData.loyaltyDiscount = loyaltyDiscount;
        }

        transaction.set(newOrderRef, orderData);
        
        transaction.set(counterRef, { lastOrderNumber: newOrderNumber }, { merge: true });
        
        // If a discount was used, increment its usage count
        if (validatedData.discount?.id) {
            const discountRef = doc(db, 'discounts', validatedData.discount.id);
            transaction.update(discountRef, { timesUsed: increment(1) });
        }

        return customOrderId;
    });

    console.log("Order placed successfully with ID:", newOrderId);

    // If payment method is ZaloPay, generate the order data and save it.
    if (validatedData.paymentMethod === 'zalopay') {
        try {
            const siteConfig = await getSiteConfig();
            if (siteConfig.paymentMethods.zalopay.enabled) {
                const zaloPayData = await createZaloPayOrder(newOrderId, validatedData.total, validatedData.items);
                if (zaloPayData && Object.keys(zaloPayData).length > 0) {
                    const orderRef = doc(db, 'orders', newOrderId);
                    await updateDoc(orderRef, { paymentData: zaloPayData });
                }
            }
        } catch (zaloError) {
            console.error(`Failed to process ZaloPay for order ${newOrderId}, but order was created. Error:`, zaloError);
        }
    }
    
    // Determine the base path for email links based on user role
    const userProfile = validatedData.customer.id ? await getUserProfile(validatedData.customer.id) : null;
    const basePath = userProfile?.role === 'reseller' ? '/reseller' : '/profile';

    // Fire-and-forget: Don't await email sending to avoid delaying the UI response.
    sendOrderConfirmationEmail({
        ...validatedData,
        orderId: newOrderId,
        basePath: basePath,
    }).catch(console.error);


    revalidatePath('/cms/admin/orders');
    revalidatePath('/cms/admin/customers');
    revalidatePath('/cms/admin');
    if (validatedData.customer.id) {
        revalidatePath(`/order-history`);
    }
    
    return newOrderId;

  } catch (error) {
    console.error("Error placing order: ", error);
    throw new Error("Không thể đặt hàng. Đã có lỗi xảy ra.");
  }
}
