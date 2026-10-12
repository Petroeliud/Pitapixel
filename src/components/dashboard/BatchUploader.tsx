import React, { useState, useRef } from 'react';
import { Upload, CheckCircle2, Loader2, AlertCircle, RefreshCw, X } from 'lucide-react';
import { Photo } from '../../types';
import { getUploadSignatureApi, uploadPhotoToCloudinary } from '../../lib/api';

interface BatchUploaderProps {
  galleryId: string;
  collectionId?: string;
  currentPhotoCount: number;
  onUploadComplete: (newPhotos: Photo[]) => void;
}

interface UploadTaskItem {
  id: string;
  file: File;
  fileName: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  stageText: string;
  progressPercent: number;
  error?: string;
}

export const BatchUploader: React.FC<BatchUploaderProps> = ({
  galleryId,
  onUploadComplete,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [tasks, setTasks] = useState<UploadTaskItem[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);

  const uploadBatch = async (fileList: File[]) => {
    if (!fileList.length) return;

    const initialTasks: UploadTaskItem[] = fileList.map((file, idx) => ({
      id: `task-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      file,
      fileName: file.name,
      status: 'pending',
      stageText: 'Waiting in queue...',
      progressPercent: 0,
    }));

    setTasks(initialTasks);
    setIsUploading(true);

    try {
      // Fetch signed upload parameters from server
      const signatureData = await getUploadSignatureApi(galleryId);

      let completedCount = 0;
      const CONCURRENCY = 3; // Upload 3 files at a time
      let activeIndex = 0;

      const processTask = async (task: UploadTaskItem) => {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? { ...t, status: 'uploading', stageText: 'Uploading to Cloudinary...', progressPercent: 0 }
              : t
          )
        );

        try {
          await uploadPhotoToCloudinary(task.file, signatureData, (pct) => {
            setTasks((prev) =>
              prev.map((t) =>
                t.id === task.id
                  ? {
                      ...t,
                      progressPercent: pct,
                      stageText: `Uploading (${pct}%)`,
                    }
                  : t
              )
            );
          });

          completedCount++;
          setTasks((prev) =>
            prev.map((t) =>
              t.id === task.id
                ? { ...t, status: 'completed', stageText: 'Saved to Cloudinary', progressPercent: 100 }
                : t
            )
          );
        } catch (err: any) {
          console.error(`Error uploading ${task.fileName}:`, err);
          setTasks((prev) =>
            prev.map((t) =>
              t.id === task.id
                ? {
                    ...t,
                    status: 'error',
                    stageText: 'Upload failed',
                    error: err.message || 'Error uploading file',
                  }
                : t
            )
          );
        } finally {
          const totalPct = Math.round((completedCount / initialTasks.length) * 100);
          setOverallProgress(totalPct);
        }
      };

      // Run concurrency pool of 3 parallel uploads
      const workers = Array.from({ length: Math.min(CONCURRENCY, initialTasks.length) }, async () => {
        while (activeIndex < initialTasks.length) {
          const taskToRun = initialTasks[activeIndex];
          activeIndex++;
          await processTask(taskToRun);
        }
      });

      await Promise.all(workers);

      // Re-fetch gallery from server so Cloudinary list is source of truth
      onUploadComplete([]);
    } catch (err: any) {
      console.error('Failed to initialize upload signature:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const retryFailedTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    await uploadBatch([task.file]);
  };

  const handleFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) =>
      f.type.startsWith('image/')
    );
    if (!fileArray.length) return;
    uploadBatch(fileArray);
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

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const failedCount = tasks.filter((t) => t.status === 'error').length;

  return (
    <div className="w-full space-y-4">
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

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          isUploading
            ? 'border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50 cursor-default opacity-80'
            : isDragging
            ? 'border-zinc-900 bg-zinc-50 dark:border-white dark:bg-zinc-800/50 cursor-pointer'
            : 'border-zinc-200 hover:border-zinc-400 bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 cursor-pointer'
        }`}
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
          <Upload className="h-5 w-5" />
        </div>
        <h3 className="mt-3 text-xs font-semibold text-zinc-900 dark:text-white">
          Drag and drop photos here, or click to browse
        </h3>
        <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
          Direct signed upload to Cloudinary (3 at a time concurrency)
        </p>
      </div>

      {/* Progress & Queue Panel */}
      {tasks.length > 0 && (
        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-3">
          <div className="flex items-center justify-between text-xs font-medium text-zinc-900 dark:text-white pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin text-zinc-700 dark:text-zinc-300" />
              ) : failedCount > 0 ? (
                <AlertCircle className="h-4 w-4 text-amber-500" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              )}
              <span>
                {isUploading
                  ? `Uploading ${tasks.length} photos...`
                  : `Upload completed (${completedCount}/${tasks.length} saved)`}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px] text-zinc-500">
                {overallProgress}%
              </span>
              {!isUploading && (
                <button
                  onClick={() => setTasks([])}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  title="Clear list"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Overall Progress Bar */}
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className={`h-full transition-all duration-200 ${
                failedCount > 0 ? 'bg-amber-500' : 'bg-zinc-900 dark:bg-zinc-100'
              }`}
              style={{ width: `${overallProgress}%` }}
            />
          </div>

          {/* Per-File Status List */}
          <div className="max-h-48 overflow-y-auto space-y-2 pr-1 pt-1 divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="pt-2 first:pt-0 flex items-center justify-between text-xs gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate font-mono text-[11px] text-zinc-800 dark:text-zinc-200">
                    {task.fileName}
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    {task.stageText}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {task.status === 'uploading' ? (
                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-500">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>{task.progressPercent}%</span>
                    </div>
                  ) : task.status === 'completed' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : task.status === 'error' ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => retryFailedTask(task.id)}
                        className="flex items-center gap-1 rounded-xs bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                        title="Retry file"
                      >
                        <RefreshCw className="h-3 w-3" />
                        <span>Retry</span>
                      </button>
                    </div>
                  ) : (
                    <span className="text-[10px] text-zinc-400">Queued</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
