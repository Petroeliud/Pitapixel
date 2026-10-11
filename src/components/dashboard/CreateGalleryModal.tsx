import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Gallery } from '../../types';
import { saveGallery } from '../../storage/db';

interface CreateGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  photographerId: string;
  onGalleryCreated: (newGallery: Gallery) => void;
}

export const CreateGalleryModal: React.FC<CreateGalleryModalProps> = ({
  isOpen,
  onClose,
  photographerId,
  onGalleryCreated,
}) => {
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [shootDate, setShootDate] = useState(
    new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  );
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Generate clean, readable album share link slug
    const slug = title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const shortSuffix = Math.random().toString(36).substring(2, 6);
    const shareId = slug ? `${slug}-${shortSuffix}` : `gallery-${shortSuffix}`;
    const galleryId = `gallery-${Date.now()}`;

    const newGallery: Gallery = {
      id: galleryId,
      photographerId,
      shareId,
      title: title.trim(),
      clientName: clientName.trim() || undefined,
      shootDate: shootDate.trim(),
      coverFocalPoint: { x: 50, y: 28 },
      coverFramingSummary: 'AI smart framing keeps subject heads in upper frame',
      password: password.trim() || undefined,
      settings: {
        allowDownload: true,
        allowFavorites: true,
        sizes: ['web', 'original'],
      },
      collections: [],
      viewCount: 0,
      downloadCount: 0,
      createdAt: new Date().toISOString(),
    };

    await saveGallery(newGallery);
    onGalleryCreated(newGallery);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
              Create New Gallery
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Generates a secure, unguessable delivery link
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Gallery Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Maya & Daniel — Estate Wedding"
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-800 dark:text-white dark:focus:border-zinc-100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Client Name (optional)
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Maya Lin"
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-800 dark:text-white dark:focus:border-zinc-100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Shoot Date
            </label>
            <input
              type="text"
              value={shootDate}
              onChange={(e) => setShootDate(e.target.value)}
              placeholder="October 11, 2026"
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-800 dark:text-white dark:focus:border-zinc-100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Optional Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank for open link"
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-800 dark:text-white dark:focus:border-zinc-100"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-md bg-zinc-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Gallery</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
