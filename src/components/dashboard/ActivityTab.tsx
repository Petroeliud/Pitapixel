import React, { useState, useEffect } from 'react';
import { Copy, Check, Eye, Download, Heart, Clock } from 'lucide-react';
import { Gallery, Photo, ActivityEvent } from '../../types';
import { getActivities, getFavorites } from '../../storage/db';

interface ActivityTabProps {
  gallery: Gallery;
  photos: Photo[];
}

export const ActivityTab: React.FC<ActivityTabProps> = ({ gallery, photos }) => {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [favoritePhotoIds, setFavoritePhotoIds] = useState<string[]>([]);
  const [copiedFormat, setCopiedFormat] = useState<'comma' | 'newline' | null>(null);

  useEffect(() => {
    getActivities(gallery.id).then(setActivities);
    getFavorites(gallery.id).then(setFavoritePhotoIds);
  }, [gallery.id]);

  const favoritedPhotos = photos.filter((p) => favoritePhotoIds.includes(p.id));

  const handleCopyFileNames = (format: 'comma' | 'newline') => {
    const names = favoritedPhotos.map((p) => p.fileName);
    const text = format === 'comma' ? names.join(', ') : names.join('\n');
    navigator.clipboard.writeText(text);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* 1. Metric Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Total Views
            </span>
            <Eye className="h-4 w-4 text-zinc-400" />
          </div>
          <div className="mt-2 text-2xl font-semibold font-mono tabular-nums text-zinc-900 dark:text-white">
            {gallery.viewCount}
          </div>
          <p className="mt-1 text-[11px] text-zinc-400">
            Client visits via shared link
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Downloads
            </span>
            <Download className="h-4 w-4 text-zinc-400" />
          </div>
          <div className="mt-2 text-2xl font-semibold font-mono tabular-nums text-zinc-900 dark:text-white">
            {gallery.downloadCount}
          </div>
          <p className="mt-1 text-[11px] text-zinc-400">
            Individual & batch ZIP downloads
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Favorited Photos
            </span>
            <Heart className="h-4 w-4 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-semibold font-mono tabular-nums text-zinc-900 dark:text-white">
            {favoritedPhotos.length}
          </div>
          <p className="mt-1 text-[11px] text-zinc-400">
            Hearted by client for album review
          </p>
        </div>
      </div>

      {/* 2. Client Favorites & Export */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
              Client's Selected Favorites ({favoritedPhotos.length})
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Export file names directly for Lightroom or Capture One search filtering
            </p>
          </div>

          {favoritedPhotos.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopyFileNames('comma')}
                className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                {copiedFormat === 'comma' ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                <span>Copy as comma list</span>
              </button>

              <button
                onClick={() => handleCopyFileNames('newline')}
                className="flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              >
                {copiedFormat === 'newline' ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                <span>Copy file names</span>
              </button>
            </div>
          )}
        </div>

        {favoritedPhotos.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-400">
            Client has not favorited any photos in this gallery yet.
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {favoritedPhotos.map((photo) => (
              <div
                key={photo.id}
                className="group relative overflow-hidden rounded-md border border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="aspect-4/3 w-full overflow-hidden">
                  <img
                    src={photo.urls.thumb}
                    alt={photo.fileName}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-2">
                  <p className="truncate font-mono text-[10px] text-zinc-600 dark:text-zinc-400" title={photo.fileName}>
                    {photo.fileName}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Activity History Feed */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white pb-4 border-b border-zinc-100 dark:border-zinc-800">
          Activity Log
        </h3>

        {activities.length === 0 ? (
          <div className="py-6 text-center text-xs text-zinc-400">
            No activity recorded yet.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {activities.map((act) => (
              <div
                key={act.id}
                className="flex items-start justify-between py-2 text-xs border-b border-zinc-50 dark:border-zinc-800/50 last:border-none"
              >
                <div className="flex items-center gap-2.5">
                  <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {act.type === 'view' ? (
                      <Eye className="h-3 w-3" />
                    ) : act.type === 'download' ? (
                      <Download className="h-3 w-3" />
                    ) : act.type === 'favorite' ? (
                      <Heart className="h-3 w-3 text-rose-500" />
                    ) : (
                      <Clock className="h-3 w-3" />
                    )}
                  </div>
                  <div>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200 capitalize">
                      {act.type === 'selection_sent' ? 'Selection Received' : act.type}
                    </span>
                    {act.details && (
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {act.details}
                      </p>
                    )}
                  </div>
                </div>

                <span className="font-mono text-[10px] text-zinc-400 shrink-0">
                  {new Date(act.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {' · '}
                  {new Date(act.timestamp).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
