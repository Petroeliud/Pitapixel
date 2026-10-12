/**
 * Client-side high performance image resizing & optimization
 * Generates thumbnail (400px), web-view (1600px) and keeps original
 */

export interface ProcessedImageResult {
  fileName: string;
  urls: {
    thumb: string;
    web: string;
    original: string;
  };
  width: number;
  height: number;
  aspectRatio: number;
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export function resizeImageElement(
  img: HTMLImageElement,
  maxDimension: number,
  quality: number = 0.85,
  format: 'image/jpeg' | 'image/webp' = 'image/jpeg'
): { dataUrl: string; width: number; height: number } {
  const origWidth = img.naturalWidth || img.width;
  const origHeight = img.naturalHeight || img.height;

  let targetWidth = origWidth;
  let targetHeight = origHeight;

  if (origWidth > maxDimension || origHeight > maxDimension) {
    if (origWidth >= origHeight) {
      targetWidth = maxDimension;
      targetHeight = Math.round((origHeight * maxDimension) / origWidth);
    } else {
      targetHeight = maxDimension;
      targetWidth = Math.round((origWidth * maxDimension) / origHeight);
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context not supported');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  const dataUrl = canvas.toDataURL(format, quality);
  return { dataUrl, width: targetWidth, height: targetHeight };
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const byteString = atob(parts[1]);
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const uint8Array = new Uint8Array(arrayBuffer);
  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i);
  }
  return new Blob([uint8Array], { type: mime });
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: 'image/jpeg' | 'image/webp' = 'image/jpeg',
  quality: number = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob conversion failed'));
      },
      format,
      quality
    );
  });
}

export async function processUploadedPhoto(
  file: File,
  onProgress?: (stage: string) => void
): Promise<ProcessedImageResult & {
  blobs: {
    thumb: Blob;
    web: Blob;
    original: Blob;
  };
}> {
  onProgress?.('Reading file...');
  const originalDataUrl = await fileToDataUrl(file);

  onProgress?.('Loading image...');
  const img = await loadImage(originalDataUrl);
  const origWidth = img.naturalWidth || img.width;
  const origHeight = img.naturalHeight || img.height;
  const aspectRatio = Number((origWidth / (origHeight || 1)).toFixed(3));

  onProgress?.('Generating web size (1440px)...');
  const webSize = resizeImageElement(img, 1440, 0.82, 'image/jpeg');

  onProgress?.('Generating thumbnail (420px)...');
  const thumbSize = resizeImageElement(img, 420, 0.78, 'image/jpeg');

  const thumbBlob = dataUrlToBlob(thumbSize.dataUrl);
  const webBlob = dataUrlToBlob(webSize.dataUrl);
  const originalBlob = file; // Preserve exact original binary file!

  return {
    fileName: file.name,
    urls: {
      thumb: thumbSize.dataUrl,
      web: webSize.dataUrl,
      original: originalDataUrl.length > 600000 ? webSize.dataUrl : originalDataUrl,
    },
    blobs: {
      thumb: thumbBlob,
      web: webBlob,
      original: originalBlob,
    },
    width: origWidth,
    height: origHeight,
    aspectRatio,
  };
}

/**
 * Creates a subtle placeholder SVG blur for zero-jitter layouts
 */
export function createBlurredPlaceholder(width: number, height: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <rect width="${width}" height="${height}" fill="#27272a" fill-opacity="0.08"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
