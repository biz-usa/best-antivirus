

'use server';

import { z } from 'zod';
import { updateSiteConfig } from '@/lib/data';
import { revalidatePath } from 'next/cache';

const loyaltyTierSchema = z.object({
  name: z.string(),
  minPoints: z.coerce.number(),
  discountPercentage: z.coerce.number(),
  benefits: z.array(z.string()),
});

const loyaltySettingsSchema = z.object({
  loyalty: z.object({
      pointConversionRate: z.coerce.number(),
      tiers: z.object({
        bronze: loyaltyTierSchema,
        silver: loyaltyTierSchema,
        gold: loyaltyTierSchema,
        diamond: loyaltyTierSchema,
    }),
      resellerLoyaltyTiers: z.object({
        bronze: loyaltyTierSchema,
        silver: loyaltyTierSchema,
        gold: loyaltyTierSchema,
        diamond: loyaltyTierSchema,
    }).optional(),
  }),
});


export async function updateLoyaltySettings(data: z.infer<typeof loyaltySettingsSchema>) {
  const validatedData = loyaltySettingsSchema.parse(data);

  try {
    await updateSiteConfig({ loyalty: validatedData.loyalty });
    revalidatePath('/');
  } catch (error) {
    console.error('Error updating loyalty settings:', error);
    throw new Error('Không thể cập nhật cài đặt khách hàng thân thiết.');
  }
}
