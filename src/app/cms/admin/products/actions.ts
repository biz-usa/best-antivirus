
'use server';

import { z } from 'zod';
// Use Admin SDK
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import type { Category, Product, ProductVariant } from '@/lib/types';
import { uploadDataUriAdmin } from '@/lib/admin-storage'; // Use Admin Storage
import { generateVariants as generateVariantsFlow } from '@/ai/flows/variant-generator';
import { generateProductDetailsFlow } from '@/ai/flows/product-generator';
import { generateScreenshots as generateScreenshotsFlow } from '@/ai/flows/screenshot-generator';
import { generateSeoContent } from '@/ai/flows/seo-generator';
import type { VariantGeneratorInput, VariantGeneratorOutput } from '@/lib/schemas/product-variants';
import type { ProductDetailsInput, GenerateProductDetailsOutput } from '@/lib/schemas/product-generator';
import type { ScreenshotGeneratorInput, ScreenshotGeneratorOutput } from '@/lib/schemas/screenshot-generator';
import type { SeoGeneratorInput, SeoGeneratorOutput } from '@/lib/schemas/seo-generator';
import { nanoid } from 'nanoid';
import { ai } from '@/ai/genkit';
import { gemini } from '@genkit-ai/googleai';
import { getDynamicImage } from '@/lib/data';

const adminApp = getFirebaseAdminApp();
const db = getFirestore(adminApp);


const variantSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Tên biến thể là bắt buộc"),
  price: z.coerce.number().min(0, "Giá phải là số dương"),
  resellerPrice: z.coerce.number().min(0, "Giá reseller phải là số dương").optional().or(z.literal(0)).or(z.literal('')),
  salePrice: z.coerce.number().min(0, "Giá sale phải là số dương").optional().or(z.literal('')),
  saleStartDate: z.date().optional().nullable(),
  saleEndDate: z.date().optional().nullable(),
  sku: z.string().min(1, "SKU là bắt buộc"),
  attributes: z.array(z.object({ name: z.string(), value: z.string() })).optional(),
});


const formSchema = z.object({
  name: z.string().min(3, 'Tên sản phẩm phải có ít nhất 3 ký tự.'),
  slug: z.string().min(3, 'Slug phải có ít nhất 3 ký tự.').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug phải ở dạng kebab-case."),
  brand: z.string().min(1, 'Vui lòng chọn thương hiệu.'),
  categoryId: z.string({ required_error: 'Vui lòng chọn danh mục.'}),
  shortDescription: z.string().min(10, 'Mô tả ngắn phải có ít nhất 10 ký tự.'),
  longDescription: z.string().min(20, 'Mô tả chi tiết phải có ít nhất 20 ký tự.'),
  mfr: z.string().min(1, 'MFR không được để trống.'),
  imageUrl: z.string().url('URL hình ảnh không hợp lệ.').or(z.string().startsWith('data:image')).or(z.literal('')),
  imageHint: z.string().optional(),
  licenseType: z.enum(['Subscription', 'Perpetual']),
  screenshots: z.array(z.string().url('URL không hợp lệ nếu không phải chuỗi rỗng').or(z.string().startsWith('data:image')).or(z.literal(''))).optional(),
  variants: z.array(variantSchema).min(1, "Sản phẩm phải có ít nhất một biến thể."),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});


async function processImages(imageUrls: string[], productId: string, type: 'main' | 'screenshot'): Promise<string[]> {
    const processedUrls = await Promise.all(
        (imageUrls || []).map(async (url, index) => {
            if (url && url.startsWith('data:image')) {
                const path = `products/${productId}/${type}-${index}-${Date.now()}.png`;
                // Use Admin Storage function
                return await uploadDataUriAdmin(url, path);
            }
            return url;
        })
    );
    return processedUrls.filter(url => url && url.trim() !== '');
}


export async function addProduct(data: z.infer<typeof formSchema>) {
  const validatedData = formSchema.parse(data);
  const { categoryId, imageUrl, screenshots, ...productData } = validatedData;
  
  const categoryRef = db.collection("categories").doc(categoryId);
  const categorySnap = await categoryRef.get();

  if (!categorySnap.exists) {
      throw new Error("Category not found");
  }
  const categoryData = categorySnap.data();
  const category = {
      id: categorySnap.id,
      slug: categorySnap.id,
      name: categoryData?.name
  } as Category;


  try {
    const productsCollection = db.collection('products');
    const newProductRef = productsCollection.doc();
    
    const finalImageUrl = imageUrl.startsWith('data:image') 
        ? (await processImages([imageUrl], newProductRef.id, 'main'))[0]
        : imageUrl;

    const finalScreenshots = await processImages(screenshots || [], newProductRef.id, 'screenshot');
    
    const dataToSave: any = {
      ...productData,
      status: 'active',
      variants: productData.variants.map(v => ({
          ...v,
          saleStartDate: v.saleStartDate ? Timestamp.fromDate(v.saleStartDate) : null,
          saleEndDate: v.saleEndDate ? Timestamp.fromDate(v.saleEndDate) : null,
      })),
      imageUrl: finalImageUrl,
      screenshots: finalScreenshots,
      category: {
        name: category.name,
        slug: category.slug,
      },
      currency: 'VND',
      reviews: [],
      createdAt: FieldValue.serverTimestamp(),
    };
    
    await newProductRef.set(dataToSave);

    revalidatePath('/products');
    revalidatePath(`/category/${category.slug}`);
    revalidatePath('/cms/admin/products');
    revalidatePath('/', 'layout'); 

  } catch (error) {
    console.error("Error adding document: ", error);
    throw new Error("Could not add product to the database.");
  }
}

export async function updateProduct(id: string, data: z.infer<typeof formSchema>) {
    const validatedData = formSchema.parse(data);
    const { categoryId, imageUrl, screenshots, ...productData } = validatedData;

    const categoryRef = db.collection("categories").doc(categoryId);
    const categorySnap = await categoryRef.get();

    if (!categorySnap.exists) {
        throw new Error("Category not found");
    }
    const categoryData = categorySnap.data();
     const category = {
      id: categorySnap.id,
      slug: categorySnap.id,
      name: categoryData?.name
    } as Category;

    const productRef = db.collection('products').doc(id);

    try {
        const existingProductSnap = await productRef.get();
        if (!existingProductSnap.exists) {
            throw new Error("Product not found");
        }
        const existingProductData = existingProductSnap.data() as Product;

        const finalImageUrl = imageUrl.startsWith('data:image') 
            ? (await processImages([imageUrl], id, 'main'))[0] 
            : imageUrl;
        const finalScreenshots = await processImages(screenshots || [], id, 'screenshot');
        
        const mergedVariants = productData.variants.map(formVariant => {
            const existingVariant = existingProductData.variants.find(v => v.id === formVariant.id);
            
            return {
                ...existingVariant, 
                ...formVariant,     
                saleStartDate: formVariant.saleStartDate ? Timestamp.fromDate(formVariant.saleStartDate) : null,
                saleEndDate: formVariant.saleEndDate ? Timestamp.fromDate(formVariant.saleEndDate) : null,
            };
        });

        const productUpdateData: any = {
            ...productData,
            variants: mergedVariants,
            imageUrl: finalImageUrl,
            screenshots: finalScreenshots,
            category: {
                name: category.name,
                slug: category.slug,
            },
        }

        await productRef.update(productUpdateData);

        revalidatePath('/products');
        revalidatePath(`/category/${category.slug}`);
        revalidatePath(`/products/${productData.slug}`);
        revalidatePath('/cms/admin/products');
        revalidatePath('/', 'layout');

    } catch (error) {
        console.error("Error updating document: ", error);
        throw new Error("Could not update product in the database.");
    }
}


export async function deleteProduct(id: string) {
    if (!id) {
        throw new Error('Product ID is required.');
    }
    const productRef = db.collection('products').doc(id);

    try {
        await productRef.delete();
        revalidatePath('/cms/admin/products');
        revalidatePath('/products');
        revalidatePath('/category', 'layout');
    } catch (error) {
        console.error("Error deleting document: ", error);
        throw new Error("Could not delete product from the database.");
    }
}

export async function generateProductVariants(input: VariantGeneratorInput): Promise<VariantGeneratorOutput> {
    try {
        const result = await generateVariantsFlow(input);

        const variantsWithIds = result.variants.map(variant => ({
            ...variant,
            id: nanoid(8),
            attributes: variant.attributes || []
        }));
        
        return { variants: variantsWithIds };

    } catch (error) {
        console.error("Error generating product variants:", error);
        throw new Error("Failed to generate variants using AI.");
    }
}

export async function generateProductDetails(input: ProductDetailsInput): Promise<GenerateProductDetailsOutput> {
    try {
        return await generateProductDetailsFlow(input);
    } catch (error) {
        console.error("Error generating product details:", error);
        throw new Error("Failed to generate product details using AI.");
    }
}

export async function generateScreenshots(input: ScreenshotGeneratorInput): Promise<ScreenshotGeneratorOutput> {
    try {
        return await generateScreenshotsFlow(input);
    } catch (error) {
        console.error("Error generating screenshots:", error);
        throw new Error("Failed to generate screenshots using AI.");
    }
}

export async function generateProductSeoContent(input: SeoGeneratorInput): Promise<SeoGeneratorOutput> {
    try {
        return await generateSeoContent(input);
    } catch (error) {
        console.error("Error generating SEO content:", error);
        throw new Error("Failed to generate SEO content using AI.");
    }
}

export async function generateHeroImage(prompt: string): Promise<{imageUrl: string}> {
  try {
    const imageUrl = await getDynamicImage(prompt, 'landscape');
    if (!imageUrl) {
        throw new Error("Không thể tìm thấy hình ảnh phù hợp từ các nguồn cung cấp.");
    }
    return { imageUrl };
  } catch (error) {
    console.error("Error getting hero image:", error);
    throw new Error("Không thể lấy ảnh cho khu vực Hero.");
  }
}

export async function updateProductStatus(productIds: string[], status: 'active' | 'hidden') {
    if (!productIds || productIds.length === 0) {
        throw new Error("Product IDs are required.");
    }

    const batch = db.batch();
    productIds.forEach(id => {
        const productRef = db.collection('products').doc(id);
        batch.update(productRef, { status });
    });

    try {
        await batch.commit();
        revalidatePath('/cms/admin/products');
        revalidatePath('/products', 'layout'); 
    } catch (error) {
        console.error(`Failed to update status for products:`, error);
        throw new Error(`Could not update status to ${status}.`);
    }
}

export async function deleteProducts(productIds: string[]) {
    if (!productIds || productIds.length === 0) {
        throw new Error("Product IDs are required.");
    }

    const batch = db.batch();
    productIds.forEach(id => {
        const productRef = db.collection('products').doc(id);
        batch.delete(productRef);
    });

    try {
        await batch.commit();
        revalidatePath('/cms/admin/products');
        revalidatePath('/products', 'layout');
    } catch (error) {
        console.error("Failed to delete products:", error);
        throw new Error("Could not delete products.");
    }
}
