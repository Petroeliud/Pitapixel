import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Download,
  Heart,
  CheckSquare,
  Lock,
  ArrowRight,
  Cloud,
  Send,
  X,
  Share2,
} from 'lucide-react';
import { Gallery, Photo, Photographer, DownloadSize } from '../../types';
import {
  getFavorites,
  toggleFavoritePhoto,
  recordActivity,
} from '../../storage/db';
import { useAuth } from '../../context/AuthContext';
import { JustifiedPhotoGrid } from './JustifiedPhotoGrid';
import { FullscreenLightbox } from './FullscreenLightbox';
import { DownloadModal } from './DownloadModal';
import { SaveToCloudModal } from './SaveToCloudModal';
import { SendSelectionModal } from './SendSelectionModal';
import { ShareLinkModal } from '../common/ShareLinkModal';
import { GoogleSignInModal } from '../common/GoogleSignInModal';
import { downloadSinglePhoto } from '../../utils/zipService';

interface ClientGalleryViewProps {
  gallery: Gallery;
  photos: Photo[];
  photographer: Photographer | null;
  onRefreshGallery?: () => void;
  onNavigateToDashboard?: () => void;
}

export const ClientGalleryView: React.FC<ClientGalleryViewProps> = ({
  gallery,
  photos,
  photographer,
  onRefreshGallery,
  onNavigateToDashboard,
}) => {
  const { user } = useAuth();

  // Password protection state
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordUnlocked, setPasswordUnlocked] = useState(!gallery.password);
  const [passwordError, setPasswordError] = useState(false);

  // Expiration check
  const isExpired = gallery.expiresAt
    ? new Date(gallery.expiresAt).getTime() < Date.now()
    : false;

  // Collection & Filter state
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Selection mode
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);

  // Lightbox
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Modals
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [photosToDownload, setPhotosToDownload] = useState<Photo[]>([]);
  const [saveToCloudOpen, setSaveToCloudOpen] = useState(false);
  const [sendSelectionOpen, setSendSelectionOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Download Authentication Prompt Modal
  const [downloadAuthModalOpen, setDownloadAuthModalOpen] = useState(false);
  const [pendingDownloadAction, setPendingDownloadAction] = useState<(() => void) | null>(null);

  // Load favorites
  useEffect(() => {
    let isMounted = true;
    getFavorites(gallery.id).then((favs) => {
      if (isMounted) setFavorites(favs);
    });
    recordActivity(gallery.id, 'view', 'Client opened gallery');
    return () => {
      isMounted = false;
    };
  }, [gallery.id]);

  // Execute pending download once user signs in
  useEffect(() => {
    if (user && pendingDownloadAction) {
      pendingDownloadAction();
      setPendingDownloadAction(null);
      setDownloadAuthModalOpen(false);
    }
  }, [user, pendingDownloadAction]);

  // Handle password submission
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === gallery.password) {
      setPasswordUnlocked(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  // Toggle favorite
  const handleToggleFavorite = async (photoId: string) => {
    const isNowFav = await toggleFavoritePhoto(gallery.id, photoId);
    setFavorites((prev) =>
      isNowFav ? [...prev, photoId] : prev.filter((id) => id !== photoId)
    );
  };

  // Filter photos
  const filteredPhotos = useMemo(() => {
    return photos.filter((p) => {
      if (p.hidden) return false;
      if (favoritesOnly && !favorites.includes(p.id)) return false;
      if (selectedCollectionId && p.collectionId !== selectedCollectionId) return false;
      return true;
    });
  }, [photos, favoritesOnly, favorites, selectedCollectionId]);

  // Cover photo resolution
  const coverPhoto = useMemo(() => {
    if (gallery.coverPhotoId) {
      const match = photos.find((p) => p.id === gallery.coverPhotoId);
      if (match) return match;
    }
    return photos[0] || null;
  }, [gallery.coverPhotoId, photos]);

  // Smooth scroll to gallery content
  const handleScrollToGrid = () => {
    const target = document.getElementById('gallery-content');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Multi-selection handlers
  const handleToggleSelect = (photoId: string) => {
    setSelectedPhotoIds((prev) =>
      prev.includes(photoId) ? prev.filter((id) => id !== photoId) : [...prev, photoId]
    );
  };

  const handleSelectAllVisible = () => {
    const visibleIds = filteredPhotos.map((p) => p.id);
    setSelectedPhotoIds(visibleIds);
  };

  const handleClearSelection = () => {
    setSelectedPhotoIds([]);
    setSelectionMode(false);
  };

  // Download actions (prompts Google sign-in ONLY when client initiates download)
  const handleDownloadAll = () => {
    if (!user) {
      setPendingDownloadAction(() => () => {
        setPhotosToDownload(filteredPhotos);
        setDownloadModalOpen(true);
      });
      setDownloadAuthModalOpen(true);
      return;
    }
    setPhotosToDownload(filteredPhotos);
    setDownloadModalOpen(true);
  };

  const handleDownloadSelected = () => {
    const selected = photos.filter((p) => selectedPhotoIds.includes(p.id));
    if (!user) {
      setPendingDownloadAction(() => () => {
        setPhotosToDownload(selected);
        setDownloadModalOpen(true);
      });
      setDownloadAuthModalOpen(true);
      return;
    }
    setPhotosToDownload(selected);
    setDownloadModalOpen(true);
  };

  const handleSinglePhotoDownload = useCallback(
    (photo: Photo, size: DownloadSize) => {
      if (!user) {
        setPendingDownloadAction(() => () => {
          downloadSinglePhoto(photo, size);
        });
        setDownloadAuthModalOpen(true);
        return;
      }
      downloadSinglePhoto(photo, size);
    },
    [user]
  );

  // Expired Screen
  if (isExpired) {
    return (
      <div className="flex min-h-[100svh] flex-col items-center justify-center px-4 text-center">
        <h1 className="text-xl font-medium text-zinc-900 dark:text-zinc-100">
          This gallery is no longer available
        </h1>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          The delivery link has expired. Please contact your photographer to request renewed access.
        </p>
      </div>
    );
  }

  // Password Lock Screen
  if (!passwordUnlocked) {
    return (
      <div className="flex min-h-[100svh] flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-8 text-center shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            <Lock className="h-4 w-4" />
          </div>
          <h1 className="mt-4 text-base font-semibold text-zinc-900 dark:text-white">
            {gallery.title}
          </h1>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            This private gallery is password protected
          </p>

          <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-3">
            <div>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordError(false);
                }}
                placeholder="Enter gallery password"
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-center text-xs text-zinc-900 focus:border-zinc-900 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-800 dark:text-white dark:focus:border-zinc-100"
              />
              {passwordError && (
                <p className="mt-1.5 text-[11px] text-rose-500">
                  Incorrect password. Please try again.
                </p>
              )}
            </div>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-1.5 rounded-md bg-zinc-900 py-2 text-xs font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white cursor-pointer"
            >
              <span>View Gallery</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Cover overlay opacity: defaults to 25% (0.25)
  const overlayOpacity = ((gallery.coverOverlayStrength !== undefined ? gallery.coverOverlayStrength : 25) / 100).toFixed(2);

  // Cover subtitle text (date and client name below in small uppercase text with wide letter-spacing)
  const coverSubtitle =
    gallery.coverCustomDate ||
    `${gallery.shootDate}${gallery.clientName ? ` · ${gallery.clientName}` : ''}`;

  return (
    <div className="min-h-screen bg-white text-zinc-900 transition-colors dark:bg-[#09090b] dark:text-zinc-100 pb-28">
      {/*
        1. Full-Page Cover Section (Pixieset Style):
        - Fills entire viewport: 100svh, object-fit: cover, edge to edge
        - No navigation bar above it
        - Flat dark overlay at ~25% opacity (no gradients, no glow effects)
        - Centered text block vertically and horizontally:
          - Gallery title in large white type (refined serif, scaling with clamp())
          - Date and client name below in small uppercase text with wide letter-spacing
          - Photographer's name or logo small below. Clicking it navigates to dashboard login.
          - "View Gallery" button below: transparent background, 1px white border, uppercase small text, subtle fill on hover, visible keyboard focus state.
          - Clicking button smooth-scrolls to photo grid below.
      */}
      <section className="relative w-full h-[100svh] min-h-[100svh] overflow-hidden bg-zinc-950 select-none">
        {coverPhoto && (
          <img
            src={coverPhoto.urls.original || coverPhoto.urls.web}
            alt={gallery.title}
            referrerPolicy="no-referrer"
            className="absolute inset-0 h-full w-full object-cover select-none"
            style={{
              objectPosition: gallery.coverFocalPoint
                ? `${gallery.coverFocalPoint.x}% ${gallery.coverFocalPoint.y}%`
                : '50% 28%',
            }}
            fetchPriority="high"
          />
        )}

        {/* Flat dark overlay at ~25% opacity with NO gradients and NO glow effects */}
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})`,
          }}
        />

        {/* Center a text block vertically and horizontally over the image */}
        <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-4 sm:px-8 text-center">
          {/* Gallery title in large white type (refined serif, scaling with clamp()) */}
          <h1
            className="font-serif font-normal text-white tracking-tight leading-[1.08] max-w-4xl select-none"
            style={{
              fontSize: 'clamp(2.15rem, 5.5vw + 0.5rem, 4.75rem)',
            }}
          >
            {gallery.coverCustomTitle || gallery.title}
          </h1>

          {/* Date and client name below in small uppercase text with wide letter-spacing */}
          <p className="mt-3.5 sm:mt-4 text-[10px] sm:text-xs font-light uppercase tracking-[0.26em] sm:tracking-[0.32em] text-white/90 select-none">
            {coverSubtitle}
          </p>

          {/* Photographer's name or logo small below. Clicking takes you to the dashboard page login */}
          {photographer && (
            <button
              type="button"
              onClick={onNavigateToDashboard}
              title="Photographer Portal"
              className="mt-2.5 sm:mt-3 text-[10px] sm:text-[11px] font-normal uppercase tracking-[0.25em] text-white/70 hover:text-white transition-colors cursor-pointer select-none underline-offset-4 hover:underline focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-white"
            >
              {photographer.brandName || photographer.name}
            </button>
          )}

          {/*
            "View Gallery" button:
            - transparent background
            - 1px white border
            - uppercase small text
            - subtle fill on hover
            - visible keyboard focus state
            - smooth-scrolls to photo grid below
          */}
          <button
            type="button"
            onClick={handleScrollToGrid}
            className="mt-8 sm:mt-10 rounded-none border border-white bg-transparent px-8 py-3 text-[10px] sm:text-xs font-medium uppercase tracking-[0.25em] text-white transition-all duration-200 hover:bg-white/15 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black cursor-pointer"
          >
            {gallery.coverButtonLabel || 'VIEW GALLERY'}
          </button>
        </div>
      </section>

      {/* Target for smooth-scrolling right below the 100svh cover */}
      <div id="gallery-content" className="scroll-mt-0" />

      {/* 2. Gallery Toolbar & Collection Tabs */}
      <nav
        aria-label="Gallery toolbar"
        className="sticky top-0 z-30 w-full border-b border-zinc-200/90 bg-white/95 backdrop-blur-xs dark:border-zinc-800/90 dark:bg-zinc-950/95"
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-2.5">
          {/* Collections Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => {
                setSelectedCollectionId(null);
                setFavoritesOnly(false);
              }}
              className={`rounded-sm px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                !selectedCollectionId && !favoritesOnly
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              All Photos
            </button>

            {gallery.collections.map((col) => (
              <button
                key={col.id}
                onClick={() => {
                  setSelectedCollectionId(col.id);
                  setFavoritesOnly(false);
                }}
                className={`rounded-sm px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCollectionId === col.id && !favoritesOnly
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                }`}
              >
                {col.name}
              </button>
            ))}

            {gallery.settings.allowFavorites && (
              <button
                onClick={() => setFavoritesOnly((prev) => !prev)}
                className={`flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  favoritesOnly
                    ? 'bg-rose-600 text-white dark:bg-rose-600 dark:text-white'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                }`}
              >
                <Heart className={`h-3 w-3 ${favorites.length > 0 ? 'fill-current' : ''}`} />
                <span>Favorites</span>
                {favorites.length > 0 && (
                  <span className="font-mono tabular-nums text-[11px] opacity-90">
                    ({favorites.length})
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Action Buttons: Select, Save to, Download All, Share */}
          <div className="flex items-center gap-2">
            {favoritesOnly && favorites.length > 0 && (
              <button
                onClick={() => setSendSelectionOpen(true)}
                className="flex items-center gap-1.5 rounded-sm bg-rose-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-rose-700 cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Send selection</span>
              </button>
            )}

            <button
              onClick={() => {
                setSelectionMode((prev) => !prev);
                if (selectionMode) setSelectedPhotoIds([]);
              }}
              className={`flex items-center gap-1.5 rounded-sm border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                selectionMode
                  ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900'
                  : 'border-zinc-200 text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <CheckSquare className="h-3.5 w-3.5" />
              <span>{selectionMode ? 'Done' : 'Select'}</span>
            </button>

            <button
              onClick={() => setShareModalOpen(true)}
              title="Share Gallery Link"
              className="flex items-center gap-1.5 rounded-sm border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-700 cursor-pointer"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>Share</span>
            </button>

            {gallery.settings.allowDownload && (
              <>
                <button
                  onClick={() => setSaveToCloudOpen(true)}
                  title="Save photos to cloud or device"
                  className="hidden sm:flex items-center gap-1.5 rounded-sm border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-700 cursor-pointer"
                >
                  <Cloud className="h-3.5 w-3.5" />
                  <span>Save to...</span>
                </button>

                <button
                  onClick={handleDownloadAll}
                  className="flex items-center gap-1.5 rounded-sm bg-zinc-900 px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download all</span>
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* 3. Main Photos Grid (Justified Photo Layout) */}
      <main className="mx-auto max-w-7xl px-2 sm:px-6 py-6">
        {filteredPhotos.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              {favoritesOnly ? 'No favorited photos yet' : 'No photos in this collection'}
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              {favoritesOnly
                ? 'Tap the heart icon on any photo to add it to your favorites list.'
                : 'Check other collections above.'}
            </p>
          </div>
        ) : (
          <JustifiedPhotoGrid
            photos={filteredPhotos}
            onPhotoClick={(_, idx) => setLightboxIndex(idx)}
            selectionMode={selectionMode}
            selectedPhotoIds={selectedPhotoIds}
            onToggleSelect={handleToggleSelect}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            allowFavorites={gallery.settings.allowFavorites}
          />
        )}
      </main>

      {/* 4. Selection Mode Bottom Float Bar */}
      {selectionMode && (
        <div className="fixed bottom-6 inset-x-0 z-40 flex justify-center px-4">
          <div className="flex items-center gap-3 rounded-full border border-zinc-800 bg-zinc-950/95 px-5 py-2.5 text-white shadow-2xl backdrop-blur-md">
            <span className="text-xs font-mono tabular-nums text-zinc-300">
              {selectedPhotoIds.length} selected
            </span>

            <div className="h-3.5 w-px bg-zinc-800" />

            <button
              onClick={handleSelectAllVisible}
              className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              Select all ({filteredPhotos.length})
            </button>

            {gallery.settings.allowDownload && selectedPhotoIds.length > 0 && (
              <button
                onClick={handleDownloadSelected}
                className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1 text-xs font-semibold text-zinc-950 transition-colors hover:bg-zinc-200 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download selected</span>
              </button>
            )}

            <button
              onClick={handleClearSelection}
              title="Clear selection"
              className="text-zinc-400 hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Lightbox Viewer (with slideshow and left/right click navigation) */}
      {lightboxIndex !== null && (
        <FullscreenLightbox
          photos={filteredPhotos}
          currentIndex={lightboxIndex}
          isOpen={lightboxIndex !== null}
          onClose={() => setLightboxIndex(null)}
          onNavigate={(newIdx) => setLightboxIndex(newIdx)}
          favorites={favorites}
          onToggleFavorite={handleToggleFavorite}
          allowDownload={gallery.settings.allowDownload}
          allowFavorites={gallery.settings.allowFavorites}
          availableSizes={gallery.settings.sizes}
          onShareClick={() => setShareModalOpen(true)}
          onDownloadRequest={handleSinglePhotoDownload}
        />
      )}

      {/* Download Modal (ZIP batch generator) */}
      <DownloadModal
        isOpen={downloadModalOpen}
        onClose={() => setDownloadModalOpen(false)}
        photos={photosToDownload}
        galleryTitle={gallery.title}
        onSuccess={() => {
          recordActivity(gallery.id, 'download', `Downloaded ${photosToDownload.length} photos`);
          onRefreshGallery?.();
        }}
      />

      {/* Save to Cloud Modal */}
      <SaveToCloudModal
        isOpen={saveToCloudOpen}
        onClose={() => setSaveToCloudOpen(false)}
        onTriggerDownload={handleDownloadAll}
        photoCount={filteredPhotos.length}
      />

      {/* Send Selection Modal */}
      <SendSelectionModal
        isOpen={sendSelectionOpen}
        onClose={() => setSendSelectionOpen(false)}
        galleryId={gallery.id}
        favoritedCount={favorites.length}
        onSuccess={() => onRefreshGallery?.()}
      />

      {/* Share Link Modal */}
      <ShareLinkModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        shareId={gallery.shareId}
        galleryTitle={gallery.title}
        coverThumbUrl={coverPhoto?.urls.thumb}
        photographerName={photographer?.brandName || photographer?.name}
        photoCount={photos.length}
      />

      {/* Download Authentication Gate Modal: ONLY prompted when client clicks download */}
      <GoogleSignInModal
        isOpen={downloadAuthModalOpen}
        onClose={() => {
          setDownloadAuthModalOpen(false);
          setPendingDownloadAction(null);
        }}
        galleryTitle={gallery.title}
        coverThumbUrl={coverPhoto?.urls.thumb}
      />

      {/* Discreet Client Footer: Clean and minimal */}
      <footer className="mt-16 text-center text-xs text-zinc-400 dark:text-zinc-500">
        <p>
          {photographer?.brandName || 'Pitapixel'} · {gallery.title}
        </p>
        <p className="mt-1 text-[11px] text-zinc-400">
          Delivered with Pitapixel
        </p>
      </footer>
    </div>
  );
};
