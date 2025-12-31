
'use server';

import { z } from 'zod';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import { generateIconSuggestions } from '@/ai/flows/icon-generator';

const adminApp = getFirebaseAdminApp();
const db = getFirestore(adminApp);

const brandSchema = z.object({
  name: z.string().min(1),
  icon: z.string().optional(),
});

const brandUpdateSchema = brandSchema;

export async function addBrand(data: z.infer<typeof brandSchema>) {
  const validatedData = brandSchema.parse(data);

  try {
    const brandsCollection = db.collection('brands');
    
    // Check if brand already exists
    const querySnapshot = await brandsCollection.where("name", "==", validatedData.name).get();
    if (!querySnapshot.empty) {
      throw new Error("Thương hiệu với tên này đã tồn tại.");
    }

    await brandsCollection.add(validatedData);

    revalidatePath('/cms/admin/brands');
    revalidatePath('/products'); 
    revalidatePath('/category', 'layout'); 

  } catch (error: any) {
    console.error("Error adding brand: ", error);
    if (error.message.includes("đã tồn tại")) {
        throw error;
    }
    throw new Error("Không thể thêm thương hiệu vào cơ sở dữ liệu.");
  }
}


export async function updateBrand(id: string, data: z.infer<typeof brandUpdateSchema>) {
    const validatedData = brandUpdateSchema.parse(data);
    const brandRef = db.collection('brands').doc(id);

    try {
        await brandRef.update(validatedData);
        
        revalidatePath('/cms/admin/brands');
        revalidatePath('/products');
        revalidatePath('/category', 'layout');
    } catch (error) {
        console.error("Error updating brand: ", error);
        throw new Error("Không thể cập nhật thương hiệu.");
    }
}

export async function deleteBrand(id: string) {
    if (!id) {
        throw new Error('Cần có ID thương hiệu.');
    }
    const brandRef = db.collection('brands').doc(id);

    try {
        await brandRef.delete();
        revalidatePath('/cms/admin/brands');
        revalidatePath('/products');
        revalidatePath('/category', 'layout');
    } catch (error) {
        console.error("Error deleting brand: ", error);
        throw new Error("Không thể xóa thương hiệu.");
    }
}

export async function importBrands(brandNames: string[]) {
  if (!brandNames || brandNames.length === 0) {
    throw new Error("Không có thương hiệu nào để nhập.");
  }
  
  const brandsCollection = db.collection('brands');
  
  try {
    const batch = db.batch();
    
    // Fetch existing brands to avoid duplicates
    const existingBrandsSnapshot = await brandsCollection.get();
    const existingBrandNames = new Set(existingBrandsSnapshot.docs.map(doc => doc.data().name.toLowerCase()));
    
    let addedCount = 0;
    for (const name of brandNames) {
      if (name && !existingBrandNames.has(name.toLowerCase())) {
        const newBrandRef = brandsCollection.doc();
        batch.set(newBrandRef, { name, icon: '' });
        existingBrandNames.add(name.toLowerCase()); 
        addedCount++;
      }
    }

    if (addedCount > 0) {
        await batch.commit();
    }
    
    revalidatePath('/cms/admin/brands');

    return {
      total: brandNames.length,
      added: addedCount,
      skipped: brandNames.length - addedCount
    };

  } catch (error) {
    console.error("Error importing brands:", error);
    throw new Error("Đã xảy ra lỗi khi nhập thương hiệu từ tệp.");
  }
}

export async function generateAndAssignBrandIcons(brandNames: string[]): Promise<{ updatedCount: number }> {
    if (!brandNames || brandNames.length === 0) {
        throw new Error("No brand names provided.");
    }

    try {
        const suggestions = await generateIconSuggestions({ names: brandNames });
        
        const brandsCol = db.collection('brands');
        
        const batch = db.batch();
        let updatedCount = 0;

        for (const suggestion of suggestions.icons) {
            const querySnapshot = await brandsCol.where("name", "==", suggestion.name).get();
            
            if (!querySnapshot.empty) {
                const docRef = querySnapshot.docs[0].ref;
                batch.update(docRef, { icon: suggestion.iconName });
                updatedCount++;
            }
        }
        
        if (updatedCount > 0) {
            await batch.commit();
        }

        revalidatePath('/cms/admin/brands');
        revalidatePath('/', 'layout');

        return { updatedCount };
    } catch (error) {
        console.error("Error generating and assigning brand icons:", error);
        throw new Error("An error occurred during the AI icon generation process for brands.");
    }
}
