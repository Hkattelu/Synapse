import React, { useCallback, useRef, useState } from 'react';
import { useMediaAssets, useTimeline } from '../state/hooks';
import { useNotifications } from '../state/notifications';
import { validateMediaAsset } from '../lib/validation';
import { RecorderDialog } from './RecorderDialog';
import { AudioWaveform } from './Waveform';
import type { MediaAsset, MediaAssetType } from '../lib/types';

interface MediaBinProps {
  className?: string;
}

interface FileUploadError {
  file: string;
  message: string;
}

const SUPPORTED_FILE_TYPES = {
  video: ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov'],
  image: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ],
  audio: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/flac'],
} as const;

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export function MediaBin({ className = '' }: MediaBinProps) {
  const { mediaAssets, addMediaAsset, removeMediaAsset } = useMediaAssets();
  const [recorderOpen, setRecorderOpen] = useState(false);
  const { addTimelineItem } = useTimeline();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<FileUploadError[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { notify } = useNotifications();

  // Determine media type from MIME type
  const getMediaType = (mimeType: string): MediaAssetType | null => {
    if (SUPPORTED_FILE_TYPES.video.includes(mimeType as any)) return 'video';
    if (SUPPORTED_FILE_TYPES.image.includes(mimeType as any)) return 'image';
    if (SUPPORTED_FILE_TYPES.audio.includes(mimeType as any))
      return 'audio';
    return null;
  };

  // Validate file before upload
  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds 100MB limit`;
    }

    const mediaType = getMediaType(file.type);
    if (!mediaType) {
      return `Unsupported file type: ${file.type}`;
    }

    return null;
  };

  // Generate thumbnail for media assets
  const generateThumbnail = async (
    file: File,
    type: MediaAssetType
  ): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (type === 'image') {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => resolve(undefined);
        reader.readAsDataURL(file);
      } else if (type === 'video') {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        video.onloadedmetadata = () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          video.currentTime = Math.min(1, video.duration / 2); // Seek to middle or 1 second
        };

        video.onseeked = () => {
          if (ctx) {
            ctx.drawImage(video, 0, 0);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          } else {
            resolve(undefined);
          }
          URL.revokeObjectURL(video.src);
        };

        video.onerror = () => {
          resolve(undefined);
          URL.revokeObjectURL(video.src);
        };

        video.src = URL.createObjectURL(file);
        video.load();
      } else {
        resolve(undefined);
      }
    });
  };

  // Get media duration for video/audio files
  const getMediaDuration = async (
    file: File,
    type: MediaAssetType
  ): Promise<number | undefined> => {
    return new Promise((resolve) => {
      if (type === 'video') {
        const video = document.createElement('video');
        video.onloadedmetadata = () => {
          resolve(video.duration);
          URL.revokeObjectURL(video.src);
        };
        video.onerror = () => {
          resolve(undefined);
          URL.revokeObjectURL(video.src);
        };
        video.src = URL.createObjectURL(file);
        video.load();
      } else if (type === 'audio') {
        const audio = document.createElement('audio');
        audio.onloadedmetadata = () => {
          resolve(audio.duration);
          URL.revokeObjectURL(audio.src);
        };
        audio.onerror = () => {
          resolve(undefined);
          URL.revokeObjectURL(audio.src);
        };
        audio.src = URL.createObjectURL(file);
        audio.load();
      } else {
        resolve(undefined);
      }
    });
  };

  // Process and upload files
  const processFiles = async (files: FileList) => {
    setIsUploading(true);
    setUploadErrors([]);
    const errors: FileUploadError[] = [];

    for (const file of Array.from(files)) {
      try {
        // Validate file
        const validationError = validateFile(file);
        if (validationError) {
          errors.push({ file: file.name, message: validationError });
          continue;
        }

        const mediaType = getMediaType(file.type)!;

        // Create object URL for the file
        const url = URL.createObjectURL(file);

        // Generate thumbnail and get duration
        const [thumbnail, duration] = await Promise.all([
          generateThumbnail(file, mediaType),
          getMediaDuration(file, mediaType),
        ]);

        // Warn if metadata could not be extracted
        if ((mediaType === 'video' || mediaType === 'audio') && duration === undefined) {
          notify({ type: 'warning', title: 'Metadata', message: `Could not read duration for ${file.name}. Using defaults.` });
        }
        if (mediaType === 'video' && !thumbnail) {
          notify({ type: 'warning', title: 'Thumbnail', message: `Could not generate thumbnail for ${file.name}.` });
        }

        // Create media asset
        const mediaAsset: Omit<MediaAsset, 'id' | 'createdAt'> = {
          name: file.name,
          type: mediaType,
          url,
          duration,
          thumbnail,
          metadata: {
            fileSize: file.size,
            mimeType: file.type,
          },
        };

        // Validate the media asset
        const validation = validateMediaAsset({
          ...mediaAsset,
          id: 'temp',
          createdAt: new Date(),
        });

        if (!validation.isValid) {
          errors.push({
            file: file.name,
            message: validation.errors.map((e) => e.message).join(', '),
          });
          URL.revokeObjectURL(url);
          continue;
        }

        // Add to media assets
        addMediaAsset(mediaAsset);
        notify({ type: 'success', title: 'Imported', message: `${file.name} added to Media Bin` });
      } catch (error) {
        errors.push({
          file: file.name,
          message:
            error instanceof Error ? error.message : 'Unknown error occurred',
        });
      }
    }

    setUploadErrors(errors);
    if (errors.length) {
      notify({ type: 'error', title: 'Import Issues', message: `${errors.length} file(s) had problems during import.` });
    }
    setIsUploading(false);
  };

  // Handle file input change
  const handleFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        processFiles(files);
      }
      // Reset input value to allow selecting the same file again
      event.target.value = '';
    },
    []
  );

  // Handle drag and drop
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);

    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  }, []);

  // Handle drag start for timeline drop
  const handleDragStart = useCallback(
    (event: React.DragEvent, asset: MediaAsset) => {
      event.dataTransfer.setData('application/json', asset.id);
      event.dataTransfer.effectAllowed = 'copy';
    },
    []
  );

  // Handle double-click to add to timeline
  const handleDoubleClick = useCallback(
    (asset: MediaAsset) => {
      if (asset.type === 'code') {
        // For code assets, create a code timeline item
        addTimelineItem({
          assetId: asset.id,
          startTime: 0,
          duration: 10, // Default 10 seconds for code clips
          track: 0,
          type: 'code',
          properties: {
            text: asset.metadata.codeContent || '// Your code here',
            language: asset.metadata.language || 'javascript',
            theme: 'dark',
            fontSize: 16,
          },
          animations: [],
          keyframes: [],
        });
      } else {
        addTimelineItem({
          assetId: asset.id,
          startTime: 0,
          duration: asset.duration || 5, // Default 5 seconds for images
          track: 0,
          type: asset.type === 'image' ? 'video' : asset.type, // Images become video clips
          properties: {},
          animations: [],
          keyframes: [],
        });
      }
    },
    [addTimelineItem]
  );

  // Create a new code clip
  const createCodeClip = useCallback(() => {
    const codeAsset: Omit<MediaAsset, 'id' | 'createdAt'> = {
      name: `Code Clip ${mediaAssets.filter((a) => a.type === 'code').length + 1}`,
      type: 'code',
      url: '', // Code clips don't need URLs
      duration: 10, // Default 10 seconds
      metadata: {
        fileSize: 0,
        mimeType: 'text/plain',
        codeContent: '// Your code here\nconsole.log("Hello, World!");',
        language: 'javascript',
      },
    };

    addMediaAsset(codeAsset);
  }, [addMediaAsset, mediaAssets]);

  // Create a new title clip
  const createTitleClip = useCallback(() => {
    const titleAsset: Omit<MediaAsset, 'id' | 'createdAt'> = {
      name: `Title ${mediaAssets.filter((a) => a.metadata.mimeType === 'text/title').length + 1}`,
      type: 'code', // We use 'code' type for title assets to avoid creating a new asset type
      url: '', // Title clips don't need URLs
      duration: 5, // Default 5 seconds
      metadata: {
        fileSize: 0,
        mimeType: 'text/title', // Special mime type to distinguish title clips
        codeContent: 'Your Title Text',
        language: 'title',
      },
    };

    addMediaAsset(titleAsset);
  }, [addMediaAsset, mediaAssets]);

  // Open file dialog
  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`flex flex-col h-full bg-background-secondary ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-border-subtle">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-text-secondary uppercase tracking-wide">
            Media Bin
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setRecorderOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium py-1 px-3 rounded transition-colors shadow-glow"
              title="Record audio narration or camera"
            >
              Record
            </button>
            <button
              onClick={openFileDialog}
              className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium py-1 px-3 rounded transition-colors shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Add Media'}
            </button>
            <button
              onClick={createCodeClip}
              className="bg-accent-green hover:bg-accent-green/80 text-white text-xs font-medium py-1 px-3 rounded transition-colors"
              title="Create a new code clip"
            >
              Add Code
            </button>
            <button
              onClick={createTitleClip}
              className="bg-accent-mauve hover:bg-accent-mauve/80 text-white text-xs font-medium py-1 px-3 rounded transition-colors"
              title="Create a new title clip"
            >
              Add Title
            </button>
          </div>
        </div>

        {/* Upload errors */}
        {uploadErrors.length > 0 && (
          <div className="mt-3 space-y-1">
            {uploadErrors.map((error, index) => (
              <div
                key={index}
                className="text-xs text-status-error bg-status-error/10 p-2 rounded border border-status-error/20"
              >
                <strong>{error.file}:</strong> {error.message}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* File input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={[
          ...SUPPORTED_FILE_TYPES.video,
          ...SUPPORTED_FILE_TYPES.image,
          ...SUPPORTED_FILE_TYPES.audio,
        ].join(',')}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {mediaAssets.length === 0 ? (
          /* Empty state with drag and drop */
          <div
            className={`h-full flex items-center justify-center border-2 border-dashed transition-colors ${
              isDragOver
                ? 'border-primary-500 bg-primary-500/10'
                : 'border-border-subtle hover:border-neutral-500'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-background-tertiary rounded-lg mx-auto mb-4 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-text-tertiary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <p className="text-text-primary font-medium mb-2">
                No Media Assets
              </p>
              <p className="text-text-secondary text-sm mb-4">
                Drag and drop files here or click "Add Media" to upload
              </p>
              <p className="text-text-tertiary text-xs">
                Supports video, image, and audio files up to 100MB
              </p>
            </div>
          </div>
        ) : (
          /* Media assets grid */
          <div
            className={`p-4 transition-colors ${
              isDragOver ? 'bg-primary-500/10' : ''
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="grid grid-cols-2 gap-3">
              {mediaAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="bg-background-tertiary rounded-lg overflow-hidden hover:bg-neutral-700 transition-colors cursor-pointer group border border-border-subtle hover:border-neutral-600"
                  draggable
                  onDragStart={(e) => handleDragStart(e, asset)}
                  onDoubleClick={() => handleDoubleClick(asset)}
                  title="Double-click to add to timeline, or drag to timeline"
                >
                  {/* Thumbnail */}
                  <div className="aspect-video bg-background-primary flex items-center justify-center relative">
                    {asset.thumbnail ? (
                      <img
                        src={asset.thumbnail}
                        alt={asset.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-text-tertiary">
                        {asset.type === 'video' && (
                          <svg
                            className="w-8 h-8"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        )}
                        {asset.type === 'image' && (
                          <svg
                            className="w-8 h-8"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        )}
                        {asset.type === 'audio' && (
                          <AudioWaveform src={asset.url} />
                        )}
                        {asset.type === 'code' && (
                          <div className="text-center">
                            <svg
                              className="w-8 h-8 mx-auto mb-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                              />
                            </svg>
                            <div className="text-xs font-mono bg-background-tertiary px-2 py-1 rounded">
                              {asset.metadata.language || 'js'}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Duration overlay */}
                    {asset.duration && (
                      <div className="absolute bottom-1 right-1 bg-background-primary/80 text-text-primary text-xs px-1 rounded">
                        {formatDuration(asset.duration)}
                      </div>
                    )}

                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeMediaAsset(asset.id);
                        if (asset.url.startsWith('blob:')) {
                          URL.revokeObjectURL(asset.url);
                        }
                      }}
                      className="absolute top-1 right-1 bg-status-error hover:bg-status-error/80 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove asset"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Asset info */}
                  <div className="p-2">
                    <p
                      className="text-sm font-medium text-text-primary truncate"
                      title={asset.name}
                    >
                      {asset.name}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-text-tertiary uppercase">
                        {asset.type}
                      </span>
                      <span className="text-xs text-text-tertiary">
                        {formatFileSize(asset.metadata.fileSize)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {recorderOpen && (
        <RecorderDialog isOpen={recorderOpen} onClose={() => setRecorderOpen(false)} />
      )}
    </div>
  );
}
