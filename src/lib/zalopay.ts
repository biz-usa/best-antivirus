

'use server';

import { getSiteConfig } from './data';
import CryptoJS from 'crypto-js';
import type { OrderItem } from './types';

interface ZaloPayOrderResponse {
    return_code: number;
    return_message: string;
    sub_return_code: number;
    sub_return_message: string;
    order_url: string;
    zp_trans_token: string;
}

const ZALO_API_ENDPOINT = "https://sb-openapi.zalopay.vn/v2/create"; // Sandbox endpoint

export async function createZaloPayOrder(orderId: string, amount: number, items: OrderItem[]): Promise<{ qr_code?: string; order_url?: string; zp_trans_token?: string } | null> {
    const config = await getSiteConfig();
    const zaloConfig = config.paymentMethods.zalopay;
    const siteUrl = config.companyInfo.websiteUrl || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    if (!zaloConfig.enabled || !zaloConfig.appId || !zaloConfig.key1 || !zaloConfig.key2) {
        console.log("ZaloPay is not configured correctly. Skipping ZaloPay order creation.");
        return null; // Return null if not configured to avoid breaking the flow
    }

    const embed_data = {
        redirecturl: `${siteUrl}/order/success`,
    };

    const order_items = items.map(item => ({
        item_id: item.id,
        item_name: item.name,
        item_price: item.price,
        item_quantity: item.quantity
    }));

    const app_trans_id = `${new Date().getFullYear().toString().slice(2)}${Date.now()}`;

    const order = {
        app_id: zaloConfig.appId,
        app_trans_id: app_trans_id,
        app_user: "user123", // Replace with actual user identifier if available
        app_time: Date.now(),
        amount: Math.round(amount),
        item: JSON.stringify(order_items),
        description: `Thanh toan cho don hang #${orderId}`,
        embed_data: JSON.stringify(embed_data),
        bank_code: "zalopayapp",
        callback_url: "https://saigonsoft.com/callback", // Your server callback URL
    };

    const dataToSign = `${order.app_id}|${order.app_trans_id}|${order.app_user}|${order.amount}|${order.app_time}|${order.embed_data}|${order.item}`;
    const hmac = CryptoJS.HmacSHA256(dataToSign, zaloConfig.key1);
    const mac = hmac.toString();

    const requestBody = { ...order, mac };

    try {
        const response = await fetch(ZALO_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const result: ZaloPayOrderResponse = await response.json();

        if (result.return_code === 1) {
            return {
                qr_code: result.order_url, // This is the URL to generate the QR code from
                order_url: result.order_url, // For deep-linking
                zp_trans_token: result.zp_trans_token
            };
        } else {
            console.error("ZaloPay API Error:", result);
            throw new Error(`ZaloPay Error: ${result.return_message}`);
        }
    } catch (error) {
        console.error("Failed to create ZaloPay order:", error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("Could not connect to ZaloPay.");
    }
}
