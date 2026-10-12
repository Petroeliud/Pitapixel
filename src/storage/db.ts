import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db as firestoreDb } from './firebase';
import { storageProvider } from './storageProvider';
import {
  Gallery,
  Photo,
  Photographer,
  ActivityEvent,
  Collection,
} from '../types';
import { SEED_SCENES, generatePhotoDataUrl } from '../data/photoPresets';

const DB_NAME = 'pitapixel_photo_delivery_db';
const DB_VERSION = 3;

let dbPromise: Promise<IDBDatabase> | null = null;

export const SEED_SHARE_ID = 'elena-marcus-coastal-wedding';
export const LEGACY_SEED_SHARE_ID = 'k9a2f7c0-d3e4-41b2-8f90-8e1c6a23f5b7';
export const SEED_GALLERY_ID = 'gallery-elena-marcus-wedding';
export const SEED_GALLERY_2_ID = 'gallery-maya-daniel-wedding';
export const SEED_SHARE_2_ID = 'maya-daniel-estate-wedding';
export const SEED_PHOTOGRAPHER_ID = 'photo-studio-main';

const DELETED_STORAGE_KEY = 'pitapixel_deleted_gallery_ids';

// =================== Deleted Galleries Tracking ===================

export async function getDeletedGalleryIds(): Promise<string[]> {
  const localSet = new Set<string>();
  try {
    const raw = localStorage.getItem(DELETED_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((id) => localSet.add(id));
      }
    }
  } catch {
    // Ignore localStorage errors
  }

  try {
    const configSnap = await getDoc(doc(firestoreDb, 'system', 'config'));
    if (configSnap.exists()) {
      const data = configSnap.data();
      if (Array.isArray(data?.deletedGalleryIds)) {
        data.deletedGalleryIds.forEach((id: string) => localSet.add(id));
      }
    }
  } catch (err) {
    console.warn('Could not read deleted galleries from Firestore:', err);
  }

  return Array.from(localSet);
}

export async function markGalleryDeleted(galleryId: string): Promise<void> {
  // Update local storage immediately
  try {
    const current = await getDeletedGalleryIds();
    if (!current.includes(galleryId)) {
      current.push(galleryId);
      localStorage.setItem(DELETED_STORAGE_KEY, JSON.stringify(current));
    }
  } catch {
    // Ignore
  }

  // Update Firestore config
  try {
    const current = await getDeletedGalleryIds();
    if (!current.includes(galleryId)) {
      current.push(galleryId);
    }
    await setDoc(
      doc(firestoreDb, 'system', 'config'),
      { deletedGalleryIds: current },
      { merge: true }
    );
  } catch (err) {
    console.warn('Could not mark gallery deleted in Firestore:', err);
  }
}

// =================== IndexedDB Setup ===================

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

// Helper to sanitize photo objects for Firestore (ensure <800KB)
function sanitizePhotoForFirestore(photo: Photo): Photo {
  const safe: Photo = { ...photo };
  // If original data url is > 400KB, use web url in Firestore to avoid 1MB doc limits
  if (safe.urls.original && safe.urls.original.length > 400000) {
    safe.urls = {
      ...safe.urls,
      original: safe.urls.web || safe.urls.thumb,
    };
  }
  // If web data url is also very large, fallback to thumb
  if (safe.urls.web && safe.urls.web.length > 700000) {
    safe.urls = {
      ...safe.urls,
      web: safe.urls.thumb,
      original: safe.urls.thumb,
    };
  }
  return safe;
}

function generatePhotosForGallery(
  galleryId: string,
  collections: Collection[],
  prefix: string
): Photo[] {
  return SEED_SCENES.map((scene, idx) => {
    const col = collections.find((c) => c.name === scene.collection);
    return {
      id: `photo-${prefix}-${idx + 1}`,
      galleryId,
      collectionId: col?.id,
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
    };
  });
}

// =================== Seed Data Initialization (Optional Demo Gallery) ===================

export async function ensureSeedData(): Promise<void> {
  // Real backend mode: Automatic mock seeding is disabled.
  // Galleries and photos are persisted live in Firestore & Firebase Storage.
  return Promise.resolve();
}

export async function loadDemoGallery(photographerId: string = SEED_PHOTOGRAPHER_ID): Promise<Gallery> {
  const collectionsGal: Collection[] = [
    { id: `col-ceremony-${Date.now()}`, galleryId: SEED_GALLERY_ID, name: 'Ceremony', order: 1 },
    { id: `col-portraits-${Date.now()}`, galleryId: SEED_GALLERY_ID, name: 'Portraits', order: 2 },
    { id: `col-reception-${Date.now()}`, galleryId: SEED_GALLERY_ID, name: 'Reception', order: 3 },
  ];

  const photosGal = generatePhotosForGallery(SEED_GALLERY_ID, collectionsGal, 'demo');

  const demoGallery: Gallery = {
    id: `gallery-demo-${Date.now()}`,
    photographerId,
    shareId: `demo-${Math.random().toString(36).substring(2, 8)}`,
    title: 'Demo Gallery — Coastal Ceremony',
    clientName: 'Elena Rostova & Marcus Vance',
    shootDate: 'October 4, 2026',
    coverPhotoId: photosGal[0].id,
    coverFocalPoint: { x: 50, y: 28 },
    coverOverlayStrength: 25,
    coverButtonLabel: 'VIEW GALLERY',
    coverFramingSummary: 'Refined editorial cover crop',
    settings: {
      allowDownload: true,
      allowFavorites: true,
      sizes: ['web', 'original'],
    },
    collections: collectionsGal,
    viewCount: 1,
    downloadCount: 0,
    createdAt: new Date().toISOString(),
  };

  await setDoc(doc(firestoreDb, 'galleries', demoGallery.id), demoGallery);
  for (const p of photosGal) {
    p.galleryId = demoGallery.id;
    await setDoc(
      doc(firestoreDb, 'galleries', demoGallery.id, 'photos', p.id),
      sanitizePhotoForFirestore(p)
    );
  }

  saveGalleryToIndexedDB(demoGallery).catch(() => {});
  return demoGallery;
}

// =================== Storage Access APIs ===================

async function fetchAllGalleriesFromFirestore(): Promise<Gallery[]> {
  try {
    const snap = await getDocs(collection(firestoreDb, 'galleries'));
    const deletedIds = await getDeletedGalleryIds();
    const list: Gallery[] = [];

    snap.forEach((d) => {
      const g = d.data() as Gallery;
      if (g && g.id && !deletedIds.includes(g.id)) {
        list.push(g);
      }
    });

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  } catch (err) {
    console.warn('Error fetching galleries from Firestore:', err);
    return [];
  }
}

export async function getGalleryByShareId(shareId: string): Promise<Gallery | null> {
  const cleanId = (shareId || '').toLowerCase().trim();
  if (!cleanId) return null;

  const deletedIds = await getDeletedGalleryIds();

  // 1. Check Firestore by exact shareId
  try {
    const q = query(collection(firestoreDb, 'galleries'), where('shareId', '==', cleanId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const g = snap.docs[0].data() as Gallery;
      if (!deletedIds.includes(g.id)) {
        saveGalleryToIndexedDB(g).catch(() => {});
        return g;
      }
    }
  } catch (err) {
    console.warn('Firestore shareId query failed, trying doc lookup:', err);
  }

  // 2. Check Firestore by exact document ID
  try {
    const docSnap = await getDoc(doc(firestoreDb, 'galleries', cleanId));
    if (docSnap.exists()) {
      const g = docSnap.data() as Gallery;
      if (!deletedIds.includes(g.id)) {
        saveGalleryToIndexedDB(g).catch(() => {});
        return g;
      }
    }
  } catch (err) {
    console.warn('Firestore doc lookup failed:', err);
  }

  // 3. Fallback to all Firestore galleries with strict exact match (case-insensitive)
  try {
    const allGalleries = await fetchAllGalleriesFromFirestore();
    const match = allGalleries.find((g) => {
      const s = (g.shareId || '').toLowerCase().trim();
      const i = (g.id || '').toLowerCase().trim();
      return s === cleanId || i === cleanId;
    });
    if (match) {
      saveGalleryToIndexedDB(match).catch(() => {});
      return match;
    }
  } catch (err) {
    console.warn('Firestore all galleries lookup failed:', err);
  }

  // 4. Fallback to local IndexedDB (exact match only)
  try {
    const idb = await openDB();
    const tx = idb.transaction('galleries', 'readonly');
    const store = tx.objectStore('galleries');

    return new Promise((resolve) => {
      const req = store.getAll();
      req.onsuccess = () => {
        const list: Gallery[] = req.result || [];
        const match = list.find((g) => {
          if (deletedIds.includes(g.id)) return false;
          const s = (g.shareId || '').toLowerCase().trim();
          const i = (g.id || '').toLowerCase().trim();
          return s === cleanId || i === cleanId;
        });
        resolve(match || null);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function getGalleryById(id: string): Promise<Gallery | null> {
  const deletedIds = await getDeletedGalleryIds();
  if (deletedIds.includes(id)) return null;

  try {
    const docSnap = await getDoc(doc(firestoreDb, 'galleries', id));
    if (docSnap.exists()) {
      return docSnap.data() as Gallery;
    }
  } catch {
    // Fallback to IndexedDB
  }

  const idb = await openDB();
  return new Promise((resolve) => {
    const tx = idb.transaction('galleries', 'readonly');
    const req = tx.objectStore('galleries').get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => resolve(null);
  });
}

export async function getAllGalleries(): Promise<Gallery[]> {
  await ensureSeedData();

  // Try Firestore first
  const firestoreList = await fetchAllGalleriesFromFirestore();
  if (firestoreList.length > 0) {
    return firestoreList;
  }

  // Fallback to IndexedDB
  const idb = await openDB();
  const deletedIds = await getDeletedGalleryIds();

  return new Promise((resolve) => {
    const tx = idb.transaction('galleries', 'readonly');
    const req = tx.objectStore('galleries').getAll();
    req.onsuccess = () => {
      const list: Gallery[] = (req.result || []).filter(
        (g: Gallery) => !deletedIds.includes(g.id)
      );
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      resolve(list);
    };
    req.onerror = () => resolve([]);
  });
}

async function saveGalleryToIndexedDB(gallery: Gallery): Promise<void> {
  try {
    const idb = await openDB();
    const tx = idb.transaction('galleries', 'readwrite');
    tx.objectStore('galleries').put(gallery);
  } catch (err) {
    console.warn('Could not cache gallery in IndexedDB:', err);
  }
}

export async function saveGallery(gallery: Gallery): Promise<void> {
  // 1. Save to Firestore so it is globally available across all browsers and devices
  try {
    await setDoc(doc(firestoreDb, 'galleries', gallery.id), gallery, { merge: true });
  } catch (err) {
    console.error('Error saving gallery to Firestore:', err);
  }

  // 2. Save to local IndexedDB
  await saveGalleryToIndexedDB(gallery);
}

export async function deleteGallery(id: string): Promise<void> {
  // 1. Record as deleted so seed data NEVER resurrects it
  await markGalleryDeleted(id);

  // 2. Delete from Firestore
  try {
    await deleteDoc(doc(firestoreDb, 'galleries', id));

    // Delete photos in subcollection
    const photosSnap = await getDocs(collection(firestoreDb, 'galleries', id, 'photos'));
    const batch = writeBatch(firestoreDb);
    photosSnap.forEach((pDoc) => {
      batch.delete(pDoc.ref);
    });
    await batch.commit();
  } catch (err) {
    console.warn('Could not delete gallery from Firestore:', err);
  }

  // 3. Delete from IndexedDB
  try {
    const idb = await openDB();
    const tx = safeTransaction(idb, ['galleries', 'photos', 'favorites', 'activities'], 'readwrite');
    tx.objectStore('galleries').delete(id);

    const photoStore = tx.objectStore('photos');
    const photoIndex = photoStore.index('galleryId');
    const pReq = photoIndex.getAll(id);
    pReq.onsuccess = () => {
      for (const p of pReq.result) {
        photoStore.delete(p.id);
      }
    };
  } catch (err) {
    console.warn('Could not delete from IndexedDB:', err);
  }
}

// =================== Photos Data Access ===================

export async function getPhotosByGallery(galleryId: string): Promise<Photo[]> {
  // 1. Try Firestore subcollection first
  try {
    const snap = await getDocs(collection(firestoreDb, 'galleries', galleryId, 'photos'));
    if (!snap.empty) {
      const photos: Photo[] = [];
      snap.forEach((d) => {
        photos.push(d.data() as Photo);
      });
      photos.sort((a, b) => a.order - b.order);

      // Cache into local IndexedDB
      try {
        const idb = await openDB();
        const tx = idb.transaction('photos', 'readwrite');
        const store = tx.objectStore('photos');
        for (const p of photos) {
          store.put(p);
        }
      } catch {
        // Non-blocking
      }

      return photos;
    }
  } catch (err) {
    console.warn('Error reading photos from Firestore:', err);
  }

  // 2. Try IndexedDB
  const idb = await openDB();
  return new Promise((resolve) => {
    const tx = idb.transaction('photos', 'readonly');
    const store = tx.objectStore('photos');
    const index = store.index('galleryId');
    const req = index.getAll(galleryId);

    req.onsuccess = async () => {
      let photos: Photo[] = req.result || [];

      // If seed gallery had no photos yet, generate and save to Firestore
      if (photos.length === 0 && galleryId === SEED_GALLERY_ID) {
        const collections: Collection[] = [
          { id: 'col-ceremony', galleryId: SEED_GALLERY_ID, name: 'Ceremony', order: 1 },
          { id: 'col-portraits', galleryId: SEED_GALLERY_ID, name: 'Portraits', order: 2 },
          { id: 'col-reception', galleryId: SEED_GALLERY_ID, name: 'Reception', order: 3 },
          { id: 'col-details', galleryId: SEED_GALLERY_ID, name: 'Details', order: 4 },
        ];
        photos = generatePhotosForGallery(SEED_GALLERY_ID, collections, 'em');
        savePhotosBatch(photos).catch(() => {});
      } else if (photos.length === 0 && galleryId === SEED_GALLERY_2_ID) {
        const collections: Collection[] = [
          { id: 'col-preparations', galleryId: SEED_GALLERY_2_ID, name: 'Morning Prep', order: 1 },
          { id: 'col-firstlook', galleryId: SEED_GALLERY_2_ID, name: 'First Look', order: 2 },
          { id: 'col-party', galleryId: SEED_GALLERY_2_ID, name: 'Evening Party', order: 3 },
        ];
        photos = generatePhotosForGallery(SEED_GALLERY_2_ID, collections, 'md');
        savePhotosBatch(photos).catch(() => {});
      }

      photos.sort((a, b) => a.order - b.order);
      resolve(photos);
    };
    req.onerror = () => resolve([]);
  });
}

export async function savePhoto(photo: Photo): Promise<void> {
  // 1. Save to Firestore
  try {
    const safePhoto = sanitizePhotoForFirestore(photo);
    await setDoc(
      doc(firestoreDb, 'galleries', photo.galleryId, 'photos', photo.id),
      safePhoto,
      { merge: true }
    );
  } catch (err) {
    console.error('Error saving photo to Firestore:', err);
  }

  // 2. Save to IndexedDB
  try {
    const idb = await openDB();
    const tx = idb.transaction('photos', 'readwrite');
    tx.objectStore('photos').put(photo);
  } catch (err) {
    console.warn('Could not save photo to IndexedDB:', err);
  }
}

export async function savePhotosBatch(photos: Photo[]): Promise<void> {
  if (!photos.length) return;

  // 1. Save to Firestore
  try {
    for (const p of photos) {
      const safe = sanitizePhotoForFirestore(p);
      await setDoc(doc(firestoreDb, 'galleries', p.galleryId, 'photos', p.id), safe, {
        merge: true,
      });
    }
  } catch (err) {
    console.error('Error batch saving photos to Firestore:', err);
  }

  // 2. Save to IndexedDB
  try {
    const idb = await openDB();
    const tx = idb.transaction('photos', 'readwrite');
    const store = tx.objectStore('photos');
    for (const p of photos) {
      store.put(p);
    }
  } catch (err) {
    console.warn('Could not save photos to IndexedDB:', err);
  }
}

export async function deletePhoto(photoId: string): Promise<void> {
  // 1. Delete from IndexedDB first to find galleryId
  let galleryId = '';
  try {
    const idb = await openDB();
    const tx = idb.transaction('photos', 'readwrite');
    const store = tx.objectStore('photos');
    const getReq = store.get(photoId);
    getReq.onsuccess = () => {
      if (getReq.result) {
        galleryId = getReq.result.galleryId;
      }
      store.delete(photoId);
    };
  } catch {
    // Non-blocking
  }

  // 2. Delete from Firestore and Storage if galleryId is known
  if (galleryId) {
    try {
      await deleteDoc(doc(firestoreDb, 'galleries', galleryId, 'photos', photoId));
      storageProvider.deletePhotoFiles(galleryId, photoId).catch(() => {});
    } catch (err) {
      console.warn('Error deleting photo from Firestore:', err);
    }
  }
}

// =================== Photographer Profile ===================

export async function getPhotographer(): Promise<Photographer> {
  try {
    const docSnap = await getDoc(doc(firestoreDb, 'system', 'photographer'));
    if (docSnap.exists()) {
      return docSnap.data() as Photographer;
    }
  } catch {
    // Fallback to default
  }

  const defaultPhotog: Photographer = {
    id: SEED_PHOTOGRAPHER_ID,
    name: 'Eliud Petro',
    brandName: 'Pitapixel Studio',
    email: 'petroeliud04@gmail.com',
    createdAt: new Date().toISOString(),
  };

  return defaultPhotog;
}

export async function savePhotographer(photographer: Photographer): Promise<void> {
  try {
    await setDoc(doc(firestoreDb, 'system', 'photographer'), photographer, { merge: true });
  } catch (err) {
    console.error('Error saving photographer to Firestore:', err);
  }

  try {
    const idb = await openDB();
    const tx = idb.transaction('photographers', 'readwrite');
    tx.objectStore('photographers').put(photographer);
  } catch {
    // Non-blocking
  }
}

// =================== Favorites & Activity ===================

export async function getFavorites(galleryId: string): Promise<string[]> {
  try {
    const snap = await getDocs(collection(firestoreDb, 'galleries', galleryId, 'favorites'));
    if (!snap.empty) {
      const favs: string[] = [];
      snap.forEach((d) => {
        const data = d.data();
        if (data?.photoId) favs.push(data.photoId);
      });
      return favs;
    }
  } catch {
    // Fallback to IndexedDB
  }

  try {
    const idb = await openDB();
    const tx = idb.transaction('favorites', 'readonly');
    const store = tx.objectStore('favorites');
    const index = store.index('galleryId');

    return new Promise((resolve) => {
      const req = index.getAll(galleryId);
      req.onsuccess = () => {
        const records = req.result || [];
        resolve(records.map((r: { photoId: string }) => r.photoId));
      };
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function toggleFavoritePhoto(galleryId: string, photoId: string): Promise<boolean> {
  const favDocId = `fav-${photoId}`;

  try {
    const favRef = doc(firestoreDb, 'galleries', galleryId, 'favorites', favDocId);
    const snap = await getDoc(favRef);
    if (snap.exists()) {
      await deleteDoc(favRef);
      return false;
    } else {
      await setDoc(favRef, {
        id: favDocId,
        galleryId,
        photoId,
        createdAt: new Date().toISOString(),
      });
      return true;
    }
  } catch {
    // Local fallback
  }

  try {
    const idb = await openDB();
    if (!idb.objectStoreNames.contains('favorites')) return false;

    return new Promise((resolve) => {
      const tx = idb.transaction(['favorites'], 'readwrite');
      const store = tx.objectStore('favorites');
      const getReq = store.get(favDocId);
      getReq.onsuccess = () => {
        if (getReq.result) {
          store.delete(favDocId);
          resolve(false);
        } else {
          store.put({
            id: favDocId,
            galleryId,
            photoId,
            createdAt: new Date().toISOString(),
          });
          resolve(true);
        }
      };
      getReq.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

export async function recordActivity(
  galleryId: string,
  type: ActivityEvent['type'],
  details: string
): Promise<void> {
  const activity: ActivityEvent = {
    id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    galleryId,
    type,
    details,
    timestamp: new Date().toISOString(),
  };

  try {
    await setDoc(doc(firestoreDb, 'galleries', galleryId, 'activities', activity.id), activity);
  } catch {
    // Local fallback
  }

  try {
    const idb = await openDB();
    if (idb.objectStoreNames.contains('activities')) {
      const tx = idb.transaction('activities', 'readwrite');
      tx.objectStore('activities').put(activity);
    }
  } catch {
    // Non-blocking
  }
}

export async function getActivities(galleryId: string): Promise<ActivityEvent[]> {
  try {
    const snap = await getDocs(collection(firestoreDb, 'galleries', galleryId, 'activities'));
    if (!snap.empty) {
      const acts: ActivityEvent[] = [];
      snap.forEach((d) => acts.push(d.data() as ActivityEvent));
      acts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return acts;
    }
  } catch {
    // Fallback
  }

  try {
    const idb = await openDB();
    if (!idb.objectStoreNames.contains('activities')) return [];

    return new Promise((resolve) => {
      const tx = idb.transaction('activities', 'readonly');
      const index = tx.objectStore('activities').index('galleryId');
      const req = index.getAll(galleryId);
      req.onsuccess = () => {
        const acts: ActivityEvent[] = req.result || [];
        acts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        resolve(acts);
      };
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}
