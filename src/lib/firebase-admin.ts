import * as admin from 'firebase-admin';

// This file handles the server-side initialization of the Firebase Admin SDK.
// It ensures that we have a single, memoized instance of the app, preventing
// re-initialization on every server-side render or action in Next.js.

let serviceAccount: any;

try {
  serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : undefined;
} catch (error) {
  console.error('Error parsing FIREBASE_SERVICE_ACCOUNT environment variable:', error);
  // Do not throw here, let the function below handle the missing credential case
  // but ensure we don't crash the module load.
}

let adminApp: admin.app.App;

/**
 * Returns a memoized instance of the Firebase Admin App.
 * Initializes the app if it hasn't been initialized yet.
 * @returns {admin.app.App} The Firebase Admin App instance.
 */
export function getFirebaseAdminApp(): admin.app.App {
  if (adminApp) {
    return adminApp;
  }

  if (admin.apps.length > 0) {
    adminApp = admin.apps[0]!;
    return adminApp;
  }
  
  if (!serviceAccount) {
    throw new Error(
      "Firebase service account credentials are not set or are invalid in the environment variables (FIREBASE_SERVICE_ACCOUNT). " +
      "Please ensure the environment variable contains a valid JSON string of the service account key."
    );
  }

  adminApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  return adminApp;
}
