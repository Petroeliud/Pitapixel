import { Gallery, Photo, Photographer, ActivityEvent } from '../types';
import {
  fetchAllGalleries,
  fetchGalleryApi,
  createGalleryApi,
  updateGalleryApi,
  deleteGalleryApi,
  deletePhotoApi,
} from '../lib/api';

export const SEED_SHARE_ID = 'demo-gallery';
export const LEGACY_SEED_SHARE_ID = 'demo-gallery';
export const SEED_GALLERY_ID = 'demo-gallery';
export const SEED_GALLERY_2_ID = 'demo-gallery-2';
export const SEED_SHARE_2_ID = 'demo-gallery-2';
export const SEED_PHOTOGRAPHER_ID = 'photo-studio-main';

export async function ensureSeedData(): Promise<void> {
  // All data is live on Cloudinary backend
  return Promise.resolve();
}

export async function getDeletedGalleryIds(): Promise<string[]> {
  return [];
}

export async function markGalleryDeleted(_galleryId: string): Promise<void> {
  // No-op for deleted tracking
}

export async function getAllGalleries(): Promise<Gallery[]> {
  try {
    return await fetchAllGalleries();
  } catch (err) {
    console.warn('Could not fetch galleries from server:', err);
    return [];
  }
}

export async function getGalleryByShareId(shareId: string): Promise<Gallery | null> {
  if (!shareId) return null;
  try {
    const res = await fetchGalleryApi(shareId);
    return res.gallery;
  } catch (err) {
    console.warn(`Error fetching gallery by shareId ${shareId}:`, err);
    return null;
  }
}

export async function getGalleryById(id: string): Promise<Gallery | null> {
  if (!id) return null;
  try {
    const res = await fetchGalleryApi(id);
    return res.gallery;
  } catch (err) {
    console.warn(`Error fetching gallery by id ${id}:`, err);
    return null;
  }
}

export async function saveGallery(gallery: Gallery): Promise<void> {
  try {
    await updateGalleryApi(gallery.id, gallery);
  } catch (err) {
    console.error('Error saving gallery to server:', err);
  }
}

export async function createGallery(payload: {
  title: string;
  clientName?: string;
  shootDate?: string;
  customSlug?: string;
}): Promise<{ gallery: Gallery; shareUrl: string }> {
  return await createGalleryApi(payload);
}

export async function deleteGallery(id: string): Promise<void> {
  try {
    await deleteGalleryApi(id);
  } catch (err) {
    console.error('Error deleting gallery on server:', err);
  }
}

export async function getPhotosByGallery(galleryId: string): Promise<Photo[]> {
  if (!galleryId) return [];
  try {
    const res = await fetchGalleryApi(galleryId);
    return res.photos || [];
  } catch (err) {
    console.warn(`Error fetching photos for gallery ${galleryId}:`, err);
    return [];
  }
}

export async function savePhoto(_photo: Photo): Promise<void> {
  // Photos are uploaded directly to Cloudinary via signed batch upload
}

export async function savePhotosBatch(_photos: Photo[]): Promise<void> {
  // Photos are uploaded directly to Cloudinary via signed batch upload
}

export async function deletePhoto(photoId: string, galleryId?: string): Promise<void> {
  if (galleryId && photoId) {
    try {
      await deletePhotoApi(galleryId, photoId);
    } catch (err) {
      console.error(`Error deleting photo ${photoId}:`, err);
    }
  }
}

export async function getPhotographer(): Promise<Photographer> {
  return {
    id: SEED_PHOTOGRAPHER_ID,
    name: 'Eliud Petro',
    brandName: 'Pitapixel Studio',
    email: 'petroeliud04@gmail.com',
    createdAt: new Date().toISOString(),
  };
}

export async function savePhotographer(_photographer: Photographer): Promise<void> {
  // Saved in photographer profile
}

export async function getFavorites(galleryId: string): Promise<string[]> {
  const g = await getGalleryById(galleryId);
  return g?.favorites || [];
}

export async function toggleFavoritePhoto(galleryId: string, photoId: string): Promise<boolean> {
  const g = await getGalleryById(galleryId);
  if (!g) return false;

  const currentFavs = g.favorites || [];
  const isFav = currentFavs.includes(photoId);
  const updatedFavs = isFav
    ? currentFavs.filter((id: string) => id !== photoId)
    : [...currentFavs, photoId];

  await updateGalleryApi(galleryId, { favorites: updatedFavs });
  return !isFav;
}

export async function recordActivity(
  galleryId: string,
  type: ActivityEvent['type'],
  details: string
): Promise<void> {
  const g = await getGalleryById(galleryId);
  if (!g) return;

  const currentActs = g.activity || [];
  const newAct: ActivityEvent = {
    id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    galleryId,
    type,
    details,
    timestamp: new Date().toISOString(),
  };

  await updateGalleryApi(galleryId, { activity: [newAct, ...currentActs].slice(0, 50) });
}

export async function getActivities(galleryId: string): Promise<ActivityEvent[]> {
  const g = await getGalleryById(galleryId);
  return g?.activity || [];
}
