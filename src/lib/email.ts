

'use server';

import type { OrderItem, Discount, SiteConfig, CustomerInfo } from './types';
import { sendEmail as sendEmailServer } from './email-server';
import { getSiteConfig, getUserProfile } from './data';
import { getAuth } from 'firebase-admin/auth';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';

interface OrderConfirmationPayload {
    orderId: string;
    customer: {
        name: string;
        email: string;
    };
    items: OrderItem[];
    total: number;
    paymentMethod: string;
    basePath: string; // Add basePath
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
}).format(amount);


async function sendEmail(to: string, subject: string, htmlBody: string) {
    try {
        await sendEmailServer(to, subject, htmlBody);
    } catch(error) {
        // Log the error but don't let it crash the main application flow
        console.error(`Email sending failed for subject "${subject}" to "${to}". Error:`, error);
    }
}

export async function sendBulkEmail(
    recipients: { email: string; name: string }[],
    subject: string,
    htmlBodyFn: (recipient: { email: string; name: string }) => string
) {
    const emailPromises = recipients.map(recipient => 
        sendEmail(recipient.email, subject, htmlBodyFn(recipient))
    );
    await Promise.all(emailPromises);
}

function getBaseTemplate(config: SiteConfig, content: string) {
     const logoUrl = config.companyInfo?.logoUrl || config.header.logoDarkUrl;
     const companyName = config.companyInfo?.name || 'Saigonsoft.com';
     const companyAddress = config.companyInfo?.address || '';

     return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; color: #333333; }
                .container { max-width: 600px; margin: auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; }
                .header { background-color: #f7f7f7; padding: 20px; text-align: center; border-bottom: 1px solid #e0e0e0; }
                .header img { max-width: 180px; height: auto; }
                .content { padding: 30px; line-height: 1.6; }
                .footer { padding: 20px; text-align: center; font-size: 12px; color: #777777; background-color: #f7f7f7; border-top: 1px solid #e0e0e0; }
            </style>
        </head>
        <body>
            <table class="container" width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                    <td class="header">
                        <img src="${logoUrl}" alt="${companyName} Logo">
                    </td>
                </tr>
                <tr>
                    <td class="content">
                        ${content}
                    </td>
                </tr>
                <tr>
                    <td class="footer">
                        <p>Bạn nhận được email này vì bạn đã đăng ký tài khoản tại ${companyName}.<br>
                        ${companyAddress}<br>
                        © ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
                    </td>
                </tr>
            </table>
        </body>
        </html>
    `;
}

export async function sendOrderConfirmationEmail(payload: OrderConfirmationPayload) {
    const { orderId, customer, items, total, paymentMethod, basePath } = payload;
    const config = await getSiteConfig();
    const template = config.emailTemplates.orderConfirmation;
    const siteUrl = config.companyInfo.websiteUrl;
    const orderHistoryUrl = `${siteUrl}${basePath}/order-history`;

    const itemsHtml = items.map(item => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name}</td>
            <td style="text-align: center; padding: 10px; border-bottom: 1px solid #ddd;">${item.quantity}</td>
            <td style="text-align: right; padding: 10px; border-bottom: 1px solid #ddd;">${formatCurrency(item.price)}</td>
            <td style="text-align: right; padding: 10px; border-bottom: 1px solid #ddd;">${formatCurrency(item.price * item.quantity)}</td>
        </tr>
    `).join('');
    
    let subject = template.subject.replace('{{order_id}}', orderId);
    let body = template.body
        .replace(/{{customer_name}}/g, customer.name)
        .replace(/{{order_id}}/g, orderId)
        .replace('{{order_items_table}}', itemsHtml)
        .replace('{{order_total}}', formatCurrency(total))
        .replace('{{payment_method}}', paymentMethod === 'vietqr' ? 'Chuyển khoản VietQR' : paymentMethod)
        .replace(/{{order_history_url}}/g, orderHistoryUrl);


    const fullHtml = getBaseTemplate(config, body);
    await sendEmail(customer.email, subject, fullHtml);
}


export async function sendOrderStatusUpdateEmail(payload: {
    orderId: string;
    customer: { name: string; email: string };
    newStatus: string;
    basePath: string; // Add basePath
}) {
    const { orderId, customer, newStatus, basePath } = payload;
    const config = await getSiteConfig();
    const template = config.emailTemplates.orderStatusUpdate;
    const siteUrl = config.companyInfo.websiteUrl;
    const orderDetailsUrl = `${siteUrl}${basePath}/order-history/${orderId}`;
    
    const subject = template.subject.replace('{{order_id}}', orderId);
    let body = template.body
        .replace(/{{customer_name}}/g, customer.name)
        .replace(/{{order_id}}/g, orderId)
        .replace('{{new_status}}', newStatus)
        .replace(/{{order_details_url}}/g, orderDetailsUrl);

    if (newStatus === 'Hoàn thành') {
        const downloadPageUrl = `${siteUrl}/profile/downloads`;
        body = body.replace('{{#if is_completed}}', '').replace('{{/if}}', '').replace(/{{downloads_page_url}}/g, downloadPageUrl);
    } else {
        body = body.replace(/{{#if is_completed}}[\s\S]*?{{\/if}}/g, '');
    }
        
    const fullHtml = getBaseTemplate(config, body);
    await sendEmail(customer.email, subject, fullHtml);
}


export async function sendPasswordChangeNotificationEmail(customer: { name: string, email: string }) {
    const config = await getSiteConfig();
    const template = config.emailTemplates.passwordChanged;
    
    const subject = template.subject;
    const body = template.body.replace('{{customer_name}}', customer.name);

    const fullHtml = getBaseTemplate(config, body);
    await sendEmail(customer.email, subject, fullHtml);
}


export async function sendBackInStockEmail(payload: {
  email: string;
  productName: string;
  variantName: string;
  productSlug: string;
}) {
    const { email, productName, variantName, productSlug } = payload;
    const config = await getSiteConfig();
    const template = config.emailTemplates.backInStock;
    const productUrl = `${config.companyInfo.websiteUrl}/products/${productSlug}`;

    const subject = template.subject;
    const body = template.body
        .replace('{{product_name}}', productName)
        .replace('{{variant_name}}', variantName)
        .replace('{{product_url}}', productUrl);

    const fullHtml = getBaseTemplate(config, body);
    await sendEmail(email, subject, fullHtml);
}

export async function sendWelcomeAndSetPasswordEmail(customer: { name: string, email: string }) {
    const config = await getSiteConfig();
    const template = config.emailTemplates.welcomeAndSetPassword;
    const adminAuth = getAuth(getFirebaseAdminApp());
    const resetLink = await adminAuth.generatePasswordResetLink(customer.email);

    const subject = template.subject;
    const body = template.body
        .replace(/{{customer_name}}/g, customer.name)
        .replace(/{{reset_link}}/g, resetLink);
        
    const fullHtml = getBaseTemplate(config, body);
    await sendEmail(customer.email, subject, fullHtml);
}

export async function sendForgotPasswordEmail(email: string) {
    const config = await getSiteConfig();
    const userProfile = await getUserProfile(email);
    const template = config.emailTemplates.forgotPassword;
    
    // Generate the password reset link using Firebase Admin SDK
    const adminAuth = getAuth(getFirebaseAdminApp());
    const resetLink = await adminAuth.generatePasswordResetLink(email);

    const subject = template.subject;
    const body = template.body
        .replace(/{{customer_name}}/g, userProfile?.displayName || 'khách hàng')
        .replace(/{{reset_link}}/g, resetLink);
        
    const fullHtml = getBaseTemplate(config, body);
    await sendEmail(email, subject, fullHtml);
}
