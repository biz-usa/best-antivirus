
'use client';

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  fetchSignInMethodsForEmail,
  sendPasswordResetEmail,
  User,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  GoogleAuthProvider,
  signInWithPopup,
  linkWithPopup,
  signInWithRedirect,
  getRedirectResult,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  OAuthProvider,
  ActionCodeSettings,
} from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, setDoc, getDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { sendPasswordChangeNotificationEmail, sendWelcomeAndSetPasswordEmail } from './email';
import { handleUserSignup, handlePasswordResetRequest } from './auth-actions';


async function upsertUserProfile(user: User) {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        await setDoc(userRef, {
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            address: '',
            role: 'customer', // Default role
            status: 'active',
            companyName: '',
            taxId: '',
            loyaltyPoints: 0,
            loyaltyTier: 'Đồng',
            createdAt: serverTimestamp(),
        });
    }
    return user;
}


export async function signUp(email: string, password: string, displayName: string) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(userCredential.user, { displayName });
  
  // Call the server action to handle email sending
  await handleUserSignup(email, displayName);

  return await upsertUserProfile(userCredential.user);
}

export async function signIn(email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

export async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    return await upsertUserProfile(userCredential.user);
}

export async function signInWithApple() {
    const provider = new OAuthProvider('apple.com');
    // Potentially add scopes like 'email' and 'name'
    // provider.addScope('email');
    // provider.addScope('name');
    const userCredential = await signInWithPopup(auth, provider);
    return await upsertUserProfile(userCredential.user);
}


export async function linkGoogleAccount(user: User) {
  const provider = new GoogleAuthProvider();
  try {
    const result = await linkWithPopup(user, provider);
    return result.user;
  } catch (error: any) {
    console.error("Error linking Google account:", error);
    throw error;
  }
}

export async function linkAppleAccount(user: User) {
  const provider = new OAuthProvider('apple.com');
  try {
    const result = await linkWithPopup(user, provider);
    return result.user;
  } catch (error: any) {
    console.error("Error linking Apple account:", error);
    throw error;
  }
}


export function getRecaptchaVerifier(containerId: string): RecaptchaVerifier {
    const recaptchaContainer = document.getElementById(containerId);
    if (!recaptchaContainer) throw new Error("Recaptcha container not found");
    
    // Clear any previous verifier
    recaptchaContainer.innerHTML = '';

    return new RecaptchaVerifier(auth, recaptchaContainer, {
      'size': 'invisible',
      'callback': (response: any) => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
        // This callback is usually not needed for invisible reCAPTCHA.
      }
    });
}


export async function signInWithSms(phoneNumber: string, appVerifier: RecaptchaVerifier): Promise<ConfirmationResult> {
    return await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
}


export async function signOut() {
  return firebaseSignOut(auth);
}

export async function updateUserProfile(
    user: User, 
    name: string, 
    address: string, 
    companyName?: string, 
    taxId?: string, 
    companyAddress?: string, 
    dateOfBirth?: Date | null,
    companyEstablishmentDate?: Date | null
) {
    if (!user) {
        throw new Error("No user is signed in or UID mismatch.");
    }
    
    // Update Firebase Auth profile
    await updateProfile(user, { displayName: name });
    
    // Update Firestore profile
    const userRef = doc(db, 'users', user.uid);
    
    const dataToUpdate: any = {
        displayName: name,
        address: address,
        companyName: companyName || '',
        taxId: taxId || '',
        companyAddress: companyAddress || '',
    };

    if (dateOfBirth instanceof Date) {
        dataToUpdate.dateOfBirth = Timestamp.fromDate(dateOfBirth);
    } else {
        dataToUpdate.dateOfBirth = null;
    }

    if (companyEstablishmentDate instanceof Date) {
        dataToUpdate.companyEstablishmentDate = Timestamp.fromDate(companyEstablishmentDate);
    } else {
        dataToUpdate.companyEstablishmentDate = null;
    }
    
    await setDoc(userRef, dataToUpdate, { merge: true });
}

export async function changeUserPassword(user: User, currentPassword: string, newPassword: string) {
    if (!user.email) {
        throw new Error("User does not have an email address.");
    }
    try {
        // Re-authenticate user before changing password for security reasons
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);

        // Update the password
        await updatePassword(user, newPassword);

        // Send a notification email (fire-and-forget)
        sendPasswordChangeNotificationEmail({
            name: user.displayName || 'Khách hàng',
            email: user.email,
        });
    } catch (error: any) {
        console.error("Password change error:", error);
        if (error.code === 'auth/wrong-password') {
            throw new Error("Mật khẩu hiện tại không chính xác.");
        }
        throw new Error("Không thể thay đổi mật khẩu.");
    }
}


export async function checkIfEmailExists(email: string): Promise<boolean> {
    try {
        const methods = await fetchSignInMethodsForEmail(auth, email);
        return methods.length > 0;
    } catch (error) {
        console.error("Error checking email existence:", error);
        // In case of error (e.g., network issue), assume email doesn't exist to allow signup flow.
        // You might want to handle this differently based on your app's requirements.
        return false;
    }
}

export async function sendPasswordReset(email: string) {
    try {
        // Attempt to send the custom email first by calling the server action.
        await handlePasswordResetRequest(email);
        console.log(`Custom password reset email initiated for ${email}.`);
    } catch (error) {
        // If the custom email fails (e.g., Postmark not configured, or user not found), fall back to Firebase default.
        console.warn(`Custom password reset failed, falling back to Firebase default. Error:`, error);
        try {
            await sendPasswordResetEmail(auth, email);
            console.log(`Firebase default password reset email sent to ${email}.`);
        } catch (firebaseError) {
             console.error("Firebase password reset fallback also failed:", firebaseError);
             throw new Error("Không thể gửi email đặt lại mật khẩu.");
        }
    }
}
