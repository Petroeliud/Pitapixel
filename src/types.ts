export type DownloadSize = 'web' | 'original';

export interface Photographer {
  id: string;
  name: string;
  email: string;
  brandName: string;
  logoUrl?: string;
  createdAt: string;
}

export interface Collection {
  id: string;
  galleryId: string;
  name: string;
  order: number;
}

export interface PhotoUrls {
  thumb: string;
  web: string;
  original: string;
}

export interface PhotoExif {
  camera?: string;
  lens?: string;
  focalLength?: string;
  aperture?: string;
  shutterSpeed?: string;
  iso?: string;
}

export interface Photo {
  id: string;
  galleryId: string;
  collectionId?: string;
  fileName: string;
  urls: PhotoUrls;
  width: number;
  height: number;
  aspectRatio: number;
  order: number;
  hidden?: boolean;
  exif?: PhotoExif;
  createdAt: string;
}

export interface GallerySettings {
  allowDownload: boolean;
  allowFavorites: boolean;
  sizes: DownloadSize[];
}

export interface Gallery {
  id: string;
  photographerId: string;
  shareId: string;
  title: string;
  clientName?: string;
  shootDate: string;
  coverPhotoId?: string;
  coverFocalPoint?: { x: number; y: number };
  coverFramingSummary?: string;
  coverOverlayStrength?: number; // 0 to 100, default 25
  coverCustomTitle?: string;
  coverCustomDate?: string;
  coverButtonLabel?: string; // e.g. 'VIEW GALLERY'
  password?: string;
  expiresAt?: string;
  settings: GallerySettings;
  collections: Collection[];
  viewCount: number;
  downloadCount: number;
  createdAt: string;
}

export interface ActivityEvent {
  id: string;
  galleryId: string;
  type: 'view' | 'download' | 'favorite' | 'selection_sent';
  photoId?: string;
  details?: string;
  timestamp: string;
}

export interface ClientSelectionMessage {
  galleryId: string;
  clientName: string;
  clientEmail?: string;
  note?: string;
  photoIds: string[];
  sentAt: string;
}
