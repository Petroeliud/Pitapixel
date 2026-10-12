export const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'bzimyrvw';

/**
 * Build Cloudinary image URL with transformations
 */
export function buildCloudinaryUrl(
  publicId: string,
  transformation: string,
  cloudName: string = CLOUD_NAME
): string {
  if (!publicId) return '';
  // If publicId is already a full URL, handle gracefully
  if (publicId.startsWith('http://') || publicId.startsWith('https://')) {
    return publicId;
  }
  const cleanPublicId = publicId.replace(/^\//, '');
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformation}/${cleanPublicId}`;
}

export function getGridUrl(publicId: string, cloudName?: string): string {
  return buildCloudinaryUrl(publicId, 'w_800,c_limit,q_auto,f_auto', cloudName);
}

export function getViewerUrl(publicId: string, cloudName?: string): string {
  return buildCloudinaryUrl(publicId, 'w_1800,c_limit,q_auto,f_auto', cloudName);
}

export function getPlaceholderUrl(publicId: string, cloudName?: string): string {
  return buildCloudinaryUrl(publicId, 'w_30,e_blur:200,q_auto', cloudName);
}

export function getDownloadUrl(publicId: string, cloudName?: string): string {
  return buildCloudinaryUrl(publicId, 'fl_attachment', cloudName);
}
