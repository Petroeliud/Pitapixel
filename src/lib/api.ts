import { CLOUD_NAME } from './cloudinaryUrls';
import { Gallery, Photo } from '../types';

const ADMIN_TOKEN_KEY = 'pitapixel_admin_token';

let adminPasswordToken: string | null = (() => {
  try {
    return sessionStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
})();

export function setAdminPasswordToken(password: string) {
  adminPasswordToken = password;
  try {
    sessionStorage.setItem(ADMIN_TOKEN_KEY, password);
  } catch {}
}

export function getAdminPasswordToken(): string | null {
  if (!adminPasswordToken) {
    try {
      adminPasswordToken = sessionStorage.getItem(ADMIN_TOKEN_KEY);
    } catch {}
  }
  return adminPasswordToken;
}

export function clearAdminPasswordToken() {
  adminPasswordToken = null;
  try {
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {}
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (adminPasswordToken) {
    headers['x-admin-password'] = adminPasswordToken;
  }
  return headers;
}

/**
 * Login admin with password
 */
export async function loginAdmin(password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      setAdminPasswordToken(password);
      return { success: true };
    }
    return { success: false, error: data.error || 'Invalid admin password' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Server error' };
  }
}

/**
 * List all galleries (admin)
 */
export async function fetchAllGalleries(): Promise<Gallery[]> {
  const res = await fetch('/api/galleries', {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error('Failed to fetch galleries');
  }
  const data = await res.json();
  return data.galleries || [];
}

/**
 * Create a new gallery (admin)
 */
export async function createGalleryApi(payload: {
  title: string;
  clientName?: string;
  shootDate?: string;
  customSlug?: string;
}): Promise<{ gallery: Gallery; shareUrl: string }> {
  const res = await fetch('/api/galleries', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create gallery');
  }

  return await res.json();
}

/**
 * Fetch gallery & photo list (public)
 */
export async function fetchGalleryApi(
  galleryId: string
): Promise<{ gallery: Gallery | null; photos: Photo[] }> {
  const res = await fetch(`/api/galleries/${encodeURIComponent(galleryId)}`);
  if (!res.ok) {
    if (res.status === 404) {
      return { gallery: null, photos: [] };
    }
    throw new Error('Error loading gallery from server');
  }

  const data = await res.json();
  return {
    gallery: data.gallery,
    photos: data.photos || [],
  };
}

/**
 * Update gallery metadata (admin)
 */
export async function updateGalleryApi(
  galleryId: string,
  patch: Partial<Gallery>
): Promise<Gallery> {
  const res = await fetch(`/api/galleries/${encodeURIComponent(galleryId)}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(patch),
  });

  if (!res.ok) {
    throw new Error('Failed to update gallery');
  }

  const data = await res.json();
  return data.gallery;
}

/**
 * Delete a gallery (admin)
 */
export async function deleteGalleryApi(galleryId: string): Promise<boolean> {
  const res = await fetch(`/api/galleries/${encodeURIComponent(galleryId)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error('Failed to delete gallery');
  }

  const data = await res.json();
  return data.success;
}

/**
 * Get signed upload signature for uploading directly to Cloudinary
 */
export async function getUploadSignatureApi(galleryId: string): Promise<{
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
  tags: string;
}> {
  const res = await fetch(`/api/galleries/${encodeURIComponent(galleryId)}/upload-signature`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error('Failed to get upload signature from server');
  }

  return await res.json();
}

/**
 * Upload a photo directly from browser to Cloudinary using signed signature
 */
export function uploadPhotoToCloudinary(
  file: File,
  signatureData: {
    timestamp: number;
    signature: string;
    apiKey: string;
    cloudName: string;
    folder: string;
    tags: string;
  },
  onProgress?: (percent: number) => void
): Promise<any> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = `https://api.cloudinary.com/v1_1/${signatureData.cloudName || CLOUD_NAME}/image/upload`;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', signatureData.apiKey);
    formData.append('timestamp', signatureData.timestamp.toString());
    formData.append('signature', signatureData.signature);
    formData.append('folder', signatureData.folder);
    formData.append('tags', signatureData.tags);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (e) {
          reject(new Error('Invalid JSON response from Cloudinary'));
        }
      } else {
        try {
          const errResponse = JSON.parse(xhr.responseText);
          reject(new Error(errResponse.error?.message || 'Upload to Cloudinary failed'));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => reject(new Error('Network error during photo upload'));
    xhr.ontimeout = () => reject(new Error('Upload request timed out'));

    xhr.open('POST', url, true);
    xhr.send(formData);
  });
}

/**
 * Delete a photo by publicId
 */
export async function deletePhotoApi(galleryId: string, publicId: string): Promise<boolean> {
  const res = await fetch(`/api/galleries/${encodeURIComponent(galleryId)}/delete-photo`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ publicId }),
  });

  if (!res.ok) {
    throw new Error('Failed to delete photo');
  }

  const data = await res.json();
  return data.success;
}
