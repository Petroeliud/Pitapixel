import React, { useState } from 'react';
import { X, Copy, Check, QrCode, Share, Image as ImageIcon, ExternalLink } from 'lucide-react';

interface ShareLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareId: string;
  galleryTitle: string;
  coverThumbUrl?: string;
  photographerName?: string;
  photoCount?: number;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export const ShareLinkModal: React.FC<ShareLinkModalProps> = ({
  isOpen,
  onClose,
  shareId,
  galleryTitle,
  coverThumbUrl,
  photographerName,
  photoCount,
}) => {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  if (!isOpen) return null;

  const origin = window.location.origin;
  // Unique link and address for this specific album
  const shareUrl = `${origin}/#gallery/${shareId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: `${galleryTitle} — Pitapixel`,
          text: `View and download photos from ${galleryTitle}:`,
          url: shareUrl,
        });
      } catch {
        // User dismissed share dialog
      }
    } else {
      handleCopy();
    }
  };

  // Generate QR code image url
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
    shareUrl
  )}&margin=10`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
              Share Album Link
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Deliver directly to clients — no app install required
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Link Preview Card: Shows thumbnail, album name & metadata */}
        <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 shadow-xs">
          <div className="relative aspect-16/9 w-full overflow-hidden bg-zinc-200 dark:bg-zinc-800">
            {coverThumbUrl ? (
              <img
                src={coverThumbUrl}
                alt={galleryTitle}
                className="h-full w-full object-cover"
                loading="eager"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-zinc-400">
                <ImageIcon className="h-8 w-8 stroke-[1.2]" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute bottom-2.5 left-3 right-3 text-white">
              <span className="text-[10px] tracking-wider uppercase text-zinc-300 font-medium">
                {photographerName || 'Pitapixel Gallery'}
              </span>
              <h3 className="truncate text-sm font-semibold text-white drop-shadow-xs">
                {galleryTitle}
              </h3>
            </div>
          </div>

          <div className="p-3 flex items-center justify-between text-[11px] text-zinc-500 border-t border-zinc-200/60 dark:border-zinc-800/60">
            <span className="truncate font-mono text-zinc-700 dark:text-zinc-300 font-medium">
              #gallery/{shareId}
            </span>
            {photoCount !== undefined && (
              <span className="font-mono tabular-nums shrink-0 text-zinc-500">
                {photoCount} photos
              </span>
            )}
          </div>
        </div>

        {/* Clean Link Input with Copy Action */}
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Direct Client Link
            </label>
            <div className="mt-1 flex gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-mono text-zinc-700 select-all dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300"
              />
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 shrink-0 rounded-md bg-zinc-900 px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Quick Sharing Options */}
          <div className="flex items-center gap-2 pt-1">
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                onClick={handleNativeShare}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-zinc-200 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
              >
                <Share className="h-3.5 w-3.5" />
                <span>Share via App</span>
              </button>
            )}

            <button
              onClick={() => setShowQr((prev) => !prev)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-zinc-200 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
            >
              <QrCode className="h-3.5 w-3.5" />
              <span>{showQr ? 'Hide QR' : 'Show QR Code'}</span>
            </button>
          </div>

          {showQr && (
            <div className="mt-2 flex flex-col items-center justify-center rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <img
                src={qrCodeUrl}
                alt="Gallery QR Code"
                className="h-44 w-44 rounded-sm"
                loading="lazy"
              />
              <p className="mt-2 text-[11px] text-zinc-500 text-center">
                Scan with mobile camera to open album
              </p>
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md border border-zinc-200 px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
