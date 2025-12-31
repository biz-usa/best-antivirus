
'use server';

import { db } from './firebase';
import type { UserProfile, Order, Customer } from './types';
import { collection, getDocs, query, where, doc, updateDoc, orderBy, QueryConstraint, getDoc, writeBatch, setDoc, serverTimestamp, limit, startAfter, type QueryDocumentSnapshot, type DocumentData, Timestamp } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { getOrders } from './data';
import { serializeForClient } from './serializeForClient';


export async function getCustomers(
    filters: {
        status?: 'active' | 'trashed';
    } = {}
): Promise<UserProfile[]> {
    const { status } = filters;
    
    // Step 1: Fetch all orders to get a comprehensive list of all customers who have ever placed an order.
    // This is the most reliable source of truth for "active" customers.
    const { orders } = await getOrders({});

    // Step 2: Create a unique map of customers from the orders.
    const customerMap = new Map<string, UserProfile>();
    orders.forEach(order => {
        if (order.customer.id && !customerMap.has(order.customer.id)) {
            customerMap.set(order.customer.id, {
                uid: order.customer.id,
                email: order.customer.email,
                displayName: order.customer.name,
                // Set default values that will be overwritten by Firestore data if it exists.
                role: 'customer',
                status: 'active',
                address: '',
                loyaltyPoints: 0,
                loyaltyTier: 'Chưa xếp hạng',
            });
        }
    });

    // Step 3: Fetch all user profiles from Firestore to enrich the data.
    const usersCollectionRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCollectionRef);
    
    usersSnapshot.docs.forEach(doc => {
        const userProfile = { uid: doc.id, ...doc.data() } as UserProfile;
        if (customerMap.has(userProfile.uid)) {
            // If the user from Firestore also exists in our order-based map, update their info.
             customerMap.set(userProfile.uid, {
                ...customerMap.get(userProfile.uid)!, // Get existing data from orders
                ...userProfile,                      // Overwrite with richer data from Firestore
            });
        } else {
            // If the user from Firestore never placed an order, add them to the map.
            customerMap.set(userProfile.uid, userProfile);
        }
    });
    
    // Step 4: Convert map to array and apply filters.
    let allCustomers = Array.from(customerMap.values());
    
    if (status) {
        allCustomers = allCustomers.filter(customer => customer.status === status);
    } else {
        // Default to showing only active customers if no status is specified
        allCustomers = allCustomers.filter(customer => customer.status === 'active');
    }
    
    return serializeForClient(allCustomers.sort((a, b) => a.displayName.localeCompare(b.displayName)));
}

export async function getCustomerDetails(id: string): Promise<{ profile: UserProfile | null; orders: Order[] }> {
    if (!id) {
        throw new Error("Customer ID is required.");
    }

    const userDocRef = doc(db, "users", id);
    const userDoc = await getDoc(userDocRef);
    let profile: UserProfile | null = userDoc.exists() ? { uid: userDoc.id, ...userDoc.data() } as UserProfile : null;
    
    const { orders } = await getOrders({ userId: id });

    return { profile: serializeForClient(profile), orders: serializeForClient(orders) };
}


export async function updateUserStatus(userIds: string[], status: 'active' | 'trashed') {
    if (!userIds || userIds.length === 0) {
        throw new Error("User IDs are required.");
    }

    const batch = writeBatch(db);
    userIds.forEach(uid => {
        const userRef = doc(db, 'users', uid);
        batch.update(userRef, { status });
    });

    try {
        await batch.commit();
        revalidatePath('/cms/admin/customers');
    } catch (error) {
        console.error(`Failed to update status for users:`, error);
        throw new Error(`Could not update status to ${status}.`);
    }
}


export async function deleteUsers(userIds: string[]) {
    if (!userIds || userIds.length === 0) {
        throw new Error("User IDs are required.");
    }
    
    // Deleting users from Firebase Auth requires Admin SDK and is a destructive action.
    // For this implementation, we will only delete them from the Firestore 'users' collection.
    // The user will still exist in Firebase Auth but won't appear in the CMS.

    try {
        const batch = writeBatch(db);
        userIds.forEach(uid => {
            const userRef = doc(db, 'users', uid);
            batch.delete(userRef);
        });
        await batch.commit();
        console.log(`Successfully deleted ${userIds.length} user documents from Firestore.`);

        revalidatePath('/cms/admin/customers');
    } catch (error: any) {
        console.error(`Failed to delete users from Firestore:`, error);
        throw new Error(`Could not delete all users from Firestore.`);
    }
}


export async function emptyCustomerTrash() {
    try {
        const q = query(collection(db, 'users'), where('status', '==', 'trashed'));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return;
        }
        
        const userIdsToDelete = snapshot.docs.map(doc => doc.id);
        
        // This will delete from Firestore only, not Auth.
        await deleteUsers(userIdsToDelete);
        
        revalidatePath('/cms/admin/customers');
    } catch (error) {
         console.error(`Failed to empty trash:`, error);
        throw new Error('Could not empty the customer trash.');
    }
}

export async function syncUsersFromAuth() {
    throw new Error('This function is deprecated and should not be used. Customer data is now derived from orders and the users collection.');
}
