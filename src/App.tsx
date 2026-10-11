/**
 * Pitapixel — Minimal, High-Speed Client Photo Delivery Platform
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { TopBar } from './components/common/TopBar';
import { ClientGalleryView } from './components/client/ClientGalleryView';
import { PhotographerDashboard } from './components/dashboard/PhotographerDashboard';
import { PhotographerAuthGate } from './components/dashboard/PhotographerAuthGate';
import { ShareLinkModal } from './components/common/ShareLinkModal';
import {
  Gallery,
  Photo,
  Photographer,
} from './types';
import {
  ensureSeedData,
  getGalleryByShareId,
  getPhotosByGallery,
  getPhotographer,
  SEED_SHARE_ID,
} from './storage/db';

function FrameApp() {
  const [currentView, setCurrentView] = useState<'client' | 'dashboard'>('client');
  const [activeShareId, setActiveShareId] = useState<string>(SEED_SHARE_ID);
  const [gallery, setGallery] = useState<Gallery | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photographer, setPhotographer] = useState<Photographer | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Parse share ID from URL hash if present (e.g. #gallery/{shareId} or #dashboard)
  const parseUrlShareId = useCallback(() => {
    const hash = window.location.hash;
    if (hash === '#dashboard' || hash === '#admin') {
      setCurrentView('dashboard');
    } else if (hash.startsWith('#gallery/')) {
      const rest = hash.replace('#gallery/', '').trim();
      const queryPart = rest.includes('?') ? rest.split('?')[1] : '';
      const urlParams = new URLSearchParams(queryPart);
      const queryId = urlParams.get('id');
      const cleanPath = rest.split('?')[0].replace(/\/$/, '');
      const targetId = queryId || cleanPath;

      if (targetId) {
        setActiveShareId(decodeURIComponent(targetId));
      }
      setCurrentView('client');
    }
  }, []);

  useEffect(() => {
    parseUrlShareId();
    window.addEventListener('hashchange', parseUrlShareId);
    return () => window.removeEventListener('hashchange', parseUrlShareId);
  }, [parseUrlShareId]);

  // Load active gallery & photos from IndexedDB
  const loadGalleryData = useCallback(async () => {
    try {
      setLoading(true);
      await ensureSeedData();

      const [gal, photog] = await Promise.all([
        getGalleryByShareId(activeShareId),
        getPhotographer(),
      ]);

      if (gal) {
        setGallery(gal);
        const photoList = await getPhotosByGallery(gal.id);
        setPhotos(photoList);
      } else {
        // Fallback to seed share ID if shareId was invalid
        const seedGal = await getGalleryByShareId(SEED_SHARE_ID);
        if (seedGal) {
          setGallery(seedGal);
          const photoList = await getPhotosByGallery(seedGal.id);
          setPhotos(photoList);
        }
      }

      setPhotographer(photog);
    } catch (err) {
      console.error('Error loading gallery data:', err);
    } finally {
      setLoading(false);
    }
  }, [activeShareId]);

  useEffect(() => {
    loadGalleryData();
  }, [loadGalleryData]);

  // Sync document title and OpenGraph metadata to show album title and cover thumbnail
  useEffect(() => {
    if (gallery) {
      document.title = `${gallery.title} — Pitapixel`;
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute('content', `${gallery.title} — Pitapixel`);

      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) {
        ogDesc.setAttribute(
          'content',
          `View and download ${photos.length} photos delivered by ${photographer?.brandName || 'Pitapixel'}`
        );
      }

      const coverPhoto = photos.find((p) => p.id === gallery.coverPhotoId) || photos[0];
      if (coverPhoto) {
        let ogImg = document.querySelector('meta[property="og:image"]');
        if (!ogImg) {
          ogImg = document.createElement('meta');
          ogImg.setAttribute('property', 'og:image');
          document.head.appendChild(ogImg);
        }
        ogImg.setAttribute('content', coverPhoto.urls.thumb);
      }
    }
  }, [gallery, photos, photographer]);

  const handleViewClientGallery = (shareId: string) => {
    setActiveShareId(shareId);
    window.location.hash = `#gallery/${shareId}`;
    setCurrentView('client');
  };

  const handleNavigateToDashboard = () => {
    setCurrentView('dashboard');
    window.location.hash = '#dashboard';
  };

  return (
    <div className="min-h-screen bg-white font-sans text-zinc-900 transition-colors antialiased selection:bg-zinc-900 selection:text-white dark:bg-[#09090b] dark:text-zinc-100 dark:selection:bg-white dark:selection:text-zinc-900">
      {/*
        Top Application Header:
        Only shown in dashboard view so client cover image fills 100svh edge to edge
        with no navigation bar above it.
      */}
      {currentView === 'dashboard' && (
        <TopBar
          currentView={currentView}
          onNavigate={(view) => {
            setCurrentView(view);
            window.location.hash = view === 'dashboard' ? '#dashboard' : `#gallery/${activeShareId}`;
          }}
          galleryTitle={gallery?.title}
          brandName={photographer?.brandName || photographer?.name}
          coverThumbUrl={
            photos.find((p) => p.id === gallery?.coverPhotoId)?.urls.thumb ||
            photos[0]?.urls.thumb
          }
          onShareClick={() => setShareModalOpen(true)}
        />
      )}

      {loading ? (
        <div className="flex h-[100svh] w-full flex-col items-center justify-center space-y-3 bg-zinc-950 text-white">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
          <span className="text-xs text-zinc-400">Loading gallery...</span>
        </div>
      ) : currentView === 'client' && gallery ? (
        <ClientGalleryView
          gallery={gallery}
          photos={photos}
          photographer={photographer}
          onRefreshGallery={loadGalleryData}
          onNavigateToDashboard={handleNavigateToDashboard}
        />
      ) : photographer ? (
        <PhotographerAuthGate
          photographer={photographer}
          onReturnToGallery={() => {
            setCurrentView('client');
            window.location.hash = `#gallery/${activeShareId}`;
          }}
        >
          <PhotographerDashboard
            photographer={photographer}
            onViewClientGallery={handleViewClientGallery}
          />
        </PhotographerAuthGate>
      ) : null}

      {/* Share Modal Triggered from Top Bar or Actions */}
      {gallery && (
        <ShareLinkModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          shareId={gallery.shareId}
          galleryTitle={gallery.title}
          coverThumbUrl={
            photos.find((p) => p.id === gallery.coverPhotoId)?.urls.thumb ||
            photos[0]?.urls.thumb
          }
          photographerName={photographer?.brandName || photographer?.name}
          photoCount={photos.length}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <FrameApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
