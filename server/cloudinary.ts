import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'bzimyrvw';
const apiKey = process.env.CLOUDINARY_API_KEY || '261693571528566';
const apiSecret = process.env.CLOUDINARY_API_SECRET || 'k3bB19N7cGDzK7Qjvtu3u6lI6iI';

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

export { cloudinary };

export interface GalleryMeta {
  id: string;
  photographerId?: string;
  shareId: string;
  title: string;
  clientName?: string;
  shootDate: string;
  coverPhotoId?: string;
  coverPhotoPublicId?: string;
  coverFocalPoint?: { x: number; y: number };
  coverFramingSummary?: string;
  coverOverlayStrength?: number;
  coverCustomTitle?: string;
  coverCustomDate?: string;
  coverButtonLabel?: string;
  password?: string;
  expiresAt?: string;
  settings?: {
    allowDownload: boolean;
    allowFavorites: boolean;
    sizes: string[];
  };
  collections?: any[];
  favorites?: string[];
  activity?: any[];
  viewCount?: number;
  downloadCount?: number;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Save or update gallery meta.json in Cloudinary raw storage
 */
export async function saveGalleryMeta(galleryId: string, meta: GalleryMeta): Promise<GalleryMeta> {
  const jsonContent = JSON.stringify(meta, null, 2);
  const base64Data = Buffer.from(jsonContent).toString('base64');
  const dataUri = `data:application/json;base64,${base64Data}`;

  await cloudinary.uploader.upload(dataUri, {
    public_id: `clients/${galleryId}/meta.json`,
    resource_type: 'raw',
    overwrite: true,
    invalidate: true,
  });

  return meta;
}

/**
 * Get gallery meta.json from Cloudinary
 */
export async function getGalleryMeta(galleryId: string): Promise<GalleryMeta | null> {
  try {
    const resource = await cloudinary.api.resource(`clients/${galleryId}/meta.json`, {
      resource_type: 'raw',
    });

    if (!resource || !resource.secure_url) {
      return null;
    }

    const response = await fetch(resource.secure_url);
    if (!response.ok) return null;
    const meta = await response.json();
    return meta;
  } catch (error) {
    // If not found or error, return null
    return null;
  }
}

/**
 * Get all photos in a gallery folder from Cloudinary with pagination (>100 photos)
 */
export async function getGalleryPhotos(galleryId: string): Promise<any[]> {
  try {
    let allResources: any[] = [];
    let nextCursor: string | undefined = undefined;

    do {
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: `clients/${galleryId}/`,
        max_results: 100,
        next_cursor: nextCursor,
        context: true,
        tags: true,
      });

      if (result.resources && Array.isArray(result.resources)) {
        allResources = allResources.concat(result.resources);
      }
      nextCursor = result.next_cursor;
    } while (nextCursor);

    // Filter out any non-images or meta.json if returned
    const photos = allResources
      .filter((res) => res.resource_type === 'image')
      .map((res, index) => {
        const publicId = res.public_id;
        const fileName =
          res.context?.custom?.caption ||
          res.original_filename ||
          publicId.split('/').pop() ||
          'photo.jpg';

        const width = res.width || 1200;
        const height = res.height || 800;

        return {
          id: publicId,
          publicId,
          galleryId,
          fileName,
          urls: {
            thumb: `https://res.cloudinary.com/${cloudName}/image/upload/w_800,c_limit,q_auto,f_auto/${publicId}`,
            web: `https://res.cloudinary.com/${cloudName}/image/upload/w_1800,c_limit,q_auto,f_auto/${publicId}`,
            original: `https://res.cloudinary.com/${cloudName}/image/upload/fl_attachment/${publicId}`,
          },
          width,
          height,
          aspectRatio: width / height,
          order: index,
          createdAt: res.created_at || new Date().toISOString(),
        };
      });

    return photos;
  } catch (error) {
    console.error(`Error fetching photos for gallery ${galleryId}:`, error);
    return [];
  }
}

/**
 * Generate a signed upload payload for browser direct upload
 */
export function generateUploadSignature(galleryId: string) {
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `clients/${galleryId}`;
  const tags = `gallery_${galleryId}`;

  const paramsToSign = {
    folder,
    tags,
    timestamp,
  };

  const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

  return {
    timestamp,
    signature,
    apiKey,
    cloudName,
    folder,
    tags,
  };
}

/**
 * List all galleries by querying raw meta.json resources in Cloudinary
 */
export async function listAllGalleries(): Promise<GalleryMeta[]> {
  try {
    let allResources: any[] = [];
    let nextCursor: string | undefined = undefined;

    do {
      const result = await cloudinary.api.resources({
        resource_type: 'raw',
        prefix: 'clients/',
        max_results: 100,
        next_cursor: nextCursor,
      });

      if (result.resources && Array.isArray(result.resources)) {
        allResources = allResources.concat(result.resources);
      }
      nextCursor = result.next_cursor;
    } while (nextCursor);

    const metaFiles = allResources.filter((r) => r.public_id.endsWith('/meta.json'));

    const galleries = await Promise.all(
      metaFiles.map(async (res) => {
        try {
          const resp = await fetch(res.secure_url);
          if (resp.ok) {
            return await resp.json();
          }
        } catch {}
        return null;
      })
    );

    return galleries.filter(Boolean) as GalleryMeta[];
  } catch (error) {
    console.error('Error listing galleries from Cloudinary:', error);
    return [];
  }
}

/**
 * Delete a photo by public_id
 */
export async function deletePhotoByPublicId(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
    });
    return result.result === 'ok';
  } catch (error) {
    console.error(`Error deleting photo ${publicId}:`, error);
    return false;
  }
}

/**
 * Delete gallery, all its photos and folder
 */
export async function deleteGalleryAndContents(galleryId: string): Promise<boolean> {
  try {
    // 1. Delete all resources with prefix
    await cloudinary.api.delete_resources_by_prefix(`clients/${galleryId}/`);
    await cloudinary.api.delete_resources_by_prefix(`clients/${galleryId}/`, {
      resource_type: 'raw',
    });

    // 2. Delete empty folder
    try {
      await cloudinary.api.delete_folder(`clients/${galleryId}`);
    } catch {}

    return true;
  } catch (error) {
    console.error(`Error deleting gallery ${galleryId}:`, error);
    return false;
  }
}
