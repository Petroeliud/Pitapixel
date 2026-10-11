import React, { useRef, useState, useEffect } from 'react';
import { Heart, Check } from 'lucide-react';
import { Photo } from '../../types';
import { computeJustifiedLayout } from '../../utils/justifiedLayout';

interface JustifiedPhotoGridProps {
  photos: Photo[];
  onPhotoClick: (photo: Photo, index: number) => void;
  selectionMode: boolean;
  selectedPhotoIds: string[];
  onToggleSelect: (photoId: string) => void;
  favorites: string[];
  onToggleFavorite: (photoId: string) => void;
  allowFavorites: boolean;
}

export const JustifiedPhotoGrid: React.FC<JustifiedPhotoGridProps> = ({
  photos,
  onPhotoClick,
  selectionMode,
  selectedPhotoIds,
  onToggleSelect,
  favorites,
  onToggleFavorite,
  allowFavorites,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(1200);
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!containerRef.current) return;

    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  // Determine target row height based on container width
  const targetRowHeight = containerWidth < 640 ? 210 : containerWidth < 1024 ? 260 : 320;
  const gap = containerWidth < 640 ? 4 : 8;

  const rows = computeJustifiedLayout(photos, containerWidth, targetRowHeight, gap);

  const handleImageLoad = (id: string) => {
    setLoadedImages((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div ref={containerRef} className="w-full">
      <div className="flex flex-col" style={{ gap: `${gap}px` }}>
        {rows.map((row, rowIdx) => (
          <div
            key={`row-${rowIdx}`}
            className="flex w-full items-center"
            style={{ gap: `${gap}px`, height: `${row.height}px` }}
          >
            {row.photos.map((item) => {
              const photo = item.photo;
              const isSelected = selectedPhotoIds.includes(photo.id);
              const isFavorited = favorites.includes(photo.id);
              const isLoaded = loadedImages[photo.id];
              const globalIdx = photos.findIndex((p) => p.id === photo.id);

              return (
                <div
                  key={photo.id}
                  style={{
                    width: `${item.width}px`,
                    height: `${item.height}px`,
                  }}
                  onClick={() => {
                    if (selectionMode) {
                      onToggleSelect(photo.id);
                    } else {
                      onPhotoClick(photo, globalIdx);
                    }
                  }}
                  className={`group relative cursor-pointer overflow-hidden bg-zinc-100 transition-all select-none dark:bg-zinc-900 ${
                    selectionMode && isSelected
                      ? 'ring-2 ring-zinc-900 ring-offset-1 dark:ring-white dark:ring-offset-zinc-950'
                      : ''
                  }`}
                >
                  {/* Subtle placeholder blur backdrop */}
                  <div
                    className={`absolute inset-0 bg-zinc-200/50 transition-opacity duration-500 dark:bg-zinc-800/50 ${
                      isLoaded ? 'opacity-0' : 'opacity-100'
                    }`}
                  />

                  {/* Photo */}
                  <img
                    src={photo.urls.thumb}
                    alt={photo.fileName}
                    referrerPolicy="no-referrer"
                    onLoad={() => handleImageLoad(photo.id)}
                    className={`h-full w-full object-cover transition-all duration-300 ${
                      isLoaded ? 'opacity-100' : 'opacity-0'
                    } ${!selectionMode ? 'group-hover:scale-[1.01]' : ''}`}
                    loading="lazy"
                  />

                  {/* Hover Overlay Gradient */}
                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/15" />

                  {/* Selection Mode Indicator */}
                  {selectionMode && (
                    <div className="absolute left-2.5 top-2.5 z-10">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full border transition-all ${
                          isSelected
                            ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900'
                            : 'border-white/90 bg-black/30 text-transparent backdrop-blur-xs'
                        }`}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  )}

                  {/* Quick Favorite Heart (Only visible on hover or if already favorited) */}
                  {!selectionMode && allowFavorites && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(photo.id);
                      }}
                      title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                      aria-label="Toggle favorite"
                      className={`absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full transition-opacity ${
                        isFavorited
                          ? 'bg-black/40 text-rose-500 opacity-100'
                          : 'bg-black/30 text-white opacity-0 group-hover:opacity-100 hover:scale-110'
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${isFavorited ? 'fill-current' : ''}`} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
