import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Heart,
  Download,
  Info,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  Share2,
} from 'lucide-react';
import { Photo, DownloadSize } from '../../types';
import { downloadSinglePhoto } from '../../utils/zipService';

interface FullscreenLightboxProps {
  photos: Photo[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
  favorites: string[];
  onToggleFavorite: (photoId: string) => void;
  allowDownload: boolean;
  allowFavorites: boolean;
  availableSizes: DownloadSize[];
  onShareClick?: () => void;
  onDownloadRequest?: (photo: Photo, size: DownloadSize) => void;
}

export const FullscreenLightbox: React.FC<FullscreenLightboxProps> = ({
  photos,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
  favorites,
  onToggleFavorite,
  allowDownload,
  allowFavorites,
  availableSizes,
  onShareClick,
  onDownloadRequest,
}) => {
  const [showInfo, setShowInfo] = useState(false);
  const [downloadDropdown, setDownloadDropdown] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isSlideshowActive, setIsSlideshowActive] = useState(false);
  const touchStartXRef = useRef<number | null>(null);

  const currentPhoto = photos[currentIndex];
  const isFavorited = currentPhoto ? favorites.includes(currentPhoto.id) : false;

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
    } else {
      onNavigate(photos.length - 1);
    }
  }, [currentIndex, photos.length, onNavigate]);

  const handleNext = useCallback(() => {
    if (currentIndex < photos.length - 1) {
      onNavigate(currentIndex + 1);
    } else {
      onNavigate(0);
    }
  }, [currentIndex, photos.length, onNavigate]);

  const toggleSlideshow = useCallback(() => {
    setIsSlideshowActive((prev) => !prev);
  }, []);

  // Slideshow auto-advance interval (every 3.5 seconds)
  useEffect(() => {
    if (!isOpen || !isSlideshowActive) return;

    const interval = setInterval(() => {
      handleNext();
    }, 3500);

    return () => clearInterval(interval);
  }, [isOpen, isSlideshowActive, handleNext]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        toggleSlideshow();
      } else if (e.key === 'f' || e.key === 'F') {
        if (currentPhoto && allowFavorites) {
          onToggleFavorite(currentPhoto.id);
        }
      } else if (e.key === 'd' || e.key === 'D') {
        if (currentPhoto && allowDownload) {
          const size = availableSizes[0] || 'original';
          if (onDownloadRequest) {
            onDownloadRequest(currentPhoto, size);
          } else {
            downloadSinglePhoto(currentPhoto, size);
          }
        }
      } else if (e.key === 'i' || e.key === 'I') {
        setShowInfo((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isOpen,
    handlePrev,
    handleNext,
    onClose,
    currentPhoto,
    allowFavorites,
    allowDownload,
    onToggleFavorite,
    availableSizes,
    toggleSlideshow,
    onDownloadRequest,
  ]);

  // Touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - touchStartXRef.current;
    if (Math.abs(diff) > 45) {
      if (diff > 0) {
        handlePrev();
      } else {
        handleNext();
      }
    }
    touchStartXRef.current = null;
  };

  const handleExecuteDownload = (size: DownloadSize) => {
    if (!currentPhoto) return;
    if (onDownloadRequest) {
      onDownloadRequest(currentPhoto, size);
    } else {
      downloadSinglePhoto(currentPhoto, size);
    }
    setDownloadDropdown(false);
  };

  if (!isOpen || !currentPhoto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/98 text-white select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Menu / Quiet Bar */}
      <div className="flex h-14 items-center justify-between px-4 sm:px-6 z-20 bg-black/40 backdrop-blur-xs">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono tabular-nums text-zinc-400">
            {String(currentIndex + 1).padStart(2, '0')} / {String(photos.length).padStart(2, '0')}
          </span>
          <span className="hidden text-xs text-zinc-500 sm:inline truncate max-w-xs">
            {currentPhoto.fileName}
          </span>
        </div>

        {/* Top Right Controls: Slideshow, Favorite, Download, Share, Info, Zoom, Close */}
        <div className="flex items-center gap-2">
          {/* Slideshow Option in Full Screen Menu */}
          <button
            onClick={toggleSlideshow}
            title={isSlideshowActive ? 'Pause Slideshow (Space)' : 'Play Slideshow (Space)'}
            aria-label="Toggle Slideshow"
            className={`flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
              isSlideshowActive
                ? 'bg-white/20 text-white'
                : 'text-zinc-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            {isSlideshowActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">
              {isSlideshowActive ? 'Pause' : 'Slideshow'}
            </span>
          </button>

          {/* Share */}
          {onShareClick && (
            <button
              onClick={onShareClick}
              title="Share Photo / Gallery"
              aria-label="Share"
              className="flex h-9 w-9 items-center justify-center text-zinc-400 transition-colors hover:text-white cursor-pointer"
            >
              <Share2 className="h-4 w-4" />
            </button>
          )}

          {/* Favorite */}
          {allowFavorites && (
            <button
              onClick={() => onToggleFavorite(currentPhoto.id)}
              title="Favorite Photo (F)"
              aria-label="Favorite Photo"
              className={`flex h-9 w-9 items-center justify-center transition-colors cursor-pointer ${
                isFavorited ? 'text-rose-500' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Heart className={`h-4 w-4 ${isFavorited ? 'fill-current' : ''}`} />
            </button>
          )}

          {/* Download */}
          {allowDownload && (
            <div className="relative">
              <button
                onClick={() => {
                  if (availableSizes.length > 1) {
                    setDownloadDropdown((prev) => !prev);
                  } else {
                    handleExecuteDownload(availableSizes[0] || 'original');
                  }
                }}
                title="Download Photo (D)"
                aria-label="Download Photo"
                className="flex h-9 w-9 items-center justify-center text-zinc-400 transition-colors hover:text-white cursor-pointer"
              >
                <Download className="h-4 w-4" />
              </button>

              {downloadDropdown && (
                <div className="absolute right-0 top-11 w-44 rounded-sm border border-zinc-800 bg-zinc-900 py-1 text-xs shadow-xl z-50">
                  <button
                    onClick={() => handleExecuteDownload('web')}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-zinc-300 hover:bg-zinc-800 hover:text-white cursor-pointer"
                  >
                    <span>Web Size</span>
                    <span className="text-[10px] text-zinc-500">1600px</span>
                  </button>
                  <button
                    onClick={() => handleExecuteDownload('original')}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-zinc-300 hover:bg-zinc-800 hover:text-white cursor-pointer"
                  >
                    <span>Original</span>
                    <span className="text-[10px] text-zinc-500">Full Res</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Photo Details */}
          {currentPhoto.exif && (
            <button
              onClick={() => setShowInfo((prev) => !prev)}
              title="Photo Details (I)"
              aria-label="Photo Details"
              className={`flex h-9 w-9 items-center justify-center transition-colors cursor-pointer ${
                showInfo ? 'text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Info className="h-4 w-4" />
            </button>
          )}

          {/* Zoom */}
          <button
            onClick={() => setIsZoomed((prev) => !prev)}
            title={isZoomed ? 'Reset zoom' : 'Fit/Fill view'}
            aria-label="Toggle zoom"
            className="hidden sm:flex h-9 w-9 items-center justify-center text-zinc-400 transition-colors hover:text-white cursor-pointer"
          >
            {isZoomed ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            title="Close Viewer (Esc)"
            aria-label="Close Viewer"
            className="flex h-9 w-9 items-center justify-center text-zinc-400 transition-colors hover:text-white ml-1 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Image Viewport */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden p-2 sm:p-6">
        {/*
          Clicking on the right side of the photo or left takes you to the next or back photo
          even if not touched the arrow icons.
        */}
        {/* Left 50% hit region */}
        <div
          onClick={handlePrev}
          title="Previous Photo (click left side)"
          aria-label="Previous Photo"
          className="absolute left-0 top-0 bottom-0 w-1/2 z-5 cursor-w-resize"
        />

        {/* Right 50% hit region */}
        <div
          onClick={handleNext}
          title="Next Photo (click right side)"
          aria-label="Next Photo"
          className="absolute right-0 top-0 bottom-0 w-1/2 z-5 cursor-e-resize"
        />

        {/* Navigation Arrows (rendered at z-10 above the hit regions) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          title="Previous Photo (Left Arrow)"
          aria-label="Previous Photo"
          className="absolute left-2 sm:left-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white/80 transition-all hover:bg-black/80 hover:text-white cursor-pointer"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          title="Next Photo (Right Arrow)"
          aria-label="Next Photo"
          className="absolute right-2 sm:right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white/80 transition-all hover:bg-black/80 hover:text-white cursor-pointer"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        {/* The Photo */}
        <div
          className={`relative flex items-center justify-center h-full w-full pointer-events-none transition-transform duration-200 ${
            isZoomed ? 'scale-125' : 'scale-100'
          }`}
        >
          <img
            key={currentPhoto.id}
            src={currentPhoto.urls.web || currentPhoto.urls.original}
            alt={currentPhoto.fileName}
            referrerPolicy="no-referrer"
            className="max-h-full max-w-full object-contain select-none transition-opacity duration-300 pointer-events-none"
          />
        </div>

        {/* Slideshow playing indicator banner at bottom */}
        {isSlideshowActive && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-full bg-black/75 px-4 py-1.5 text-xs text-white/90 backdrop-blur-md border border-white/10 pointer-events-auto">
            <span className="h-2 w-2 rounded-full bg-white animate-ping" />
            <span>Slideshow Active · Space to pause</span>
            <button
              onClick={toggleSlideshow}
              className="ml-1 text-zinc-400 hover:text-white underline cursor-pointer"
            >
              Stop
            </button>
          </div>
        )}

        {/* Photo Info Overlay Drawer */}
        {showInfo && currentPhoto.exif && (
          <aside className="absolute bottom-4 right-4 z-20 w-72 rounded-sm border border-zinc-800 bg-zinc-950/90 p-4 text-xs text-zinc-300 backdrop-blur-xs pointer-events-auto">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800">
              <span className="font-semibold text-white">Details</span>
              <button
                onClick={() => setShowInfo(false)}
                className="text-zinc-500 hover:text-white cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="space-y-1.5 font-mono text-[11px]">
              <div>File: {currentPhoto.fileName}</div>
              <div>Dimensions: {currentPhoto.width} × {currentPhoto.height}</div>
              {currentPhoto.exif.camera && <div>Camera: {currentPhoto.exif.camera}</div>}
              {currentPhoto.exif.lens && <div>Lens: {currentPhoto.exif.lens}</div>}
              {currentPhoto.exif.focalLength && <div>Focal: {currentPhoto.exif.focalLength}</div>}
              {currentPhoto.exif.aperture && <div>Aperture: {currentPhoto.exif.aperture}</div>}
              {currentPhoto.exif.shutterSpeed && <div>Shutter: {currentPhoto.exif.shutterSpeed}</div>}
              {currentPhoto.exif.iso && <div>ISO: {currentPhoto.exif.iso}</div>}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
