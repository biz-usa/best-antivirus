
'use server';

import type { SiteConfig } from '@/lib/types';
import { updateSiteConfig } from '@/lib/data';
import { revalidatePath } from 'next/cache';

export async function updateAppearance(data: Partial<SiteConfig>) {
  try {
    await updateSiteConfig(data);
    revalidatePath('/');
  } catch (error) {
    console.error('Error updating appearance settings:', error);
    // Rethrow a more specific error to be caught by the calling form.
    throw new Error('Could not update site configuration.');
  }
}
