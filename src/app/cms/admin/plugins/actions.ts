
'use server';

import { z } from 'zod';
import { updateSiteConfig } from '@/lib/data';
import { revalidatePath } from 'next/cache';

const pluginSettingsSchema = z.object({
  plugins: z.object({
    recentViews: z.object({
      enabled: z.boolean(),
      excludedPages: z.string().optional(),
    }),
    wishlist: z.object({
      enabled: z.boolean(),
       excludedPages: z.string().optional(),
    }),
    stockNotifier: z.object({
      enabled: z.boolean(),
      title: z.string().optional(),
      description: z.string().optional(),
      successMessage: z.string().optional(),
    }),
    promoToast: z.object({
      enabled: z.boolean(),
      title: z.string().optional(),
      description: z.string().optional(),
      productIds: z.array(z.string()).optional(),
      excludedPages: z.string().optional(),
    }),
    livechat: z.object({
      enabled: z.boolean(),
      script: z.string().optional(),
      excludedPages: z.string().optional(),
    }),
    sgSeo: z.object({
        enabled: z.boolean(),
    }).optional(),
    analytics: z.object({
        enabled: z.boolean(),
        script: z.string().optional(),
        excludedPages: z.string().optional(),
    }).optional(),
  }),
});

export type PluginSettingsSchema = z.infer<typeof pluginSettingsSchema>;

const processExcludedPages = (pagesString?: string): string[] => {
    if (!pagesString) return [];
    return pagesString.split(',').map(p => p.trim()).filter(Boolean);
};

export async function updatePluginSettings(data: PluginSettingsSchema) {
  const validatedData = pluginSettingsSchema.parse(data);

  // Convert comma-separated strings to arrays of strings
  const processedData = {
    ...validatedData,
    plugins: {
        ...validatedData.plugins,
        recentViews: {
            ...validatedData.plugins.recentViews,
            excludedPages: processExcludedPages(validatedData.plugins.recentViews.excludedPages),
        },
        wishlist: {
            ...validatedData.plugins.wishlist,
            excludedPages: processExcludedPages(validatedData.plugins.wishlist.excludedPages),
        },
        promoToast: {
            ...validatedData.plugins.promoToast,
            excludedPages: processExcludedPages(validatedData.plugins.promoToast.excludedPages),
        },
        livechat: {
            ...validatedData.plugins.livechat,
            excludedPages: processExcludedPages(validatedData.plugins.livechat.excludedPages),
        },
        analytics: {
            ...validatedData.plugins.analytics,
            excludedPages: processExcludedPages(validatedData.plugins.analytics?.excludedPages)
        },
    }
  };

  try {
    // Cast plugins to any to bypass strict type checking for partial updates
    await updateSiteConfig({ plugins: processedData.plugins as any });
    
    revalidatePath('/', 'layout');

  } catch (error) {
    console.error('Error updating plugin settings:', error);
    throw new Error('Không thể cập nhật cài đặt plugin.');
  }
}
