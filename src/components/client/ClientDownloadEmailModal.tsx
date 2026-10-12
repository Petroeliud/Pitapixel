import React, { useState } from 'react';
import { Download, X, Mail } from 'lucide-react';

interface ClientDownloadEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  galleryTitle?: string;
  coverThumbUrl?: string;
  photoCount?: number;
  onConfirm: (email: string) => void;
}

export const ClientDownloadEmailModal: React.FC<ClientDownloadEmailModalProps> = ({
  isOpen,
  onClose,
  galleryTitle = 'Gallery Photos',
  coverThumbUrl,
  photoCount = 1,
  onConfirm,
}) => {
  const [email, setEmail] = useState<string>(() => {
    try {
      return sessionStorage.getItem('pitapixel_client_email') || '';
    } catch {
      return '';
    }
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) return;

    try {
      sessionStorage.setItem('pitapixel_client_email', cleanEmail);
    } catch {}

    onConfirm(cleanEmail);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs select-none">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 text-center">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
              <Download className="h-3.5 w-3.5" />
            </div>
            <span className="text-xs font-semibold text-zinc-900 dark:text-white">
              Download Photos
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Thumbnail preview if provided */}
        {coverThumbUrl && (
          <div className="mt-4 mx-auto h-20 w-32 overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800">
            <img
              src={coverThumbUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <h3 className="mt-3 text-sm font-semibold text-zinc-900 dark:text-white">
          {galleryTitle}
        </h3>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
          Enter your email to download {photoCount} {photoCount === 1 ? 'photo' : 'photos'}.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <div className="relative text-left">
            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              className="w-full rounded-md border border-zinc-200 bg-white pl-9 pr-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:focus:border-white"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={!email.trim() || !email.includes('@')}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-zinc-900 py-2.5 text-xs font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white cursor-pointer shadow-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Start Download</span>
          </button>
        </form>

        <p className="mt-3 text-[10px] text-zinc-400">
          Your email is only shared with your photographer. No account required.
        </p>
      </div>
    </div>
  );
};
