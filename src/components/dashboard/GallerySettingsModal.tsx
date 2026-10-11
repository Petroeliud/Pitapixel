import React, { useState, useRef } from 'react';
import { X, Check, Crosshair, Smartphone, Monitor, Sliders } from 'lucide-react';
import { Gallery, DownloadSize, Photo } from '../../types';

interface GallerySettingsModalProps {
  gallery: Gallery;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedGallery: Gallery) => void;
  coverPhoto?: Photo | null;
}

export const GallerySettingsModal: React.FC<GallerySettingsModalProps> = ({
  gallery,
  isOpen,
  onClose,
  onSave,
  coverPhoto,
}) => {
  // Active settings tab: 'cover' | 'access'
  const [activeTab, setActiveTab] = useState<'cover' | 'access'>('cover');

  // Cover settings
  const [overlayStrength, setOverlayStrength] = useState<number>(
    gallery.coverOverlayStrength !== undefined ? gallery.coverOverlayStrength : 25
  );
  const [coverTitle, setCoverTitle] = useState(gallery.coverCustomTitle || gallery.title);
  const [coverDate, setCoverDate] = useState(
    gallery.coverCustomDate ||
      `${gallery.shootDate}${gallery.clientName ? ` · ${gallery.clientName}` : ''}`
  );
  const [coverButtonLabel, setCoverButtonLabel] = useState(
    gallery.coverButtonLabel || 'VIEW GALLERY'
  );
  const [focalPoint, setFocalPoint] = useState<{ x: number; y: number }>(
    gallery.coverFocalPoint || { x: 50, y: 28 }
  );
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  // Access & Download settings
  const [allowDownload, setAllowDownload] = useState(gallery.settings.allowDownload);
  const [allowFavorites, setAllowFavorites] = useState(gallery.settings.allowFavorites);
  const [sizes, setSizes] = useState<DownloadSize[]>(gallery.settings.sizes);
  const [password, setPassword] = useState(gallery.password || '');
  const [hasPassword, setHasPassword] = useState(Boolean(gallery.password));
  const [expiresAt, setExpiresAt] = useState(
    gallery.expiresAt ? gallery.expiresAt.substring(0, 10) : ''
  );
  const [hasExpiry, setHasExpiry] = useState(Boolean(gallery.expiresAt));

  const imageContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const xPct = Math.max(0, Math.min(100, Math.round((clickX / rect.width) * 100)));
    const yPct = Math.max(0, Math.min(100, Math.round((clickY / rect.height) * 100)));
    setFocalPoint({ x: xPct, y: yPct });
  };

  const handleToggleSize = (size: DownloadSize) => {
    if (sizes.includes(size)) {
      if (sizes.length === 1) return;
      setSizes(sizes.filter((s) => s !== size));
    } else {
      setSizes([...sizes, size]);
    }
  };

  const handleSave = () => {
    const updated: Gallery = {
      ...gallery,
      title: coverTitle.trim() || gallery.title,
      coverCustomTitle: coverTitle.trim() || undefined,
      coverCustomDate: coverDate.trim() || undefined,
      coverButtonLabel: coverButtonLabel.trim() || 'VIEW GALLERY',
      coverOverlayStrength: overlayStrength,
      coverFocalPoint: focalPoint,
      password: hasPassword && password ? password : undefined,
      expiresAt: hasExpiry && expiresAt ? new Date(expiresAt).toISOString() : undefined,
      settings: {
        allowDownload,
        allowFavorites,
        sizes,
      },
    };
    onSave(updated);
    onClose();
  };

  const coverImageUrl =
    coverPhoto?.urls.web ||
    coverPhoto?.urls.original ||
    'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1800&q=80';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl my-8 rounded-lg border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
              Gallery & Cover Settings
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Customize cover typography, focal point crop, overlay strength, and download rules
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-zinc-100 dark:border-zinc-800 mt-3 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('cover')}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'cover'
                ? 'border-zinc-900 text-zinc-900 dark:border-white dark:text-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
            }`}
          >
            Cover Photo & Focal Point
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('access')}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'access'
                ? 'border-zinc-900 text-zinc-900 dark:border-white dark:text-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
            }`}
          >
            Downloads & Access
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-5 text-xs pr-1">
          {activeTab === 'cover' && (
            <>
              {/* Interactive Focal Point Picker */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-medium text-zinc-900 dark:text-white">
                    <Crosshair className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
                    <span>Set Cover Focal Point (Click Image)</span>
                  </div>
                  <span className="font-mono text-[11px] text-zinc-500">
                    X: {focalPoint.x}% · Y: {focalPoint.y}%
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Click directly on the subjects or faces in the photo. The cover will automatically anchor to this point when cropped across desktop and mobile screens.
                </p>

                {/* Clickable Image Container */}
                <div
                  ref={imageContainerRef}
                  onClick={handleImageClick}
                  className="relative w-full h-52 sm:h-64 rounded-md overflow-hidden cursor-crosshair border border-zinc-200 dark:border-zinc-800 select-none group bg-zinc-950"
                >
                  <img
                    src={coverImageUrl}
                    alt="Cover Focal Target"
                    className="w-full h-full object-cover"
                    style={{
                      objectPosition: `${focalPoint.x}% ${focalPoint.y}%`,
                    }}
                  />

                  {/* Dark flat overlay preview */}
                  <div
                    className="absolute inset-0 pointer-events-none transition-colors"
                    style={{ backgroundColor: `rgba(0, 0, 0, ${overlayStrength / 100})` }}
                  />

                  {/* Focal point indicator pin */}
                  <div
                    className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2 transition-all duration-75"
                    style={{ left: `${focalPoint.x}%`, top: `${focalPoint.y}%` }}
                  >
                    <div className="relative flex items-center justify-center">
                      <div className="h-8 w-8 rounded-full border-2 border-white/90 bg-black/30 shadow-lg flex items-center justify-center animate-pulse">
                        <div className="h-2 w-2 rounded-full bg-white shadow-xs" />
                      </div>
                      <div className="absolute -top-6 whitespace-nowrap rounded-xs bg-black/80 px-1.5 py-0.5 text-[9px] font-mono text-white">
                        Focal Point ({focalPoint.x}%, {focalPoint.y}%)
                      </div>
                    </div>
                  </div>

                  {/* Text preview overlaid */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4 text-center">
                    <span className="font-serif text-lg sm:text-2xl text-white font-normal drop-shadow-xs">
                      {coverTitle || gallery.title}
                    </span>
                    <span className="mt-1 text-[9px] sm:text-[10px] tracking-widest uppercase text-white/90">
                      {coverDate}
                    </span>
                    <span className="mt-2 text-[8px] uppercase tracking-wider text-white/70">
                      Pitapixel Studio
                    </span>
                    <div className="mt-3 border border-white/90 px-3 py-1 text-[9px] tracking-wider text-white uppercase">
                      {coverButtonLabel}
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Device Crop Previews */}
              <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    Responsive Crop Simulation
                  </span>
                  <div className="flex items-center gap-1 bg-zinc-200 dark:bg-zinc-700 p-0.5 rounded-sm">
                    <button
                      type="button"
                      onClick={() => setPreviewDevice('desktop')}
                      className={`flex items-center gap-1 px-2 py-1 rounded-xs text-[10px] transition-colors cursor-pointer ${
                        previewDevice === 'desktop'
                          ? 'bg-white text-zinc-900 shadow-2xs dark:bg-zinc-900 dark:text-white'
                          : 'text-zinc-600 dark:text-zinc-300'
                      }`}
                    >
                      <Monitor className="h-3 w-3" />
                      <span>Desktop (16:9)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewDevice('mobile')}
                      className={`flex items-center gap-1 px-2 py-1 rounded-xs text-[10px] transition-colors cursor-pointer ${
                        previewDevice === 'mobile'
                          ? 'bg-white text-zinc-900 shadow-2xs dark:bg-zinc-900 dark:text-white'
                          : 'text-zinc-600 dark:text-zinc-300'
                      }`}
                    >
                      <Smartphone className="h-3 w-3" />
                      <span>Mobile (375px)</span>
                    </button>
                  </div>
                </div>

                <div className="flex justify-center bg-zinc-900 p-4 rounded-md">
                  {previewDevice === 'desktop' ? (
                    <div className="relative w-full aspect-16/9 max-w-md rounded-xs overflow-hidden border border-zinc-700">
                      <img
                        src={coverImageUrl}
                        alt="Desktop Preview"
                        className="w-full h-full object-cover"
                        style={{ objectPosition: `${focalPoint.x}% ${focalPoint.y}%` }}
                      />
                      <div
                        className="absolute inset-0"
                        style={{ backgroundColor: `rgba(0, 0, 0, ${overlayStrength / 100})` }}
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2 text-white">
                        <span className="font-serif text-sm font-normal truncate max-w-xs">{coverTitle}</span>
                        <span className="text-[8px] uppercase tracking-widest text-white/90 mt-0.5">{coverDate}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-44 aspect-9/16 rounded-xs overflow-hidden border border-zinc-700 shadow-md">
                      <img
                        src={coverImageUrl}
                        alt="Mobile Preview"
                        className="w-full h-full object-cover"
                        style={{ objectPosition: `${focalPoint.x}% ${focalPoint.y}%` }}
                      />
                      <div
                        className="absolute inset-0"
                        style={{ backgroundColor: `rgba(0, 0, 0, ${overlayStrength / 100})` }}
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2 text-white">
                        <span className="font-serif text-xs font-normal leading-tight">{coverTitle}</span>
                        <span className="text-[7px] uppercase tracking-widest text-white/90 mt-1">{coverDate}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Overlay Strength Slider */}
              <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-zinc-900 dark:text-white">
                      Dark Flat Overlay Strength
                    </label>
                    <p className="text-[11px] text-zinc-500">
                      Flat dark color overlay without gradients for maximum text readability (Pixieset default: 25%)
                    </p>
                  </div>
                  <span className="font-mono text-xs font-bold text-zinc-900 dark:text-white">
                    {overlayStrength}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="80"
                    step="1"
                    value={overlayStrength}
                    onChange={(e) => setOverlayStrength(Number(e.target.value))}
                    className="flex-1 accent-zinc-900 dark:accent-white cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => setOverlayStrength(25)}
                    className="rounded-xs border border-zinc-200 px-2 py-1 text-[10px] text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    Reset to 25%
                  </button>
                </div>
              </div>

              {/* Cover Text Settings */}
              <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <span className="font-medium text-zinc-900 dark:text-white block">
                  Cover Text Overlays
                </span>

                <div>
                  <label className="block text-[11px] text-zinc-600 dark:text-zinc-400 mb-1">
                    Gallery Title (Large Serif)
                  </label>
                  <input
                    type="text"
                    value={coverTitle}
                    onChange={(e) => setCoverTitle(e.target.value)}
                    placeholder="e.g. Elena & Marcus — Coastal Wedding"
                    className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-600 dark:text-zinc-400 mb-1">
                    Date & Client Subtitle (Uppercase Wide Letter-spacing)
                  </label>
                  <input
                    type="text"
                    value={coverDate}
                    onChange={(e) => setCoverDate(e.target.value)}
                    placeholder="e.g. October 4, 2026 · Elena Rostova & Marcus Vance"
                    className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-600 dark:text-zinc-400 mb-1">
                    Cover Button Label
                  </label>
                  <input
                    type="text"
                    value={coverButtonLabel}
                    onChange={(e) => setCoverButtonLabel(e.target.value)}
                    placeholder="VIEW GALLERY"
                    className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
              </div>
            </>
          )}

          {activeTab === 'access' && (
            <>
              {/* Downloads toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-zinc-900 dark:text-white">
                    Client Downloads
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    Allow clients to download individual photos and batch ZIP archives
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAllowDownload((prev) => !prev)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
                    allowDownload ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-200 dark:bg-zinc-700'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition-transform dark:bg-zinc-900 ${
                      allowDownload ? 'translate-x-4.5 translate-y-0.75' : 'translate-x-0.75 translate-y-0.75'
                    }`}
                  />
                </button>
              </div>

              {/* Download sizes if allowed */}
              {allowDownload && (
                <div className="rounded-md border border-zinc-100 bg-zinc-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-800/40">
                  <div className="font-medium text-zinc-800 dark:text-zinc-200 mb-2">
                    Permitted Download Sizes
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sizes.includes('web')}
                        onChange={() => handleToggleSize('web')}
                        className="h-3.5 w-3.5 rounded-xs border-zinc-300 text-zinc-900 focus:ring-0"
                      />
                      <span className="text-zinc-700 dark:text-zinc-300">
                        Web Size (1600px - Fast mobile download)
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sizes.includes('original')}
                        onChange={() => handleToggleSize('original')}
                        className="h-3.5 w-3.5 rounded-xs border-zinc-300 text-zinc-900 focus:ring-0"
                      />
                      <span className="text-zinc-700 dark:text-zinc-300">
                        Original Resolution (Print quality)
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Favorites toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <div>
                  <div className="font-semibold text-zinc-900 dark:text-white">
                    Client Favorites
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    Allow clients to heart photos and send selections for album design
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAllowFavorites((prev) => !prev)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
                    allowFavorites ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-200 dark:bg-zinc-700'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition-transform dark:bg-zinc-900 ${
                      allowFavorites ? 'translate-x-4.5 translate-y-0.75' : 'translate-x-0.75 translate-y-0.75'
                    }`}
                  />
                </button>
              </div>

              {/* Password Protection */}
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-zinc-900 dark:text-white">
                      Password Protection
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      Require clients to enter a password to view photos
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHasPassword((prev) => !prev)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
                      hasPassword ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-200 dark:bg-zinc-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition-transform dark:bg-zinc-900 ${
                        hasPassword ? 'translate-x-4.5 translate-y-0.75' : 'translate-x-0.75 translate-y-0.75'
                      }`}
                    />
                  </button>
                </div>

                {hasPassword && (
                  <div className="mt-2.5">
                    <input
                      type="text"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Set gallery password (e.g. elena2026)"
                      className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-800 dark:text-white"
                    />
                  </div>
                )}
              </div>

              {/* Expiration Date */}
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-zinc-900 dark:text-white">
                      Gallery Expiration
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      Automatically deactivate gallery access after a set date
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHasExpiry((prev) => !prev)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
                      hasExpiry ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-200 dark:bg-zinc-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition-transform dark:bg-zinc-900 ${
                        hasExpiry ? 'translate-x-4.5 translate-y-0.75' : 'translate-x-0.75 translate-y-0.75'
                      }`}
                    />
                  </button>
                </div>

                {hasExpiry && (
                  <div className="mt-2.5">
                    <input
                      type="date"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-800 dark:text-white"
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer actions */}
        <div className="mt-5 flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 rounded-md bg-zinc-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white cursor-pointer"
          >
            <Check className="h-3.5 w-3.5" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
