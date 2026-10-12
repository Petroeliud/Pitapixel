import React, { useState } from 'react';
import { X, Copy, Check, QrCode, Share, Image as ImageIcon, ExternalLink, Link2, MessageSquare } from 'lucide-react';

interface ShareLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareId: string;
  galleryTitle: string;
  coverThumbUrl?: string;
  photographerName?: string;
  photoCount?: number;
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
  const [copiedType, setCopiedType] = useState<'short' | 'direct' | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [activeTab, setActiveTab] = useState<'short' | 'direct'>('short');

  if (!isOpen) return null;

  const origin = window.location.origin;

  // Deterministic clean URL using gallery ID: /g/{id}
  // Works both with direct path navigation and browser address bar
  const canonicalPath = `/g/${shareId}`;
  const shortLink = `${origin}${canonicalPath}`;
  const directUrl = `${origin}${canonicalPath}`;

  const handleCopy = (text: string, type: 'short' | 'direct') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `View photos from ${galleryTitle}:\n${directUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: `${galleryTitle} — Pitapixel`,
          text: `View photos from ${galleryTitle}:`,
          url: directUrl,
        });
      } catch {
        // User dismissed share dialog
      }
    } else {
      handleCopy(directUrl, 'short');
    }
  };

  // Generate QR code image url pointing to the live deterministic /g/{id} link
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
    directUrl
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
              Deliver directly to clients — fast, minimal, private
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Link Preview Card */}
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
            <span className="truncate font-mono text-zinc-800 dark:text-zinc-200 font-semibold">
              /g/{shareId}
            </span>
            {photoCount !== undefined && (
              <span className="font-mono tabular-nums shrink-0 text-zinc-500">
                {photoCount} photos
              </span>
            )}
          </div>
        </div>

        {/* Gallery Share URL */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-zinc-500">
            <span className="font-medium text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5 text-zinc-700 dark:text-zinc-300" />
              Unique Gallery URL (/g/{shareId})
            </span>
            <span className="text-[10px] text-zinc-400">Deterministic album link</span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={directUrl}
              className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-mono font-medium text-zinc-900 select-all dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <button
              onClick={() => handleCopy(directUrl, 'short')}
              className="flex items-center gap-1.5 shrink-0 rounded-md bg-zinc-900 px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white cursor-pointer"
            >
              {copiedType === 'short' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedType === 'short' ? 'Copied' : 'Copy link'}</span>
            </button>
          </div>
        </div>

        {/* Sharing Options */}
        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={handleWhatsAppShare}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-zinc-200 bg-white py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
            <span>WhatsApp</span>
          </button>

          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-zinc-200 bg-white py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <Share className="h-3.5 w-3.5" />
              <span>Share...</span>
            </button>
          )}

          <button
            onClick={() => setShowQr((prev) => !prev)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-zinc-200 bg-white py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <QrCode className="h-3.5 w-3.5" />
            <span>{showQr ? 'Hide QR' : 'QR Code'}</span>
          </button>
        </div>

        {showQr && (
          <div className="mt-3 flex flex-col items-center justify-center rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <img
              src={qrCodeUrl}
              alt="Gallery QR Code"
              className="h-44 w-44 rounded-sm"
              loading="lazy"
            />
            <p className="mt-2 text-[11px] text-zinc-500 text-center">
              Scan with smartphone camera to open album
            </p>
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md border border-zinc-200 px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
