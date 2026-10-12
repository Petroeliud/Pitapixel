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
  getAllGalleries,
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

  // Parse share ID from URL path (deterministic /g/{id}) or hash fallback
  const parseUrlShareId = useCallback(() => {
    const pathname = window.location.pathname || '';
    const hash = window.location.hash || '';
    const search = window.location.search || '';

    if (hash === '#dashboard' || hash === '#admin' || pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
      setCurrentView('dashboard');
      return;
    }

    const urlParams = new URLSearchParams(search);
    const queryG = urlParams.get('g') || urlParams.get('share') || urlParams.get('id');

    let targetId = '';
    // 1. Direct canonical pathname /g/{id}
    if (pathname.startsWith('/g/')) {
      targetId = pathname.replace('/g/', '');
    } else if (pathname.includes('/g/')) {
      targetId = pathname.split('/g/')[1];
    } else if (queryG) {
      targetId = queryG;
    } else if (hash.startsWith('#g/')) {
      targetId = hash.replace('#g/', '');
    } else if (hash.startsWith('#/g/')) {
      targetId = hash.replace('#/g/', '');
    } else if (hash.startsWith('#gallery/')) {
      targetId = hash.replace('#gallery/', '');
    }

    if (targetId) {
      const cleanPath = targetId.split('?')[0].split('#')[0].replace(/\/$/, '').trim();
      if (cleanPath) {
        setActiveShareId(decodeURIComponent(cleanPath));
        setCurrentView('client');
      }
    }
  }, []);

  useEffect(() => {
    parseUrlShareId();
    window.addEventListener('hashchange', parseUrlShareId);
    window.addEventListener('popstate', parseUrlShareId);
    return () => {
      window.removeEventListener('hashchange', parseUrlShareId);
      window.removeEventListener('popstate', parseUrlShareId);
    };
  }, [parseUrlShareId]);

  // Load active gallery & photos from Firestore / IndexedDB
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
        const hasExplicitShareInUrl =
          window.location.pathname.startsWith('/g/') ||
          window.location.hash.startsWith('#g/') ||
          window.location.hash.startsWith('#gallery/') ||
          window.location.search.includes('g=');

        if (!hasExplicitShareInUrl) {
          // Default landing: pick first available non-deleted gallery
          const allGals = await getAllGalleries();
          if (allGals.length > 0) {
            setGallery(allGals[0]);
            setActiveShareId(allGals[0].shareId);
            const photoList = await getPhotosByGallery(allGals[0].id);
            setPhotos(photoList);
          } else {
            setGallery(null);
            setPhotos([]);
          }
        } else {
          // Explicitly requested link was not found
          setGallery(null);
          setPhotos([]);
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
    // Push deterministic /g/{id} URL into window history and address bar
    const newPath = `/g/${shareId}`;
    if (window.location.pathname !== newPath) {
      window.history.pushState({ shareId }, '', newPath);
    }
    setCurrentView('client');
  };

  const handleNavigateToDashboard = () => {
    setCurrentView('dashboard');
    if (window.location.pathname !== '/dashboard') {
      window.history.pushState({}, '', '/dashboard');
    }
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
            window.location.hash = view === 'dashboard' ? '#dashboard' : `#g/${activeShareId}`;
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
      ) : currentView === 'client' && !gallery ? (
        /* Calm Not Found State if an album link does not exist */
        <div className="flex min-h-[100svh] flex-col items-center justify-center px-4 text-center bg-zinc-950 text-white">
          <div className="max-w-md space-y-4">
            <h1 className="text-xl font-medium tracking-tight">
              Gallery Not Found
            </h1>
            <p className="text-xs text-zinc-400 leading-relaxed">
              The gallery link you followed is not available or has been deleted.
            </p>
            <div className="pt-4 flex items-center justify-center gap-3">
              <button
                onClick={handleNavigateToDashboard}
                className="rounded-md border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-white/20 cursor-pointer"
              >
                Photographer Portal
              </button>
              <button
                onClick={async () => {
                  const all = await getAllGalleries();
                  if (all.length > 0) {
                    handleViewClientGallery(all[0].shareId);
                  }
                }}
                className="rounded-md bg-white px-4 py-2 text-xs font-medium text-zinc-900 transition-colors hover:bg-zinc-200 cursor-pointer"
              >
                View Available Galleries
              </button>
            </div>
          </div>
        </div>
      ) : photographer ? (
        <PhotographerAuthGate
          photographer={photographer}
          onReturnToGallery={() => {
            setCurrentView('client');
            window.location.hash = `#g/${activeShareId}`;
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
