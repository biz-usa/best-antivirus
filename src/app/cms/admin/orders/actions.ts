
'use server';

import { z } from 'zod';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import type { Order, Product, ProductVariant, UserProfile } from '@/lib/types';
import { sendOrderStatusUpdateEmail } from '@/lib/email';
import { determineLoyaltyTier, getLoyaltyConfig } from '@/lib/data'; // These are config helpers, likely safe or public read
import * as XLSX from 'xlsx';

const adminApp = getFirebaseAdminApp();
const db = getFirestore(adminApp);


async function assignLicenseKeys(order: Order) {
    if (!order.customer.id) {
        console.log(`Order ${order.id} has no customer ID, skipping license key assignment.`);
        return;
    }
    
    console.log(`Assigning license keys for order ${order.id}...`);

    await db.runTransaction(async (transaction) => {
        // --- Read Phase ---
        const productIds = [...new Set(order.items.map(item => item.id))];
        const productRefs = productIds.map(id => db.collection('products').doc(id));
        const productDocs = await Promise.all(productRefs.map(ref => transaction.get(ref)));

        const productsMap = new Map<string, Product>();
        productDocs.forEach((docSnap, i) => {
            if (docSnap.exists) {
                productsMap.set(productIds[i], { id: docSnap.id, ...docSnap.data() } as unknown as Product);
            }
        });
        
        // --- Logic & Write Phase ---
        for (const item of order.items) {
            const product = productsMap.get(item.id);
            if (!product) {
                throw new Error(`Product with ID ${item.id} not found during transaction.`);
            }

            const variantIndex = product.variants.findIndex(v => v.id === item.variantId);
            if (variantIndex === -1) {
                 throw new Error(`Variant with ID ${item.variantId} not found in product ${product.name}.`);
            }
            
            const variant = product.variants[variantIndex];
            const availableKeys = variant.licenseKeys?.available || [];
            const usedKeys = variant.licenseKeys?.used || [];

            if (availableKeys.length < item.quantity) {
                throw new Error(`Không đủ license key cho sản phẩm: ${product.name} - ${variant.name}. Cần: ${item.quantity}, Có sẵn: ${availableKeys.length}`);
            }

            const keysToAssign = availableKeys.splice(0, item.quantity);
            for (const key of keysToAssign) {
                usedKeys.push({
                    key,
                    orderId: order.id,
                    customerId: order.customer.id!,
                    assignedAt: new Date(), // Use Date instead of Timestamp to avoid type mismatch
                });
            }

            product.variants[variantIndex].licenseKeys = { available: availableKeys, used: usedKeys };
            productsMap.set(product.id!, product);
        }

        for (const [productId, productData] of productsMap.entries()) {
            const productRef = db.collection('products').doc(productId);
            transaction.update(productRef, { variants: productData.variants });
        }
        console.log(`Finished assigning keys for order ${order.id}.`);
    });
}

async function updateUserLoyalty(userId: string) {
    const userRef = db.collection('users').doc(userId);
    try {
        const userSnap = await userRef.get();
        if (!userSnap.exists) return;
        const profile = { uid: userSnap.id, ...userSnap.data() } as unknown as UserProfile;
        
        const { rate, tiers, resellerTiers } = await getLoyaltyConfig();
        const relevantTiers = profile.role === 'reseller' ? resellerTiers : tiers;

        const ordersSnapshot = await db.collection('orders')
            .where('customer.id', '==', userId)
            .where('status', '==', 'Hoàn thành')
            .get();
        
        const userOrders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Order));
        
        const totalSpent = userOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        
        const calculatedPoints = Math.floor(totalSpent * rate);
        const newTier = await determineLoyaltyTier(calculatedPoints, profile.role || 'customer');
        
        await userRef.update({
            loyaltyPoints: calculatedPoints,
            loyaltyTier: newTier.name,
        });

        console.log(`Updated loyalty for user ${userId}. New points: ${calculatedPoints}, New Tier: ${newTier.name}`);

    } catch (error) {
        console.error(`Failed to update loyalty points for user ${userId}:`, error);
    }
}

async function createNotificationAndSendEmail(order: Order, newStatus: string) {
     if (order.customer.id) {
        const userSnap = await db.collection('users').doc(order.customer.id).get();
        const userProfile = userSnap.exists ? ({ uid: userSnap.id, ...userSnap.data() } as unknown as UserProfile) : null;
        
        const basePath = userProfile?.role === 'reseller' ? '/reseller' : '/profile';
        const notificationLink = `${basePath}/order-history/${order.id}`;

        try {
            const notificationsCol = db.collection('notifications');
            await notificationsCol.add({
                userId: order.customer.id,
                message: `Trạng thái đơn hàng #${order.id} của bạn đã được cập nhật thành: ${newStatus}.`,
                link: notificationLink,
                read: false,
                createdAt: FieldValue.serverTimestamp(),
            });
        } catch (error) {
            console.error(`Failed to create notification for order ${order.id}:`, error);
        }
        
        try {
            await sendOrderStatusUpdateEmail({
                orderId: order.id,
                customer: order.customer,
                newStatus: newStatus,
                basePath: basePath,
            });
        } catch (error) {
             console.error(`Failed to send status update email for order ${order.id}:`, error);
        }
    }
}


export async function updateOrderStatus(id: string, newStatus: string) {
    if (!id) {
        throw new Error('Order ID is required.');
    }
    const orderRef = db.collection('orders').doc(id);

    try {
        const orderSnap = await orderRef.get();
        if (!orderSnap.exists) {
            throw new Error('Order not found.');
        }
        const orderData = { id: orderSnap.id, ...orderSnap.data() } as unknown as Order;

        if (newStatus === 'Hoàn thành' && orderData.status !== 'Hoàn thành') {
            await assignLicenseKeys(orderData);

            if (orderData.customer.id) {
                updateUserLoyalty(orderData.customer.id);
            }
        }
        
        await orderRef.update({ status: newStatus });
        
        createNotificationAndSendEmail(orderData, newStatus);
        
        revalidatePath('/cms/admin/orders');
        revalidatePath(`/cms/admin/orders/${id}`);
        revalidatePath('/profile/order-history');
        revalidatePath(`/profile/order-history/${id}`);
        revalidatePath('/reseller/order-history');
        revalidatePath(`/reseller/order-history/${id}`);
        if (orderData.customer.id) {
            revalidatePath(`/profile`);
            revalidatePath(`/profile/loyalty`);
            revalidatePath(`/reseller/profile`);
            revalidatePath(`/reseller/loyalty`);
        }

    } catch (error: any) {
        console.error("Error updating order status: ", error);
        if (error.message.includes("Không đủ license key")) {
             throw new Error(error.message);
        }
        throw new Error("Không thể cập nhật trạng thái đơn hàng do lỗi hệ thống.");
    }
}


export async function deleteOrder(id: string) {
    if (!id) {
        throw new Error('Order ID is required.');
    }
    const orderRef = db.collection('orders').doc(id);

    try {
        await orderRef.delete();
        revalidatePath('/cms/admin/orders');
    } catch (error) {
        console.error("Error deleting order: ", error);
        throw new Error("Could not delete order.");
    }
}


export async function exportOrders(userId?: string): Promise<{ content: string; fileName: string; contentType: string; }> {
    let query = db.collection('orders').orderBy('createdAt', 'desc');
    
    if (userId) {
        query = query.where('customer.id', '==', userId);
    }
    
    const snapshot = await query.get();
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Order));


    if (orders.length === 0) {
        throw new Error("Không có đơn hàng nào để xuất.");
    }
    
    const flatData = orders.flatMap(order => 
        order.items.map(item => {
            // Handle Timestamp properly
            const createdAtDate = (order.createdAt as any).toDate ? (order.createdAt as any).toDate() : new Date(order.createdAt as any);
            return {
                'ID Đơn hàng': order.id,
                'Ngày đặt': createdAtDate.toLocaleDateString('vi-VN'),
                'Tên khách hàng': order.customer.name,
                'Email khách hàng': order.customer.email,
                'Trạng thái': order.status,
                'Phương thức TT': order.paymentMethod,
                'Tạm tính': order.subtotal,
                'VAT': order.vat,
                'Tổng cộng': order.total,
                'Tên sản phẩm': item.name,
                'Tên biến thể': item.variantName,
                'Số lượng': item.quantity,
                'Đơn giá': item.price
            };
        })
    );
    
    const worksheet = XLSX.utils.json_to_sheet(flatData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');
    
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    
    const fileName = userId ? `saigonsoft_orders_${userId}.xlsx` : 'saigonsoft_orders_all.xlsx';

    return {
        content: buffer.toString('base64'),
        fileName,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
}


export async function updateBulkOrderStatus(orderIds: string[], newStatus: string) {
    if (!orderIds || orderIds.length === 0) {
        throw new Error("Cần có ID đơn hàng.");
    }
    
    const batch = db.batch();
    
    orderIds.forEach(id => {
        const orderRef = db.collection('orders').doc(id);
        batch.update(orderRef, { status: newStatus });
    });
    
    try {
        await batch.commit();
        revalidatePath('/cms/admin/orders');
    } catch(error) {
        console.error("Error updating bulk order status:", error);
        throw new Error("Không thể cập nhật trạng thái hàng loạt cho các đơn hàng.");
    }
}

export async function deleteBulkOrders(orderIds: string[]) {
    if (!orderIds || orderIds.length === 0) {
        throw new Error("Cần có ID đơn hàng.");
    }
    
    const batch = db.batch();
    
    orderIds.forEach(id => {
        const orderRef = db.collection('orders').doc(id);
        batch.delete(orderRef);
    });
    
    try {
        await batch.commit();
        revalidatePath('/cms/admin/orders');
    } catch(error) {
        console.error("Error deleting bulk orders:", error);
        throw new Error("Không thể xóa hàng loạt các đơn hàng.");
    }
}
