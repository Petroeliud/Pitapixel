import React, { useState } from 'react';
import {
  Star,
  EyeOff,
  Eye,
  Trash2,
  FolderPlus,
  GripVertical,
  Sparkles,
  Loader2,
  Check,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Gallery, Photo, Collection } from '../../types';
import {
  saveGallery,
  savePhoto,
  savePhotosBatch,
  deletePhoto as deletePhotoDb,
} from '../../storage/db';
import { analyzeCoverPhotoFraming } from '../../utils/aiFraming';

interface SortablePhotoCardProps {
  photo: Photo;
  gallery: Gallery;
  onSetCover: (photo: Photo) => void;
  onToggleHide: (photo: Photo) => void;
  onDeletePhoto: (photoId: string) => void;
  onSetCollection: (photo: Photo, collectionId: string | undefined) => void;
  isAiFraming: boolean;
}

const SortablePhotoCard: React.FC<SortablePhotoCardProps> = ({
  photo,
  gallery,
  onSetCover,
  onToggleHide,
  onDeletePhoto,
  onSetCollection,
  isAiFraming,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 30 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  const isCover = gallery.coverPhotoId === photo.id;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex flex-col overflow-hidden rounded-md border bg-white transition-all dark:bg-zinc-900 ${
        photo.hidden
          ? 'border-dashed border-zinc-300 opacity-60 dark:border-zinc-700'
          : isCover
          ? 'ring-2 ring-zinc-900 dark:ring-white border-transparent'
          : 'border-zinc-200 dark:border-zinc-800'
      }`}
    >
      <div className="relative aspect-4/3 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        <img
          src={photo.urls.thumb}
          alt={photo.fileName}
          className="h-full w-full object-cover select-none"
          loading="lazy"
        />

        {/* Drag Handle Overlay */}
        <div
          {...attributes}
          {...listeners}
          title="Drag to reorder"
          className="absolute left-2 top-2 z-20 flex h-7 w-7 cursor-grab items-center justify-center rounded-sm bg-black/60 text-white backdrop-blur-xs transition-opacity hover:bg-black active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </div>

        {/* Cover badge */}
        {isCover && (
          <div className="absolute right-2 top-2 z-20 flex items-center gap-1 rounded-xs bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold text-white uppercase tracking-wider dark:bg-white dark:text-zinc-900 shadow-sm">
            <Star className="h-3 w-3 fill-current" />
            <span>Cover Photo</span>
          </div>
        )}

        {photo.hidden && !isCover && (
          <div className="absolute right-2 top-2 z-20 rounded-xs bg-rose-950/80 px-1.5 py-0.5 text-[9px] font-medium text-rose-200">
            Hidden
          </div>
        )}

        {/* Quick Action Overlay Buttons */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => onSetCover(photo)}
            disabled={isAiFraming}
            title={isCover ? 'Cover Photo (AI Framed)' : 'Set as Cover Photo (with AI head framing)'}
            className={`flex items-center gap-1 rounded-xs px-2.5 py-1.5 text-xs font-medium text-white transition-colors ${
              isCover
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-zinc-900/90 hover:bg-black'
            }`}
          >
            {isAiFraming ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            )}
            <span>{isCover ? 'Re-frame AI' : 'Make Cover'}</span>
          </button>

          <button
            onClick={() => onToggleHide(photo)}
            title={photo.hidden ? 'Show photo to client' : 'Hide from client'}
            className="flex h-8 w-8 items-center justify-center rounded-xs bg-black/70 text-white hover:bg-black"
          >
            {photo.hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>

          <button
            onClick={() => onDeletePhoto(photo.id)}
            title="Delete photo"
            className="flex h-8 w-8 items-center justify-center rounded-xs bg-rose-600/80 text-white hover:bg-rose-700"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Bottom Metadata & Collection Selector */}
      <div className="p-2 space-y-1">
        <div
          className="truncate font-mono text-[10px] text-zinc-600 dark:text-zinc-400"
          title={photo.fileName}
        >
          {photo.fileName}
        </div>

        {gallery.collections.length > 0 && (
          <select
            value={photo.collectionId || ''}
            onChange={(e) => onSetCollection(photo, e.target.value || undefined)}
            className="w-full rounded-xs border border-zinc-200 bg-zinc-50 py-0.5 px-1 text-[10px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300"
          >
            <option value="">No Collection</option>
            {gallery.collections.map((col) => (
              <option key={col.id} value={col.id}>
                {col.name}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
};

interface PhotosManagerProps {
  gallery: Gallery;
  photos: Photo[];
  onPhotosChange: (photos: Photo[]) => void;
  onGalleryChange: (gallery: Gallery) => void;
}

export const PhotosManager: React.FC<PhotosManagerProps> = ({
  gallery,
  photos,
  onPhotosChange,
  onGalleryChange,
}) => {
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [newColName, setNewColName] = useState('');
  const [showAddCollection, setShowAddCollection] = useState(false);
  const [framingPhotoId, setFramingPhotoId] = useState<string | null>(null);
  const [aiStatusMessage, setAiStatusMessage] = useState<string | null>(null);

  // Setup dnd-kit sensors with distance threshold to prevent accidental drags on button clicks
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Reordering handler
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = photos.findIndex((p) => p.id === active.id);
    const newIndex = photos.findIndex((p) => p.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Reorder array
    const reordered = arrayMove(photos, oldIndex, newIndex);

    // Update the 'order' property on each photo
    const updatedWithOrder: Photo[] = reordered.map((photo, index) => ({
      ...photo,
      order: index,
    }));

    // Update parent state immediately for responsive UI
    onPhotosChange(updatedWithOrder);

    // Persist new ordering to local IndexedDB
    try {
      await savePhotosBatch(updatedWithOrder);
    } catch (err) {
      console.error('Failed to persist photo reordering to IndexedDB:', err);
    }
  };

  // Set Cover Photo with AI Smart Head Framing
  const handleSetCover = async (photo: Photo) => {
    try {
      setFramingPhotoId(photo.id);
      setAiStatusMessage('AI analyzing subject framing to keep heads in view...');

      // Run AI head & subject detection
      const framingResult = await analyzeCoverPhotoFraming(
        photo.urls.web || photo.urls.original
      );

      const updatedGallery: Gallery = {
        ...gallery,
        coverPhotoId: photo.id,
        coverFocalPoint: {
          x: framingResult.focalX,
          y: framingResult.focalY,
        },
        coverFramingSummary: framingResult.framingSummary,
      };

      await saveGallery(updatedGallery);
      onGalleryChange(updatedGallery);

      setAiStatusMessage(
        `AI Framed: ${framingResult.framingSummary || 'Subject head aligned at upper third'}`
      );
      setTimeout(() => setAiStatusMessage(null), 4000);
    } catch (err) {
      console.error('Failed to set AI cover:', err);
      // Fallback
      const fallbackGallery: Gallery = {
        ...gallery,
        coverPhotoId: photo.id,
        coverFocalPoint: { x: 50, y: 28 },
      };
      await saveGallery(fallbackGallery);
      onGalleryChange(fallbackGallery);
    } finally {
      setFramingPhotoId(null);
    }
  };

  // Toggle hide photo
  const handleToggleHide = async (photo: Photo) => {
    const updated = { ...photo, hidden: !photo.hidden };
    await savePhoto(updated);
    onPhotosChange(photos.map((p) => (p.id === photo.id ? updated : p)));
  };

  // Delete photo
  const handleDeletePhoto = async (photoId: string) => {
    if (!window.confirm('Delete this photo from the gallery?')) return;
    await deletePhotoDb(photoId, gallery.id);
    onPhotosChange(photos.filter((p) => p.id !== photoId));
  };

  // Assign collection to photo
  const handleSetPhotoCollection = async (photo: Photo, colId: string | undefined) => {
    const updated = { ...photo, collectionId: colId };
    await savePhoto(updated);
    onPhotosChange(photos.map((p) => (p.id === photo.id ? updated : p)));
  };

  // Add new collection
  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;

    const newCol: Collection = {
      id: `col-${Date.now()}`,
      galleryId: gallery.id,
      name: newColName.trim(),
      order: gallery.collections.length + 1,
    };

    const updatedGallery = {
      ...gallery,
      collections: [...gallery.collections, newCol],
    };

    await saveGallery(updatedGallery);
    onGalleryChange(updatedGallery);
    setNewColName('');
    setShowAddCollection(false);
  };

  const filteredPhotos = selectedCollectionId
    ? photos.filter((p) => p.collectionId === selectedCollectionId)
    : photos;

  const coverPhoto = photos.find((p) => p.id === gallery.coverPhotoId) || photos[0];

  return (
    <div className="space-y-6">
      {/* Cover Photo AI Framing Header Banner */}
      {coverPhoto && (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-24 sm:h-20 sm:w-32 shrink-0 overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                <img
                  src={coverPhoto.urls.thumb}
                  alt="Cover"
                  className="h-full w-full object-cover transition-all"
                  style={{
                    objectPosition: gallery.coverFocalPoint
                      ? `${gallery.coverFocalPoint.x}% ${gallery.coverFocalPoint.y}%`
                      : '50% 28%',
                  }}
                />
                <div className="absolute top-1 left-1 rounded-xs bg-zinc-900/90 px-1 py-0.2 text-[8px] font-semibold text-white uppercase">
                  Cover
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white">
                    Cover Photo Framing
                  </h3>
                </div>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {gallery.coverFramingSummary ||
                    'AI framing ensures subject heads and faces remain uncropped across devices.'}
                </p>
                <div className="mt-1 text-[11px] font-mono text-zinc-400">
                  Focal point: {gallery.coverFocalPoint?.x ?? 50}% horizontal,{' '}
                  {gallery.coverFocalPoint?.y ?? 28}% vertical (head line)
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSetCover(coverPhoto)}
                disabled={Boolean(framingPhotoId)}
                className="flex items-center gap-1.5 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              >
                {framingPhotoId ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                )}
                <span>Re-analyze Framing</span>
              </button>
            </div>
          </div>

          {aiStatusMessage && (
            <div className="bg-amber-50 dark:bg-amber-950/40 px-4 py-2 text-xs text-amber-900 dark:text-amber-200 border-t border-amber-200 dark:border-amber-900 flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              <span>{aiStatusMessage}</span>
            </div>
          )}
        </div>
      )}

      {/* Collections Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedCollectionId(null)}
            className={`rounded-sm px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCollectionId === null
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
            }`}
          >
            All Photos ({photos.length})
          </button>

          {gallery.collections.map((col) => {
            const count = photos.filter((p) => p.collectionId === col.id).length;
            return (
              <button
                key={col.id}
                onClick={() => setSelectedCollectionId(col.id)}
                className={`rounded-sm px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCollectionId === col.id
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                }`}
              >
                {col.name} ({count})
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setShowAddCollection((prev) => !prev)}
          className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
        >
          <FolderPlus className="h-3.5 w-3.5" />
          <span>New Collection</span>
        </button>
      </div>

      {/* Add Collection Inline Form */}
      {showAddCollection && (
        <form
          onSubmit={handleCreateCollection}
          className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <input
            type="text"
            required
            value={newColName}
            onChange={(e) => setNewColName(e.target.value)}
            placeholder="Collection name (e.g. Speeches, Golden Hour, Details)"
            className="flex-1 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          />
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Create
          </button>
          <button
            type="button"
            onClick={() => setShowAddCollection(false)}
            className="px-2 py-1.5 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Instructions helper */}
      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span>
          Drag items by the grip icon to reorder photos. Order is saved automatically.
        </span>
        <span className="font-mono text-[11px]">
          {filteredPhotos.length} photos
        </span>
      </div>

      {/* Drag & Drop Sortable Photos Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={filteredPhotos.map((p) => p.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filteredPhotos.map((photo) => (
              <SortablePhotoCard
                key={photo.id}
                photo={photo}
                gallery={gallery}
                onSetCover={handleSetCover}
                onToggleHide={handleToggleHide}
                onDeletePhoto={handleDeletePhoto}
                onSetCollection={handleSetPhotoCollection}
                isAiFraming={framingPhotoId === photo.id}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};
