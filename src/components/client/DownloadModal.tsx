import React, { useState } from 'react';
import { X, Check, Loader2 } from 'lucide-react';
import { Photo, DownloadSize } from '../../types';
import { downloadPhotosAsZip, ZipDownloadProgress } from '../../utils/zipService';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: Photo[];
  galleryTitle: string;
  onSuccess?: () => void;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({
  isOpen,
  onClose,
  photos,
  galleryTitle,
  onSuccess,
}) => {
  const [selectedSize, setSelectedSize] = useState<DownloadSize>('web');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ZipDownloadProgress | null>(null);

  if (!isOpen) return null;

  const handleStartDownload = async () => {
    setIsProcessing(true);
    const cleanTitle = (galleryTitle || 'Photos').replace(/[^a-zA-Z0-9_-]/g, '_');
    const zipName = `${cleanTitle}_${selectedSize}.zip`;

    try {
      await downloadPhotosAsZip(photos, selectedSize, zipName, (p) => {
        setProgress(p);
      });
      onSuccess?.();
      setTimeout(() => {
        setIsProcessing(false);
        setProgress(null);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('ZIP download error:', err);
      setIsProcessing(false);
      setProgress(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
              Download Photos
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {photos.length} {photos.length === 1 ? 'photo' : 'photos'} ready to download
            </p>
          </div>
          {!isProcessing && (
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {!isProcessing ? (
          <div className="mt-5 space-y-4">
            <p className="text-xs text-zinc-600 dark:text-zinc-300">
              Select resolution for download:
            </p>

            <div className="space-y-2">
              <label
                onClick={() => setSelectedSize('web')}
                className={`flex cursor-pointer items-start justify-between rounded-md border p-3.5 transition-all ${
                  selectedSize === 'web'
                    ? 'border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-800/60'
                    : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="text-xs font-semibold text-zinc-900 dark:text-white">
                    Web Size
                  </div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Optimized for phones, WhatsApp, and social media. Smaller file size.
                  </div>
                </div>
                <div
                  className={`mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border ${
                    selectedSize === 'web'
                      ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900'
                      : 'border-zinc-300 dark:border-zinc-600'
                  }`}
                >
                  {selectedSize === 'web' && <Check className="h-3 w-3" />}
                </div>
              </label>

              <label
                onClick={() => setSelectedSize('original')}
                className={`flex cursor-pointer items-start justify-between rounded-md border p-3.5 transition-all ${
                  selectedSize === 'original'
                    ? 'border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-800/60'
                    : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="text-xs font-semibold text-zinc-900 dark:text-white">
                    Original Resolution
                  </div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Highest print quality. Larger download size.
                  </div>
                </div>
                <div
                  className={`mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border ${
                    selectedSize === 'original'
                      ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900'
                      : 'border-zinc-300 dark:border-zinc-600'
                  }`}
                >
                  {selectedSize === 'original' && <Check className="h-3 w-3" />}
                </div>
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartDownload}
                className="flex items-center gap-1.5 rounded-md bg-zinc-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              >
                <span>Download as ZIP</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-4 py-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {progress?.status === 'compressing'
                  ? 'Compressing archive...'
                  : progress?.status === 'completed'
                  ? 'Download starting...'
                  : `Preparing photo ${progress?.loadedFiles || 0} of ${progress?.totalFiles || photos.length}`}
              </span>
              <span className="font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
                {progress?.percent || 0}%
              </span>
            </div>

            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-full bg-zinc-900 transition-all duration-200 dark:bg-zinc-100"
                style={{ width: `${progress?.percent || 0}%` }}
              />
            </div>

            <div className="flex items-center justify-center gap-2 pt-2 text-[11px] text-zinc-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-500" />
              <span>Packaging files client-side</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
