
'use server';

import { z } from 'zod';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import { generateIconSuggestions } from '@/ai/flows/icon-generator';

const adminApp = getFirebaseAdminApp();
const db = getFirestore(adminApp);

const categorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be in kebab-case."),
  icon: z.string().optional(),
});

const categoryUpdateSchema = categorySchema;


export async function addCategory(data: z.infer<typeof categorySchema>) {
  const validatedData = categorySchema.parse(data);

  try {
    const categoryRef = db.collection('categories').doc(validatedData.slug);
    const docSnap = await categoryRef.get();

    if (docSnap.exists) {
        throw new Error("Danh mục với slug này đã tồn tại.");
    }
    
    await categoryRef.set({ 
        name: validatedData.name,
        icon: validatedData.icon || '',
    });

    revalidatePath('/cms/admin/categories');
    revalidatePath('/products');
    revalidatePath('/category', 'layout');

  } catch (error: any) {
    console.error("Error adding category: ", error);
     if (error.message.includes("đã tồn tại")) {
        throw error;
    }
    throw new Error("Không thể thêm danh mục vào cơ sở dữ liệu.");
  }
}

export async function updateCategory(oldSlug: string, data: z.infer<typeof categoryUpdateSchema>) {
    const validatedData = categoryUpdateSchema.parse(data);
    const batch = db.batch();

    const oldCategoryRef = db.collection('categories').doc(oldSlug);
    const newCategoryRef = db.collection('categories').doc(validatedData.slug);
    
    const dataToSave = {
        name: validatedData.name,
        icon: validatedData.icon || '',
    };

    try {
        if (oldSlug !== validatedData.slug) {
            const newSlugSnap = await newCategoryRef.get();
            if (newSlugSnap.exists) {
                throw new Error("Slug mới đã tồn tại.");
            }
            batch.set(newCategoryRef, dataToSave);
            batch.delete(oldCategoryRef);

            const productsSnapshot = await db.collection('products').where('category.slug', '==', oldSlug).get();
            productsSnapshot.forEach(productDoc => {
                const productRef = db.collection('products').doc(productDoc.id);
                batch.update(productRef, { 
                    category: {
                        slug: validatedData.slug,
                        name: validatedData.name
                    }
                });
            });

        } else {
            batch.update(oldCategoryRef, dataToSave);
            
            const productsSnapshot = await db.collection('products').where('category.slug', '==', oldSlug).get();
            productsSnapshot.forEach(productDoc => {
                const productRef = db.collection('products').doc(productDoc.id);
                batch.update(productRef, { 'category.name': validatedData.name });
            });
        }
        
        await batch.commit();
        
        revalidatePath('/cms/admin/categories');
        revalidatePath('/products');
        revalidatePath(`/category/${oldSlug}`);
        if (oldSlug !== validatedData.slug) {
            revalidatePath(`/category/${validatedData.slug}`);
        }
    } catch(error: any) {
        console.error("Error updating category: ", error);
         if (error.message.includes("đã tồn tại")) {
            throw error;
        }
        throw new Error("Không thể cập nhật danh mục.");
    }
}


export async function deleteCategory(slug: string) {
    if (!slug) {
        throw new Error('Cần có slug của danh mục.');
    }
    
    try {
        const productsSnapshot = await db.collection('products').where('category.slug', '==', slug).get();
        if (!productsSnapshot.empty) {
            throw new Error(`Không thể xóa danh mục. Nó đang được sử dụng bởi ${productsSnapshot.size} sản phẩm.`);
        }

        const categoryRef = db.collection('categories').doc(slug);
        await categoryRef.delete();

        revalidatePath('/cms/admin/categories');
        revalidatePath('/products');
        revalidatePath('/category', 'layout');
    } catch (error: any) {
        console.error("Error deleting category: ", error);
        if (error.message.includes("Không thể xóa")) {
            throw error;
        }
        throw new Error("Không thể xóa danh mục.");
    }
}

export async function generateAndAssignIcons(categoryNames: string[]): Promise<{ updatedCount: number }> {
    if (!categoryNames || categoryNames.length === 0) {
        throw new Error("No category names provided.");
    }

    try {
        const suggestions = await generateIconSuggestions({ names: categoryNames });
        
        const categoriesCol = db.collection('categories');
        const querySnapshot = await categoriesCol.get();
        
        const categoryNameToIdMap = new Map<string, string>();
        querySnapshot.forEach(doc => {
            categoryNameToIdMap.set(doc.data().name.toLowerCase(), doc.id);
        });

        const batch = db.batch();
        let updatedCount = 0;

        for (const suggestion of suggestions.icons) {
            const categoryId = categoryNameToIdMap.get(suggestion.name.toLowerCase());
            if (categoryId) {
                const docRef = db.collection('categories').doc(categoryId);
                batch.update(docRef, { icon: suggestion.iconName });
                updatedCount++;
            }
        }
        
        if (updatedCount > 0) {
            await batch.commit();
        }

        revalidatePath('/cms/admin/categories');
        revalidatePath('/', 'layout');

        return { updatedCount };
    } catch (error) {
        console.error("Error generating and assigning icons:", error);
        throw new Error("An error occurred during the AI icon generation process.");
    }
}
