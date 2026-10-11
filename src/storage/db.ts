import {
  Gallery,
  Photo,
  Photographer,
  ActivityEvent,
  Collection,
} from '../types';
import { SEED_SCENES, generatePhotoDataUrl } from '../data/photoPresets';

const DB_NAME = 'pitapixel_photo_delivery_db';
const DB_VERSION = 2;

let dbPromise: Promise<IDBDatabase> | null = null;

export function safeTransaction(
  db: IDBDatabase,
  storeNames: string | string[],
  mode: IDBTransactionMode = 'readonly'
): IDBTransaction {
  const requested = Array.isArray(storeNames) ? storeNames : [storeNames];
  const available = requested.filter((name) => db.objectStoreNames.contains(name));
  if (available.length === 0) {
    throw new Error(`None of the requested object stores [${requested.join(', ')}] exist in database.`);
  }
  return db.transaction(available, mode);
}

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('galleries')) {
        const galleryStore = db.createObjectStore('galleries', { keyPath: 'id' });
        galleryStore.createIndex('shareId', 'shareId', { unique: true });
        galleryStore.createIndex('photographerId', 'photographerId', { unique: false });
      }

      if (!db.objectStoreNames.contains('photos')) {
        const photoStore = db.createObjectStore('photos', { keyPath: 'id' });
        photoStore.createIndex('galleryId', 'galleryId', { unique: false });
        photoStore.createIndex('order', 'order', { unique: false });
      }

      if (!db.objectStoreNames.contains('favorites')) {
        const favStore = db.createObjectStore('favorites', { keyPath: 'id' });
        favStore.createIndex('galleryId', 'galleryId', { unique: false });
        favStore.createIndex('photoId', 'photoId', { unique: false });
      }

      if (!db.objectStoreNames.contains('activities')) {
        const actStore = db.createObjectStore('activities', { keyPath: 'id' });
        actStore.createIndex('galleryId', 'galleryId', { unique: false });
      }

      if (!db.objectStoreNames.contains('photographers')) {
        db.createObjectStore('photographers', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  });

  return dbPromise;
}

export const SEED_SHARE_ID = 'elena-marcus-coastal-wedding';
export const LEGACY_SEED_SHARE_ID = 'k9a2f7c0-d3e4-41b2-8f90-8e1c6a23f5b7';
export const SEED_GALLERY_ID = 'gallery-elena-marcus-wedding';
export const SEED_GALLERY_2_ID = 'gallery-maya-daniel-wedding';
export const SEED_SHARE_2_ID = 'maya-daniel-estate-wedding';
export const SEED_PHOTOGRAPHER_ID = 'photo-studio-soren';

/**
 * Ensures initial high-res seed galleries are populated into IndexedDB
 */
export async function ensureSeedData(): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const requiredStores = ['galleries', 'photos', 'photographers', 'activities', 'favorites'];
    const validStores = requiredStores.filter((name) => db.objectStoreNames.contains(name));
    if (!validStores.includes('galleries') || !validStores.includes('photos')) {
      resolve();
      return;
    }

    const tx = db.transaction(validStores, 'readwrite');
    const galleryStore = tx.objectStore('galleries');
    const photoStore = tx.objectStore('photos');
    const photogStore = validStores.includes('photographers') ? tx.objectStore('photographers') : null;
    const actStore = validStores.includes('activities') ? tx.objectStore('activities') : null;

    // Collections for Album 1
    const collectionsGal1: Collection[] = [
      { id: 'col-ceremony', galleryId: SEED_GALLERY_ID, name: 'Ceremony', order: 1 },
      { id: 'col-portraits', galleryId: SEED_GALLERY_ID, name: 'Portraits', order: 2 },
      { id: 'col-reception', galleryId: SEED_GALLERY_ID, name: 'Reception', order: 3 },
      { id: 'col-details', galleryId: SEED_GALLERY_ID, name: 'Details', order: 4 },
    ];

    // Collections for Album 2
    const collectionsGal2: Collection[] = [
      { id: 'col-m2-ceremony', galleryId: SEED_GALLERY_2_ID, name: 'First Look', order: 1 },
      { id: 'col-m2-portraits', galleryId: SEED_GALLERY_2_ID, name: 'Estate Portraits', order: 2 },
      { id: 'col-m2-reception', galleryId: SEED_GALLERY_2_ID, name: 'Celebration', order: 3 },
    ];

    const generatePhotosForGallery = (galleryId: string, colList: Collection[], prefix: string) => {
      return SEED_SCENES.map((scene, idx) => {
        const colMatch = colList[idx % colList.length];
        const thumbUrl = generatePhotoDataUrl(scene, 'thumb');
        const webUrl = generatePhotoDataUrl(scene, 'web');

        return {
          id: `${prefix}-photo-${idx + 1}`,
          galleryId,
          collectionId: colMatch?.id,
          fileName: `${prefix.toUpperCase()}_${String(idx + 1).padStart(2, '0')}_${scene.fileName}`,
          urls: {
            thumb: thumbUrl,
            web: webUrl,
            original: webUrl,
          },
          width: scene.width,
          height: scene.height,
          aspectRatio: scene.aspectRatio,
          order: idx,
          exif: scene.exif,
          createdAt: new Date(Date.now() - (SEED_SCENES.length - idx) * 3600000).toISOString(),
        };
      });
    };

    // Populate photographer
    const photographer: Photographer = {
      id: SEED_PHOTOGRAPHER_ID,
      name: 'Julian Vance',
      brandName: 'Pitapixel Studio',
      email: 'julian@pitapixel.com',
      createdAt: new Date().toISOString(),
    };
    if (photogStore) {
      photogStore.put(photographer);
    }

    // Check Album 1
    const checkReq1 = galleryStore.get(SEED_GALLERY_ID);
    checkReq1.onsuccess = () => {
      const photosGal1 = generatePhotosForGallery(SEED_GALLERY_ID, collectionsGal1, 'em');

      if (checkReq1.result) {
        const existing = checkReq1.result as Gallery;
        let needsUpdate = false;
        if (existing.shareId === LEGACY_SEED_SHARE_ID || !existing.shareId) {
          existing.shareId = SEED_SHARE_ID;
          needsUpdate = true;
        }
        if (!existing.coverFocalPoint) {
          existing.coverFocalPoint = { x: 50, y: 28 };
          needsUpdate = true;
        }
        if (existing.coverOverlayStrength === undefined) {
          existing.coverOverlayStrength = 25;
          needsUpdate = true;
        }
        if (!existing.coverButtonLabel) {
          existing.coverButtonLabel = 'VIEW GALLERY';
          needsUpdate = true;
        }
        if (!existing.coverPhotoId) {
          existing.coverPhotoId = photosGal1[0].id;
          needsUpdate = true;
        }
        if (needsUpdate) {
          galleryStore.put(existing);
        }
      } else {
        // Create Album 1
        for (const p of photosGal1) {
          photoStore.put(p);
        }
        const gallery1: Gallery = {
          id: SEED_GALLERY_ID,
          photographerId: SEED_PHOTOGRAPHER_ID,
          shareId: SEED_SHARE_ID,
          title: 'Elena & Marcus — Coastal Wedding',
          clientName: 'Elena Rostova & Marcus Vance',
          shootDate: 'October 4, 2026',
          coverPhotoId: photosGal1[0].id,
          coverFocalPoint: { x: 50, y: 28 },
          coverOverlayStrength: 25,
          coverButtonLabel: 'VIEW GALLERY',
          coverFramingSummary: 'Refined editorial cover crop',
          settings: {
            allowDownload: true,
            allowFavorites: true,
            sizes: ['web', 'original'],
          },
          collections: collectionsGal1,
          viewCount: 142,
          downloadCount: 38,
          createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
        };
        galleryStore.put(gallery1);
      }

      // Check Album 2
      const checkReq2 = galleryStore.get(SEED_GALLERY_2_ID);
      checkReq2.onsuccess = () => {
        const photosGal2 = generatePhotosForGallery(SEED_GALLERY_2_ID, collectionsGal2, 'md');

        if (checkReq2.result) {
          const existing2 = checkReq2.result as Gallery;
          let needsUpdate2 = false;
          if (!existing2.coverFocalPoint) {
            existing2.coverFocalPoint = { x: 50, y: 35 };
            needsUpdate2 = true;
          }
          if (existing2.coverOverlayStrength === undefined) {
            existing2.coverOverlayStrength = 25;
            needsUpdate2 = true;
          }
          if (!existing2.coverButtonLabel) {
            existing2.coverButtonLabel = 'VIEW GALLERY';
            needsUpdate2 = true;
          }
          if (!existing2.coverPhotoId) {
            existing2.coverPhotoId = photosGal2[1].id;
            needsUpdate2 = true;
          }
          if (needsUpdate2) {
            galleryStore.put(existing2);
          }
        } else {
          // Create Album 2
          for (const p of photosGal2) {
            photoStore.put(p);
          }
          const gallery2: Gallery = {
            id: SEED_GALLERY_2_ID,
            photographerId: SEED_PHOTOGRAPHER_ID,
            shareId: SEED_SHARE_2_ID,
            title: 'Maya & Daniel — Estate Wedding',
            clientName: 'Maya Chen & Daniel Ross',
            shootDate: 'September 18, 2026',
            coverPhotoId: photosGal2[1].id,
            coverFocalPoint: { x: 50, y: 32 },
            coverOverlayStrength: 25,
            coverButtonLabel: 'VIEW GALLERY',
            coverFramingSummary: 'Estate terrace portraits',
            settings: {
              allowDownload: true,
              allowFavorites: true,
              sizes: ['web', 'original'],
            },
            collections: collectionsGal2,
            viewCount: 89,
            downloadCount: 19,
            createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
          };
          galleryStore.put(gallery2);
        }

        // Check if photos exist for Gal 1
        const pIndex = photoStore.index('galleryId');
        const countReq1 = pIndex.count(SEED_GALLERY_ID);
        countReq1.onsuccess = () => {
          if (countReq1.result === 0) {
            for (const p of photosGal1) {
              photoStore.put(p);
            }
          }
          const countReq2 = pIndex.count(SEED_GALLERY_2_ID);
          countReq2.onsuccess = () => {
            if (countReq2.result === 0) {
              for (const p of photosGal2) {
                photoStore.put(p);
              }
            }
          };
        };
      };
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// =================== Storage Access APIs ===================

export async function getGalleryByShareId(shareId: string): Promise<Gallery | null> {
  await ensureSeedData();
  const db = await openDB();

  const lookupId = shareId === LEGACY_SEED_SHARE_ID ? SEED_SHARE_ID : shareId;

  return new Promise((resolve, reject) => {
    const tx = db.transaction('galleries', 'readonly');
    const store = tx.objectStore('galleries');
    const index = store.index('shareId');
    const req = index.get(lookupId);

    req.onsuccess = () => {
      if (req.result) {
        resolve(req.result);
      } else {
        // Fallback: check all galleries for case-insensitive match or fallback to seed
        const allReq = store.getAll();
        allReq.onsuccess = () => {
          const list: Gallery[] = allReq.result || [];
          const cleanId = (shareId || '').toLowerCase().trim();
          const match = list.find(
            (g) =>
              g.shareId.toLowerCase() === cleanId ||
              g.id.toLowerCase() === cleanId ||
              cleanId.includes(g.shareId.toLowerCase()) ||
              g.shareId.toLowerCase().includes(cleanId) ||
              g.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').includes(cleanId) ||
              cleanId.includes(g.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
          );
          resolve(match || list[0] || null);
        };
        allReq.onerror = () => resolve(null);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getGalleryById(id: string): Promise<Gallery | null> {
  await ensureSeedData();
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('galleries', 'readonly');
    const store = tx.objectStore('galleries');
    const req = store.get(id);

    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function getAllGalleries(): Promise<Gallery[]> {
  await ensureSeedData();
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('galleries', 'readonly');
    const store = tx.objectStore('galleries');
    const req = store.getAll();

    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function saveGallery(gallery: Gallery): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('galleries', 'readwrite');
    const store = tx.objectStore('galleries');
    const req = store.put(gallery);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deleteGallery(id: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = safeTransaction(db, ['galleries', 'photos', 'favorites', 'activities'], 'readwrite');
    tx.objectStore('galleries').delete(id);

    // Delete photos associated with gallery
    const photoStore = tx.objectStore('photos');
    const photoIndex = photoStore.index('galleryId');
    const pReq = photoIndex.getAll(id);
    pReq.onsuccess = () => {
      for (const p of pReq.result) {
        photoStore.delete(p.id);
      }
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPhotosByGallery(galleryId: string): Promise<Photo[]> {
  await ensureSeedData();
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('photos', 'readonly');
    const store = tx.objectStore('photos');
    const index = store.index('galleryId');
    const req = index.getAll(galleryId);

    req.onsuccess = () => {
      let photos: Photo[] = req.result || [];
      if (photos.length === 0 && (galleryId === SEED_GALLERY_ID || galleryId === 'gallery-elena-marcus-wedding')) {
        // Generate immediately
        const collections: Collection[] = [
          { id: 'col-ceremony', galleryId: SEED_GALLERY_ID, name: 'Ceremony', order: 1 },
          { id: 'col-portraits', galleryId: SEED_GALLERY_ID, name: 'Portraits', order: 2 },
          { id: 'col-reception', galleryId: SEED_GALLERY_ID, name: 'Reception', order: 3 },
          { id: 'col-details', galleryId: SEED_GALLERY_ID, name: 'Details', order: 4 },
        ];
        photos = SEED_SCENES.map((scene, idx) => ({
          id: `photo-${idx + 1}`,
          galleryId: SEED_GALLERY_ID,
          collectionId: collections.find((c) => c.name === scene.collection)?.id,
          fileName: scene.fileName,
          urls: {
            thumb: generatePhotoDataUrl(scene, 'thumb'),
            web: generatePhotoDataUrl(scene, 'web'),
            original: generatePhotoDataUrl(scene, 'web'),
          },
          width: scene.width,
          height: scene.height,
          aspectRatio: scene.aspectRatio,
          order: idx,
          exif: scene.exif,
          createdAt: new Date().toISOString(),
        }));
        // Save in background
        savePhotosBatch(photos).catch(() => {});
      }
      photos.sort((a, b) => a.order - b.order);
      resolve(photos);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function savePhoto(photo: Photo): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('photos', 'readwrite');
    const store = tx.objectStore('photos');
    const req = store.put(photo);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function savePhotosBatch(photos: Photo[]): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('photos', 'readwrite');
    const store = tx.objectStore('photos');

    for (const p of photos) {
      store.put(p);
    }

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deletePhoto(photoId: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('photos', 'readwrite');
    const store = tx.objectStore('photos');
    const req = store.delete(photoId);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getFavorites(galleryId: string): Promise<string[]> {
  await ensureSeedData();
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('favorites', 'readonly');
    const store = tx.objectStore('favorites');
    const index = store.index('galleryId');
    const req = index.getAll(galleryId);

    req.onsuccess = () => {
      const records = req.result || [];
      resolve(records.map((r: { photoId: string }) => r.photoId));
    };
    req.onerror = () => reject(req.error);
  });
}

export async function toggleFavoritePhoto(galleryId: string, photoId: string): Promise<boolean> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    if (!db.objectStoreNames.contains('favorites')) {
      resolve(false);
      return;
    }
    const stores = ['favorites'];
    if (db.objectStoreNames.contains('activities')) stores.push('activities');
    const tx = db.transaction(stores, 'readwrite');
    const favStore = tx.objectStore('favorites');
    const favId = `fav-${photoId}`;

    const getReq = favStore.get(favId);
    getReq.onsuccess = () => {
      if (getReq.result) {
        // Remove
        favStore.delete(favId);
        tx.oncomplete = () => resolve(false);
      } else {
        // Add
        favStore.put({
          id: favId,
          galleryId,
          photoId,
          createdAt: new Date().toISOString(),
        });

        // Record activity if store exists
        if (db.objectStoreNames.contains('activities')) {
          const actStore = tx.objectStore('activities');
          actStore.put({
            id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            galleryId,
            type: 'favorite',
            photoId,
            details: 'Client favorited photo',
            timestamp: new Date().toISOString(),
          });
        }

        tx.oncomplete = () => resolve(true);
      }
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

export async function recordActivity(
  galleryId: string,
  type: ActivityEvent['type'],
  details?: string,
  photoId?: string
): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const stores: string[] = [];
    if (db.objectStoreNames.contains('activities')) stores.push('activities');
    if (db.objectStoreNames.contains('galleries')) stores.push('galleries');
    if (stores.length === 0) {
      resolve();
      return;
    }
    const tx = db.transaction(stores, 'readwrite');
    if (stores.includes('activities')) {
      const actStore = tx.objectStore('activities');
      actStore.put({
        id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        galleryId,
        type,
        details,
        photoId,
        timestamp: new Date().toISOString(),
      });
    }

    if (stores.includes('galleries')) {
      const galleryStore = tx.objectStore('galleries');

      if (type === 'view') {
        const gReq = galleryStore.get(galleryId);
        gReq.onsuccess = () => {
          if (gReq.result) {
            const g = gReq.result as Gallery;
            g.viewCount = (g.viewCount || 0) + 1;
            galleryStore.put(g);
          }
        };
      } else if (type === 'download') {
        const gReq = galleryStore.get(galleryId);
        gReq.onsuccess = () => {
          if (gReq.result) {
            const g = gReq.result as Gallery;
            g.downloadCount = (g.downloadCount || 0) + 1;
            galleryStore.put(g);
          }
        };
      }
    }

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getActivities(galleryId: string): Promise<ActivityEvent[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('activities', 'readonly');
    const store = tx.objectStore('activities');
    const index = store.index('galleryId');
    const req = index.getAll(galleryId);

    req.onsuccess = () => {
      const acts: ActivityEvent[] = req.result || [];
      acts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      resolve(acts);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getPhotographer(id: string = SEED_PHOTOGRAPHER_ID): Promise<Photographer | null> {
  await ensureSeedData();
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('photographers', 'readonly');
    const store = tx.objectStore('photographers');
    const req = store.get(id);

    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}
