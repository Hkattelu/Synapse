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
import { formatFileSize, formatDuration } from '../lib/exportManagerClient';
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
  const { isExporting, progress, canStartExport } = useExportStatus();
  const {
    authenticated,
    membership,
    donateDemo,
    loading: authLoading,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [selectedPresetId, setSelectedPresetId] =
    useState<string>('youtube-1080p');

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
      await startExport(project);
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

  // Close dialog when export completes successfully
  useEffect(() => {
    if (progress?.status === 'completed') {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // Auto-close after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [progress?.status, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-background-primary border border-border-subtle rounded-lg max-w-2xl w-full mx-4 max-h-screen overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-subtle">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">
              Export Video
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              Export "{project?.name ?? 'Test Project'}" as video file
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
                    Export completed successfully! The file will be available in
                    your downloads.
                  </p>
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
              {/* Auth/Membership gating */}
              {!authenticated && (
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
              {authenticated && !membership?.active && (
                <div className="p-6 border-b border-border-subtle">
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold text-text-primary">
                      Unlock exports
                    </h3>
                    <p className="text-sm text-text-secondary">
                      A one-time donation activates your membership for 30 days.
                    </p>
                  </div>
                  <button
                    onClick={() => void donateDemo(500)}
                    disabled={authLoading}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded disabled:opacity-60"
                  >
                    {authLoading ? 'Processing…' : 'Donate $5 (demo)'}
                  </button>
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
                {activeTab === 'presets' ? (
                  // Presets Tab
                  <div className="space-y-4">
                    {presets.map((preset) => (
                      <div
                        key={preset.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedPresetId === preset.id
                            ? 'border-primary-400 bg-primary-900/20'
                            : 'border-border-subtle hover:border-border-primary'
                        }`}
                        onClick={() => handlePresetSelect(preset)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium text-text-primary">
                              {preset.name}
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

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-text-secondary hover:text-text-primary border border-border-subtle rounded hover:bg-background-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStartExport}
                disabled={
                  !canStartExport || !authenticated || !membership?.active
                }
                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-600 disabled:cursor-not-allowed text-white rounded transition-colors"
              >
                {!authenticated
                  ? 'Sign in to export'
                  : !membership?.active
                    ? 'Unlock to export'
                    : 'Start Export'}
              </button>
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
