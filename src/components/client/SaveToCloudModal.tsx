import React from 'react';
import { X, Download, Cloud, ExternalLink } from 'lucide-react';

interface SaveToCloudModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerDownload: () => void;
  photoCount: number;
}

export const SaveToCloudModal: React.FC<SaveToCloudModalProps> = ({
  isOpen,
  onClose,
  onTriggerDownload,
  photoCount,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
            Save {photoCount} {photoCount === 1 ? 'photo' : 'photos'} to...
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-2.5">
          {/* Option 1: Direct Download (Active) */}
          <button
            onClick={() => {
              onClose();
              onTriggerDownload();
            }}
            className="flex w-full items-center justify-between rounded-md border border-zinc-200 p-3 text-left transition-colors hover:border-zinc-900 dark:border-zinc-800 dark:hover:border-zinc-100"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                <Download className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-zinc-900 dark:text-white">
                  Download to Device
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Save as ZIP archive to your files
                </div>
              </div>
            </div>
          </button>

          {/* Option 2: Google Photos (Coming soon) */}
          <div className="group relative flex w-full items-center justify-between rounded-md border border-zinc-100 bg-zinc-50/60 p-3 text-left opacity-80 dark:border-zinc-800/60 dark:bg-zinc-800/30">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-zinc-200/70 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                <Cloud className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Google Photos
                </div>
                <div className="text-[11px] text-zinc-400">
                  Sync directly to your Google Photos library
                </div>
              </div>
            </div>
            <span className="text-[10px] font-medium text-zinc-400">
              Coming soon
            </span>
          </div>

          {/* Option 3: Microsoft OneDrive (Coming soon) */}
          <div className="group relative flex w-full items-center justify-between rounded-md border border-zinc-100 bg-zinc-50/60 p-3 text-left opacity-80 dark:border-zinc-800/60 dark:bg-zinc-800/30">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-zinc-200/70 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                <ExternalLink className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Microsoft OneDrive
                </div>
                <div className="text-[11px] text-zinc-400">
                  Transfer albums to your cloud drive
                </div>
              </div>
            </div>
            <span className="text-[10px] font-medium text-zinc-400">
              Coming soon
            </span>
          </div>
        </div>

        <div className="mt-5 text-center">
          <button
            onClick={onClose}
            className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
