
import { getFirebaseAdminApp } from './firebase-admin';
import { getStorage } from 'firebase-admin/storage';
import { nanoid } from 'nanoid';

const adminApp = getFirebaseAdminApp();
const bucket = getStorage(adminApp).bucket();

export async function uploadDataUriAdmin(dataUri: string, path: string): Promise<string> {
    if (!dataUri.startsWith('data:')) {
        throw new Error('Invalid data URI format.');
    }

    const matches = dataUri.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
        throw new Error('Invalid data URI format.');
    }

    const contentType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');
    
    const file = bucket.file(path);
    const token = nanoid();
    
    await file.save(buffer, {
        metadata: {
            contentType: contentType,
            metadata: {
                firebaseStorageDownloadTokens: token,
            }
        }
    });

    const bucketName = bucket.name;
    const encodedPath = encodeURIComponent(path).replace(/\//g, '%2F'); // Encode path components properly
    return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media&token=${token}`;
}
