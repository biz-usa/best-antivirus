
'use server';

import { z } from 'zod';
// Import Admin SDK components
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import type { AdminUser, LoyaltyTier, Permission, SiteConfig } from '@/lib/types';
import { updateSiteConfig } from '@/lib/data';

// Initialize Admin App and Firestore
const adminApp = getFirebaseAdminApp();
const adminDb = getFirestore(adminApp);

// ... (other actions kept same, appending new one)

// =================================================================
// Customers Actions
// =================================================================

const userInfoSchema = z.object({
  displayName: z.string().min(1, 'Họ và tên là bắt buộc.'),
  address: z.string().min(1, 'Địa chỉ không được để trống.'),
  companyName: z.string().optional(),
  taxId: z.string().optional(),
  companyAddress: z.string().optional(),
});


export async function updateUserInfo(uid: string, data: z.infer<typeof userInfoSchema>) {
    if (!uid) throw new Error("User ID is required.");
    const validatedData = userInfoSchema.parse(data);

    try {
        await adminDb.collection('users').doc(uid).update(validatedData);
        revalidatePath(`/cms/admin/customers/${uid}`);
        revalidatePath('/cms/admin/customers');
    } catch (error) {
        console.error("Failed to update user info:", error);
        throw new Error("Could not update user info.");
    }
}


export async function updateUserRole(uid: string, role: 'customer' | 'reseller') {
    if (!uid) throw new Error("User ID is required.");
    try {
        await adminDb.collection('users').doc(uid).update({ role: role });
        revalidatePath(`/cms/admin/customers/${uid}`);
        revalidatePath('/cms/admin/customers');
    } catch (error) {
        console.error("Failed to update user role:", error);
        throw new Error("Could not update user role.");
    }
}

export async function updateUserLoyalty(uid: string, loyaltyTier: LoyaltyTier, loyaltyPoints: number) {
     if (!uid) throw new Error("User ID is required.");
    try {
        await adminDb.collection('users').doc(uid).update({ 
            loyaltyTier: loyaltyTier,
            loyaltyPoints: loyaltyPoints
        });
        revalidatePath(`/cms/admin/customers/${uid}`);
        revalidatePath('/cms/admin/customers');
    } catch (error) {
        console.error("Failed to update user loyalty:", error);
        throw new Error("Could not update user loyalty.");
    }
}


// =================================================================
// Moderator Actions
// =================================================================

const moderatorSchema = z.object({
  email: z.string().email("Email không hợp lệ."),
  role: z.enum(['superadmin', 'moderator']),
  permissions: z.array(z.string()),
});

const ALL_PERMISSIONS: Permission[] = [
    'manage_products', 'manage_orders', 'manage_discounts', 'manage_digital_assets', 'manage_customers', 'manage_pages', 'manage_categories', 'manage_brands',
    'manage_email_campaigns', 'manage_plugins', 'manage_appearance', 'manage_product_feeds', 'manage_authentication', 'manage_payments', 'manage_integrations', 'manage_tax_settings', 'manage_moderators',
    'manage_loyalty_program'
];

function validatePermissions(permissions: string[]): Permission[] {
    const validPermissions = permissions.filter(p => ALL_PERMISSIONS.includes(p as Permission));
    return validPermissions as Permission[];
}

export async function addModerator(data: z.infer<typeof moderatorSchema>) {
    const validatedData = moderatorSchema.parse(data);

    try {
        const usersCol = adminDb.collection('admin_users');
        const q = usersCol.where("email", "==", validatedData.email);
        const querySnapshot = await q.get();
        
        if (!querySnapshot.empty) {
            throw new Error("Một quản trị viên với email này đã tồn tại.");
        }
        
        const newModerator = {
            email: validatedData.email,
            role: validatedData.role,
            permissions: validatePermissions(validatedData.permissions),
            createdAt: FieldValue.serverTimestamp(),
        };

        await usersCol.add(newModerator);
        revalidatePath('/cms/admin/moderators');
    } catch (error: any) {
        console.error("Error adding moderator:", error);
        if (error.message.includes("đã tồn tại")) {
            throw error;
        }
        throw new Error("Không thể thêm quản trị viên.");
    }
}


export async function updateModerator(id: string, data: z.infer<typeof moderatorSchema>) {
    const validatedData = moderatorSchema.parse(data);
    
    const moderatorUpdate = {
        role: validatedData.role,
        permissions: validatePermissions(validatedData.permissions),
    };

    try {
        await adminDb.collection('admin_users').doc(id).update(moderatorUpdate);
        revalidatePath('/cms/admin/moderators');
        revalidatePath(`/cms/admin/moderators/${id}/edit`);
    } catch (error) {
        console.error("Error updating moderator:", error);
        throw new Error("Không thể cập nhật quản trị viên.");
    }
}

export async function deleteModerator(id: string) {
    if (!id) {
        throw new Error("Cần có ID của quản trị viên.");
    }

    try {
        await adminDb.collection('admin_users').doc(id).delete();
        revalidatePath('/cms/admin/moderators');
    } catch (error) {
        console.error("Error deleting moderator:", error);
        throw new Error("Không thể xóa quản trị viên.");
    }
}

export async function getAdminUsers(): Promise<AdminUser[]> {
    const snapshot = await adminDb.collection('admin_users').orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
            id: doc.id, 
            ...data 
        } as AdminUser;
    });
}

export async function getAdminUserById(id: string): Promise<AdminUser | null> {
    const docSnap = await adminDb.collection('admin_users').doc(id).get();
    if (docSnap.exists) {
        return { id: docSnap.id, ...docSnap.data() } as AdminUser;
    }
    return null;
}


// =================================================================
// Tax Actions
// =================================================================

const taxRateSchema = z.object({
  countryCode: z.string().length(2, "Mã quốc gia phải có 2 ký tự (ISO 3166-1 alpha-2).").toUpperCase(),
  countryName: z.string().min(1, "Tên quốc gia là bắt buộc."),
  rate: z.coerce.number().min(0, "Tỷ lệ thuế phải là số không âm."),
  isEnabled: z.boolean().default(true),
});

const defaultCountrySchema = z.object({
    tax: z.object({
        defaultCountryCode: z.string().min(1, "Vui lòng chọn quốc gia mặc định."),
    })
});

export async function addOrUpdateTaxRate(data: z.infer<typeof taxRateSchema>, id?: string) {
  const validatedData = taxRateSchema.parse(data);

  try {
    if (id) {
        await adminDb.collection('tax_rates').doc(id).set(validatedData, { merge: true });
    } else {
        await adminDb.collection('tax_rates').add(validatedData);
    }

    revalidatePath('/cms/admin/tax');
    revalidatePath('/checkout');
  } catch (error) {
    console.error("Error saving tax rate: ", error);
    throw new Error("Không thể lưu cài đặt thuế.");
  }
}

export async function deleteTaxRate(id: string) {
    if (!id) throw new Error('Cần có ID thuế.');
    try {
        await adminDb.collection('tax_rates').doc(id).delete();
        revalidatePath('/cms/admin/tax');
        revalidatePath('/checkout');
    } catch (error) {
        console.error("Error deleting tax rate: ", error);
        throw new Error("Không thể xóa cài đặt thuế.");
    }
}

export async function updateDefaultTaxCountry(data: z.infer<typeof defaultCountrySchema>) {
    const validatedData = defaultCountrySchema.parse(data);
    try {
        await adminDb.collection('site_config').doc('main').set({ tax: validatedData.tax }, { merge: true });
        revalidatePath('/');
    } catch (error) {
        console.error("Error updating default tax country:", error);
        throw new Error("Không thể cập nhật quốc gia mặc định.");
    }
}


// =================================================================
// Payment Method Actions
// =================================================================

const paymentMethodDetailsSchema = z.object({
    enabled: z.boolean(),
    accountName: z.string().optional(),
    accountNumber: z.string().optional(),
    bankShortName: z.string().optional(),
})

const disabledPaymentMethodSchema = z.object({
      enabled: z.boolean(),
});

const paymentMethodsSchema = z.object({
  paymentMethods: z.object({
    vietqr: paymentMethodDetailsSchema,
    zalopay: disabledPaymentMethodSchema,
    creditcard: disabledPaymentMethodSchema,
  }),
});


export async function updatePaymentMethods(data: z.infer<typeof paymentMethodsSchema>) {
  const validatedData = paymentMethodsSchema.parse(data);

  try {
    await adminDb.collection('site_config').doc('main').set({ paymentMethods: validatedData.paymentMethods }, { merge: true });
    revalidatePath('/');
  } catch (error) {
    console.error('Error updating payment methods:', error);
    throw new Error('Không thể cập nhật cài đặt cổng thanh toán.');
  }
}


// =================================================================
// Authentication Actions
// =================================================================

const authSettingsSchema = z.object({
  authentication: z.object({
    google: z.object({
      enabled: z.boolean(),
    }),
    apple: z.object({
      enabled: z.boolean(),
    }),
    sms: z.object({
      enabled: z.boolean(),
    }),
  }),
});


export async function updateAuthSettings(data: z.infer<typeof authSettingsSchema>) {
  const validatedData = authSettingsSchema.parse(data);

  try {
    await adminDb.collection('site_config').doc('main').set({ authentication: validatedData.authentication }, { merge: true });
    revalidatePath('/');
  } catch (error) {
    console.error('Error updating authentication settings:', error);
    throw new Error('Không thể cập nhật cài đặt xác thực.');
  }
}

// =================================================================
// Appearance Actions
// =================================================================

export async function updateAppearance(data: Partial<SiteConfig>) {
  try {
    await adminDb.collection('site_config').doc('main').set(data, { merge: true });
    revalidatePath('/');
  } catch (error) {
     console.error('Error updating appearance:', error);
     throw new Error('Could not update site configuration.');
  }
}


// =================================================================
// Plugin Actions
// =================================================================

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

const processExcludedPages = (pagesString?: string): string[] => {
    if (!pagesString) return [];
    return pagesString.split(',').map(p => p.trim()).filter(Boolean);
};

export async function updatePluginSettings(data: z.infer<typeof pluginSettingsSchema>) {
  const validatedData = pluginSettingsSchema.parse(data);

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
    await adminDb.collection('site_config').doc('main').set({ plugins: processedData.plugins }, { merge: true });
    revalidatePath('/');
  } catch (error) {
    console.error('Error updating plugin settings:', error);
    throw new Error('Không thể cập nhật cài đặt plugin.');
  }
}

// =================================================================
// Integrations Actions
// =================================================================
const integrationsSchema = z.object({
  email: z.object({
    postmark: z.object({
        serverToken: z.string().optional(),
        fromEmail: z.string().optional(),
        replyToEmail: z.string().optional(),
    }).optional(),
  }),
});

export async function updateIntegrations(data: Partial<z.infer<typeof integrationsSchema>>) {
  const validatedData = integrationsSchema.partial().parse(data);

  try {
    await adminDb.collection('site_config').doc('main').set(validatedData, { merge: true });
    revalidatePath('/');
  } catch (error) {
    console.error('Error updating integrations settings:', error);
    throw new Error('Không thể cập nhật cài đặt tích hợp.');
  }
}

// =================================================================
// Email Template Actions
// =================================================================
export async function updateEmailTemplates(data: { emailTemplates: SiteConfig['emailTemplates'] }) {
    try {
        // Validate or assume data is correct as it's coming from typed form
        await adminDb.collection('site_config').doc('main').set({ emailTemplates: data.emailTemplates }, { merge: true });
        revalidatePath('/');
    } catch (error) {
        console.error('Error updating email templates:', error);
        throw new Error('Không thể cập nhật mẫu email.');
    }
}
