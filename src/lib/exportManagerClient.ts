import type {
  ExportSettings,
  ExportProgress,
  ExportJob,
  Project,
  ExportPreset,
  ExportQuality,
} from './types';

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

// Generate output filename
const generateOutputFilename = (
  project: Project,
  settings: ExportSettings
): string => {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
  const qualityLabel =
    settings.quality.charAt(0).toUpperCase() + settings.quality.slice(1);
  const resolution = `${settings.width || project.settings.width}x${settings.height || project.settings.height}`;

  return `${project.name}_${qualityLabel}_${resolution}_${timestamp}.${settings.format}`;
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

  // Start export process (browser version - will communicate with server)
  public async startExport(
    project: Project,
    settings: ExportSettings
  ): Promise<string> {
    if (this.isExporting) {
      throw new Error('Export already in progress');
    }

    this.currentJob = createExportJob(project, settings);
    this.isExporting = true;
    this.abortController = new AbortController();

    try {
      this.updateProgress({
        status: 'preparing',
        progress: 0,
        startTime: new Date(),
      });

      // Generate output filename
      const outputFilename = generateOutputFilename(project, settings);

      // Prepare export payload for server
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
        jobId: this.currentJob.id,
      };

      this.updateProgress({ status: 'preparing', progress: 20 });

      // In the future, this will send the job to a server worker
      // For now, we'll simulate the export process
      await this.simulateExportProcess(outputFilename);

      // Complete the export
      this.currentJob.outputPath = `./exports/${outputFilename}`;
      this.currentJob.completedAt = new Date();

      this.updateProgress({
        status: 'completed',
        progress: 100,
        endTime: new Date(),
      });

      console.log(`Export completed: ${outputFilename}`);
      return this.currentJob.outputPath;
    } catch (error) {
      console.error('Export failed:', error);

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';

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

        return this.startExport(project, settings);
      }

      throw new Error(`Export failed: ${errorMessage}`);
    } finally {
      this.isExporting = false;
      this.abortController = null;
    }
  }

  // Simulate export process (placeholder for actual server communication)
  private async simulateExportProcess(filename: string): Promise<void> {
    const totalSteps = 10;

    for (let step = 1; step <= totalSteps; step++) {
      // Check if cancelled
      if (this.abortController?.signal.aborted) {
        throw new Error('Export cancelled');
      }

      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 500));

      const progress = 20 + (step / totalSteps) * 70; // 20-90%

      this.updateProgress({
        status: step <= 8 ? 'rendering' : 'finalizing',
        progress,
        currentFrame: step * 30, // Simulate frame progress
        renderedFrames: step * 30,
        totalFrames: totalSteps * 30,
      });
    }

    // Simulate final processing
    await new Promise((resolve) => setTimeout(resolve, 500));
    this.updateProgress({ status: 'finalizing', progress: 95 });
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
