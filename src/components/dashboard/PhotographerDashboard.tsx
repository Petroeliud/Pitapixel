import React, { useState, useEffect } from 'react';
import {
  Plus,
  Share2,
  Settings,
  Eye,
  Download,
  Image,
  Calendar,
  ExternalLink,
  ChevronLeft,
  Upload,
} from 'lucide-react';
import { Gallery, Photo, Photographer } from '../../types';
import {
  getAllGalleries,
  getPhotosByGallery,
  saveGallery,
  deleteGallery,
} from '../../storage/db';
import { BatchUploader } from './BatchUploader';
import { PhotosManager } from './PhotosManager';
import { ActivityTab } from './ActivityTab';
import { GallerySettingsModal } from './GallerySettingsModal';
import { CreateGalleryModal } from './CreateGalleryModal';
import { ShareLinkModal } from '../common/ShareLinkModal';

interface PhotographerDashboardProps {
  photographer: Photographer;
  onViewClientGallery: (shareId: string) => void;
}

export const PhotographerDashboard: React.FC<PhotographerDashboardProps> = ({
  photographer,
  onViewClientGallery,
}) => {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [activeGallery, setActiveGallery] = useState<Gallery | null>(null);
  const [activePhotos, setActivePhotos] = useState<Photo[]>([]);
  const [galleryPhotoCounts, setGalleryPhotoCounts] = useState<Record<string, number>>({});
  const [galleryCovers, setGalleryCovers] = useState<Record<string, string>>({});

  // Active tab inside gallery detail: 'photos' | 'activity'
  const [activeDetailTab, setActiveDetailTab] = useState<'photos' | 'activity'>('photos');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [uploaderExpanded, setUploaderExpanded] = useState(false);

  // Load galleries on mount
  useEffect(() => {
    refreshGalleries();
  }, []);

  const refreshGalleries = async () => {
    const list = await getAllGalleries();
    setGalleries(list);

    // Fetch counts and covers
    const counts: Record<string, number> = {};
    const covers: Record<string, string> = {};

    for (const g of list) {
      const photos = await getPhotosByGallery(g.id);
      counts[g.id] = photos.length;
      if (photos.length > 0) {
        const cover = photos.find((p) => p.id === g.coverPhotoId) || photos[0];
        covers[g.id] = cover.urls.thumb;
      }
    }

    setGalleryPhotoCounts(counts);
    setGalleryCovers(covers);
  };

  // Select gallery to manage
  const handleSelectGallery = async (gallery: Gallery) => {
    setActiveGallery(gallery);
    const photos = await getPhotosByGallery(gallery.id);
    setActivePhotos(photos);
    setActiveDetailTab('photos');
    setUploaderExpanded(photos.length === 0);
  };

  const handleUploadComplete = (newPhotos: Photo[]) => {
    setActivePhotos((prev) => [...prev, ...newPhotos]);
    refreshGalleries();
  };

  const handleSettingsSaved = async (updated: Gallery) => {
    await saveGallery(updated);
    setActiveGallery(updated);
    refreshGalleries();
  };

  const handleDeleteGalleryClick = async (galleryId: string) => {
    if (!window.confirm('Are you sure you want to delete this gallery? This cannot be undone.')) return;
    await deleteGallery(galleryId);
    setActiveGallery(null);
    refreshGalleries();
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 transition-colors dark:bg-zinc-950 dark:text-zinc-100 pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-8">
        {/* If no gallery is selected, show Gallery List View */}
        {!activeGallery ? (
          <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                  Client Deliveries
                </h1>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {photographer.brandName} · {photographer.name}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-md bg-zinc-900 px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Gallery</span>
                </button>
              </div>
            </div>

            {/* Gallery Cards Grid */}
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {galleries.map((gallery) => {
                const coverThumb = galleryCovers[gallery.id];
                const count = galleryPhotoCounts[gallery.id] || 0;
                const isExpired = gallery.expiresAt
                  ? new Date(gallery.expiresAt).getTime() < Date.now()
                  : false;

                return (
                  <div
                    key={gallery.id}
                    className="group relative flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white transition-all hover:border-zinc-300 hover:shadow-xs dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                  >
                    {/* Cover Preview Image */}
                    <div
                      onClick={() => handleSelectGallery(gallery)}
                      className="relative h-48 w-full cursor-pointer overflow-hidden bg-zinc-100 dark:bg-zinc-800"
                    >
                      {coverThumb ? (
                        <img
                          src={coverThumb}
                          alt={gallery.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-102"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-zinc-400">
                          <Image className="h-8 w-8 stroke-[1.2]" />
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                      {/* Status label */}
                      <div className="absolute left-3 top-3">
                        <span
                          className={`rounded-xs px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase ${
                            isExpired
                              ? 'bg-rose-950/80 text-rose-300'
                              : 'bg-zinc-900/80 text-zinc-200 dark:bg-white/90 dark:text-zinc-900'
                          }`}
                        >
                          {isExpired ? 'Expired' : 'Active'}
                        </span>
                      </div>

                      {/* Photo count overlay */}
                      <div className="absolute right-3 bottom-3 text-xs font-mono tabular-nums text-white/90 drop-shadow-xs">
                        {count} photos
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col justify-between p-4">
                      <div>
                        <h2
                          onClick={() => handleSelectGallery(gallery)}
                          className="cursor-pointer text-sm font-semibold text-zinc-900 hover:underline dark:text-white"
                        >
                          {gallery.title}
                        </h2>
                        {gallery.clientName && (
                          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                            Client: {gallery.clientName}
                          </p>
                        )}
                        <p className="mt-1 text-[11px] text-zinc-400">
                          Shoot date: {gallery.shootDate}
                        </p>
                      </div>

                      {/* Stats & Actions */}
                      <div className="mt-4 flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-500">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            <span className="font-mono tabular-nums">{gallery.viewCount}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Download className="h-3 w-3" />
                            <span className="font-mono tabular-nums">{gallery.downloadCount}</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              setActiveGallery(gallery);
                              const photos = await getPhotosByGallery(gallery.id);
                              setActivePhotos(photos);
                              setShareModalOpen(true);
                            }}
                            title="Share Gallery Link"
                            className="flex items-center gap-1 text-xs font-medium text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
                          >
                            <Share2 className="h-3 w-3" />
                            <span>Share</span>
                          </button>
                          <span className="text-zinc-300 dark:text-zinc-700">·</span>
                          <button
                            onClick={() => onViewClientGallery(gallery.shareId)}
                            title="Preview client view"
                            className="flex items-center gap-1 text-xs font-medium text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
                          >
                            <span>Client view</span>
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Gallery Detail & Management View */
          <div>
            {/* Top Back & Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setActiveGallery(null);
                    refreshGalleries();
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div>
                  <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                    {activeGallery.title}
                  </h1>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {activeGallery.clientName || 'Private delivery'} · {activePhotos.length} photos
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShareModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Share link</span>
                </button>

                <button
                  onClick={() => setSettingsModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  <Settings className="h-3.5 w-3.5" />
                  <span>Settings</span>
                </button>

                <button
                  onClick={() => onViewClientGallery(activeGallery.shareId)}
                  className="flex items-center gap-1.5 rounded-md bg-zinc-900 px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Open client gallery</span>
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="mt-6 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-px">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setActiveDetailTab('photos')}
                  className={`pb-3 text-xs font-medium border-b-2 transition-colors ${
                    activeDetailTab === 'photos'
                      ? 'border-zinc-900 text-zinc-900 dark:border-white dark:text-white'
                      : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                  }`}
                >
                  Photos ({activePhotos.length})
                </button>

                <button
                  onClick={() => setActiveDetailTab('activity')}
                  className={`pb-3 text-xs font-medium border-b-2 transition-colors ${
                    activeDetailTab === 'activity'
                      ? 'border-zinc-900 text-zinc-900 dark:border-white dark:text-white'
                      : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                  }`}
                >
                  Activity & Client Favorites
                </button>
              </div>

              {activeDetailTab === 'photos' && (
                <button
                  onClick={() => setUploaderExpanded((prev) => !prev)}
                  className="flex items-center gap-1.5 pb-2 text-xs font-medium text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>{uploaderExpanded ? 'Hide uploader' : 'Add more photos'}</span>
                </button>
              )}
            </div>

            {/* Tab Contents */}
            <div className="mt-6">
              {activeDetailTab === 'photos' ? (
                <div className="space-y-6">
                  {uploaderExpanded && (
                    <BatchUploader
                      galleryId={activeGallery.id}
                      currentPhotoCount={activePhotos.length}
                      onUploadComplete={handleUploadComplete}
                    />
                  )}

                  <PhotosManager
                    gallery={activeGallery}
                    photos={activePhotos}
                    onPhotosChange={setActivePhotos}
                    onGalleryChange={setActiveGallery}
                  />

                  {/* Danger zone delete */}
                  <div className="pt-12 mt-12 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center text-xs text-zinc-500">
                    <span>Delete gallery and associated uploaded photos</span>
                    <button
                      onClick={() => handleDeleteGalleryClick(activeGallery.id)}
                      className="text-xs text-rose-600 hover:text-rose-700 font-medium"
                    >
                      Delete gallery
                    </button>
                  </div>
                </div>
              ) : (
                <ActivityTab gallery={activeGallery} photos={activePhotos} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateGalleryModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        photographerId={photographer.id}
        onGalleryCreated={(newGal) => {
          refreshGalleries();
          handleSelectGallery(newGal);
        }}
      />

      {activeGallery && (
        <GallerySettingsModal
          gallery={activeGallery}
          isOpen={settingsModalOpen}
          onClose={() => setSettingsModalOpen(false)}
          onSave={handleSettingsSaved}
          coverPhoto={
            activePhotos.find((p) => p.id === activeGallery.coverPhotoId) || activePhotos[0]
          }
        />
      )}

      {activeGallery && (
        <ShareLinkModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          shareId={activeGallery.shareId}
          galleryTitle={activeGallery.title}
          coverThumbUrl={
            galleryCovers[activeGallery.id] ||
            activePhotos.find((p) => p.id === activeGallery.coverPhotoId)?.urls.thumb ||
            activePhotos[0]?.urls.thumb
          }
          photographerName={photographer.brandName || photographer.name}
          photoCount={galleryPhotoCounts[activeGallery.id] ?? activePhotos.length}
        />
      )}
    </div>
  );
};
