
'use server';

import { db } from '@/lib/firebase';
import { sendBackInStockEmail } from '@/lib/email';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { z } from 'zod';

const stockNotificationSchema = z.object({
  email: z.string().email(),
  productId: z.string(),
  variantId: z.string(),
  productName: z.string(),
  variantName: z.string(),
  productSlug: z.string(),
});

export async function addStockNotification(data: z.infer<typeof stockNotificationSchema>) {
    const validatedData = stockNotificationSchema.parse(data);

    try {
        const notificationsCol = collection(db, 'stockNotifications');
        await addDoc(notificationsCol, {
            ...validatedData,
            createdAt: serverTimestamp(),
            notified: false,
        });
    } catch (error) {
        console.error("Error adding stock notification:", error);
        throw new Error("Could not save notification request.");
    }
}
