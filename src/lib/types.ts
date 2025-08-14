// Core data types for Synapse Studio

export type MediaAssetType = 'video' | 'image' | 'audio' | 'code';
export type TimelineItemType = 'video' | 'code' | 'title' | 'audio';
export type AnimationType = 'entrance' | 'exit' | 'emphasis' | 'transition';

export interface AssetMetadata {
  width?: number;
  height?: number;
  fps?: number;
  codec?: string;
  bitrate?: number;
  fileSize: number;
  mimeType: string;
  // Code-specific metadata
  codeContent?: string;
  language?: string;
}

export interface MediaAsset {
  id: string;
  name: string;
  type: MediaAssetType;
  url: string;
  duration?: number;
  metadata: AssetMetadata;
  thumbnail?: string;
  createdAt: Date;
}

export interface AnimationPreset {
  id: string;
  name: string;
  type: AnimationType;
  parameters: Record<string, unknown>;
  duration: number;
  easing?: string;
}

// Keyframe system types
export interface Keyframe {
  id: string;
  time: number; // Time in seconds relative to timeline item start
  properties: Partial<ItemProperties>;
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'bounce' | 'elastic';
}

export interface PropertyKeyframes {
  property: keyof ItemProperties;
  keyframes: Keyframe[];
}

export interface TrackGroup {
  id: string;
  name: string;
  tracks: number[];
  color?: string;
  collapsed?: boolean;
  visible?: boolean;
  locked?: boolean;
  muted?: boolean;
  solo?: boolean;
}

export interface TimelineMarker {
  id: string;
  name: string;
  time: number;
  color: string;
  description?: string;
}

export interface TimelineRegion {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  color: string;
  description?: string;
}

export interface ItemProperties {
  // Transform properties
  x?: number;
  y?: number;
  scale?: number;
  rotation?: number;
  opacity?: number;

  // Video-specific properties
  volume?: number;
  playbackRate?: number;

  // Code-specific properties
  language?: string;
  theme?: string;
  fontSize?: number;

  // Title-specific properties
  text?: string;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
}

export interface TimelineItem {
  id: string;
  assetId: string;
  startTime: number; // in seconds
  duration: number;
  track: number;
  type: TimelineItemType;
  properties: ItemProperties;
  animations: AnimationPreset[];
  keyframes: Keyframe[]; // Keyframe animations
  locked?: boolean;
  muted?: boolean;
  solo?: boolean;
  visible?: boolean;
  label?: string;
  color?: string;
}

export interface ProjectSettings {
  width: number;
  height: number;
  fps: number;
  duration: number;
  backgroundColor: string;
  audioSampleRate?: number;
}

export interface Project {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  timeline: TimelineItem[];
  mediaAssets: MediaAsset[];
  settings: ProjectSettings;
  version: string;
  // Advanced timeline features
  trackGroups?: TrackGroup[];
  markers?: TimelineMarker[];
  regions?: TimelineRegion[];
}

// UI State types
export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
}

export interface TimelineViewState {
  zoom: number;
  scrollPosition: number;
  selectedItems: string[];
  snapToGrid: boolean;
  gridSize: number;
  // Advanced timeline view options
  showKeyframes: boolean;
  trackHeight: number;
  selectedKeyframes: string[];
  timelineMode: 'standard' | 'advanced' | 'keyframe';
  verticalScrollPosition: number;
}

export interface UIState {
  currentView: 'dashboard' | 'studio';
  sidebarVisible: boolean;
  inspectorVisible: boolean;
  mediaBinVisible: boolean;
  playback: PlaybackState;
  timeline: TimelineViewState;
}

// Export system types
export type VideoCodec = 'h264' | 'h265' | 'vp8' | 'vp9' | 'av1';
export type VideoFormat = 'mp4' | 'webm' | 'mov' | 'avi';
export type AudioCodec = 'aac' | 'mp3' | 'opus' | 'vorbis';
export type ExportQuality = 'low' | 'medium' | 'high' | 'ultra';
export type ExportStatus =
  | 'idle'
  | 'preparing'
  | 'rendering'
  | 'finalizing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface ExportSettings {
  // Video settings
  format: VideoFormat;
  codec: VideoCodec;
  quality: ExportQuality;
  crf?: number; // Constant Rate Factor (0-51)
  bitrate?: number; // Target bitrate in kbps
  width?: number; // Override project width
  height?: number; // Override project height
  fps?: number; // Override project fps

  // Audio settings
  audioCodec: AudioCodec;
  audioBitrate?: number; // Audio bitrate in kbps
  audioSampleRate?: number; // Audio sample rate in Hz

  // Range settings
  startTime?: number; // Export start time in seconds
  endTime?: number; // Export end time in seconds

  // Advanced settings
  enableHardwareAcceleration?: boolean;
  enableMultithreading?: boolean;
  concurrency?: number; // Number of concurrent render jobs
  imageSequence?: boolean; // Export as image sequence instead of video
  frameRange?: [number, number]; // Specific frame range [start, end]
}

export interface ExportProgress {
  status: ExportStatus;
  progress: number; // 0-100
  currentFrame?: number;
  totalFrames?: number;
  renderedFrames?: number;
  estimatedTimeRemaining?: number; // in seconds
  averageFrameTime?: number; // milliseconds per frame
  errorMessage?: string;
  startTime?: Date;
  endTime?: Date;
}

export interface ExportJob {
  id: string;
  projectId: string;
  projectName: string;
  settings: ExportSettings;
  progress: ExportProgress;
  outputPath?: string;
  outputSize?: number; // File size in bytes
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  retryCount: number;
  maxRetries: number;
}

export interface ExportPreset {
  id: string;
  name: string;
  description: string;
  settings: Partial<ExportSettings>;
  isDefault?: boolean;
  category: 'web' | 'social' | 'broadcast' | 'archive' | 'custom';
}

export interface ExportState {
  isExporting: boolean;
  currentJob?: ExportJob;
  exportHistory: ExportJob[];
  availablePresets: ExportPreset[];
  exportSettings: ExportSettings;
}
