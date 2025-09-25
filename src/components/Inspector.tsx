import React, { useState, useCallback } from 'react';
import { useTimeline, useMediaAssets } from '../state/hooks';
import { validateItemProperties } from '../lib/validation';
import { PresetSelector } from './animation/PresetSelector';
import {
  getApplicablePresets,
  getRecommendedPresetsFor,
} from '../remotion/animations/presets';
import * as animationPresetsModule from '../lib/animationPresets';
import { VisualControlsTabs } from './ui/VisualControlsTabs';
import { BackgroundPicker } from './ui/BackgroundPicker';
import { themeManager } from '../lib/themes';
import {
  detectLanguageFromCode,
  getCodeLanguageDefaults,
  getEducationalTrackByNumber,
} from '../lib/educationalTypes';
import type {
  TimelineItem,
  ItemProperties,
  AnimationPreset,
} from '../lib/types';

interface InspectorProps {
  className?: string;
}

export function Inspector({ className = '' }: InspectorProps) {
  const { selectedTimelineItems, updateTimelineItem } = useTimeline();
  const { getMediaAssetById } = useMediaAssets();
  const [activeTab, setActiveTab] = useState<
    'properties' | 'visual' | 'layout'
  >('properties');

  // Get the first selected item (for now, we'll handle single selection)
  const selectedItem = selectedTimelineItems[0];
  const selectedAsset = selectedItem
    ? getMediaAssetById(selectedItem.assetId)
    : undefined;

  if (!selectedItem) {
    return (
      <div
        className={`inspector bg-background-secondary flex flex-col h-full max-h-[calc(100vh-12rem)] ${className}`}
      >
        <div className="p-4 border-b border-border-subtle flex-shrink-0">
          <h3 className="font-semibold text-sm text-text-primary uppercase tracking-wide">
            Inspector
          </h3>
        </div>
        <div className="flex-1 p-4 min-h-0">
          <div className="h-full flex items-center justify-center text-text-secondary">
            <div className="text-center">
              <div className="w-12 h-12 bg-background-tertiary rounded-lg mx-auto mb-3 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-text-tertiary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <p className="font-medium text-text-primary">No Selection</p>
              <p className="text-sm text-text-secondary">
                Select a clip to edit properties
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Animation tab removed for now; presets still accessible via properties where relevant
  const hasAnimationPresets = false;

  return (
    <div
      className={`inspector bg-background-secondary flex flex-col h-full max-h-[calc(100vh-12rem)] ${className}`}
    >
      {/* Simplified Header */}
      <div className="p-3 border-b border-border-subtle flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-text-primary">Inspector</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-secondary bg-background-tertiary px-2 py-1 rounded">
              {selectedItem.type.toUpperCase()}
            </span>
            {(() => {
              const track = getEducationalTrackByNumber(selectedItem.track);
              return track ? (
                <div className="flex items-center gap-1">
                  <span
                    className="text-xs px-2 py-1 rounded text-synapse-text-inverse font-medium"
                    title={`Educational Track: ${track.name} - ${track.allowedContentTypes.join(', ')} content`}
                    style={{ backgroundColor: track.color }}
                  >
                    {track.name}
                  </span>
                  {/* Educational track icon */}
                  <div
                    className="text-xs text-text-tertiary"
                    title={`Track ${track.trackNumber + 1}`}
                  >
                    {track.icon === 'code' && '💻'}
                    {track.icon === 'monitor' && '🖥️'}
                    {track.icon === 'mic' && '🎤'}
                    {track.icon === 'user' && '👤'}
                  </div>
                </div>
              ) : (
                <span className="text-xs text-text-tertiary bg-background-tertiary px-2 py-1 rounded">
                  Track {selectedItem.track + 1}
                </span>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Simplified Tab Navigation */}
      <div className="border-b border-border-subtle bg-background-tertiary">
        <div className="flex">
          <button
            onClick={() => setActiveTab('properties')}
            className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === 'properties'
                ? 'text-text-primary bg-synapse-surface border-b-2 border-synapse-primary'
                : 'text-text-secondary hover:text-text-primary hover:bg-synapse-surface-hover'
            }`}
          >
            Properties
          </button>

          {/* Visual tab hidden for code and audio items */}
          {selectedItem.type !== 'code' && selectedItem.type !== 'audio' && (
            <button
              onClick={() => setActiveTab('visual')}
              className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === 'visual'
                  ? 'text-text-primary bg-synapse-surface border-b-2 border-synapse-primary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-synapse-surface-hover'
              }`}
            >
              Visual
            </button>
          )}

          {/* Layout tab hidden for audio items */}
          {selectedItem.type !== 'audio' && (
            <button
              onClick={() => setActiveTab('layout')}
              className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === 'layout'
                  ? 'text-text-primary bg-synapse-surface border-b-2 border-synapse-primary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-synapse-surface-hover'
              }`}
            >
              Layout
            </button>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {activeTab === 'properties' && (
          <>
            {/* Subtle hover tip for Code track (replaces bulky hint) */}
            {(() => {
              const track = getEducationalTrackByNumber(selectedItem.track);
              if (track?.name === 'Code') {
                const tip =
                  'Code Track Tips:\n• Use typing animation for step-by-step explanations\n• Enable line numbers for better reference\n• Choose a readable theme';
                return (
                  <div className="px-4 py-2 border-b border-border-subtle text-xs text-text-secondary">
                    <span
                      role="img"
                      aria-label="tip"
                      title={tip}
                      className="cursor-help"
                    >
                      💡 Code track tips (hover)
                    </span>
                  </div>
                );
              }
              return null;
            })()}

            {/* Main properties (code, media, etc.) */}
            <ClipProperties
              mode="properties"
              item={selectedItem}
              onUpdateProperties={(properties) =>
                updateTimelineItem(selectedItem.id, { properties })
              }
            />

            {/* Move Clip Information to bottom */}
            <ClipMetadata item={selectedItem} asset={selectedAsset} />
          </>
        )}

        {activeTab === 'visual' && selectedItem.type !== 'code' && selectedItem.type !== 'audio' && (
          <VisualControlsTabs
            item={selectedItem}
            onUpdateProperties={(properties) =>
              updateTimelineItem(selectedItem.id, {
                properties: { ...selectedItem.properties, ...properties },
              })
            }
          />
        )}

        {activeTab === 'layout' && selectedItem.type !== 'audio' && (
          <ClipProperties
            mode="layout"
            item={selectedItem}
            onUpdateProperties={(properties) =>
              updateTimelineItem(selectedItem.id, { properties })
            }
          />
        )}
      </div>
    </div>
  );
}

interface ClipMetadataProps {
  item: TimelineItem;
  asset: any; // MediaAsset | undefined
}

function ClipMetadata({ item, asset }: ClipMetadataProps) {
  const { updateMediaAsset } = useMediaAssets();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isRelinking, setIsRelinking] = useState(false);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round((seconds % 60) * 10) / 10;
    return `${mins}:${secs.toString().padStart(4, '0')}`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return (
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
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        );
      case 'audio':
        return (
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
              d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
            />
          </svg>
        );
      case 'code':
        return (
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
              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
            />
          </svg>
        );
      case 'title':
        return (
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
              d="M4 6h16M4 12h16M4 18h7"
            />
          </svg>
        );
      case 'visual-asset':
        return (
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
              d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3H5a2 2 0 00-2 2v12a4 4 0 004 4h2a2 2 0 002-2V5a2 2 0 00-2-2z"
            />
          </svg>
        );
      default:
        return (
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        );
    }
  };

  const getMediaDuration = async (
    file: File,
    type: 'video' | 'audio'
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

  const handleBrowseForNewSource = () => {
    try {
      fileInputRef.current?.click();
    } catch {}
  };

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !asset) return;
    const file = files[0];
    setIsRelinking(true);
    try {
      const mediaType = asset.type === 'image' ? 'video' : (asset.type as 'video' | 'audio');
      const url = URL.createObjectURL(file);
      const duration = await getMediaDuration(file, mediaType);
      updateMediaAsset(asset.id, {
        name: file.name,
        url,
        duration,
        metadata: {
          ...asset.metadata,
          fileSize: file.size,
          mimeType: file.type,
        },
      } as any);
    } finally {
      setIsRelinking(false);
      // reset input to allow same file selection again
      if (e.target) e.target.value = '';
    }
  };

  return (
    <div className="p-4 border-b border-border-subtle">
      <h4 className="font-medium text-text-primary mb-3">Clip Information</h4>

      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <div className="text-text-secondary">{getTypeIcon(item.type)}</div>
          <div>
            <p className="text-sm font-medium text-text-primary">
              {asset?.name || 'Unknown Asset'}
            </p>
            <p className="text-xs text-text-secondary capitalize">
              {item.type} clip
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-text-secondary font-medium">Duration</p>
            <p className="text-text-primary font-mono">
              {formatDuration(item.duration)}
            </p>
          </div>
          <div>
            <p className="text-text-secondary font-medium">Start Time</p>
            <p className="text-text-primary font-mono">
              {formatDuration(item.startTime)}
            </p>
          </div>
          <div>
            <p className="text-text-secondary font-medium">Track</p>
            <p className="text-text-primary">Track {item.track + 1}</p>
          </div>
          <div>
            <p className="text-text-secondary font-medium">End Time</p>
            <p className="text-text-primary font-mono">
              {formatDuration(item.startTime + item.duration)}
            </p>
          </div>
        </div>

        {asset && (
          <div className="pt-2 border-t border-border-subtle">
            <p className="text-xs text-text-secondary font-medium mb-2">
              Source File
            </p>
            <div className="text-xs text-text-secondary space-y-1">
              <p>
                Size: {(asset.metadata.fileSize / 1024 / 1024).toFixed(1)} MB
              </p>
              <p>Type: {asset.metadata.mimeType}</p>
              {asset.metadata.width && asset.metadata.height && (
                <p>
                  Resolution: {asset.metadata.width} × {asset.metadata.height}
                </p>
              )}
              <div>
                <p className="text-text-secondary font-medium mb-1">Filename</p>
                <p className="text-text-primary break-all">{asset.name}</p>
              </div>
              <div>
                <p className="text-text-secondary font-medium mb-1">Source URL / Path</p>
                <input
                  readOnly
                  value={asset.url}
                  className="w-full bg-background-tertiary border border-border-subtle rounded px-2 py-1 text-text-secondary text-xs"
                />
              </div>
              {(asset.type === 'audio' || asset.type === 'video') && (
                <div className="pt-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={onFileSelected}
                    accept={asset.type === 'audio' ? 'audio/*' : 'video/*'}
                    className="hidden"
                  />
                  <button
                    onClick={handleBrowseForNewSource}
                    disabled={isRelinking}
                    className="px-2 py-1 text-xs rounded bg-synapse-primary text-synapse-text-inverse hover:bg-synapse-primary-hover disabled:opacity-60"
                    title="Relink to a different source file"
                  >
                    {isRelinking ? 'Relinking…' : 'Relink Source'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface ClipPropertiesProps {
  item: TimelineItem;
  mode: 'properties' | 'layout';
  onUpdateProperties: (properties: ItemProperties) => void;
}

function ClipProperties({
  item,
  mode,
  onUpdateProperties,
}: ClipPropertiesProps) {
  const [localProperties, setLocalProperties] = useState<ItemProperties>(
    item.properties
  );

  const { getMediaAssetById } = useMediaAssets();

  // Simplified theme dropdown options
  const themeOptions = React.useMemo(() => {
    try {
      const all = themeManager.getAllThemes();
      return all.map((t) => ({
        value: t.id,
        label: `${t.name} (${t.category}) • ${t.colors.background}`,
      }));
    } catch {
      return [
        { value: 'vscode-dark-plus', label: 'VSCode Dark Plus • #1e1e1e' },
      ];
    }
  }, []);

  // Sensible default monospace font stacks
  const defaultFontOptions = React.useMemo(
    () => [
      {
        label: 'Monaco / Menlo / Ubuntu Mono',
        value: 'Monaco, Menlo, "Ubuntu Mono", monospace',
      },
      {
        label: 'Fira Code',
        value:
          'Fira Code, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      },
      {
        label: 'JetBrains Mono',
        value: 'JetBrains Mono, Menlo, Monaco, "Courier New", monospace',
      },
      {
        label: 'Consolas / Liberation Mono',
        value: 'Consolas, "Liberation Mono", Menlo, Courier, monospace',
      },
      {
        label: 'Source Code Pro',
        value: 'Source Code Pro, Menlo, Monaco, Consolas, monospace',
      },
      {
        label: 'Cascadia Code',
        value: 'Cascadia Code, Segoe UI, Consolas, monospace',
      },
      {
        label: 'Courier New',
        value: 'Courier New, Courier, monospace',
      },
      {
        label: 'IBM Plex Mono',
        value: 'IBM Plex Mono, Menlo, Monaco, Consolas, monospace',
      },
      {
        label: 'SF Mono',
        value:
          'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      },
    ],
    []
  );

  const fontOptions = React.useMemo(() => {
    const opts = [...defaultFontOptions];
    const current = localProperties.fontFamily;
    if (current && !opts.some((o) => o.value === current)) {
      opts.unshift({
        label: `Current (${current.slice(0, 40)}${current.length > 40 ? '…' : ''})`,
        value: current,
      });
    }
    return opts;
  }, [defaultFontOptions, localProperties.fontFamily]);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Temporary helper to avoid undefined reference during tests; can be enhanced to list eligible assets
  const getSideBySideOptions = React.useCallback(() => {
    return [] as { value: string; label: string }[];
  }, []);

  // Compute preview background style to match selected background options
  const gradientToCss = React.useCallback((g: any): string => {
    if (!g) return '';
    if (g.type === 'linear') {
      const angle = typeof g.angle === 'number' ? g.angle : 180;
      const stops = (g.colors || [])
        .map((c: any) => `${c.color} ${Math.round((c.position || 0) * 100)}%`)
        .join(', ');
      return `linear-gradient(${angle}deg, ${stops})`;
    }
    if (g.type === 'radial') {
      const cx = Math.round((g.centerX ?? 0.5) * 100);
      const cy = Math.round((g.centerY ?? 0.5) * 100);
      const stops = (g.colors || [])
        .map((c: any) => `${c.color} ${Math.round((c.position || 0) * 100)}%`)
        .join(', ');
      return `radial-gradient(at ${cx}% ${cy}%, ${stops})`;
    }
    return '';
  }, []);

  const computeBackgroundStyle = React.useCallback((): React.CSSProperties => {
    const props = localProperties;
    const style: React.CSSProperties = {
      border: '1px solid var(--synapse-border, rgba(255,255,255,0.1))',
      borderRadius: 8,
      padding: 8,
    };

    // If no explicit background set, fall back to theme background
    const theme = themeManager.getTheme(props.theme || 'vscode-dark-plus');

    if (!props.backgroundType || props.backgroundType === 'none') {
      style.backgroundColor = theme?.colors?.background || '#1e1e1e';
      return style;
    }

    if (props.backgroundType === 'color') {
      style.backgroundColor =
        props.backgroundColor || theme?.colors?.background || '#1e1e1e';
      return style;
    }

    if (props.backgroundType === 'gradient' && props.backgroundGradient) {
      style.backgroundImage = gradientToCss(props.backgroundGradient as any);
      style.backgroundColor = theme?.colors?.background || '#1e1e1e';
      style.backgroundSize = 'cover';
      style.backgroundPosition = 'center';
      return style;
    }

    if (props.backgroundType === 'wallpaper' && props.backgroundWallpaper) {
      const asset = getMediaAssetById(props.backgroundWallpaper);
      if (asset?.url) {
        style.backgroundImage = `url(${asset.url})`;
        style.backgroundSize = 'cover';
        style.backgroundPosition = 'center';
      } else {
        style.backgroundColor = theme?.colors?.background || '#1e1e1e';
      }
      return style;
    }

    style.backgroundColor = theme?.colors?.background || '#1e1e1e';
    return style;
  }, [getMediaAssetById, gradientToCss, localProperties]);

  // Update local state when item changes
  React.useEffect(() => {
    setLocalProperties(item.properties);
    setValidationErrors({});
  }, [item.properties]);

  const validateAndUpdate = useCallback(
    (newProperties: ItemProperties) => {
      const validation = validateItemProperties(newProperties);

      if (validation.isValid) {
        setValidationErrors({});
        onUpdateProperties(newProperties);
      } else {
        const errorMap: Record<string, string> = {};
        validation.errors.forEach((error) => {
          errorMap[error.field] = error.message;
        });
        setValidationErrors(errorMap);
      }
    },
    [onUpdateProperties]
  );

  const updateProperty = useCallback(
    (key: keyof ItemProperties, value: any) => {
      const newProperties = { ...localProperties, [key]: value };
      setLocalProperties(newProperties);

      // Immediate validation for testing, debounced for production
      if (process.env.NODE_ENV === 'test') {
        validateAndUpdate(newProperties);
      } else {
        // Debounced validation and update
        const timeoutId = setTimeout(() => {
          validateAndUpdate(newProperties);
        }, 300);
        return () => clearTimeout(timeoutId);
      }
    },
    [localProperties, validateAndUpdate]
  );

  // Bulk update helper to apply multiple property changes atomically (prevents debounce race conditions)
  const updatePropertiesBulk = useCallback(
    (updates: Partial<ItemProperties>) => {
      const newProperties = { ...localProperties, ...updates };
      setLocalProperties(newProperties);
      // Apply immediately to avoid intermediate states being lost
      validateAndUpdate(newProperties);
    },
    [localProperties, validateAndUpdate]
  );

  const renderTransformProperties = () => (
    <div className="space-y-3">
      <NumberInput
        label="X Position"
        value={localProperties.x ?? 0}
        onChange={(value) => updateProperty('x', value)}
        error={validationErrors.x}
        step={1}
      />
      <NumberInput
        label="Y Position"
        value={localProperties.y ?? 0}
        onChange={(value) => updateProperty('y', value)}
        error={validationErrors.y}
        step={1}
      />
      <NumberInput
        label="Scale"
        value={localProperties.scale ?? 1}
        onChange={(value) => updateProperty('scale', value)}
        error={validationErrors.scale}
        min={0.1}
        max={5}
        step={0.1}
      />
      <NumberInput
        label="Rotation"
        value={localProperties.rotation ?? 0}
        onChange={(value) => updateProperty('rotation', value)}
        error={validationErrors.rotation}
        min={-360}
        max={360}
        step={1}
        suffix="°"
      />
      <NumberInput
        label="Opacity"
        value={localProperties.opacity ?? 1}
        onChange={(value) => updateProperty('opacity', value)}
        error={validationErrors.opacity}
        min={0}
        max={1}
        step={0.01}
      />
    </div>
  );

  const renderVideoProperties = () => (
    <div className="space-y-3">
      <NumberInput
        label="Volume"
        value={localProperties.volume ?? 1}
        onChange={(value) => updateProperty('volume', value)}
        error={validationErrors.volume}
        min={0}
        max={1}
        step={0.01}
      />
      <NumberInput
        label="Playback Rate"
        value={localProperties.playbackRate ?? 1}
        onChange={(value) => updateProperty('playbackRate', value)}
        error={validationErrors.playbackRate}
        min={0.1}
        max={3}
        step={0.1}
        suffix="×"
      />
    </div>
  );

  const renderCodeProperties = () => (
    <div className="space-y-3">
      {/* Theme and font controls first (simplified dropdowns) */}
      <SelectInput
        label="Theme"
        value={localProperties.theme ?? 'vscode-dark-plus'}
        onChange={(value) => updateProperty('theme', value)}
        options={themeOptions}
      />
      <SelectInput
        label="Font Family"
        value={localProperties.fontFamily ?? defaultFontOptions[0].value}
        onChange={(value) => updateProperty('fontFamily', value)}
        options={fontOptions}
        error={validationErrors.fontFamily}
      />
      <NumberInput
        label="Font Size"
        value={localProperties.fontSize ?? 14}
        onChange={(value) => updateProperty('fontSize', value)}
        error={validationErrors.fontSize}
        min={8}
        max={48}
        step={1}
        suffix="px"
      />

      {/* Canvas Background */}
      <h6 className="text-xs font-medium text-text-secondary">Canvas Background</h6>
      {renderBackgroundControlsInline()}

      {/* Panel Style */}
      <div className="space-y-2">
        <h6 className="text-xs font-medium text-text-secondary">Panel Style</h6>
        {(() => {
          const radius = localProperties.codePanelRadius ?? 12;
          const shadow = localProperties.codePanelShadow ?? true;
          const isNoFrame = radius === 0 && shadow === false;
          const isCard = radius === 12 && shadow === true;
          const isStrong = radius === 16 && shadow === true;
          const base = 'px-2 py-1 text-xs rounded border transition-colors';
          const active = 'bg-synapse-primary text-synapse-text-inverse border-synapse-primary shadow-synapse-sm';
          const inactive = 'bg-background-tertiary text-text-secondary border-border-subtle hover:text-text-primary';
          return (
            <div className="flex flex-col gap-2">
              <div className="flex gap-1">
                <button
                  onClick={() => updatePropertiesBulk({ codePanelRadius: 0, codePanelShadow: false })}
                  className={`${base} ${isNoFrame ? active : inactive}`}
                  title="No frame"
                >
                  No frame
                </button>
                <button
                  onClick={() => updatePropertiesBulk({ codePanelRadius: 12, codePanelShadow: true })}
                  className={`${base} ${isCard ? active : inactive}`}
                  title="Card"
                >
                  Card
                </button>
                <button
                  onClick={() => updatePropertiesBulk({ codePanelRadius: 16, codePanelShadow: true })}
                  className={`${base} ${isStrong ? active : inactive}`}
                  title="Strong card"
                >
                  Strong
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <NumberInput
                  label="Panel Width"
                  value={(localProperties as any).codePanelWidth ?? 800}
                  onChange={(value) => updateProperty('codePanelWidth' as any, value)}
                  min={100}
                  max={4096}
                  step={1}
                  suffix="px"
                />
                <NumberInput
                  label="Panel Height"
                  value={(localProperties as any).codePanelHeight ?? 450}
                  onChange={(value) => updateProperty('codePanelHeight' as any, value)}
                  min={100}
                  max={4096}
                  step={1}
                  suffix="px"
                />
              </div>
            </div>
          );
        })()}
      </div>

      {/* Code content */}
      <TextAreaWithFormat
        label="Code Content"
        value={localProperties.codeText ?? localProperties.text ?? ''}
        language={localProperties.language ?? 'javascript'}
        onChange={(value) => {
          updateProperty('text', value);
          updateProperty('codeText', value);
        }}
        error={validationErrors.codeText}
      />
      <TextInput
        label="Second Code (for Diff)"
        value={localProperties.codeTextB ?? ''}
        onChange={(value) => updateProperty('codeTextB', value)}
        error={validationErrors.codeTextB}
        multiline
      />
      <div className="space-y-2">
        <SelectInput
          label="Language"
          value={localProperties.language ?? 'javascript'}
          onChange={(value) => updateProperty('language', value)}
          options={[
            { value: 'javascript', label: 'JavaScript' },
            { value: 'typescript', label: 'TypeScript' },
            { value: 'tsx', label: 'TSX' },
            { value: 'jsx', label: 'JSX' },
            { value: 'python', label: 'Python' },
            { value: 'java', label: 'Java' },
            { value: 'cpp', label: 'C++' },
            { value: 'html', label: 'HTML' },
            { value: 'css', label: 'CSS' },
            { value: 'json', label: 'JSON' },
            { value: 'glsl', label: 'GLSL' },
            { value: 'gdscript', label: 'GDScript' },
          ]}
        />

        {/* Language Detection Button */}
        <button
          onClick={() => {
            const codeText =
              localProperties.codeText || localProperties.text || '';
            if (codeText.trim()) {
              const detection = detectLanguageFromCode(codeText);
              if (detection.confidence > 20) {
                updateProperty('language', detection.language);
                // Apply language-specific defaults
                const defaults = getCodeLanguageDefaults(detection.language);
                Object.entries(defaults).forEach(([key, value]) => {
                  if (value !== undefined) {
                    updateProperty(key as keyof ItemProperties, value);
                  }
                });
              }
            }
          }}
          className="w-full px-3 py-2 text-sm bg-synapse-primary text-synapse-text-inverse rounded hover:bg-synapse-primary-hover transition-colors"
        >
          🔍 Auto-Detect Language & Apply Defaults
        </button>
      </div>

      {/* Snippets (Multi-step) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h6 className="text-xs font-medium text-text-secondary">Snippets (Multi‑step)</h6>
          <SelectInput
            label="Transition"
            value={localProperties.codeStepsTransition ?? 'none'}
            onChange={(value) => updateProperty('codeStepsTransition', value as any)}
            options={[
              { value: 'none', label: 'None' },
              { value: 'crossfade', label: 'Crossfade' },
              { value: 'line-morph', label: 'Line Morph' },
              { value: 'type-in', label: 'Type In (changed lines)' },
            ]}
          />
        </div>

        {(() => {
          const steps = (localProperties as any).codeSteps as Array<{
            code: string;
            duration: number;
            annotate?: string;
            highlightRanges?: Array<[number, number]>;
          }> | undefined;

          const parsedSteps = Array.isArray(steps) ? steps : [];

          const addFromCurrent = () => {
            const codeText = localProperties.codeText || localProperties.text || '';
            const next = [...parsedSteps, { code: codeText, duration: 3 }];
            updateProperty('codeSteps', next as any);
          };

          const addBlank = () => {
            const next = [...parsedSteps, { code: '// step', duration: 3 }];
            updateProperty('codeSteps', next as any);
          };

          const fromTwoCodes = () => {
            const a = localProperties.codeText || localProperties.text || '';
            const b = (localProperties as any).codeTextB || '';
            const next = [
              { code: a || '// step A', duration: Math.max(1, Math.round(((item.duration || 6) / 2))) },
              { code: b || '// step B', duration: Math.max(1, Math.round(((item.duration || 6) / 2))) },
            ];
            updateProperty('codeSteps', next as any);
          };

          const parseRanges = (s: string): Array<[number, number]> => {
            const out: Array<[number, number]> = [];
            s.split(/[,;\s]+/).forEach((tok) => {
              if (!tok) return;
              const m = tok.split('-').map((x) => parseInt(x, 10));
              if (m.length === 2 && Number.isFinite(m[0]) && Number.isFinite(m[1])) {
                const a = Math.max(1, Math.min(m[0], m[1]));
                const b = Math.max(1, Math.max(m[0], m[1]));
                out.push([a, b]);
              } else if (m.length === 1 && Number.isFinite(m[0])) {
                const v = Math.max(1, m[0]);
                out.push([v, v]);
              }
            });
            return out;
          };

          const sumDur = parsedSteps.reduce((s, st) => s + Math.max(0, st.duration || 0), 0);

          return (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={addFromCurrent}
                  className="px-2 py-1 text-xs rounded border bg-background-tertiary text-text-secondary hover:text-text-primary"
                  title="Add a step from the current code content"
                >
                  + Add Step from Code
                </button>
                <button
                  onClick={addBlank}
                  className="px-2 py-1 text-xs rounded border bg-background-tertiary text-text-secondary hover:text-text-primary"
                  title="Add a blank step"
                >
                  + Add Blank Step
                </button>
                <button
                  onClick={fromTwoCodes}
                  className="px-2 py-1 text-xs rounded border bg-background-tertiary text-text-secondary hover:text-text-primary"
                  title="Create 2 steps from Code + Second Code"
                >
                  ↔ From Code + Second
                </button>
                <div className="ml-auto text-xs text-text-tertiary self-center">
                  Total steps: {parsedSteps.length} • Sum duration: {Math.round(sumDur * 10) / 10}s
                </div>
              </div>

              {parsedSteps.length === 0 && (
                <div className="text-xs text-text-tertiary">
                  No steps yet. Add one above to enable snippet transitions.
                </div>
              )}

              {parsedSteps.map((step, idx) => (
                <div key={idx} className="border border-border-subtle rounded p-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="text-xs font-medium text-text-secondary">Step {idx + 1}</div>
                    <div className="ml-auto flex items-center gap-1">
                      <button
                        onClick={() => {
                          const next = [...parsedSteps];
                          if (idx > 0) {
                            [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                            updateProperty('codeSteps', next as any);
                          }
                        }}
                        className="px-1.5 py-0.5 text-[11px] rounded border bg-background-tertiary text-text-secondary hover:text-text-primary"
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => {
                          const next = [...parsedSteps];
                          if (idx < next.length - 1) {
                            [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
                            updateProperty('codeSteps', next as any);
                          }
                        }}
                        className="px-1.5 py-0.5 text-[11px] rounded border bg-background-tertiary text-text-secondary hover:text-text-primary"
                        title="Move down"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => {
                          const next = parsedSteps.filter((_, i) => i !== idx);
                          updateProperty('codeSteps', next as any);
                        }}
                        className="px-1.5 py-0.5 text-[11px] rounded border bg-background-tertiary text-text-secondary hover:text-text-primary"
                        title="Remove step"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <TextInput
                        label="Annotate (optional)"
                        value={(step as any).annotate ?? ''}
                        onChange={(value) => {
                          const next = [...parsedSteps];
                          (next[idx] as any).annotate = value;
                          updateProperty('codeSteps', next as any);
                        }}
                        multiline
                      />
                    </div>
                    <div>
                      <NumberInput
                        label="Duration (s)"
                        value={Math.max(0.1, step.duration || 3)}
                        onChange={(value) => {
                          const next = [...parsedSteps];
                          next[idx] = { ...next[idx], duration: Math.max(0.1, value || 0) } as any;
                          updateProperty('codeSteps', next as any);
                        }}
                        min={0.1}
                        max={120}
                        step={0.1}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-3">
                      <TextAreaWithFormat
                        label="Step Code"
                        value={step.code || ''}
                        language={localProperties.language ?? 'javascript'}
                        onChange={(value) => {
                          const next = [...parsedSteps];
                          next[idx] = { ...next[idx], code: value } as any;
                          updateProperty('codeSteps', next as any);
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <TextInput
                      label="Highlight Ranges (e.g., 1-3,5,9-10)"
                      value={(() => {
                        const ranges = (step as any).highlightRanges as Array<[number, number]> | undefined;
                        if (!ranges || ranges.length === 0) return '';
                        return ranges.map(([a, b]) => (a === b ? `${a}` : `${a}-${b}`)).join(',');
                      })()}
                      onChange={(value) => {
                        const next = [...parsedSteps];
                        (next[idx] as any).highlightRanges = parseRanges(value);
                        updateProperty('codeSteps', next as any);
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      <div className="space-y-2">
        <SelectInput
          label="Animation Mode"
          value={localProperties.animationMode ?? 'typing'}
          onChange={(value) => updateProperty('animationMode', value as any)}
          options={[
            { value: 'typing', label: 'Typing (Educational)' },
            { value: 'line-by-line', label: 'Line by Line (Step-by-step)' },
            { value: 'diff', label: 'Diff Highlight (Changes)' },
            { value: 'none', label: 'None (Instant)' },
          ]}
        />

        {/* Educational Animation Tips */}
        <div className="text-xs text-text-secondary bg-background-tertiary p-2 rounded">
          {(() => {
            const mode = localProperties.animationMode ?? 'typing';
            const tips: Record<string, string> = {
              typing:
                '💡 Perfect for beginners - shows code being written character by character',
              'line-by-line':
                '📝 Great for step-by-step explanations - reveals one line at a time',
              diff: '🔄 Ideal for showing code changes and refactoring',
              none: '⚡ Best for quick demonstrations or when code is already familiar',
            };
            return tips[mode] || '';
          })()}
        </div>
      </div>
      <div className="space-y-2">
        <h6 className="text-xs font-medium text-text-secondary">Typing Speed</h6>
        {(() => {
          const speed = localProperties.typingSpeedCps ?? 30;
          const base = 'flex-1 px-2 py-1 text-xs rounded border transition-colors';
          const active = 'bg-synapse-primary text-synapse-text-inverse border-synapse-primary shadow-synapse-sm';
          const inactive = 'bg-background-tertiary text-text-secondary border-border-subtle hover:text-text-primary';
          const is = (v:number) => speed === v;
          return (
            <div className="flex gap-1">
              <button
                onClick={() => updateProperty('typingSpeedCps', 12)}
                className={`${base} ${is(12) ? active : inactive}`}
              >
                Slow
              </button>
              <button
                onClick={() => updateProperty('typingSpeedCps', 20)}
                className={`${base} ${is(20) ? active : inactive}`}
              >
                Medium
              </button>
              <button
                onClick={() => updateProperty('typingSpeedCps', 35)}
                className={`${base} ${is(35) ? active : inactive}`}
              >
                Fast
              </button>
            </div>
          );
        })()}
      </div>
      <NumberInput
        label="Line Reveal Interval"
        value={localProperties.lineRevealIntervalMs ?? 350}
        onChange={(value) => updateProperty('lineRevealIntervalMs', value)}
        error={validationErrors.lineRevealIntervalMs}
        min={50}
        max={2000}
        step={10}
        suffix="ms"
      />
      <SelectInput
        label="Line Numbers"
        value={(localProperties.showLineNumbers ?? false) ? 'on' : 'off'}
        onChange={(value) => updateProperty('showLineNumbers', value === 'on')}
        options={[
          { value: 'off', label: 'Off' },
          { value: 'on', label: 'On' },
        ]}
      />
    </div>
  );

  function TextAreaWithFormat({
    label,
    value,
    language,
    onChange,
    error,
  }: {
    label: string;
    value: string;
    language: string;
    onChange: (v: string) => void;
    error?: string;
  }) {
    const inputId = React.useId();
    const [localValue, setLocalValue] = useState(value);
    React.useEffect(() => setLocalValue(value), [value]);

    const handlePaste = async (
      e: React.ClipboardEvent<HTMLTextAreaElement>
    ) => {
      // Let paste happen, then format next tick
      setTimeout(async () => {
        const target = e.target as HTMLTextAreaElement;
        const formatted = await import('../lib/format').then((m) =>
          m.formatCode(target.value, language)
        );
        setLocalValue(formatted);
        onChange(formatted);
      }, 0);
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setLocalValue(e.target.value);
      onChange(e.target.value);
    };

    return (
      <div>
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-text-secondary mb-1"
        >
          {label}
        </label>
        <div className="rounded" style={computeBackgroundStyle()}>
          <textarea
            id={inputId}
            value={localValue}
            onChange={handleChange}
            onPaste={handlePaste}
            rows={8}
            className={`w-full bg-transparent border-0 outline-none px-2 py-2 text-sm resize-vertical ${error ? '' : ''}`}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${inputId}-error` : undefined}
            style={{
              fontFamily:
                localProperties.fontFamily ||
                'Monaco, Menlo, "Ubuntu Mono", monospace',
              fontSize: (localProperties.fontSize || 14) + 'px',
              color:
                themeManager.getTheme(
                  localProperties.theme || 'vscode-dark-plus'
                )?.colors?.foreground || 'var(--synapse-text-primary, #e6e6e6)',
            }}
          />
        </div>
        {error && (
          <p
            id={`${inputId}-error`}
            className="text-synapse-error text-xs mt-1"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }

  const renderTitleProperties = () => (
    <div className="space-y-3">
      <TextInput
        label="Text"
        value={localProperties.text ?? ''}
        onChange={(value) => updateProperty('text', value)}
        error={validationErrors.text}
        multiline
      />
      <TextInput
        label="Font Family"
        value={localProperties.fontFamily ?? 'Inter'}
        onChange={(value) => updateProperty('fontFamily', value)}
        error={validationErrors.fontFamily}
      />
      <ColorInput
        label="Text Color"
        value={localProperties.color ?? '#ffffff'}
        onChange={(value) => updateProperty('color', value)}
        error={validationErrors.color}
      />
      <ColorInput
        label="Background Color"
        value={localProperties.backgroundColor ?? 'transparent'}
        onChange={(value) => updateProperty('backgroundColor', value)}
        error={validationErrors.backgroundColor}
      />
    </div>
  );

  const renderBackgroundControlsInline = () => {
    // Derive current canvas background config
    const getCurrentBackgroundConfig = () => {
      const props = localProperties;
      if (!props.backgroundType || props.backgroundType === 'none')
        return undefined;
      switch (props.backgroundType) {
        case 'color':
          return {
            type: 'color',
            color: props.backgroundColor || '#1e1e1e',
          } as any;
        case 'gradient':
          return props.backgroundGradient
            ? ({ type: 'gradient', gradient: props.backgroundGradient } as any)
            : undefined;
        case 'wallpaper':
          return props.backgroundWallpaper
            ? ({
                type: 'wallpaper',
                wallpaper: {
                  assetId: props.backgroundWallpaper,
                  opacity: props.backgroundOpacity || 1,
                  blendMode: 'normal',
                },
              } as any)
            : undefined;
        default:
          return undefined;
      }
    };

    const handleBackgroundChange = (config: any | null) => {
      if (!config) {
        updatePropertiesBulk({
          backgroundType: 'none' as any,
          backgroundWallpaper: undefined as any,
          backgroundGradient: undefined as any,
          backgroundColor: undefined as any,
        });
        return;
      }
      if (config.type === 'color') {
        updatePropertiesBulk({
          backgroundType: 'color' as any,
          backgroundColor: config.color,
          backgroundWallpaper: undefined as any,
          backgroundGradient: undefined as any,
        });
      } else if (config.type === 'gradient') {
        updatePropertiesBulk({
          backgroundType: 'gradient' as any,
          backgroundGradient: config.gradient,
          backgroundColor: undefined as any,
          backgroundWallpaper: undefined as any,
        });
      } else if (config.type === 'wallpaper') {
        updatePropertiesBulk({
          backgroundType: 'wallpaper' as any,
          backgroundWallpaper: config.wallpaper?.assetId,
          backgroundColor: undefined as any,
          backgroundGradient: undefined as any,
        });
      }
    };

    return (
      <div className="space-y-2">
        {(() => {
          const t = localProperties.backgroundType ?? 'none';
          const base = 'px-2 py-1 text-xs rounded border transition-colors';
          const active = 'bg-synapse-primary text-synapse-text-inverse border-synapse-primary shadow-synapse-sm';
          const inactive = 'bg-background-tertiary text-text-secondary border-border-subtle hover:text-text-primary';
          return (
            <div className="flex gap-1">
              <button
                className={`${base} ${t === 'none' ? active : inactive}`}
                onClick={() => updatePropertiesBulk({
                  backgroundType: 'none' as any,
                  backgroundColor: undefined as any,
                  backgroundGradient: undefined as any,
                  backgroundWallpaper: undefined as any,
                })}
              >
                None
              </button>
              <button
                className={`${base} ${t === 'color' ? active : inactive}`}
                onClick={() => updatePropertiesBulk({
                  backgroundType: 'color' as any,
                  backgroundColor: localProperties.backgroundColor ?? '#1e1e1e',
                  backgroundGradient: undefined as any,
                  backgroundWallpaper: undefined as any,
                })}
              >
                Color
              </button>
              <button
                className={`${base} ${t === 'gradient' ? active : inactive}`}
                onClick={() => updatePropertiesBulk({
                  backgroundType: 'gradient' as any,
                  backgroundGradient: localProperties.backgroundGradient ?? ({} as any),
                  backgroundColor: undefined as any,
                  backgroundWallpaper: undefined as any,
                })}
              >
                Gradient
              </button>
              <button
                className={`${base} ${t === 'wallpaper' ? active : inactive}`}
                onClick={() => updatePropertiesBulk({
                  backgroundType: 'wallpaper' as any,
                  backgroundWallpaper: localProperties.backgroundWallpaper,
                  backgroundColor: undefined as any,
                  backgroundGradient: undefined as any,
                })}
              >
                Image
              </button>
            </div>
          );
        })()}

        {localProperties.backgroundType === 'color' && (
          <ColorInput
            label="Color"
            value={localProperties.backgroundColor ?? '#1e1e1e'}
            onChange={(value) => updateProperty('backgroundColor', value)}
            error={validationErrors.backgroundColor}
          />
        )}

        {localProperties.backgroundType && localProperties.backgroundType !== 'none' && (
          <BackgroundPicker
            value={getCurrentBackgroundConfig()}
            onChange={handleBackgroundChange}
            opacity={localProperties.backgroundOpacity || 1}
            onOpacityChange={(opacity) => updateProperty('backgroundOpacity', opacity)}
          />
        )}
      </div>
    );
  };

  const renderVisualAssetProperties = () => {
    const assetType = localProperties.visualAssetType;

    return (
      <div className="space-y-3">
        <SelectInput
          label="Asset Type"
          value={assetType ?? 'arrow'}
          onChange={(value) => updateProperty('visualAssetType', value as any)}
          options={[
            { value: 'arrow', label: 'Arrow' },
            { value: 'box', label: 'Box' },
            { value: 'finger-pointer', label: 'Finger Pointer' },
            { value: 'circle', label: 'Circle' },
            { value: 'line', label: 'Line' },
          ]}
        />

        <ColorInput
          label="Stroke Color"
          value={localProperties.strokeColor ?? '#ff0000'}
          onChange={(value) => updateProperty('strokeColor', value)}
          error={validationErrors.strokeColor}
        />

        <NumberInput
          label="Stroke Width"
          value={localProperties.strokeWidth ?? 3}
          onChange={(value) => updateProperty('strokeWidth', value)}
          error={validationErrors.strokeWidth}
          min={1}
          max={20}
          step={1}
          suffix="px"
        />

        {(assetType === 'box' || assetType === 'circle') && (
          <ColorInput
            label="Fill Color"
            value={localProperties.fillColor ?? 'transparent'}
            onChange={(value) => updateProperty('fillColor', value)}
            error={validationErrors.fillColor}
          />
        )}

        {assetType === 'arrow' && (
          <>
            <SelectInput
              label="Direction"
              value={localProperties.arrowDirection ?? 'right'}
              onChange={(value) =>
                updateProperty('arrowDirection', value as any)
              }
              options={[
                { value: 'up', label: 'Up' },
                { value: 'down', label: 'Down' },
                { value: 'left', label: 'Left' },
                { value: 'right', label: 'Right' },
                { value: 'up-left', label: 'Up Left' },
                { value: 'up-right', label: 'Up Right' },
                { value: 'down-left', label: 'Down Left' },
                { value: 'down-right', label: 'Down Right' },
              ]}
            />
            <SelectInput
              label="Style"
              value={localProperties.arrowStyle ?? 'solid'}
              onChange={(value) => updateProperty('arrowStyle', value as any)}
              options={[
                { value: 'solid', label: 'Solid' },
                { value: 'dashed', label: 'Dashed' },
                { value: 'curved', label: 'Curved' },
              ]}
            />
          </>
        )}

        {assetType === 'box' && (
          <>
            <SelectInput
              label="Style"
              value={localProperties.boxStyle ?? 'solid'}
              onChange={(value) => updateProperty('boxStyle', value as any)}
              options={[
                { value: 'solid', label: 'Solid' },
                { value: 'dashed', label: 'Dashed' },
                { value: 'dotted', label: 'Dotted' },
              ]}
            />
            <NumberInput
              label="Border Radius"
              value={localProperties.borderRadius ?? 0}
              onChange={(value) => updateProperty('borderRadius', value)}
              error={validationErrors.borderRadius}
              min={0}
              max={50}
              step={1}
              suffix="px"
            />
          </>
        )}

        {assetType === 'finger-pointer' && (
          <>
            <SelectInput
              label="Direction"
              value={localProperties.fingerDirection ?? 'down'}
              onChange={(value) =>
                updateProperty('fingerDirection', value as any)
              }
              options={[
                { value: 'up', label: 'Up' },
                { value: 'down', label: 'Down' },
                { value: 'left', label: 'Left' },
                { value: 'right', label: 'Right' },
              ]}
            />
            <SelectInput
              label="Style"
              value={localProperties.fingerStyle ?? 'pointing'}
              onChange={(value) => updateProperty('fingerStyle', value as any)}
              options={[
                { value: 'pointing', label: 'Pointing' },
                { value: 'tapping', label: 'Tapping' },
              ]}
            />
            <ColorInput
              label="Fill Color"
              value={localProperties.fillColor ?? '#ff0000'}
              onChange={(value) => updateProperty('fillColor', value)}
              error={validationErrors.fillColor}
            />
          </>
        )}

        {assetType === 'circle' && (
          <SelectInput
            label="Style"
            value={localProperties.circleStyle ?? 'solid'}
            onChange={(value) => updateProperty('circleStyle', value as any)}
            options={[
              { value: 'solid', label: 'Solid' },
              { value: 'dashed', label: 'Dashed' },
              { value: 'dotted', label: 'Dotted' },
            ]}
          />
        )}

        {assetType === 'line' && (
          <>
            <SelectInput
              label="Style"
              value={localProperties.lineStyle ?? 'solid'}
              onChange={(value) => updateProperty('lineStyle', value as any)}
              options={[
                { value: 'solid', label: 'Solid' },
                { value: 'dashed', label: 'Dashed' },
                { value: 'dotted', label: 'Dotted' },
              ]}
            />
            <div className="grid grid-cols-2 gap-2">
              <NumberInput
                label="Start X"
                value={localProperties.lineStartX ?? 0}
                onChange={(value) => updateProperty('lineStartX', value)}
                error={validationErrors.lineStartX}
                step={1}
                suffix="px"
              />
              <NumberInput
                label="Start Y"
                value={localProperties.lineStartY ?? 0}
                onChange={(value) => updateProperty('lineStartY', value)}
                error={validationErrors.lineStartY}
                step={1}
                suffix="px"
              />
              <NumberInput
                label="End X"
                value={localProperties.lineEndX ?? 100}
                onChange={(value) => updateProperty('lineEndX', value)}
                error={validationErrors.lineEndX}
                step={1}
                suffix="px"
              />
              <NumberInput
                label="End Y"
                value={localProperties.lineEndY ?? 0}
                onChange={(value) => updateProperty('lineEndY', value)}
                error={validationErrors.lineEndY}
                step={1}
                suffix="px"
              />
            </div>
          </>
        )}

        <SelectInput
          label="Animate In"
          value={localProperties.animateIn ?? 'fade'}
          onChange={(value) => updateProperty('animateIn', value as any)}
          options={[
            { value: 'none', label: 'None' },
            { value: 'fade', label: 'Fade' },
            { value: 'scale', label: 'Scale' },
            { value: 'slide', label: 'Slide' },
            { value: 'draw', label: 'Draw' },
          ]}
        />

        <SelectInput
          label="Animate Out"
          value={localProperties.animateOut ?? 'fade'}
          onChange={(value) => updateProperty('animateOut', value as any)}
          options={[
            { value: 'none', label: 'None' },
            { value: 'fade', label: 'Fade' },
            { value: 'scale', label: 'Scale' },
            { value: 'slide', label: 'Slide' },
          ]}
        />
      </div>
    );
  };

  return (
    <div className="border-b border-border-subtle">
      <div className="p-4">
        <h4 className="font-medium text-text-primary mb-3">
          {mode === 'layout' ? 'Layout' : 'Properties'}
        </h4>

        {mode === 'properties' && (
          <>
            {/* If code, show Code properties first to avoid scrolling (no layout sections here) */}
            {item.type === 'code' && (
              <div className="mb-4">
                <h5 className="text-sm font-medium text-text-secondary mb-2">
                  Code
                </h5>
                {renderCodeProperties()}
              </div>
            )}

            {/* Type-specific Properties */}
            {(item.type === 'video' || item.type === 'audio') && (
              <div className="mb-4">
                <h5 className="text-sm font-medium text-text-secondary mb-2">
                  Media
                </h5>
                {renderVideoProperties()}
              </div>
            )}

            {/* If not code, render Code properties in normal position */}
            {item.type !== 'code' && <></>}

            {item.type === 'title' && (
              <div className="mb-4">
                <h5 className="text-sm font-medium text-text-secondary mb-2">
                  Text
                </h5>
                {renderTitleProperties()}
              </div>
            )}

            {item.type === 'visual-asset' && (
              <div className="mb-4">
                <h5 className="text-sm font-medium text-text-secondary mb-2">
                  Visual Asset
                </h5>
                {renderVisualAssetProperties()}
              </div>
            )}
          </>
        )}

        {mode === 'layout' && (
          <>
            {/* Transform Properties */}
            <div className="mb-4">
              <h5 className="text-sm font-medium text-text-secondary mb-2">
                Transform
              </h5>
              {renderTransformProperties()}
            </div>

            {/* Layout sections specific to code */}
            {item.type === 'code' && (
              <>
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-text-secondary mb-2">
                    Focus (Ken Burns)
                  </h5>
                  <SelectInput
                    label="Auto Focus"
                    value={(localProperties.autoFocus ?? true) ? 'on' : 'off'}
                    onChange={(value) =>
                      updateProperty('autoFocus', value === 'on')
                    }
                    options={[
                      { value: 'off', label: 'Off' },
                      { value: 'on', label: 'On' },
                    ]}
                  />
                  <NumberInput
                    label="Focus X"
                    value={localProperties.focusPointX ?? 0.5}
                    onChange={(value) => updateProperty('focusPointX', value)}
                    min={0}
                    max={1}
                    step={0.01}
                  />
                  <NumberInput
                    label="Focus Y"
                    value={localProperties.focusPointY ?? 0.5}
                    onChange={(value) => updateProperty('focusPointY', value)}
                    min={0}
                    max={1}
                    step={0.01}
                  />
                  <NumberInput
                    label="Focus Scale"
                    value={localProperties.focusScale ?? 1.2}
                    onChange={(value) => updateProperty('focusScale', value)}
                    min={1}
                    max={3}
                    step={0.05}
                  />
                </div>

                <div className="mb-4">
                  <h5 className="text-sm font-medium text-text-secondary mb-2">
                    Side by Side
                  </h5>
                  <SelectInput
                    label="Companion Asset"
                    value={localProperties.sideBySideAssetId ?? ''}
                    onChange={(value) =>
                      updateProperty('sideBySideAssetId', value || undefined)
                    }
                    options={[
                      { value: '', label: 'None' },
                      ...getSideBySideOptions(),
                    ]}
                  />
                  <SelectInput
                    label="Layout"
                    value={localProperties.sideBySideLayout ?? 'left-right'}
                    onChange={(value) =>
                      updateProperty('sideBySideLayout', value as any)
                    }
                    options={[
                      { value: 'left-right', label: 'Left • Right' },
                      { value: 'right-left', label: 'Right • Left' },
                      { value: 'top-bottom', label: 'Top • Bottom' },
                      { value: 'bottom-top', label: 'Bottom • Top' },
                    ]}
                  />
                  <NumberInput
                    label="Gap"
                    value={localProperties.sideBySideGap ?? 16}
                    onChange={(value) => updateProperty('sideBySideGap', value)}
                    min={0}
                    max={128}
                    step={1}
                    suffix="px"
                  />
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface AnimationSettingsProps {
  item: TimelineItem;
  onUpdateAnimations: (animations: AnimationPreset[]) => void;
}

function AnimationSettings({
  item,
  onUpdateAnimations,
}: AnimationSettingsProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [selectedType, setSelectedType] = useState<
    'entrance' | 'exit' | 'emphasis' | 'transition'
  >('entrance');

  // Import animation presets from the comprehensive system
  const { ANIMATION_PRESETS, getAnimationsByType, getCompatibleAnimations } =
    animationPresetsModule;

  // Get available presets filtered by type
  const availablePresets = React.useMemo(() => {
    return getAnimationsByType(selectedType);
  }, [selectedType, getAnimationsByType]);

  const addAnimation = useCallback(() => {
    if (!selectedPreset) return;

    const preset = availablePresets.find((p) => p.id === selectedPreset);
    if (!preset) return;

    const newAnimations = [...(item.animations ?? []), preset];
    onUpdateAnimations(newAnimations);
    setSelectedPreset('');
  }, [selectedPreset, item.animations, onUpdateAnimations, availablePresets]);

  const removeAnimation = useCallback(
    (index: number) => {
      const newAnimations = (item.animations ?? []).filter(
        (_, i) => i !== index
      );
      onUpdateAnimations(newAnimations);
    },
    [item.animations, onUpdateAnimations]
  );

  return (
    <div className="p-4">
      <h4 className="font-medium text-text-primary mb-3">Animations</h4>

      {/* Current Animations */}
      {(item.animations?.length ?? 0) > 0 && (
        <div className="mb-4">
          <h5 className="text-sm font-medium text-text-secondary mb-2">
            Applied Animations
          </h5>
          <div className="space-y-2">
            {(item.animations ?? []).map((animation, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-background-tertiary rounded p-2 border border-border-subtle"
              >
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {animation.name}
                  </p>
                  <p className="text-xs text-text-tertiary capitalize">
                    {animation.type} • {animation.duration}s
                  </p>
                </div>
                <button
                  onClick={() => removeAnimation(index)}
                  className="text-status-error hover:text-status-error/80 transition-colors"
                  title="Remove Animation"
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
            ))}
          </div>
        </div>
      )}

      {/* Add Animation */}
      <div>
        <h5 className="text-sm font-medium text-text-secondary mb-2">
          Add Animation
        </h5>

        {/* Animation Type Selector */}
        <div className="mb-3">
          <div className="flex space-x-1 bg-background-tertiary rounded p-1">
            {(['entrance', 'exit', 'emphasis', 'transition'] as const).map(
              (type) => (
                <button
                  key={type}
                  onClick={() => {
                    setSelectedType(type);
                    setSelectedPreset(''); // Reset selection when changing type
                  }}
                  className={`flex-1 px-2 py-1 text-xs font-medium rounded capitalize transition-colors ${
                    selectedType === type
                      ? 'bg-synapse-primary text-synapse-text-inverse shadow-synapse-sm'
                      : 'text-text-secondary hover:text-text-primary hover:bg-synapse-surface-hover'
                  }`}
                >
                  {type}
                </button>
              )
            )}
          </div>
        </div>

        {/* Animation Selector and Add Button */}
        <div className="flex space-x-2">
          <select
            value={selectedPreset}
            onChange={(e) => setSelectedPreset(e.target.value)}
            className="flex-1 bg-background-tertiary border border-border-subtle rounded px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-synapse-border-focus"
          >
            <option value="">Select {selectedType} animation...</option>
            {availablePresets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name} • {preset.duration}s
              </option>
            ))}
          </select>
          <button
            onClick={addAnimation}
            disabled={!selectedPreset}
            className="bg-synapse-primary hover:bg-synapse-primary-hover disabled:bg-synapse-surface-active disabled:cursor-not-allowed disabled:opacity-50 text-synapse-text-inverse px-3 py-2 rounded text-sm transition-colors shadow-synapse-sm"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

// Input Components

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  error?: string;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}

function NumberInput({
  label,
  value,
  onChange,
  error,
  min,
  max,
  step = 1,
  suffix,
}: NumberInputProps) {
  const [localValue, setLocalValue] = useState(value.toString());
  const inputId = React.useId();

  React.useEffect(() => {
    setLocalValue(value.toString());
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    const numValue = parseFloat(newValue);
    if (!isNaN(numValue)) {
      let clampedValue = numValue;
      if (min !== undefined) clampedValue = Math.max(min, clampedValue);
      if (max !== undefined) clampedValue = Math.min(max, clampedValue);
      onChange(clampedValue);
    }
  };

  const handleBlur = () => {
    const numValue = parseFloat(localValue);
    if (isNaN(numValue)) {
      setLocalValue(value.toString());
    }
  };

  return (
    <div>
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-text-secondary mb-1"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type="number"
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          min={min}
          max={max}
          step={step}
          className={`w-full bg-synapse-surface border rounded px-3 py-2 text-synapse-text-primary text-sm focus:outline-none focus:border-synapse-border-focus focus:ring-1 focus:ring-synapse-border-focus ${
            error ? 'border-synapse-error' : 'border-synapse-border'
          }`}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : undefined}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary text-sm">
            {suffix}
          </span>
        )}
      </div>
      {error && (
        <p
          id={`${inputId}-error`}
          className="text-status-error text-xs mt-1"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}

interface TextInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  multiline?: boolean;
}

function TextInput({
  label,
  value,
  onChange,
  error,
  multiline = false,
}: TextInputProps) {
  const inputId = React.useId();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    onChange(e.target.value);
  };

  return (
    <div>
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-text-secondary mb-1"
      >
        {label}
      </label>
      {multiline ? (
        <textarea
          id={inputId}
          value={value}
          onChange={handleChange}
          rows={label === 'Code Content' ? 8 : 3}
          className={`w-full bg-synapse-surface border rounded px-3 py-2 text-synapse-text-primary text-sm focus:outline-none focus:border-synapse-border-focus focus:ring-1 focus:ring-synapse-border-focus ${
            error ? 'border-synapse-error' : 'border-synapse-border'
          }`}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : undefined}
          style={
            label === 'Code Content'
              ? { fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace' }
              : undefined
          }
        />
      ) : (
        <input
          id={inputId}
          type="text"
          value={value}
          onChange={handleChange}
          className={`w-full bg-synapse-surface border rounded px-3 py-2 text-synapse-text-primary text-sm focus:outline-none focus:border-synapse-border-focus focus:ring-1 focus:ring-synapse-border-focus ${
            error ? 'border-synapse-error' : 'border-synapse-border'
          }`}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : undefined}
        />
      )}
      {error && (
        <p
          id={`${inputId}-error`}
          className="text-status-error text-xs mt-1"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}

interface SelectInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  error?: string;
}

function SelectInput({
  label,
  value,
  onChange,
  options,
  error,
}: SelectInputProps) {
  const inputId = React.useId();

  return (
    <div>
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-text-secondary mb-1"
      >
        {label}
      </label>
      <select
        id={inputId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-synapse-surface border rounded px-3 py-2 text-synapse-text-primary text-sm focus:outline-none focus:border-synapse-border-focus focus:ring-1 focus:ring-synapse-border-focus ${
          error ? 'border-synapse-error' : 'border-synapse-border'
        }`}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${inputId}-error` : undefined}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p
          id={`${inputId}-error`}
          className="text-status-error text-xs mt-1"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

function ColorInput({ label, value, onChange, error }: ColorInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const inputId = React.useId();
  const colorId = React.useId();

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    // Validate color format (hex, rgb, rgba, named colors, etc.)
    const isValidColor =
      /^(#[0-9A-Fa-f]{3,8}|rgb\(|rgba\(|hsl\(|hsla\(|[a-zA-Z]+|transparent)/.test(
        newValue
      );
    if (isValidColor || newValue === '') {
      onChange(newValue);
    }
  };

  return (
    <div>
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-text-secondary mb-1"
      >
        {label}
      </label>
      <div className="flex space-x-2">
        <input
          id={colorId}
          type="color"
          value={localValue.startsWith('#') ? localValue : '#ffffff'}
          onChange={handleColorChange}
          className="w-12 h-10 bg-synapse-surface border border-synapse-border rounded cursor-pointer"
          aria-label={`${label} color picker`}
        />
        <input
          id={inputId}
          type="text"
          value={localValue}
          onChange={handleTextChange}
          placeholder="#ffffff"
          className={`flex-1 bg-synapse-surface border rounded px-3 py-2 text-synapse-text-primary text-sm focus:outline-none focus:border-synapse-border-focus focus:ring-1 focus:ring-synapse-border-focus ${
            error ? 'border-synapse-error' : 'border-synapse-border'
          }`}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : undefined}
        />
      </div>
      {error && (
        <p
          id={`${inputId}-error`}
          className="text-status-error text-xs mt-1"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
