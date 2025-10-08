import type {
  ExportSettings,
  ExportProgress,
  ExportJob,
  Project,
  ExportPreset,
  ExportQuality,
} from './types';
import { api, ApiError } from './api';
import {
  validateExportSettings as validateFull,
  getFormatRecommendations,
  isTransparencySupported as isSupported,
  getTransparencyCompatibilityWarning as getWarning,
  validateTransparencySettings as validateTransparencyFull,
} from './validation/exportValidation';
import type {
  ExportValidationResult,
  ExportCompatibilityIssue,
} from './validation/exportValidation';

// Export presets for common use cases
export const DEFAULT_EXPORT_PRESETS: ExportPreset[] = [
  {
    id: 'youtube-1080p',
    name: 'YouTube 1080p',
    description: 'Optimized for YouTube uploads',
    category: 'web',
    isDefault: true,
    settings: {
      format: 'mp4',
      codec: 'h264',
      quality: 'high',
      width: 1920,
      height: 1080,
      fps: 30,
      audioCodec: 'aac',
      audioBitrate: 128,
      audioSampleRate: 48000,
    },
  },
  {
    id: 'twitter-720p',
    name: 'Twitter/X 720p',
    description: 'Optimized for Twitter/X posts',
    category: 'social',
    settings: {
      format: 'mp4',
      codec: 'h264',
      quality: 'medium',
      width: 1280,
      height: 720,
      fps: 30,
      audioCodec: 'aac',
      audioBitrate: 128,
      audioSampleRate: 44100,
    },
  },
  {
    id: 'instagram-square',
    name: 'Instagram Square',
    description: 'Square format for Instagram posts',
    category: 'social',
    settings: {
      format: 'mp4',
      codec: 'h264',
      quality: 'medium',
      width: 1080,
      height: 1080,
      fps: 30,
      audioCodec: 'aac',
      audioBitrate: 128,
      audioSampleRate: 44100,
    },
  },
  // Portrait / vertical presets for shorts workflows
  {
    id: 'vertical-1080x1920',
    name: 'Vertical 1080×1920',
    description: 'Portrait Full HD (9:16) for Shorts/Reels/TikTok',
    category: 'social',
    settings: {
      format: 'mp4',
      codec: 'h264',
      quality: 'high',
      width: 1080,
      height: 1920,
      fps: 30,
      audioCodec: 'aac',
      audioBitrate: 128,
      audioSampleRate: 48000,
    },
  },
  {
    id: 'vertical-720x1280',
    name: 'Vertical 720×1280',
    description: 'Portrait HD (9:16)',
    category: 'social',
    settings: {
      format: 'mp4',
      codec: 'h264',
      quality: 'medium',
      width: 720,
      height: 1280,
      fps: 30,
      audioCodec: 'aac',
      audioBitrate: 128,
      audioSampleRate: 44100,
    },
  },
  {
    id: 'vertical-2160x3840',
    name: 'Vertical 2160×3840 (4K)',
    description: 'Portrait 4K (9:16)',
    category: 'social',
    settings: {
      format: 'mp4',
      codec: 'h264',
      quality: 'ultra',
      width: 2160,
      height: 3840,
      fps: 30,
      audioCodec: 'aac',
      audioBitrate: 192,
      audioSampleRate: 48000,
    },
  },
  {
    id: 'high-quality-archive',
    name: 'High Quality Archive',
    description: 'Lossless quality for archival purposes',
    category: 'archive',
    settings: {
      format: 'mov',
      codec: 'h264',
      quality: 'ultra',
      crf: 10,
      audioCodec: 'aac',
      audioBitrate: 320,
      audioSampleRate: 48000,
      enableHardwareAcceleration: false,
    },
  },
  // Transparency-enabled presets
  {
    id: 'transparent-overlay',
    name: 'Transparent Overlay',
    description: 'Transparent background for compositing over other content',
    category: 'custom',
    settings: {
      format: 'mov',
      codec: 'h264',
      quality: 'high',
      audioCodec: 'aac',
      audioBitrate: 128,
      audioSampleRate: 48000,
      transparentBackground: true,
      includeWallpaper: false,
      includeGradient: false,
    },
  },
  {
    id: 'transparent-with-backgrounds',
    name: 'Transparent with Backgrounds',
    description: 'Transparent background but includes wallpapers and gradients',
    category: 'custom',
    settings: {
      format: 'mov',
      codec: 'h264',
      quality: 'high',
      audioCodec: 'aac',
      audioBitrate: 128,
      audioSampleRate: 48000,
      transparentBackground: true,
      includeWallpaper: true,
      includeGradient: true,
    },
  },
  {
    id: 'webm-transparent',
    name: 'WebM Transparent',
    description: 'WebM format with VP9 codec for web transparency',
    category: 'web',
    settings: {
      format: 'webm',
      codec: 'vp9',
      quality: 'high',
      audioCodec: 'opus',
      audioBitrate: 128,
      audioSampleRate: 48000,
      transparentBackground: true,
      includeWallpaper: false,
      includeGradient: false,
    },
  },
];

// Default export settings
export const getDefaultExportSettings = (project: Project): ExportSettings => ({
  format: 'mp4',
  codec: 'h264',
  quality: 'high',
  width: project.settings.width,
  height: project.settings.height,
  fps: project.settings.fps,
  audioCodec: 'aac',
  audioBitrate: 128,
  audioSampleRate: project.settings.audioSampleRate || 48000,
  enableHardwareAcceleration: true,
  enableMultithreading: true,
  concurrency: 4,
  // Transparency settings (default to false for backward compatibility)
  transparentBackground: false,
  includeWallpaper: true,
  includeGradient: true,
});

// Quality settings mapping
const getQualitySettings = (quality: ExportQuality) => {
  switch (quality) {
    case 'low':
      return { crf: 28, bitrate: 1000 };
    case 'medium':
      return { crf: 23, bitrate: 3000 };
    case 'high':
      return { crf: 18, bitrate: 8000 };
    case 'ultra':
      return { crf: 12, bitrate: 15000 };
    default:
      return { crf: 18, bitrate: 8000 };
  }
};

// Sanitize a user-provided file base name (no extension)
const sanitizeFileBase = (name: string): string => {
  const trimmed = name.trim();
  // Replace illegal filename characters with dashes and collapse repeats
  const cleaned = trimmed
    .replace(/[^a-zA-Z0-9 _.-]+/g, '-')
    .replace(/-+/g, '-');
  // Avoid empty names
  return cleaned || 'export';
};

// Generate output filename
const generateOutputFilename = (
  project: Project,
  settings: ExportSettings
): string => {
  const ext = settings.format;
  if (settings.outputName && typeof settings.outputName === 'string') {
    const base = sanitizeFileBase(settings.outputName);
    return `${base}.${ext}`;
  }
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
  const qualityLabel =
    settings.quality.charAt(0).toUpperCase() + settings.quality.slice(1);
  const resolution = `${settings.width || project.settings.width}x${settings.height || project.settings.height}`;

  return `${project.name}_${qualityLabel}_${resolution}_${timestamp}.${ext}`;
};

// Create export job
export const createExportJob = (
  project: Project,
  settings: ExportSettings,
  maxRetries: number = 3
): ExportJob => {
  const jobId = `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    id: jobId,
    projectId: project.id,
    projectName: project.name,
    settings,
    progress: {
      status: 'idle',
      progress: 0,
    },
    createdAt: new Date(),
    retryCount: 0,
    maxRetries,
  };
};

// Progress callback type
export type ProgressCallback = (progress: ExportProgress) => void;

// Browser-compatible export manager class
export class ClientExportManager {
  private currentJob: ExportJob | null = null;
  private isExporting = false;
  private progressCallback: ProgressCallback | null = null;
  private abortController: AbortController | null = null;

  // Set progress callback
  public setProgressCallback(callback: ProgressCallback | null): void {
    this.progressCallback = callback;
  }

  // Get current export status
  public getCurrentJob(): ExportJob | null {
    return this.currentJob;
  }

  public isCurrentlyExporting(): boolean {
    return this.isExporting;
  }

  // Update progress
  private updateProgress(updates: Partial<ExportProgress>): void {
    if (!this.currentJob) return;

    this.currentJob.progress = {
      ...this.currentJob.progress,
      ...updates,
    };

    this.progressCallback?.(this.currentJob.progress);
  }

  // Start export process (browser version - communicates with server for authorization and job progress)
  public async startExport(
    project: Project,
    settings: ExportSettings
  ): Promise<string> {
    if (this.isExporting) {
      throw new Error('Export already in progress');
    }

    // Validate export settings before starting
    const validation = validateExportSettings(settings);
    if (!validation.isValid) {
      const errorMessage = `Export validation failed: ${validation.errors.join(', ')}`;
      throw new Error(errorMessage);
    }

    // Log warnings and recommendations
    if (validation.warnings.length > 0) {
      console.warn('Export warnings:', validation.warnings);
    }

    // Recommendations (only when present and array)
    const hasRecommendations = (
      v: unknown
    ): v is { recommendations: unknown[] } =>
      typeof v === 'object' &&
      v !== null &&
      'recommendations' in (v as Record<string, unknown>) &&
      Array.isArray((v as { recommendations?: unknown }).recommendations);

    if (
      hasRecommendations(validation) &&
      validation.recommendations.length > 0
    ) {
      console.info('Export recommendations:', validation.recommendations);
    }

    // Log compatibility issues (guard + type predicate for severity)
    const hasCompatibilityIssues = (
      v: unknown
    ): v is { compatibilityIssues: unknown[] } =>
      typeof v === 'object' &&
      v !== null &&
      'compatibilityIssues' in (v as Record<string, unknown>) &&
      Array.isArray(
        (v as { compatibilityIssues?: unknown }).compatibilityIssues
      );

    if (
      hasCompatibilityIssues(validation) &&
      validation.compatibilityIssues.length > 0
    ) {
      const issuesWithSeverity = (
        validation.compatibilityIssues as unknown[]
      ).filter(
        (i): i is ExportCompatibilityIssue =>
          typeof i === 'object' &&
          i !== null &&
          'severity' in (i as Record<string, unknown>) &&
          typeof (i as { severity?: unknown }).severity === 'string'
      );

      const errors = issuesWithSeverity.filter(
        (issue) => issue.severity === 'error'
      );
      const warnings = issuesWithSeverity.filter(
        (issue) => issue.severity === 'warning'
      );
      if (errors.length > 0) {
        console.error('Export compatibility errors:', errors);
      }

      if (warnings.length > 0) {
        console.warn('Export compatibility warnings:', warnings);
      }
    }

    this.currentJob = createExportJob(project, settings);
    this.isExporting = true;
    this.abortController = new AbortController();

    try {
      // Attempt loop (avoids recursive re-entry while isExporting is true)
      // Will retry up to maxRetries on transient failures.
      // Status is updated between attempts to surface errors in UI.
      while (true) {
        try {
          this.updateProgress({
            status: 'preparing',
            progress: 0,
            startTime: this.currentJob?.progress?.startTime || new Date(),
          });

          // Generate output filename (each attempt may time-stamp differently)
          const outputFilename = generateOutputFilename(project, settings);

          // Prevent export if any asset still uses a local-only URL scheme the server cannot fetch
          const isElectron = (() => {
            try {
              // Presence of SynapseFS indicates Electron renderer with preload
              // Fallback: process.versions.electron if available
              return Boolean((globalThis as any)?.window?.SynapseFS) ||
                Boolean((globalThis as any)?.process?.versions?.electron);
            } catch {
              return false;
            }
          })();

          const mediaAssets = Array.isArray(project.mediaAssets)
            ? project.mediaAssets
            : [];

          const offending: { name: string; url: string }[] = [];
          for (const a of mediaAssets) {
            const url = typeof a?.url === 'string' ? a.url : '';
            if (!url) continue;
            const name = String(a?.name || a?.id || 'unnamed');
            if (url.startsWith('blob:')) offending.push({ name, url });
            else if (url.startsWith('data:')) offending.push({ name, url });
            else if (!isElectron && url.startsWith('file:')) offending.push({ name, url });
          }

          if (offending.length > 0) {
            const details = offending
              .slice(0, 5)
              .map((o) => `${o.name} -> ${o.url.slice(0, 64)}…`)
              .join('; ');
            const hint = isElectron
              ? 'Please upload local recordings (blob:/data:) before exporting.'
              : 'Please wait for uploads to finish (blob:/data:/file:). Open the Uploads panel to retry/resolve.';
            throw new Error(
              `Some media are not server-readable: ${details}. ${hint}`
            );
          }

          // Prepare export payload for legacy server (kept for backward compatibility)
          const exportPayload = {
            project: {
              id: project.id,
              name: project.name,
              timeline: project.timeline,
              mediaAssets: project.mediaAssets,
              settings: project.settings,
            },
            settings,
            outputFilename,
            jobId: this.currentJob!.id,
          };

          // Prefer new render API if available; fallback to legacy export jobs
          let serverJobId: string | null = null;
          let useRenderApi = false;
          try {
            const inputProps = {
              // Pass project identifiers so server can attribute renders
              project: { id: project.id, name: project.name },
              timeline: project.timeline,
              mediaAssets: project.mediaAssets,
              settings: {
                width: settings.width || project.settings.width,
                height: settings.height || project.settings.height,
                fps: project.settings.fps,
                // Prefer explicit project duration; otherwise derive from timeline, fallback to 60s
                duration:
                  project.settings.duration && project.settings.duration > 0
                    ? project.settings.duration
                    : Math.max(
                        60,
                        Math.ceil(
                          (project.timeline || []).reduce(
                            (max, item) =>
                              Math.max(
                                max,
                                (Number(item.startTime) || 0) +
                                  (Number(item.duration) || 0)
                              ),
                            0
                          ) || 0
                        )
                      ),
                backgroundColor: project.settings.backgroundColor || '#000000',
              },
              exportSettings: {
                format: settings.format,
                codec: settings.codec,
                quality: settings.quality,
                audioCodec: settings.audioCodec,
                transparentBackground: !!settings.transparentBackground,
                includeWallpaper: settings.includeWallpaper !== false,
                includeGradient: settings.includeGradient !== false,
              },
              // Pass desired filename to the server render pipeline as a hint
              outputFilename,
            };
            const { jobId } = await api.startRender(inputProps);
            serverJobId = jobId;
            useRenderApi = true;
          } catch (e) {
            if (e instanceof ApiError && (e.status === 404 || e.status === 405)) {
              // Fallback to legacy endpoint
              const { id } = await api.createExportJob(exportPayload, {
                signal: this.abortController?.signal,
              });
              serverJobId = id;
              useRenderApi = false;
            } else {
              throw e;
            }
          }

          this.updateProgress({ status: 'preparing', progress: 10 });

          // Poll server job for progress until completion
          await this.pollServerJob(serverJobId!, useRenderApi);

          console.log(`Export completed: ${outputFilename}`);
          return this.currentJob!.outputPath as string;
        } catch (error) {
          console.error('Export failed:', error);

          let errorMessage = 'Unknown error occurred';
          if (error instanceof ApiError) {
            if (error.status === 401)
              errorMessage = 'Authentication required to export';
            else if (error.status === 402)
              errorMessage = 'Membership required to export';
            else errorMessage = error.message;
          } else if (error instanceof Error) {
            errorMessage = error.message;
          }

          this.updateProgress({
            status: 'failed',
            errorMessage,
            endTime: new Date(),
          });

          // Check if we should retry
          if (
            this.currentJob &&
            this.currentJob.retryCount < this.currentJob.maxRetries
          ) {
            console.log(
              `Retrying export (attempt ${this.currentJob.retryCount + 1}/${this.currentJob.maxRetries})`
            );
            this.currentJob.retryCount++;
            // Wait before retrying
            await new Promise((resolve) => setTimeout(resolve, 2000));
            // Continue loop to retry without re-entering startExport()
            continue;
          }

          throw new Error(`Export failed: ${errorMessage}`);
        }
      }
    } finally {
      this.isExporting = false;
      this.abortController = null;
    }
  }

  private async pollServerJob(
    serverJobId: string,
    useRenderApi: boolean
  ): Promise<void> {
    if (!this.currentJob) return;
    const start = Date.now();
    const maxDurationMs = 5 * 60_000; // 5 minutes
    let delay = 600; // ms
    const maxDelay = 5_000;

    while (true) {
      // Abort/cancel handling: do not pass the aborted signal to cancel request
      if (this.abortController?.signal.aborted) {
        try {
          await api.cancelExportJob(serverJobId);
        } catch {
          // ignore; best-effort cancel
        }
        throw new Error('Export cancelled');
      }

      // Timeout guard
      if (Date.now() - start > maxDurationMs) {
        throw new Error('Export polling timed out');
      }

      const job = useRenderApi
        ? await api.getRenderStatus(serverJobId)
        : await api.getExportJob(serverJobId, {
            signal: this.abortController?.signal,
          });

      const status = (job.status || 'preparing') as ExportProgress['status'];
      const progress = Number(
        (job as any).progress ??
          (status === 'completed' ? 100 : status === 'rendering' ? 50 : 0)
      );

      // Compute ETA with smoothing using frames throughput if available
      const renderedFrames = Number((job as any).renderedFrames || 0);
      const totalFrames = Number((job as any).totalFrames || 0);
      let etaSeconds = 0;
      if (totalFrames > 0 && renderedFrames > 10) {
        // Use exponential moving average of fps
        const elapsedMs = Date.now() - start;
        const instantFps = renderedFrames / Math.max(0.001, elapsedMs / 1000);
        const prevAvg =
          (this.currentJob?.progress as any)?.averageFps || instantFps;
        const alpha = 0.25; // smoothing factor
        const averageFps = alpha * instantFps + (1 - alpha) * prevAvg;
        const remainingFrames = Math.max(0, totalFrames - renderedFrames);
        etaSeconds = Math.round(remainingFrames / Math.max(0.001, averageFps));
        this.updateProgress({
          averageFrameTime: Math.round(1000 / Math.max(0.001, averageFps)),
        });
      } else if (progress > 0) {
        // Fallback: proportion-based estimate
        const elapsedMs = Date.now() - start;
        etaSeconds = Math.round(
          ((100 - progress) / Math.max(1, progress)) * (elapsedMs / 1000)
        );
      }

      this.updateProgress({
        status,
        progress,
        currentFrame: renderedFrames || undefined,
        totalFrames: totalFrames || undefined,
        estimatedTimeRemaining: etaSeconds,
        queuePosition: (job as any).queuePosition,
        pendingCount: (job as any).pendingCount,
        activeCount: (job as any).activeCount,
        concurrency: (job as any).concurrency,
      });

      if (status === 'completed') {
        this.currentJob!.outputPath = useRenderApi
          ? api.renderDownloadUrl(serverJobId)
          : job.outputPath || `./exports/${job.outputFilename}`;
        this.currentJob!.completedAt = new Date();
        this.updateProgress({
          status: 'completed',
          progress: 100,
          endTime: new Date(),
        });
        return;
      }
      if (status === 'failed' || status === 'cancelled') {
        const reason =
          (job as any).error ||
          (status === 'cancelled' ? 'Export cancelled' : 'Export failed');
        throw new Error(reason);
      }

      await new Promise((r) => setTimeout(r, delay));
      delay = Math.min(Math.floor(delay * 1.5), maxDelay);
    }
  }

  // Cancel current export
  public cancelExport(): void {
    if (!this.isExporting || !this.currentJob) {
      return;
    }

    console.log('Cancelling export...');

    this.abortController?.abort();

    this.currentJob.cancelledAt = new Date();
    this.updateProgress({
      status: 'cancelled',
      endTime: new Date(),
    });

    this.isExporting = false;
    this.abortController = null;
  }

  // Map video codec to standardized format (for future server communication)
  public mapVideoCodec(codec: string): 'h264' | 'h265' | 'vp8' | 'vp9' {
    switch (codec) {
      case 'h264':
        return 'h264';
      case 'h265':
        return 'h265';
      case 'vp8':
        return 'vp8';
      case 'vp9':
        return 'vp9';
      default:
        return 'h264';
    }
  }

  // Map audio codec to standardized format (for future server communication)
  public mapAudioCodec(codec: string): 'aac' | 'mp3' | 'pcm-16' {
    switch (codec) {
      case 'aac':
        return 'aac';
      case 'mp3':
        return 'mp3';
      case 'pcm':
        return 'pcm-16';
      default:
        return 'aac';
    }
  }
}

// Create a singleton export manager instance
export const exportManager = new ClientExportManager();

// Utility functions
export const formatFileSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

export const estimateFileSize = (
  settings: ExportSettings,
  durationSeconds: number
): number => {
  // Rough estimation based on bitrate and duration
  const videoBitrate =
    settings.bitrate || getQualitySettings(settings.quality).bitrate;
  const audioBitrate = settings.audioBitrate || 128;

  const totalBitrate = videoBitrate + audioBitrate; // kbps
  const estimatedBytes = (totalBitrate * 1000 * durationSeconds) / 8; // Convert to bytes

  return Math.round(estimatedBytes);
};

// Enhanced export validation using the validation module
export const validateExportSettings = (settings: ExportSettings) => {
  try {
    return validateFull(settings);
  } catch (error) {
    console.error('Export validation error:', error);
    // Fallback to basic validation
    return validateTransparencySettingsBasic(settings);
  }
};

export const getExportRecommendations = (requirements: {
  needsTransparency?: boolean;
  targetPlatform?: 'web' | 'mobile' | 'desktop' | 'broadcast';
  prioritizeFileSize?: boolean;
  prioritizeQuality?: boolean;
  prioritizeCompatibility?: boolean;
}) => {
  try {
    return getFormatRecommendations(requirements);
  } catch (error) {
    console.error('Export recommendations error:', error);
    return [];
  }
};

// Transparency format validation (enhanced)
export const isTransparencySupported = (
  format: string,
  codec?: string
): boolean => {
  try {
    return isSupported(format as any);
  } catch (error) {
    console.error('Transparency support check error:', error);
    // Fallback to basic check
    return isTransparencySupportedBasic(format, codec);
  }
};

// Basic transparency support check (fallback)
const isTransparencySupportedBasic = (
  format: string,
  codec?: string
): boolean => {
  // MOV with H.264/H.265 supports alpha channel
  if (format === 'mov' && (!codec || codec === 'h264' || codec === 'h265')) {
    return true;
  }

  // WebM with VP8/VP9 supports alpha channel
  if (format === 'webm' && (!codec || codec === 'vp8' || codec === 'vp9')) {
    return true;
  }

  return false;
};

export const getTransparencyCompatibilityWarning = (
  settings: ExportSettings
): string | null => {
  try {
    return getWarning(settings);
  } catch (error) {
    console.error('Transparency warning error:', error);
    // Fallback to basic warning
    return getTransparencyCompatibilityWarningBasic(settings);
  }
};

// Basic transparency warning (fallback)
const getTransparencyCompatibilityWarningBasic = (
  settings: ExportSettings
): string | null => {
  if (!settings.transparentBackground) {
    return null;
  }

  if (!isTransparencySupportedBasic(settings.format, settings.codec)) {
    return `Transparent backgrounds are not supported with ${settings.format.toUpperCase()} + ${settings.codec.toUpperCase()}. Consider using MOV + H.264 or WebM + VP9.`;
  }

  return null;
};

export const getRecommendedTransparencySettings =
  (): Partial<ExportSettings> => {
    return {
      format: 'mov',
      codec: 'h264',
      quality: 'high',
      audioCodec: 'aac',
      transparentBackground: true,
      includeWallpaper: false,
      includeGradient: false,
    };
  };

// Validate export settings for transparency compatibility (enhanced)
export const validateTransparencySettings = (
  settings: ExportSettings
): { isValid: boolean; warnings: string[]; errors: string[] } => {
  try {
    return validateTransparencyFull(settings);
  } catch (error) {
    console.error('Transparency validation error:', error);
    // Fallback to basic validation
    return validateTransparencySettingsBasic(settings);
  }
};

// Basic transparency validation (fallback)
const validateTransparencySettingsBasic = (
  settings: ExportSettings
): { isValid: boolean; warnings: string[]; errors: string[] } => {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (settings.transparentBackground) {
    // Check format/codec compatibility
    if (!isTransparencySupportedBasic(settings.format, settings.codec)) {
      errors.push(
        `Transparent backgrounds require MOV + H.264/H.265 or WebM + VP8/VP9. Current: ${settings.format.toUpperCase()} + ${settings.codec.toUpperCase()}`
      );
    }

    // Warn about background inclusion settings
    if (settings.includeWallpaper && settings.includeGradient) {
      warnings.push(
        'Both wallpaper and gradient backgrounds are enabled. This may reduce the transparency effect.'
      );
    }

    // Warn about quality settings for transparency
    if (settings.quality === 'low') {
      warnings.push(
        'Low quality settings may affect alpha channel quality. Consider using medium or higher quality.'
      );
    }
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
};

// Download exported file (for web usage)
export const downloadExportedFile = (
  filePath: string,
  filename?: string
): void => {
  if (typeof window === 'undefined') {
    console.warn(
      'downloadExportedFile is only available in browser environments'
    );
    return;
  }

  // Create download link
  const link = document.createElement('a');
  link.href = filePath;
  link.download = filename || filePath.split('/').pop() || 'export.mp4';

  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
