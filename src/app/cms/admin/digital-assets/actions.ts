
'use server';

import { generateGuide as generateGuideFlow } from "@/ai/flows/guide-generator";
import type { GuideGeneratorInput } from "@/lib/schemas/guide-generator";
import { z } from "zod";
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { revalidatePath } from "next/cache";
import { findDownloadLink as findDownloadLinkFlow } from "@/ai/flows/download-link-finder";
import type { DownloadLinkFinderInput, DownloadLinkFinderOutput } from "@/ai/flows/download-link-finder";
import { sendBackInStockEmail } from "@/lib/email";
import type { Product, StockNotification, ProductVariant } from "@/lib/types";

const adminApp = getFirebaseAdminApp();
const db = getFirestore(adminApp);

const usedLicenseKeySchema = z.object({
    key: z.string(),
    orderId: z.string(),
    customerId: z.string(),
    assignedAt: z.any(),
});

const licenseKeysSchema = z.object({
    available: z.array(z.string()).optional(),
    used: z.array(usedLicenseKeySchema).optional(),
});

const variantAssetSchema = z.object({
    id: z.string(),
    name: z.string(),
    price: z.number(),
    resellerPrice: z.union([z.number(), z.string()]).optional().nullable(),
    salePrice: z.union([z.number(), z.string()]).optional().nullable(),
    saleStartDate: z.union([z.date(), z.string()]).optional().nullable(),
    saleEndDate: z.union([z.date(), z.string()]).optional().nullable(),
    sku: z.string(),
    attributes: z.array(z.any()).optional(),
    downloadUrl: z.string().url().or(z.literal('')).optional().nullable(),
    licenseKeys: licenseKeysSchema.optional(),
});


const productAssetUpdateSchema = z.object({
  guide: z.string().optional(),
  variants: z.array(variantAssetSchema),
});


export async function generateGuide(input: GuideGeneratorInput): Promise<string> {
    try {
        const result = await generateGuideFlow(input);
        return result.guide;
    } catch (error) {
        console.error("Error generating guide:", error);
        throw new Error("Failed to generate guide using AI.");
    }
}

async function handleStockNotifications(productId: string, oldVariants: ProductVariant[], newVariants: ProductVariant[]) {
    const productRef = db.collection('products').doc(productId);
    const productSnap = await productRef.get();
    if (!productSnap.exists) return;
    
    // Admin SDK returns data directly
    // const productData = productSnap.data() as Product; 

    for (const newVariant of newVariants) {
        const oldVariant = oldVariants.find(v => v.id === newVariant.id);
        const oldStock = oldVariant?.licenseKeys?.available?.length || 0;
        const newStock = newVariant.licenseKeys?.available?.length || 0;

        if (oldStock === 0 && newStock > 0) {
            console.log(`Variant ${newVariant.name} is back in stock. Checking for notifications...`);
            
            const notificationsRef = db.collection('stockNotifications');
            const snapshot = await notificationsRef
                .where('productId', '==', productId)
                .where('variantId', '==', newVariant.id)
                .where('notified', '==', false)
                .get();
            
            if (snapshot.empty) {
                console.log(`No pending notifications for variant ${newVariant.name}.`);
                continue;
            }

            const notificationsToSend: StockNotification[] = snapshot.docs.map(d => ({id: d.id, ...d.data()} as unknown as StockNotification));
            console.log(`Found ${notificationsToSend.length} notifications to send.`);
            
            const batch = db.batch();
            for (const notification of notificationsToSend) {
                await sendBackInStockEmail({
                    email: notification.email,
                    productName: notification.productName,
                    variantName: notification.variantName,
                    productSlug: notification.productSlug,
                });

                const notificationRef = db.collection('stockNotifications').doc(notification.id!);
                batch.update(notificationRef, { notified: true });
            }
            await batch.commit();
            console.log(`Sent and marked ${notificationsToSend.length} notifications as complete.`);
        }
    }
}


export async function updateProductAssets(productId: string, data: z.infer<typeof productAssetUpdateSchema>) {
    const validatedData = productAssetUpdateSchema.parse(data);

    const productRef = db.collection('products').doc(productId);
    const productSnap = await productRef.get();
    if (!productSnap.exists) throw new Error("Product not found.");
    const oldProductData = productSnap.data() as Product;


    const variantsForDb = validatedData.variants.map(variant => {
        const { saleStartDate, saleEndDate, salePrice, resellerPrice, ...restOfVariant } = variant;
        return {
            ...restOfVariant,
            salePrice: salePrice ? Number(salePrice) : undefined,
            resellerPrice: resellerPrice ? Number(resellerPrice) : undefined,
            saleStartDate: saleStartDate ? Timestamp.fromDate(new Date(saleStartDate)) : null,
            saleEndDate: saleEndDate ? Timestamp.fromDate(new Date(saleEndDate)) : null,
        } as unknown as ProductVariant;
    });


    try {
        await productRef.update({ 
            variants: variantsForDb,
            guide: validatedData.guide,
         });

        await handleStockNotifications(productId, oldProductData.variants, variantsForDb);

        revalidatePath(`/cms/admin/digital-assets/${productId}`);
        revalidatePath(`/downloads`);
        revalidatePath(`/products/${productId}`);
    } catch (error) {
        console.error("Error updating product assets:", error);
        throw new Error("Could not update product assets.");
    }
}


export async function findDownloadLink(input: DownloadLinkFinderInput): Promise<DownloadLinkFinderOutput> {
    try {
        const result = await findDownloadLinkFlow(input);
        return result;
    } catch (error) {
        console.error("Error finding download link:", error);
        throw new Error("Failed to find download link using AI.");
    }
}
