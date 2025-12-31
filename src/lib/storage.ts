
      import { ref, uploadString, getDownloadURL, uploadBytes } from 'firebase/storage';
      import { storage } from './firebase';

      /**
       * Uploads a file directly from the client to Firebase Storage.
       * @param file The File object to upload.
       * @param path The desired path in Firebase Storage.
       * @returns The public download URL of the uploaded file.
       */
      export async function uploadFile(file: File, path: string): Promise<string> {
          try {
              const storageRef = ref(storage, path);
              const snapshot = await uploadBytes(storageRef, file, {
                  contentType: file.type,
              });
              console.log(`Uploaded file directly! URL: ${snapshot.ref.fullPath}`);
              return await getDownloadURL(snapshot.ref);
          } catch (error) {
              console.error(`Error uploading file directly to Firebase Storage:`, error);
              throw new Error('Failed to upload file to storage.');
          }
      }

      /**
       * Uploads a data URI (e.g., from an AI-generated image) to Firebase Storage.
       * @param dataUri The data URI string (e.g., "data:image/png;base64,...").
       * @param path The full path in Firebase Storage where the file should be saved.
       * @returns The public download URL of the uploaded file.
       */
      export async function uploadDataUri(dataUri: string, path: string): Promise<string> {
         if (!dataUri.startsWith('data:')) {
              throw new Error('Invalid data URI format.');
          }
           try {
              const storageRef = ref(storage, path);
              const snapshot = await uploadString(storageRef, dataUri, 'data_url');
              console.log(`Uploaded data URI! Path: ${path}`);
              return await getDownloadURL(snapshot.ref);
          } catch (error) {
              console.error(`Error uploading data URI to Firebase Storage at path ${path}:`, error);
              throw new Error('Failed to upload image to storage.');
          }
      }
/**
 * Checks if a file exists in Firebase Storage.
 * @param path The path of the file to check.
 * @returns A promise that resolves with true if the file exists, and false otherwise.
 */
export async function fileExists(path: string): Promise<boolean> {
    if (!path) {
        return false;
    }
    const storageRef = ref(storage, path);
    try {
        await getDownloadURL(storageRef);
        return true;
    } catch (error: any) {
        if (error.code === 'storage/object-not-found') {
            return false;
        }
        throw error;
    }
}
      
