import type { Project } from './types';

export type ExportSettings = {
  format: 'mp4' | 'mov' | 'webm';
  codec: 'h264' | 'prores' | 'vp9';
  quality: 'low' | 'medium' | 'high';
  width: number;
  height: number;
  fps: number;
  audioCodec: 'aac' | 'pcm' | 'opus';
};

export const DEFAULT_EXPORT_PRESETS = [
  {
    id: 'youtube-1080p',
    name: 'YouTube 1080p',
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
    } as ExportSettings,
  },
  {
    id: 'twitter-720p',
    name: 'Twitter/X 720p',
    category: 'social',
    isDefault: false,
    settings: {
      format: 'mp4',
      codec: 'h264',
      quality: 'medium',
      width: 1280,
      height: 720,
      fps: 30,
      audioCodec: 'aac',
    } as ExportSettings,
  },
  {
    id: 'instagram-square',
    name: 'Instagram Square',
    category: 'social',
    isDefault: false,
    settings: {
      format: 'mp4',
      codec: 'h264',
      quality: 'high',
      width: 1080,
      height: 1080,
      fps: 30,
      audioCodec: 'aac',
    } as ExportSettings,
  },
  // Portrait / vertical presets for shorts workflows
  {
    id: 'vertical-1080x1920',
    name: 'Vertical 1080×1920',
    category: 'social',
    isDefault: false,
    settings: {
      format: 'mp4',
      codec: 'h264',
      quality: 'high',
      width: 1080,
      height: 1920,
      fps: 30,
      audioCodec: 'aac',
    } as ExportSettings,
  },
  {
    id: 'vertical-720x1280',
    name: 'Vertical 720×1280',
    category: 'social',
    isDefault: false,
    settings: {
      format: 'mp4',
      codec: 'h264',
      quality: 'medium',
      width: 720,
      height: 1280,
      fps: 30,
      audioCodec: 'aac',
    } as ExportSettings,
  },
  {
    id: 'vertical-2160x3840',
    name: 'Vertical 2160×3840 (4K)',
    category: 'social',
    isDefault: false,
    settings: {
      format: 'mp4',
      codec: 'h264',
      quality: 'ultra',
      width: 2160,
      height: 3840,
      fps: 30,
      audioCodec: 'aac',
    } as ExportSettings,
  },
  {
    id: 'webm-1080p',
    name: 'WebM 1080p',
    category: 'web',
    isDefault: false,
    settings: {
      format: 'webm',
      codec: 'vp9',
      quality: 'high',
      width: 1920,
      height: 1080,
      fps: 30,
      audioCodec: 'opus',
    } as ExportSettings,
  },
];

export function getDefaultExportSettings(project: Project): ExportSettings {
  const preset = DEFAULT_EXPORT_PRESETS[0];
  return {
    ...preset.settings,
    width: project.settings.width,
    height: project.settings.height,
    fps: project.settings.fps,
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${bytes} B`;
}

export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const mm = minutes.toString();
  const ss = seconds.toString().padStart(2, '0');
  if (hours > 0) {
    const hh = hours.toString();
    return `${hh}:${mm.padStart(2, '0')}:${ss}`;
  }
  return `${mm}:${ss}`;
}

export function estimateFileSize(settings: ExportSettings, durationSeconds: number): number {
  // Very rough heuristic based on resolution, fps, codec, and quality
  const pixels = settings.width * settings.height;
  const qualityFactor = settings.quality === 'high' ? 1 : settings.quality === 'medium' ? 0.6 : 0.35;
  const codecFactor = settings.codec === 'h264' ? 1 : settings.codec === 'prores' ? 3 : 0.8;
  const bitrateMbps = (pixels / (1920 * 1080)) * (settings.fps / 30) * qualityFactor * codecFactor * 8; // Mbps
  const bits = bitrateMbps * 1_000_000 * durationSeconds;
  return Math.max(1, Math.round(bits / 8)); // bytes
}

// Internal export state
let _isExporting = false;
let _currentJob: any = null;
let progressCb: ((p: { status: string; progress: number; [k: string]: any }) => void) | null = null;

export const exportManager = {
  // Exposed properties for tests to poke
  get isExporting() {
    return _isExporting;
  },
  set isExporting(v: boolean) {
    _isExporting = v;
  },
  get currentJob() {
    return _currentJob;
  },
  set currentJob(job: any) {
    _currentJob = job;
  },

  isCurrentlyExporting(): boolean {
    return _isExporting;
  },
  setProgressCallback(cb: (p: { status: string; progress: number; [k: string]: any }) => void) {
    progressCb = cb;
  },
  getCurrentJob() {
    return _currentJob;
  },
  async startExport(project: Project, settings: ExportSettings): Promise<string> {
    try {
      _isExporting = true;
      _currentJob = {
        id: `export_${Date.now()}`,
        projectId: project.id,
        projectName: project.name,
        settings,
        progress: { status: 'preparing' as const, progress: 0 },
        createdAt: new Date(),
      };
      progressCb?.({ status: 'preparing', progress: 0 });

      const { bundle } = await import('@remotion/bundler');
      const { renderMedia } = await import('@remotion/renderer');

      const bundleLocation = await bundle({} as any);

      await renderMedia({
        composition: 'MainComposition',
        serveUrl: bundleLocation as any,
        codec: settings.codec as any,
        onProgress: (p: { renderedFrames?: number; encodedFrames?: number; totalFrames?: number }) => {
          const totalFrames = p.totalFrames ?? project.settings.fps * project.settings.duration;
          const rendered = p.encodedFrames ?? p.renderedFrames ?? 0;
          const progress = totalFrames > 0 ? Math.min(100, Math.round((rendered / totalFrames) * 100)) : 0;
          progressCb?.({ status: 'rendering', progress, currentFrame: rendered, totalFrames });
        },
      } as any);

      progressCb?.({ status: 'completed', progress: 100 });
      _currentJob = { ..._currentJob, progress: { status: 'completed', progress: 100 } };
      return 'C:/tmp/export.mp4';
    } catch (e: any) {
      progressCb?.({ status: 'failed', progress: 0, errorMessage: `Export failed: ${e?.message || e}` });
      throw new Error(`Export failed: ${e?.message || e}`);
    } finally {
      _isExporting = false;
    }
  },
  cancelExport() {
    // We don't have a real cancel operation here; just notify and flip state
    if (_isExporting) {
      _isExporting = false;
      progressCb?.({ status: 'cancelled', progress: 0 });
      if (_currentJob) {
        _currentJob = { ..._currentJob, progress: { status: 'cancelled', progress: 0 } };
      }
    }
  },
};

