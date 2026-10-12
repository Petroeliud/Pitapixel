/**
 * Pluggable Storage Provider Interface
 *
 * Encapsulates file uploads for thumbnail, web-size, and original photos.
 * Implemented using Firebase Storage by default, architected cleanly so it can
 * easily be swapped for Cloudflare R2 (or AWS S3) via presigned upload URLs.
 */

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage as firebaseStorage } from './firebase';

export interface UploadProgress {
  stage: 'thumb' | 'web' | 'original';
  bytesTransferred: number;
  totalBytes: number;
  progressPercent: number;
}

export interface PhotoUploadResult {
  thumbUrl: string;
  webUrl: string;
  originalUrl: string;
}

export interface IStorageProvider {
  uploadPhoto(
    galleryId: string,
    photoId: string,
    files: {
      thumbBlob: Blob;
      webBlob: Blob;
      originalBlob: Blob;
    },
    onProgress?: (progress: UploadProgress) => void
  ): Promise<PhotoUploadResult>;

  deletePhotoFiles(
    galleryId: string,
    photoId: string
  ): Promise<void>;
}

/**
 * Firebase Storage Implementation
 */
export class FirebaseStorageProvider implements IStorageProvider {
  async uploadPhoto(
    galleryId: string,
    photoId: string,
    files: {
      thumbBlob: Blob;
      webBlob: Blob;
      originalBlob: Blob;
    },
    onProgress?: (progress: UploadProgress) => void
  ): Promise<PhotoUploadResult> {
    const uploadSingle = async (
      stage: 'thumb' | 'web' | 'original',
      blob: Blob,
      extension: string = 'jpg'
    ): Promise<string> => {
      const path = `galleries/${galleryId}/photos/${photoId}/${stage}.${extension}`;
      const storageRef = ref(firebaseStorage, path);

      return new Promise<string>((resolve, reject) => {
        const uploadTask = uploadBytesResumable(storageRef, blob, {
          contentType: blob.type || 'image/jpeg',
          cacheControl: 'public,max-age=31536000',
        });

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const pct = snapshot.totalBytes > 0
              ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
              : 0;
            onProgress?.({
              stage,
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
              progressPercent: pct,
            });
          },
          (error) => {
            console.error(`Upload error for ${stage}:`, error);
            reject(error);
          },
          async () => {
            try {
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadUrl);
            } catch (err) {
              reject(err);
            }
          }
        );
      });
    };

    // Upload thumbnail
    const thumbUrl = await uploadSingle('thumb', files.thumbBlob);
    // Upload web size
    const webUrl = await uploadSingle('web', files.webBlob);
    // Upload original file
    const originalUrl = await uploadSingle('original', files.originalBlob);

    return {
      thumbUrl,
      webUrl,
      originalUrl,
    };
  }

  async deletePhotoFiles(galleryId: string, photoId: string): Promise<void> {
    const stages = ['thumb.jpg', 'web.jpg', 'original.jpg'];
    for (const file of stages) {
      try {
        const fileRef = ref(firebaseStorage, `galleries/${galleryId}/photos/${photoId}/${file}`);
        await deleteObject(fileRef);
      } catch (err) {
        console.warn(`Could not delete storage file ${file}:`, err);
      }
    }
  }
}

/**
 * Cloudflare R2 / S3 Storage Provider Skeleton
 * Ready to be connected when R2 bucket and worker/presigned endpoints are configured.
 */
export class CloudflareR2StorageProvider implements IStorageProvider {
  constructor(private apiBaseUrl: string = '/api/storage/r2') {}

  async uploadPhoto(
    galleryId: string,
    photoId: string,
    files: {
      thumbBlob: Blob;
      webBlob: Blob;
      originalBlob: Blob;
    },
    onProgress?: (progress: UploadProgress) => void
  ): Promise<PhotoUploadResult> {
    // R2 implementation pattern:
    // 1. Request presigned upload URL from server: POST /api/storage/r2/presign
    // 2. Direct PUT to R2 bucket with upload progress
    // Fallback to Firebase provider if not configured
    const fallback = new FirebaseStorageProvider();
    return fallback.uploadPhoto(galleryId, photoId, files, onProgress);
  }

  async deletePhotoFiles(galleryId: string, photoId: string): Promise<void> {
    const fallback = new FirebaseStorageProvider();
    return fallback.deletePhotoFiles(galleryId, photoId);
  }
}

// Active singleton storage provider (can be toggled in environment or settings)
export const storageProvider: IStorageProvider = new FirebaseStorageProvider();
