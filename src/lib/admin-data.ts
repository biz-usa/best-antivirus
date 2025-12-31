
import { getFirebaseAdminApp } from './firebase-admin';
import type { Order, DailyRevenue, Product, UserProfile } from './types';
import { format, subDays } from 'date-fns';
import { Timestamp } from 'firebase-admin/firestore';

const admin = getFirebaseAdminApp();
const db = admin.firestore();

export async function getAdminDashboardStats(): Promise<{
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    totalProducts: number;
    revenueByDay: DailyRevenue[];
}> {
    const ordersSnapshot = await db.collection('orders').get();
    const productsSnapshot = await db.collection('products').get();
    const usersSnapshot = await db.collection('users').get();

    const orders = ordersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
             ...data,
             createdAt: data.createdAt 
        };
    });
    
    // Calculate total revenue
    const totalRevenue = orders.reduce((sum, order: any) => sum + (order.total || 0), 0);
    const totalOrders = ordersSnapshot.size;
    const totalProducts = productsSnapshot.size;
    const totalCustomers = usersSnapshot.size;
    
    // Calculate revenue for the last 7 days
    const revenueByDay: { [key: string]: number } = {};
    for (let i = 0; i < 7; i++) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        revenueByDay[date] = 0;
    }

    orders.forEach((order: any) => {
        if (order.createdAt) {
             const orderDate = format(order.createdAt.toDate(), 'yyyy-MM-dd');
             if (revenueByDay[orderDate] !== undefined) {
                 revenueByDay[orderDate] += (order.total || 0);
             }
        }
    });

    const chartData = Object.keys(revenueByDay).map(date => ({
        date,
        revenue: revenueByDay[date],
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
        totalRevenue,
        totalOrders,
        totalCustomers,
        totalProducts,
        revenueByDay: chartData,
    };
}

export async function getAdminOrders(params: {
    limit?: number;
}): Promise<{ orders: Order[] }> {
    const { limit: queryLimit } = params;
    
    let query = db.collection('orders').orderBy('createdAt', 'desc');

    if (queryLimit) {
        query = query.limit(queryLimit);
    }
    
    const orderSnapshot = await query.get();
    
    const orders = orderSnapshot.docs.map(doc => {
        const data = doc.data();
        return { 
            id: doc.id, 
            ...data,
        } as unknown as Order;
    });

    return { orders };
}

export async function getAdminOrderById(id: string): Promise<Order | null> {
    if (!id) return null;
    const orderDoc = await db.collection('orders').doc(id).get();
    
    if (!orderDoc.exists) return null;
    
    return {
        id: orderDoc.id,
        ...orderDoc.data()
    } as unknown as Order;
}

export async function getAdminProductById(id: string): Promise<Product | null> {
    if (!id) return null;
    const productRef = db.collection('products').doc(id);
    const productSnap = await productRef.get();

    if (productSnap.exists) {
        const data = productSnap.data();
        return { id: productSnap.id, ...data } as unknown as Product;
    } else {
        return null;
    }
}

export async function getAdminCustomers(filters: { status?: 'active' | 'trashed' } = {}): Promise<UserProfile[]> {
    const { status } = filters;
    
    const ordersSnapshot = await db.collection('orders').get();
    const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

    const customerMap = new Map<string, any>();
    orders.forEach((order: any) => {
        if (order.customer && order.customer.id && !customerMap.has(order.customer.id)) {
             customerMap.set(order.customer.id, {
                uid: order.customer.id,
                email: order.customer.email,
                displayName: order.customer.name,
                role: 'customer',
                status: 'active',
                address: '',
                loyaltyPoints: 0,
                loyaltyTier: 'Chưa xếp hạng',
            });
        }
    });

    const usersSnapshot = await db.collection('users').get();
    usersSnapshot.forEach(doc => {
        const userProfile = { uid: doc.id, ...doc.data() };
        if (customerMap.has(doc.id)) {
             customerMap.set(doc.id, {
                ...customerMap.get(doc.id),
                ...userProfile,
            });
        } else {
             customerMap.set(doc.id, userProfile);
        }
    });

    let allCustomers = Array.from(customerMap.values());
    
    if (status) {
        allCustomers = allCustomers.filter(customer => customer.status === status);
    } else {
        allCustomers = allCustomers.filter(customer => customer.status === 'active');
    }
    
    return allCustomers.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
}

export async function getAdminCustomerDetails(id: string): Promise<{ profile: UserProfile | null; orders: Order[] }> {
    if (!id) return { profile: null, orders: [] };

    // Fetch profile from users collection
    const userDoc = await db.collection('users').doc(id).get();
    let profile: UserProfile | null = null;
    
    if (userDoc.exists) {
        profile = { uid: userDoc.id, ...userDoc.data() } as unknown as UserProfile;
    }

    // Fetch orders for this customer
    const ordersSnapshot = await db.collection('orders')
        .where('customer.id', '==', id)
        .orderBy('createdAt', 'desc')
        .get();

    const orders = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as unknown as Order));

    // If profile is still null (user not in 'users' collection), try to reconstruct from orders
    if (!profile && orders.length > 0) {
        const lastOrder = orders[0];
        profile = {
            uid: id,
            email: lastOrder.customer.email,
            displayName: lastOrder.customer.name,
            role: 'customer',
            status: 'active',
            address: '',
            loyaltyPoints: 0,
            loyaltyTier: 'Chưa xếp hạng',
        };
    }

    return { profile, orders };
}
