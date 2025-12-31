
'use server';

import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const adminApp = getFirebaseAdminApp();
const db = getFirestore(adminApp);

export async function promoteToSuperAdmin(uid: string, email: string) {
    if (!uid) throw new Error("UID is required");

    try {
        await db.collection('admin_users').doc(uid).set({
            email: email,
            role: 'superadmin',
            permissions: [], // superadmin implies all permissions
            createdAt: FieldValue.serverTimestamp(),
        }, { merge: true });
        
        console.log(`Promoted user ${uid} (${email}) to superadmin.`);
    } catch (error) {
        console.error("Error promoting user:", error);
        throw new Error("Failed to promote user.");
    }
}
