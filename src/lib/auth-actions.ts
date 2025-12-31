

'use server';

import { sendWelcomeAndSetPasswordEmail, sendForgotPasswordEmail } from './email';
import { db } from './firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';


export async function handleUserSignup(email: string, displayName: string) {
    try {
        await sendWelcomeAndSetPasswordEmail({
            name: displayName,
            email: email,
        });
    } catch (error) {
        console.error("Failed to send welcome email:", error);
    }
}

export async function handlePasswordResetRequest(email: string) {
    try {
        await sendForgotPasswordEmail(email);
    } catch (error: any) {
        console.error("Failed to send custom password reset email:", error);
        // Re-throw the original error or a new one to be caught by the client-side fallback logic.
        throw new Error(error.message || "Could not send password reset email via custom provider.");
    }
}

