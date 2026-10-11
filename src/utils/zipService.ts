import JSZip from 'jszip';
import { Photo, DownloadSize } from '../types';

export interface ZipDownloadProgress {
  percent: number;
  currentFile: string;
  loadedFiles: number;
  totalFiles: number;
  status: 'fetching' | 'compressing' | 'completed' | 'error';
}

/**
 * Converts a data URL or external URL to an ArrayBuffer/Blob for JSZip
 */
async function fetchPhotoBuffer(url: string): Promise<ArrayBuffer> {
  if (url.startsWith('data:')) {
    const base64Data = url.split(',')[1];
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  const response = await fetch(url, { mode: 'cors' });
  if (!response.ok) {
    throw new Error(`Failed to load photo: ${response.statusText}`);
  }
  return await response.arrayBuffer();
}

/**
 * Packages multiple photos into a ZIP archive and triggers download
 */
export async function downloadPhotosAsZip(
  photos: Photo[],
  size: DownloadSize = 'web',
  zipName: string = 'Gallery_Photos.zip',
  onProgress?: (progress: ZipDownloadProgress) => void
): Promise<void> {
  if (!photos.length) return;

  const zip = new JSZip();
  const folder = zip.folder('photos') || zip;
  const total = photos.length;

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    const targetUrl = size === 'original' ? photo.urls.original : photo.urls.web;
    
    // Clean file name
    let fileName = photo.fileName || `Photo_${i + 1}.jpg`;
    if (!fileName.toLowerCase().endsWith('.jpg') && !fileName.toLowerCase().endsWith('.jpeg')) {
      fileName += '.jpg';
    }

    onProgress?.({
      percent: Math.round(((i) / total) * 60),
      currentFile: fileName,
      loadedFiles: i,
      totalFiles: total,
      status: 'fetching',
    });

    try {
      const buffer = await fetchPhotoBuffer(targetUrl);
      folder.file(fileName, buffer, { binary: true });
    } catch (err) {
      console.warn(`Could not add photo ${fileName} to zip:`, err);
      // Fallback to web if original failed
      if (size === 'original' && photo.urls.web !== photo.urls.original) {
        try {
          const fallbackBuffer = await fetchPhotoBuffer(photo.urls.web);
          folder.file(fileName, fallbackBuffer, { binary: true });
        } catch {
          // ignore
        }
      }
    }
  }

  onProgress?.({
    percent: 65,
    currentFile: 'Creating ZIP archive...',
    loadedFiles: total,
    totalFiles: total,
    status: 'compressing',
  });

  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 5 },
    },
    (metadata) => {
      onProgress?.({
        percent: Math.min(99, 65 + Math.round(metadata.percent * 0.34)),
        currentFile: 'Compressing archive...',
        loadedFiles: total,
        totalFiles: total,
        status: 'compressing',
      });
    }
  );

  onProgress?.({
    percent: 100,
    currentFile: 'Starting download...',
    loadedFiles: total,
    totalFiles: total,
    status: 'completed',
  });

  // Trigger browser download
  const downloadUrl = URL.createObjectURL(zipBlob);
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = zipName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  setTimeout(() => {
    URL.revokeObjectURL(downloadUrl);
  }, 15000);
}

/**
 * Triggers a direct single file download
 */
export async function downloadSinglePhoto(
  photo: Photo,
  size: DownloadSize = 'original'
): Promise<void> {
  const targetUrl = size === 'original' ? photo.urls.original : photo.urls.web;
  let fileName = photo.fileName || 'photo.jpg';
  if (!fileName.toLowerCase().endsWith('.jpg') && !fileName.toLowerCase().endsWith('.jpeg')) {
    fileName += '.jpg';
  }

  if (targetUrl.startsWith('data:')) {
    const anchor = document.createElement('a');
    anchor.href = targetUrl;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    return;
  }

  try {
    const buffer = await fetchPhotoBuffer(targetUrl);
    const blob = new Blob([buffer], { type: 'image/jpeg' });
    const blobUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = blobUrl;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
  } catch {
    // direct fallback
    const anchor = document.createElement('a');
    anchor.href = targetUrl;
    anchor.download = fileName;
    anchor.target = '_blank';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }
}
