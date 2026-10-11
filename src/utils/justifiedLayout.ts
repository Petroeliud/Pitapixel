import { Photo } from '../types';

export interface LayoutPhoto {
  photo: Photo;
  width: number;
  height: number;
  rowIndex: number;
  colIndex: number;
}

export interface LayoutRow {
  photos: LayoutPhoto[];
  height: number;
  totalWidth: number;
}

export function computeJustifiedLayout(
  photos: Photo[],
  containerWidth: number,
  targetRowHeight: number = 280,
  gap: number = 8
): LayoutRow[] {
  if (!photos.length || containerWidth <= 0) return [];

  const rows: LayoutRow[] = [];
  let currentRowPhotos: Photo[] = [];
  let currentAspectRatiosSum = 0;

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    const aspect = photo.aspectRatio > 0 ? photo.aspectRatio : (photo.width / (photo.height || 1));
    currentRowPhotos.push(photo);
    currentAspectRatiosSum += aspect;

    const availableWidth = containerWidth - (currentRowPhotos.length - 1) * gap;
    const computedHeight = availableWidth / currentAspectRatiosSum;

    // Check if row has filled sufficiently compared to target height
    if (computedHeight <= targetRowHeight || i === photos.length - 1) {
      const isLastRow = i === photos.length - 1;

      // In the last row, if photos are too few, avoid blowing up height
      let finalHeight = computedHeight;
      let naturalWidth = false;

      if (isLastRow && computedHeight > targetRowHeight * 1.3) {
        finalHeight = targetRowHeight;
        naturalWidth = true; // left-aligned without stretching
      }

      const layoutPhotos: LayoutPhoto[] = [];
      let accumulatedWidth = 0;

      for (let j = 0; j < currentRowPhotos.length; j++) {
        const item = currentRowPhotos[j];
        const itemAspect = item.aspectRatio > 0 ? item.aspectRatio : (item.width / (item.height || 1));
        
        let itemWidth = Math.round(finalHeight * itemAspect);

        // Adjust rounding on the last item in a stretched row
        if (!naturalWidth && j === currentRowPhotos.length - 1) {
          const expectedRemaining = availableWidth - accumulatedWidth;
          if (expectedRemaining > 0) {
            itemWidth = expectedRemaining;
          }
        }

        accumulatedWidth += itemWidth;

        layoutPhotos.push({
          photo: item,
          width: itemWidth,
          height: Math.round(finalHeight),
          rowIndex: rows.length,
          colIndex: j,
        });
      }

      rows.push({
        photos: layoutPhotos,
        height: Math.round(finalHeight),
        totalWidth: accumulatedWidth + (currentRowPhotos.length - 1) * gap,
      });

      currentRowPhotos = [];
      currentAspectRatiosSum = 0;
    }
  }

  return rows;
}
