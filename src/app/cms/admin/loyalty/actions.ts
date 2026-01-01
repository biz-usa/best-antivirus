
'use server';

import { z } from 'zod';
import { updateSiteConfig } from '@/lib/data';
import { revalidatePath } from 'next/cache';
import type { LoyaltySettings } from '@/lib/types';

const loyaltyTierSchema = z.object({
  name: z.string().transform(val => val as any), // Cast name to any to satisfy LoyaltyTier type
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
    await updateSiteConfig({ loyalty: validatedData.loyalty as unknown as LoyaltySettings });
    revalidatePath('/');
  } catch (error) {
    console.error('Error updating loyalty settings:', error);
    throw new Error('Không thể cập nhật cài đặt khách hàng thân thiết.');
  }
}
