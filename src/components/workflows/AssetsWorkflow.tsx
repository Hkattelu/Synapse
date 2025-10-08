import React, { useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTimeline, useMediaAssets } from '../../state/hooks';
import { useNotifications } from '../../state/notifications';
import { getEducationalTrackByName } from '../../lib/educationalTypes';
import { ContextualHelp } from './ContextualHelp';

interface AssetsWorkflowProps {
  isOpen: boolean;
  onClose: () => void;
  onAssetsAdded: () => void;
}

interface AssetCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  acceptedTypes: string[];
  targetTrack: 'Visual' | 'Narration';
  examples: string[];
}

const ASSET_CATEGORIES: AssetCategory[] = [
  {
    id: 'images',
    name: 'Images & Graphics',
    description: 'Photos, illustrations, diagrams, and visual aids',
    targetTrack: 'Visual',
    acceptedTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ],
    icon: (
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
    ),
    examples: [
      'Screenshots and diagrams',
      'Code architecture illustrations',
      'Process flow charts',
      'Before/after comparisons',
      'UI mockups and designs',
    ],
  },
  {
    id: 'audio',
    name: 'Audio Files',
    description: 'Background music, sound effects, and audio clips',
    targetTrack: 'Narration',
    acceptedTypes: [
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/mp4',
      'audio/webm',
    ],
    icon: (
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
          d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
        />
      </svg>
    ),
    examples: [
      'Background music tracks',
      'Transition sound effects',
      'Notification sounds',
      'Ambient audio',
      'Voice recordings',
    ],
  },
  {
    id: 'documents',
    name: 'Documents & Files',
    description: 'PDFs, presentations, and reference materials',
    targetTrack: 'Visual',
    acceptedTypes: [
      'application/pdf',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ],
    icon: (
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
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
    examples: [
      'Course slides and presentations',
      'Reference documentation',
      'Cheat sheets and guides',
      'Exercise worksheets',
      'Resource PDFs',
    ],
  },
  {
    id: 'animations',
    name: 'Animations & GIFs',
    description: 'Animated graphics and motion elements',
    targetTrack: 'Visual',
    acceptedTypes: ['image/gif', 'video/webm', 'video/mp4'],
    icon: (
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
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
    examples: [
      'Loading animations',
      'Process demonstrations',
      'UI interaction examples',
      'Concept illustrations',
      'Transition effects',
    ],
  },
];

interface UploadedAsset {
  file: File;
  category: AssetCategory;
  title: string;
  description: string;
  duration: number;
}

export function AssetsWorkflow({
  isOpen,
  onClose,
  onAssetsAdded,
}: AssetsWorkflowProps) {
  const { addTimelineItem } = useTimeline();
  const { addMediaAsset } = useMediaAssets();
  const { notify } = useNotifications();

  const [selectedCategory, setSelectedCategory] =
    useState<AssetCategory | null>(null);
  const [uploadedAssets, setUploadedAssets] = useState<UploadedAsset[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelection = useCallback((category: AssetCategory) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.accept = category.acceptedTypes.join(',');

    fileInput.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        const newAssets: UploadedAsset[] = Array.from(files).map((file) => ({
          file,
          category,
          title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
          description: '',
          duration: category.id === 'audio' ? 30 : 5, // Default durations
        }));

        setUploadedAssets((prev) => [...prev, ...newAssets]);
        setSelectedCategory(null);
      }
    };

    fileInput.click();
  }, []);

  // Update asset details
  const updateAsset = useCallback(
    (index: number, updates: Partial<UploadedAsset>) => {
      setUploadedAssets((prev) =>
        prev.map((asset, i) => (i === index ? { ...asset, ...updates } : asset))
      );
    },
    []
  );

  // Remove asset
  const removeAsset = useCallback((index: number) => {
    setUploadedAssets((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Add assets to timeline
  const addAssetsToTimeline = useCallback(async () => {
    if (uploadedAssets.length === 0) return;

    setIsProcessing(true);

    try {
      // Add each asset individually
      uploadedAssets.forEach((asset) => {
        const targetTrack = getEducationalTrackByName(
          asset.category.targetTrack
        );
        if (!targetTrack) return;

        const mediaAsset = {
          name: asset.title,
          type:
            asset.category.id === 'audio'
              ? ('audio' as const)
              : asset.category.id === 'images' ||
                  asset.category.id === 'animations'
                ? ('image' as const)
                : ('video' as const),
          url: URL.createObjectURL(asset.file),
          duration: asset.duration,
          metadata: {
            fileSize: asset.file.size,
            mimeType: asset.file.type,
            originalFileName: asset.file.name,
            description: asset.description,
            category: asset.category.id,
          },
        };

        const assetId = addMediaAsset(mediaAsset);

        addTimelineItem({
          assetId,
          startTime: 0,
          duration: asset.duration,
          track: targetTrack.trackNumber,
          type: asset.category.id === 'audio' ? 'audio' : 'video',
          properties: {
            ...targetTrack.defaultProperties,
            title: asset.title,
            description: asset.description,
          },
          animations: [],
          keyframes: [],
        });
      });

      notify({
        type: 'success',
        title: 'Assets Added',
        message: `${uploadedAssets.length} asset(s) added to timeline`,
      });

      onAssetsAdded();
      onClose();

      // Reset
      setUploadedAssets([]);
      setSelectedCategory(null);
    } catch (error) {
      notify({
        type: 'error',
        title: 'Upload Failed',
        message: 'Failed to add assets to timeline',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [
    uploadedAssets,
    addMediaAsset,
    addTimelineItem,
    notify,
    onAssetsAdded,
    onClose,
  ]);

  if (!isOpen) return null;

const modal = (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-amber-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <svg
              className="w-6 h-6 text-white"
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
            <h2 className="text-xl font-bold text-white">
              Add Educational Assets
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <svg
              className="w-6 h-6"
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

        <div className="flex h-[600px]">
          {/* Categories Sidebar */}
          <div className="w-80 bg-gray-700 border-r border-gray-600 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-lg font-semibold text-white mb-4">
                Asset Categories
              </h3>
              <div className="space-y-3">
                {ASSET_CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleFileSelection(category)}
                    className="w-full text-left p-4 bg-gray-600 border border-gray-500 rounded-lg hover:bg-gray-500 transition-all group"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="text-amber-400 group-hover:text-amber-300 transition-colors">
                        {category.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-medium mb-1">
                          {category.name}
                        </h4>
                        <p className="text-gray-300 text-sm mb-2">
                          {category.description}
                        </p>
                        <div className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded inline-block">
                          → {category.targetTrack} Track
                        </div>
                      </div>
                    </div>

                    {/* Examples */}
                    <div className="mt-3 pt-3 border-t border-gray-500">
                      <div className="text-xs text-gray-400 mb-1">
                        Examples:
                      </div>
                      <ul className="text-xs text-gray-300 space-y-1">
                        {category.examples.slice(0, 3).map((example, index) => (
                          <li
                            key={index}
                            className="flex items-center space-x-1"
                          >
                            <div className="w-1 h-1 bg-amber-400 rounded-full"></div>
                            <span>{example}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </button>
                ))}
              </div>

              {/* Contextual Help */}
              <div className="mt-6">
                <ContextualHelp type="assets" />
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {uploadedAssets.length === 0 ? (
              /* Empty State */
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <svg
                    className="w-16 h-16 text-gray-500 mx-auto mb-4"
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
                  <h3 className="text-lg font-medium text-gray-300 mb-2">
                    No Assets Selected
                  </h3>
                  <p className="text-gray-400 mb-4">
                    Choose a category from the sidebar to upload educational
                    assets
                  </p>
                  <div className="text-sm text-gray-500">
                    Supported formats: Images, Audio, Documents, Animations
                  </div>
                </div>
              </div>
            ) : (
              /* Asset List */
              <div className="flex-1 overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white">
                    Selected Assets ({uploadedAssets.length})
                  </h3>
                  <button
                    onClick={() => setUploadedAssets([])}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Clear All
                  </button>
                </div>

                <div className="space-y-4">
                  {uploadedAssets.map((asset, index) => (
                    <div
                      key={index}
                      className="bg-gray-700 rounded-lg p-4 border border-gray-600"
                    >
                      <div className="flex items-start space-x-4">
                        {/* Asset Icon */}
                        <div className="text-amber-400 flex-shrink-0">
                          {asset.category.icon}
                        </div>

                        {/* Asset Details */}
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-white">
                                {asset.file.name}
                              </span>
                              <span className="text-xs px-2 py-1 bg-gray-600 text-gray-300 rounded">
                                {asset.category.name}
                              </span>
                            </div>
                            <button
                              onClick={() => removeAsset(index)}
                              className="text-gray-400 hover:text-red-400 transition-colors"
                            >
                              <svg
                                className="w-4 h-4"
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

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-300 mb-1">
                                Title
                              </label>
                              <input
                                type="text"
                                value={asset.title}
                                onChange={(e) =>
                                  updateAsset(index, { title: e.target.value })
                                }
                                className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-300 mb-1">
                                Duration (seconds)
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="300"
                                value={asset.duration}
                                onChange={(e) =>
                                  updateAsset(index, {
                                    duration: parseInt(e.target.value) || 5,
                                  })
                                }
                                className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-300 mb-1">
                              Description (optional)
                            </label>
                            <input
                              type="text"
                              value={asset.description}
                              onChange={(e) =>
                                updateAsset(index, {
                                  description: e.target.value,
                                })
                              }
                              placeholder="Brief description of this asset's purpose"
                              className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                          </div>

                          <div className="flex items-center justify-between text-xs text-gray-400">
                            <span>
                              Size: {(asset.file.size / 1024 / 1024).toFixed(2)}{' '}
                              MB
                            </span>
                            <span>
                              Target: {asset.category.targetTrack} Track
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            {uploadedAssets.length > 0 && (
              <div className="bg-gray-700 px-6 py-4 border-t border-gray-600 flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  {uploadedAssets.length} asset(s) ready to add
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addAssetsToTimeline}
                    disabled={isProcessing}
                    className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isProcessing ? 'Adding...' : 'Add to Timeline'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
