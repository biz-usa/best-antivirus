
'use server';

import { z } from 'zod';
// Use Admin SDK
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import { sendBulkEmail } from '@/lib/email';
import type { Discount } from '@/lib/types';
import { getAdminCustomers } from '@/lib/admin-data'; // Use Admin Data
import { applyDiscountCode } from '@/app/cms/admin/discounts/actions'; // This is now using Admin SDK
import { getAi, getModelByName } from '@/ai/genkit';
import { EmailCampaignGeneratorInputSchema, EmailCampaignGeneratorOutputSchema } from '@/lib/schemas/email-campaign-generator';

const adminApp = getFirebaseAdminApp();
const db = getFirestore(adminApp);
const ai = getAi();

const emailCampaignSchema = z.object({
  subject: z.string().min(5, "Chủ đề email phải có ít nhất 5 ký tự."),
  body: z.string().min(20, "Nội dung email phải có ít nhất 20 ký tự."),
  targetAudience: z.enum(['all', 'subscribers', 'customers']), 
  discountCode: z.string().optional(),
});


export async function sendEmailCampaign(data: z.infer<typeof emailCampaignSchema>) {
    const validatedData = emailCampaignSchema.parse(data);
    
    // 1. Validate discount code if provided
    let discount: Discount | null = null;
    if (validatedData.discountCode) {
        try {
            // applyDiscountCode uses Admin SDK now
            discount = await applyDiscountCode(validatedData.discountCode);
        } catch (error: any) {
            throw new Error(`Mã giảm giá không hợp lệ: ${error.message}`);
        }
    }

    // 2. Fetch target audience using Admin SDK
    // TODO: Filter based on targetAudience. For now fetching all active customers.
    const allCustomers = await getAdminCustomers({ status: 'active' });
    
    // Simple logic for audience filtering (can be expanded)
    const recipients = allCustomers.map(c => ({ email: c.email, name: c.displayName }));

    if (recipients.length === 0) {
        throw new Error("Không tìm thấy người nhận nào.");
    }

    // 3. Construct and send emails
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    function getFullHtml(bodyContent: string, discountDetails: Discount | null) {
     let discountHtml = '';
     if (discountDetails) {
         const discountValue = discountDetails.type === 'percentage' ? `${discountDetails.value}%` : `${discountDetails.value.toLocaleString('vi-VN')} VNĐ`;
         discountHtml = `
             <div style="background-color: #e6f7ff; border: 2px dashed #91d5ff; padding: 15px; text-align: center; margin: 20px 0;">
                 <p style="font-size: 1.1em; margin: 0;">Sử dụng mã giảm giá đặc biệt của bạn:</p>
                 <p style="font-size: 1.5em; font-weight: bold; color: #0056b3; margin: 10px 0; letter-spacing: 2px; border: 1px solid #0056b3; padding: 10px; display: inline-block;">${discountDetails.code}</p>
                 <p style="font-size: 1.1em; margin: 0;">Để được giảm ${discountValue} cho đơn hàng tiếp theo của bạn!</p>
             </div>
         `;
     }

     return `
           <div style="font-family: Arial, sans-serif; color: #333; max-width: 680px; margin: auto; border: 1px solid #eee; padding: 20px;">
               ${bodyContent}
               
               ${discountHtml}
               
               <div style="text-align: center; margin: 30px 0;">
                   <a href="${baseUrl}/products" style="background-color: #0056b3; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Khám phá ngay</a>
               </div>
               
               <p style="margin-top: 40px; font-size: 0.9em; color: #777; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
                   Bạn nhận được email này vì bạn đã đăng ký tài khoản tại Saigonsoft.com.<br>
                   © ${new Date().getFullYear()} Saigonsoft.com. All rights reserved.
               </p>
           </div>
       `;
     }
    
    await sendBulkEmail(
        recipients,
        validatedData.subject,
        (recipient) => getFullHtml(validatedData.body.replace('{{name}}', recipient.name), discount)
    );

    const historyCol = db.collection('email_campaigns');
    await historyCol.add({
        subject: validatedData.subject,
        audience: validatedData.targetAudience,
        recipientCount: recipients.length,
        sentAt: FieldValue.serverTimestamp(),
        discountCode: validatedData.discountCode || null,
    });

    revalidatePath('/cms/admin/email');

    return { success: true, count: recipients.length };
}

export async function generateEmailCampaignContent({ productName, discountCode, audience }: { productName: string, discountCode?: string, audience: string }) {
    const prompt = ai.definePrompt({
        name: 'emailCampaignContentPrompt',
        model: getModelByName(),
        input: { schema: EmailCampaignGeneratorInputSchema },
        output: { schema: EmailCampaignGeneratorOutputSchema },
        prompt: `B\u1EA1n l\u00E0 m\u1ED9t tr\u1EE3 l\u00FD chuy\u00EAn t\u1EA1o n\u1ED9i dung email.\n\nT\u1EA1o m\u1ED9t email qu\u1EA3ng c\u00E1o h\u1EA5p d\u1EABn cho s\u1EA3n ph\u1EA9m ph\u1EA7n m\u1EC1m: "${productName}".\nEmail n\u00E0y s\u1EBD \u0111\u01B0\u1EE3c g\u1EEDi t\u1EDBi nh\u00F3m \u0111\u1ED1i t\u01B0\u1EE3ng "${audience}".\nN\u1EBFu c\u00F3 m\u00E3 gi\u1EA3m gi\u00E1 "${discountCode || 'kh\u00F4ng c\u00F3'}", h\u00E3y nh\u1EA5n m\u1EA1nh \u01B0u \u0111\u00E3 n\u00E0y.\n\n**Y\u00EAu c\u1EA7u:**\n- \u0110\u1ED9 d\u00E0i: Kho\u1EA3ng 200-300 t\u1EEB.\n- Tone: Th\u00E2n thi\u1EC7n, chuy\u00EAn nghi\u1EC7p, khuy\u1EBFn kh\u00EDch h\u00E0nh \u0111\u1ED9ng.\n- N\u1ED9i dung:\n    - Gi\u1EDBi thi\u1EC7u s\u1EA3n ph\u1EA9m v\u00E0 l\u1EE3i \u00EDch ch\u00EDnh.\n    - Nh\u1EA5n m\u1EA1nh \u0111i\u1EC3m n\u1ED5i b\u1EADt, t\u1EA1i sao kh\u00E1ch h\u00E0ng n\u00EAn mua.\n    - K\u00EAu g\u1ECDi h\u00E0nh \u0111\u1ED9ng r\u00F5 r\u00E0ng (v\u00ED d\u1EE5: "Mua ngay", "T\u00ECm hi\u1EC3u th\u00EAm").\n    - N\u1EBFu c\u00F3 m\u00E3 gi\u1EA3m gi\u00E1, h\u00E3y t\u00EDch h\u1EE3p n\u00F3 m\u1ED9t c\u00E1ch t\u1EF1 nhi\u00EAn v\u00E0 l\u00E0m n\u1ED5i b\u1EADt.\n    - K\u1EBFt th\u00FAc b\u1EB1ng l\u1EDDi c\u1EA3m \u01A1n v\u00E0 th\u00F4ng tin li\u00EAn h\u1EC7 c\u1EE7a Saigonsoft.\n- \u0110\u1ECBnh d\u1EA1ng HTML \u0111\u01A1n gi\u1EA3n (s\u1EED d\u1EE5ng <p>, <strong>, <a>). KH\u00D4NG bao g\u1ED3m th\u1EBB <html>, <head>, <body> ho\u1EB7c <style>. Ch\u1EC9 ph\u1EA7n n\u1ED9i dung email.\n- KH\u00D4NG s\u1EED d\u1EE5ng c\u00E1c t\u1EEB nh\u01B0 "k\u00EDnh g\u1EEDi", "th\u00E2n g\u1EEDi", "dear" hay "hi". Email b\u1EAFt \u0111\u1EA7u b\u1EB1ng "Ch\u00E0o [t\u00EAn kh\u00E1ch h\u00E0ng]!" v\u00E0 n\u1EBFu kh\u00F4ng c\u00F3 t\u00EAn th\u00EC l\u00E0 "Ch\u00E0o b\u1EA1n!".\n\nV\u00ED d\u1EE5 v\u1EC1 \u0111\u1EA7u ra:\n<p>Ch\u00E0o [t\u00EAn kh\u00E1ch h\u00E0ng]!</p>\n<p>B\u1EA1n \u0111ang t\u00ECm ki\u1EBFm...</p>\n<!-- ...n\u1ED9i dung email... -->\n<p>H\u00E3y truy c\u1EADp website c\u1EE7a ch\u00FAng t\u00F4i: <a href="https://saigonsoft.com">Saigonsoft.com</a></p>\n`
    });

    const { output } = await prompt({ productName, discountCode, audience });
    if (!output) {
        throw new Error("AI failed to generate email campaign content.");
    }
    return output.content;
}
