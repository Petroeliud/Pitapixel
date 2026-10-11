import React, { useState, useRef } from 'react';
import { Upload, CheckCircle2, Loader2, ImagePlus } from 'lucide-react';
import { Photo } from '../../types';
import { processUploadedPhoto } from '../../utils/imageProcessing';
import { savePhotosBatch } from '../../storage/db';

interface BatchUploaderProps {
  galleryId: string;
  collectionId?: string;
  currentPhotoCount: number;
  onUploadComplete: (newPhotos: Photo[]) => void;
}

export const BatchUploader: React.FC<BatchUploaderProps> = ({
  galleryId,
  collectionId,
  currentPhotoCount,
  onUploadComplete,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [currentFileName, setCurrentFileName] = useState('');

  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) =>
      f.type.startsWith('image/')
    );
    if (!fileArray.length) return;

    setIsProcessing(true);
    setTotalFiles(fileArray.length);
    setProcessedCount(0);

    const createdPhotos: Photo[] = [];

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      setCurrentFileName(file.name);

      try {
        const processed = await processUploadedPhoto(file);
        const photo: Photo = {
          id: `photo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          galleryId,
          collectionId,
          fileName: processed.fileName,
          urls: processed.urls,
          width: processed.width,
          height: processed.height,
          aspectRatio: processed.aspectRatio,
          order: currentPhotoCount + i,
          createdAt: new Date().toISOString(),
        };

        createdPhotos.push(photo);
      } catch (err) {
        console.error(`Error processing file ${file.name}:`, err);
      }

      setProcessedCount(i + 1);
    }

    if (createdPhotos.length > 0) {
      await savePhotosBatch(createdPhotos);
      onUploadComplete(createdPhotos);
    }

    setIsProcessing(false);
    setProcessedCount(0);
    setTotalFiles(0);
    setCurrentFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
        }}
      />

      {!isProcessing ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-zinc-900 bg-zinc-50 dark:border-white dark:bg-zinc-800/50'
              : 'border-zinc-200 hover:border-zinc-400 bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700'
          }`}
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
            <Upload className="h-5 w-5" />
          </div>
          <h3 className="mt-3 text-xs font-semibold text-zinc-900 dark:text-white">
            Drag and drop photos here, or click to browse
          </h3>
          <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
            Supports JPEG, PNG, WebP. Generates mobile thumbnails and web previews automatically.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between text-xs font-medium text-zinc-900 dark:text-white">
            <div className="flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-600 dark:text-zinc-300" />
              <span>Optimizing {currentFileName}...</span>
            </div>
            <span className="font-mono tabular-nums text-zinc-500">
              {processedCount} of {totalFiles}
            </span>
          </div>

          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className="h-full bg-zinc-900 transition-all duration-200 dark:bg-zinc-100"
              style={{
                width: `${totalFiles > 0 ? (processedCount / totalFiles) * 100 : 0}%`,
              }}
            />
          </div>

          <p className="mt-2 text-[11px] text-zinc-400">
            Resizing in browser (original resolution preserved).
          </p>
        </div>
      )}
    </div>
  );
};
