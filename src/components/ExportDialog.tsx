import React, { useState, useEffect } from 'react';
import { useProject } from '../state/hooks';
import {
  useExport,
  useExportSettings,
  useExportStatus,
} from '../state/exportContext';
import type {
  ExportPreset,
  ExportQuality,
  VideoFormat,
  VideoCodec,
  AudioCodec,
} from '../lib/types';
import {
  formatFileSize,
  formatDuration,
  isTransparencySupported,
  getTransparencyCompatibilityWarning,
  validateTransparencySettings,
  downloadExportedFile,
} from '../lib/exportManagerClient';
import { useAuth } from '../state/authContext';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const { project } = useProject();
  const { startExport, cancelExport, getEstimatedFileSize } = useExport();
  const { settings, presets, updateSettings, applyPreset } =
    useExportSettings();
  const { isExporting, progress, canStartExport, currentJob } =
    useExportStatus();
  const {
    authenticated,
    membership,
    donateDemo,
    loading: authLoading,
  } = useAuth();
  const trialsUsed = Number(membership?.trialUsed ?? 0);
  const trialsLimit = Number(membership?.trialLimit ?? 0);
  const trialsRemaining = Math.max(0, trialsLimit - trialsUsed);

  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [selectedPresetId, setSelectedPresetId] =
    useState<string>('youtube-1080p');
  const [outputName, setOutputName] = useState<string>(
    project?.name || 'export'
  );
  const [hasTriggeredDownload, setHasTriggeredDownload] = useState(false);

  // Calculate estimated file size
  const estimatedSize = project ? getEstimatedFileSize(project) : 0;

  // Handle preset selection
  const handlePresetSelect = (preset: ExportPreset) => {
    setSelectedPresetId(preset.id);
    applyPreset(preset);
  };

  // Handle export start
  const handleStartExport = async () => {
    if (!project) return;

    try {
      // Pass the currently selected settings explicitly so tests and
      // downstream pipelines use the exact values (width/height, etc.).
      // Pass the currently selected settings explicitly so tests and
      // downstream pipelines use the exact values (width/height, etc.).
      await startExport(project, { ...settings, outputName });
      // Keep dialog open to show progress
    } catch (error) {
      console.error('Export failed:', error);
      // Error is already handled by the export context
    }
  };

  // Handle export cancel
  const handleCancelExport = () => {
    cancelExport();
  };

  // Handle file download/save after completion
  const handleDownload = async (): Promise<boolean> => {
    try {
      const outputUrl = (currentJob as any)?.outputPath as string | undefined;
      if (!outputUrl) return false;
      const lastSegment = (outputUrl.split('/').pop() || '').trim();
      const hasExt = /\.[a-zA-Z0-9]+$/.test(lastSegment);
      const suggestedName = hasExt
        ? lastSegment
        : `${outputName}.${settings.format}`;

      // If running in Electron, offer native Save dialog and write file
      const anyWindow = window as any;
      if (typeof window !== 'undefined' && anyWindow?.SynapseFS) {
        const savePath = await anyWindow.SynapseFS.showSaveDialog({
          title: 'Save exported video',
          defaultPath: suggestedName,
          filters: [
            { name: 'Video', extensions: ['mp4', 'webm', 'mov'] },
          ],
        });
        if (savePath) {
          const resp = await fetch(outputUrl);
          const buf = new Uint8Array(await resp.arrayBuffer());
          await anyWindow.SynapseFS.writeFile(savePath, buf);
          return true;
        }
        return false;
      } else {
        // Browser: trigger a download using an anchor element
        downloadExportedFile(outputUrl, suggestedName);
        return true;
      }
    } catch (e) {
      console.warn('Download failed:', e);
      return false;
    }
  };
  useEffect(() => {
    if (progress?.status === 'completed') {
      if (!hasTriggeredDownload) {
        void handleDownload().then((ok) => {
          if (ok) setHasTriggeredDownload(true);
        });
      }
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // Auto-close after 3 seconds
      return () => clearTimeout(timer);
    } else {
      // Reset flag if a new export starts or status changes away from completed
      if (hasTriggeredDownload) setHasTriggeredDownload(false);
    }
  }, [progress?.status, currentJob?.outputPath, onClose, hasTriggeredDownload]);

  if (!isOpen) return null;
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background-primary border border-border-subtle rounded-lg max-w-2xl w-full mx-4 max-h-screen overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-subtle">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">
              Export Video
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              Export "{project?.name ?? 'Test Project'}" as video
            </p>
          </div>
          {!isExporting && (
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary p-1 rounded transition-colors"
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
          )}
        </div>

        <div className="flex-1 overflow-hidden">
          {isExporting ? (
            // Export Progress View
            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-text-primary">
                    {progress?.status === 'preparing' && 'Preparing export...'}
                    {progress?.status === 'rendering' && 'Rendering video...'}
                    {progress?.status === 'finalizing' && 'Finalizing...'}
                    {progress?.status === 'completed' && 'Export completed!'}
                    {progress?.status === 'failed' && 'Export failed'}
                    {progress?.status === 'cancelled' && 'Export cancelled'}
                  </span>
                  <span className="text-sm text-text-secondary">
                    {Math.round(progress?.progress || 0)}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-neutral-700 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress?.progress || 0}%` }}
                  />
                </div>
              </div>

              {/* Progress Details */}
              {progress && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  {progress.currentFrame && progress.totalFrames && (
                    <div>
                      <span className="text-text-secondary">Frame:</span>
                      <span className="text-text-primary ml-2">
                        {progress.currentFrame} / {progress.totalFrames}
                      </span>
                    </div>
                  )}

                  {progress.estimatedTimeRemaining && (
                    <div>
                      <span className="text-text-secondary">
                        Time remaining:
                      </span>
                      <span className="text-text-primary ml-2">
                        {formatDuration(progress.estimatedTimeRemaining)}
                      </span>
                    </div>
                  )}

                  {progress.averageFrameTime && (
                    <div>
                      <span className="text-text-secondary">Frame time:</span>
                      <span className="text-text-primary ml-2">
                        {Math.round(progress.averageFrameTime)}ms
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Error Message */}
              {progress?.status === 'failed' && progress.errorMessage && (
                <div className="mt-4 p-3 bg-red-900/20 border border-red-700 rounded">
                  <p className="text-red-400 text-sm">
                    {progress.errorMessage}
                  </p>
                </div>
              )}

              {/* Success Message */}
              {progress?.status === 'completed' && (
                <div className="mt-4 p-3 bg-green-900/20 border border-green-700 rounded">
                  <p className="text-green-400 text-sm">
                    Export completed successfully!
                  </p>
                  <div className="mt-3 flex gap-3">
                    <button
                      onClick={() => void handleDownload()}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded transition-colors"
                    >
                      Download file
                    </button>
                    <a
                      href={(currentJob as any)?.outputPath || '#'}
                      download
                      className="px-4 py-2 border border-border-subtle rounded text-text-secondary hover:text-text-primary hover:bg-background-secondary transition-colors"
                    >
                      Open link
                    </a>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-6">
                {(progress?.status === 'preparing' ||
                  progress?.status === 'rendering') && (
                  <button
                    onClick={handleCancelExport}
                    className="px-4 py-2 text-text-secondary hover:text-text-primary border border-border-subtle rounded hover:bg-background-secondary transition-colors"
                  >
                    Cancel Export
                  </button>
                )}

                {(progress?.status === 'completed' ||
                  progress?.status === 'failed' ||
                  progress?.status === 'cancelled') && (
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded transition-colors"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          ) : (
            // Export Settings View
            <div className="overflow-y-auto max-h-96">
              {/* Auth/Membership gating - Hidden in development mode */}
              {process.env.NODE_ENV !== 'development' && !authenticated && (
                <div className="p-6 border-b border-border-subtle">
                  <div className="mb-2">
                    <h3 className="text-lg font-semibold text-text-primary">
                      Sign in required
                    </h3>
                    <p className="text-sm text-text-secondary">
                      Create an account or sign in to export videos.
                    </p>
                  </div>
                  <AuthInlineForm />
                </div>
              )}
              {process.env.NODE_ENV !== 'development' &&
                authenticated &&
                !membership?.active && (
                  <div className="p-6 border-b border-border-subtle">
                    <div className="mb-3">
                      <h3 className="text-lg font-semibold text-text-primary">
                        Unlock exports
                      </h3>
                      <p className="text-sm text-text-secondary">
                        You have {trialsRemaining} of {trialsLimit || 2} trial
                        exports remaining. Support us on Ko‑fi to unlock
                        unlimited exports for 30 days.
                      </p>
                    </div>
                    <button
                      onClick={() => void donateDemo(500)}
                      disabled={authLoading}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded disabled:opacity-60"
                    >
                      {authLoading ? 'Processing…' : 'Support on Ko‑fi (demo)'}
                    </button>
                  </div>
                )}
              {/* Development mode notice */}
              {process.env.NODE_ENV === 'development' && (
                <div className="p-6 border-b border-border-subtle">
                  <div className="mb-2">
                    <h3 className="text-lg font-semibold text-green-600">
                      🚧 Development Mode
                    </h3>
                    <p className="text-sm text-text-secondary">
                      Authentication is bypassed in development mode. You can
                      export without signing in.
                    </p>
                  </div>
                </div>
              )}
              {/* Tabs */}
              <div className="flex border-b border-border-subtle">
                <button
                  onClick={() => setActiveTab('presets')}
                  className={`px-6 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'presets'
                      ? 'text-primary-400 border-b-2 border-primary-400'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Presets
                </button>
                <button
                  onClick={() => setActiveTab('custom')}
                  className={`px-6 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'custom'
                      ? 'text-primary-400 border-b-2 border-primary-400'
                      : 'text-text-secondary hover:text-primary-400'
                  }`}
                >
                  Custom Settings
                </button>
              </div>

              <div className="p-6">
                {/* File name input */}
                <div className="mb-6">
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Video name
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      value={outputName}
                      onChange={(e) => setOutputName(e.target.value)}
                      placeholder={project?.name || 'My Video'}
                      className="flex-1 p-2 bg-background-secondary border border-border-subtle rounded text-sm text-text-primary"
                    />
                    <span className="text-xs text-text-secondary whitespace-nowrap">
                      .{settings.format}
                    </span>
                  </div>
                </div>
                {activeTab === 'presets' ? (
                  // Presets Tab
                  <div
                    className="space-y-4"
                    role="radiogroup"
                    aria-label="Export presets"
                  >
                    {presets.map((preset) => (
                      <div
                        key={preset.id}
                        role="radio"
                        aria-checked={selectedPresetId === preset.id}
                        tabIndex={0}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedPresetId === preset.id
                            ? 'border-primary-400 bg-primary-900/20 ring-1 ring-primary-500'
                            : 'border-border-subtle hover:border-border-primary'
                        }`}
                        onClick={() => handlePresetSelect(preset)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ')
                            handlePresetSelect(preset);
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium text-text-primary flex items-center gap-2">
                              {preset.name}
                              {selectedPresetId === preset.id && (
                                <span className="ml-2 text-xxs uppercase tracking-wide text-primary-300 bg-primary-900/40 px-2 py-0.5 rounded">
                                  Selected
                                </span>
                              )}
                            </h3>
                            <p className="text-sm text-text-secondary mt-1">
                              {preset.description}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-text-secondary">
                              <span>
                                {preset.settings.format?.toUpperCase()}
                              </span>
                              <span>{preset.settings.quality}</span>
                              {preset.settings.width &&
                                preset.settings.height && (
                                  <span>
                                    {preset.settings.width}×
                                    {preset.settings.height}
                                  </span>
                                )}
                            </div>
                          </div>
                          <div className="flex items-center">
                            {selectedPresetId === preset.id && (
                              <div className="w-4 h-4 bg-primary-600 rounded-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Custom Settings Tab
                  <div className="space-y-6">
                    {/* Video Settings */}
                    <div>
                      <h3 className="text-sm font-medium text-text-primary mb-3">
                        Video Settings
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-text-secondary mb-1">
                            Format
                          </label>
                          <select
                            value={settings.format}
                            onChange={(e) =>
                              updateSettings({
                                format: e.target.value as VideoFormat,
                              })
                            }
                            className="w-full p-2 bg-background-secondary border border-border-subtle rounded text-sm text-text-primary"
                          >
                            <option value="mp4">MP4</option>
                            <option value="webm">WebM</option>
                            <option value="mov">MOV</option>
                          </select>
                        </div>

                        {/* Orientation toggle (Landscape vs Vertical/Portrait) */}
                        <div>
                          <label className="block text-xs font-medium text-text-secondary mb-1">
                            Orientation
                          </label>
                          {(() => {
                            const currentWidth =
                              settings.width ||
                              project?.settings?.width ||
                              1920;
                            const currentHeight =
                              settings.height ||
                              project?.settings?.height ||
                              1080;
                            const isVertical = currentHeight > currentWidth;
                            return (
                              <button
                                type="button"
                                onClick={() => {
                                  if (isVertical) {
                                    // Switch to landscape 16:9 default
                                    updateSettings({
                                      width: 1920,
                                      height: 1080,
                                    });
                                  } else {
                                    // Switch to portrait 9:16 default
                                    updateSettings({
                                      width: 1080,
                                      height: 1920,
                                    });
                                  }
                                }}
                                className={`w-full p-2 border rounded text-sm transition-colors ${
                                  isVertical
                                    ? 'border-primary-400 bg-primary-900/20 text-text-primary'
                                    : 'border-border-subtle bg-background-secondary text-text-primary'
                                }`}
                                title="Toggle between landscape (16:9) and vertical (9:16)"
                              >
                                {isVertical
                                  ? 'Vertical (9:16)'
                                  : 'Landscape (16:9)'}
                              </button>
                            );
                          })()}
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-text-secondary mb-1">
                            Codec
                          </label>
                          <select
                            value={settings.codec}
                            onChange={(e) =>
                              updateSettings({
                                codec: e.target.value as VideoCodec,
                              })
                            }
                            className="w-full p-2 bg-background-secondary border border-border-subtle rounded text-sm text-text-primary"
                          >
                            <option value="h264">H.264</option>
                            <option value="h265">H.265</option>
                            <option value="vp8">VP8</option>
                            <option value="vp9">VP9</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-text-secondary mb-1">
                            Quality
                          </label>
                          <select
                            value={settings.quality}
                            onChange={(e) =>
                              updateSettings({
                                quality: e.target.value as ExportQuality,
                              })
                            }
                            className="w-full p-2 bg-background-secondary border border-border-subtle rounded text-sm text-text-primary"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="ultra">Ultra</option>
                          </select>
                        </div>

                        {/* Vertical resolution presets (shown when in Vertical mode) */}
                        {(() => {
                          const currentWidth =
                            settings.width || project?.settings?.width || 1920;
                          const currentHeight =
                            settings.height ||
                            project?.settings?.height ||
                            1080;
                          const isVertical = currentHeight > currentWidth;
                          if (!isVertical) return null;
                          return (
                            <div>
                              <label className="block text-xs font-medium text-text-secondary mb-1">
                                Vertical resolution presets
                              </label>
                              <select
                                value={`${currentWidth}x${currentHeight}`}
                                onChange={(e) => {
                                  const [w, h] = e.target.value
                                    .split('x')
                                    .map((n) => parseInt(n, 10));
                                  if (!isNaN(w) && !isNaN(h)) {
                                    updateSettings({ width: w, height: h });
                                  }
                                }}
                                className="w-full p-2 bg-background-secondary border border-border-subtle rounded text-sm text-text-primary"
                              >
                                <option value="720x1280">720×1280 (HD)</option>
                                <option value="1080x1920">
                                  1080×1920 (Full HD)
                                </option>
                                <option value="2160x3840">
                                  2160×3840 (4K)
                                </option>
                              </select>
                              <p className="text-xs text-text-secondary mt-1">
                                Choose a portrait preset or set a custom size
                                below.
                              </p>
                            </div>
                          );
                        })()}

                        <div>
                          <label className="block text-xs font-medium text-text-secondary mb-1">
                            Resolution
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              value={
                                settings.width ||
                                project?.settings?.width ||
                                1920
                              }
                              onChange={(e) =>
                                updateSettings({
                                  width: parseInt(e.target.value),
                                })
                              }
                              className="flex-1 p-2 bg-background-secondary border border-border-subtle rounded text-sm text-text-primary"
                              placeholder="Width"
                            />
                            <span className="flex items-center text-text-secondary">
                              ×
                            </span>
                            <input
                              type="number"
                              value={
                                settings.height ||
                                project?.settings?.height ||
                                1080
                              }
                              onChange={(e) =>
                                updateSettings({
                                  height: parseInt(e.target.value),
                                })
                              }
                              className="flex-1 p-2 bg-background-secondary border border-border-subtle rounded text-sm text-text-primary"
                              placeholder="Height"
                            />
                          </div>
                          <p className="text-xs text-text-secondary mt-1">
                            Enter any custom width × height. For
                            Shorts/TikTok/Reels, use portrait sizes like
                            1080×1920.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Audio Settings */}
                    <div>
                      <h3 className="text-sm font-medium text-text-primary mb-3">
                        Audio Settings
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-text-secondary mb-1">
                            Audio Codec
                          </label>
                          <select
                            value={settings.audioCodec}
                            onChange={(e) =>
                              updateSettings({
                                audioCodec: e.target.value as AudioCodec,
                              })
                            }
                            className="w-full p-2 bg-background-secondary border border-border-subtle rounded text-sm text-text-primary"
                          >
                            <option value="aac">AAC</option>
                            <option value="mp3">MP3</option>
                            <option value="opus">Opus</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-text-secondary mb-1">
                            Audio Bitrate (kbps)
                          </label>
                          <input
                            type="number"
                            value={settings.audioBitrate || 128}
                            onChange={(e) =>
                              updateSettings({
                                audioBitrate: parseInt(e.target.value),
                              })
                            }
                            className="w-full p-2 bg-background-secondary border border-border-subtle rounded text-sm text-text-primary"
                            min="64"
                            max="320"
                            step="32"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Transparency Settings */}
                    <div>
                      <h3 className="text-sm font-medium text-text-primary mb-3">
                        Transparency Settings
                      </h3>

                      {/* Transparency Toggle */}
                      <div className="mb-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.transparentBackground || false}
                            onChange={(e) =>
                              updateSettings({
                                transparentBackground: e.target.checked,
                              })
                            }
                            className="w-4 h-4 text-primary-600 bg-background-secondary border-border-subtle rounded focus:ring-primary-500 focus:ring-2"
                          />
                          <span className="text-sm text-text-primary">
                            Enable transparent background
                          </span>
                        </label>
                        <p className="text-xs text-text-secondary mt-1 ml-6">
                          Export with alpha channel for compositing over other
                          content
                        </p>
                      </div>

                      {/* Format Compatibility Warning */}
                      {(() => {
                        const warning =
                          getTransparencyCompatibilityWarning(settings);
                        if (!warning) return null;

                        return (
                          <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-700 rounded">
                            <div className="flex items-start gap-2">
                              <svg
                                className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <p className="text-xs text-yellow-200">
                                {warning}
                              </p>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Background Inclusion Options */}
                      {settings.transparentBackground && (
                        <div className="space-y-3">
                          <div className="text-xs font-medium text-text-secondary mb-2">
                            Background Elements to Include:
                          </div>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.includeWallpaper ?? true}
                              onChange={(e) =>
                                updateSettings({
                                  includeWallpaper: e.target.checked,
                                })
                              }
                              className="w-4 h-4 text-primary-600 bg-background-secondary border-border-subtle rounded focus:ring-primary-500 focus:ring-2"
                            />
                            <span className="text-sm text-text-primary">
                              Include wallpaper backgrounds
                            </span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.includeGradient ?? true}
                              onChange={(e) =>
                                updateSettings({
                                  includeGradient: e.target.checked,
                                })
                              }
                              className="w-4 h-4 text-primary-600 bg-background-secondary border-border-subtle rounded focus:ring-primary-500 focus:ring-2"
                            />
                            <span className="text-sm text-text-primary">
                              Include gradient backgrounds
                            </span>
                          </label>

                          <div className="mt-3 p-3 bg-blue-900/20 border border-blue-700 rounded">
                            <div className="flex items-start gap-2">
                              <svg
                                className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <div className="text-xs text-blue-200">
                                <p className="font-medium mb-1">
                                  Transparency Preview
                                </p>
                                <div className="w-full h-8 bg-transparent border border-blue-400 rounded relative overflow-hidden">
                                  <div
                                    className="absolute inset-0 opacity-20"
                                    style={{
                                      backgroundImage: `
                                        linear-gradient(45deg, #666 25%, transparent 25%), 
                                        linear-gradient(-45deg, #666 25%, transparent 25%), 
                                        linear-gradient(45deg, transparent 75%, #666 75%), 
                                        linear-gradient(-45deg, transparent 75%, #666 75%)
                                      `,
                                      backgroundSize: '8px 8px',
                                      backgroundPosition:
                                        '0 0, 0 4px, 4px -4px, -4px 0px',
                                    }}
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-xs text-blue-300 font-mono">
                                      Transparent
                                    </span>
                                  </div>
                                </div>
                                <p className="mt-1">
                                  Checkerboard pattern indicates transparent
                                  areas
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isExporting && (
          <div className="flex items-center justify-between p-6 border-t border-border-subtle bg-background-secondary">
            <div className="text-sm text-text-secondary">
              <div>
                Estimated file size:{' '}
                <span className="text-text-primary">
                  {formatFileSize(estimatedSize)}
                </span>
              </div>
              <div className="mt-1">
                Duration:{' '}
                <span className="text-text-primary">
                  {formatDuration(project?.settings?.duration ?? 0)}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {/* Validation Warnings */}
              {(() => {
                const validation = validateTransparencySettings(settings);
                if (!validation.errors.length && !validation.warnings.length)
                  return null;

                return (
                  <div className="space-y-2">
                    {validation.errors.map((error, index) => (
                      <div
                        key={`error-${index}`}
                        className="flex items-start gap-2 p-2 bg-red-900/20 border border-red-700 rounded"
                      >
                        <svg
                          className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <p className="text-xs text-red-200">{error}</p>
                      </div>
                    ))}
                    {validation.warnings.map((warning, index) => (
                      <div
                        key={`warning-${index}`}
                        className="flex items-start gap-2 p-2 bg-yellow-900/20 border border-yellow-700 rounded"
                      >
                        <svg
                          className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <p className="text-xs text-yellow-200">{warning}</p>
                      </div>
                    ))}
                  </div>
                );
              })()}

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-text-secondary hover:text-text-primary border border-border-subtle rounded hover:bg-background-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  aria-label="Start export"
                  title="Start export"
                  onClick={handleStartExport}
                  disabled={
                    !canStartExport ||
                    (process.env.NODE_ENV !== 'development' &&
                      !authenticated) ||
                    (process.env.NODE_ENV !== 'development' &&
                      !(membership?.active || trialsRemaining > 0)) ||
                    !validateTransparencySettings(settings).isValid
                  }
                  className="px-6 py-3 min-w-[180px] inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 border-border-subtle rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 active:translate-y-[1px] transition-all disabled:bg-neutral-600 disabled:cursor-not-allowed"
                >
                  <svg
                    aria-hidden="true"
                    className="w-5 h-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M6 4l10 6-10 6V4z" />
                  </svg>
                  <span>
                    {process.env.NODE_ENV === 'development'
                      ? 'Start Export (Dev Mode)'
                      : !authenticated
                        ? 'Sign in to export'
                        : membership?.active
                          ? 'Start Export'
                          : trialsRemaining > 0
                            ? `Start Export (trial ${trialsUsed + 1}/${trialsLimit || 2})`
                            : 'Unlock to export'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Inline auth form used in export dialog
const AuthInlineForm: React.FC = () => {
  const { login, signup, loading, error } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') await login({ email, password });
    else await signup({ email, password, name });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      {mode === 'signup' && (
        <input
          className="w-full p-2 bg-background-secondary border border-border-subtle rounded text-sm text-text-primary"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      )}
      <input
        className="w-full p-2 bg-background-secondary border border-border-subtle rounded text-sm text-text-primary"
        placeholder="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        className="w-full p-2 bg-background-secondary border border-border-subtle rounded text-sm text-text-primary"
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {error && <div className="text-xs text-red-500">{String(error)}</div>}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded disabled:opacity-60"
        >
          {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Sign up'}
        </button>
        <button
          type="button"
          onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          className="text-sm text-primary-400 hover:text-primary-300"
        >
          {mode === 'login' ? 'Create an account' : 'Have an account? Sign in'}
        </button>
      </div>
    </form>
  );
};
