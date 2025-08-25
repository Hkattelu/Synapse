// Core data types for Synapse Studio

export type MediaAssetType = 'video' | 'image' | 'audio' | 'code' | 'visual-asset';
export type TimelineItemType = 'video' | 'code' | 'title' | 'audio' | 'visual-asset';
export type VisualAssetType = 'arrow' | 'box' | 'finger-pointer' | 'circle' | 'line';
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
  // Visual asset metadata
  visualAssetType?: VisualAssetType;
  defaultProperties?: Partial<ItemProperties>;
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

// Core animation config (new modular preset system)
// Discriminated union keyed by `preset` for runtime branching in Remotion hooks
export type AnimationConfig =
  | {
      preset: 'typewriter';
      // characters per second
      speedCps: number;
      // Reserved for future: cursor visibility, etc.
    }
  | {
      preset: 'lineFocus';
      // "5" or "5-8"
      activeLines: string;
      // Opacity to apply to non-active lines (0..1)
      focusOpacity: number;
    }
  | {
      preset: 'kenBurns';
      direction: 'zoomIn' | 'zoomOut' | 'panLeft' | 'panRight';
      // 0..1 intensity multiplier
      intensity: number;
    }
  | {
      preset: 'slide';
      direction: 'left' | 'right' | 'up' | 'down';
      // duration in frames
      duration: number;
      easing: 'gentle' | 'bouncy' | 'stiff';
    };

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
  theme?: string; // 'monokai' | 'solarized-dark' | 'solarized-light' | 'vscode-dark-plus' | 'dark' | 'light'
  fontSize?: number;
  fontFamily?: string;
  showLineNumbers?: boolean;
  codeText?: string; // raw pasted code
  codeTextB?: string; // optional second code block for diff mode
  animationMode?: 'typing' | 'line-by-line' | 'diff' | 'none';
  typingSpeedCps?: number; // characters per second for typing
  lineRevealIntervalMs?: number; // interval per line for line-by-line

  // Side-by-side companion media with code
  sideBySideAssetId?: string; // media asset (image/video) to render alongside code
  sideBySideLayout?: 'left-right' | 'right-left' | 'top-bottom' | 'bottom-top';
  sideBySideGap?: number; // px gap between panes

  // Focus / Ken Burns
  autoFocus?: boolean; // enable auto pan/zoom
  focusPointX?: number; // 0..1 normalized center X
  focusPointY?: number; // 0..1 normalized center Y
  focusScale?: number; // zoom level target (e.g., 1.0..2.0)

  // Title-specific properties
  text?: string;
  color?: string;
  backgroundColor?: string;

  // Talking head bubble overlay
  // When enabled on a video timeline item, the video is rendered as a small
  // circular (or rounded) bubble anchored to a screen corner. Intended for
  // picture-in-picture narration overlays.
  talkingHeadEnabled?: boolean;
  talkingHeadShape?: 'circle' | 'rounded';
  talkingHeadCorner?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  talkingHeadSize?: 'sm' | 'md';
  // Viewer-controlled, non-destructive visibility toggle
  talkingHeadHidden?: boolean;

  // Visual asset properties
  visualAssetType?: VisualAssetType;
  // Arrow properties
  arrowDirection?: 'up' | 'down' | 'left' | 'right' | 'up-left' | 'up-right' | 'down-left' | 'down-right';
  arrowStyle?: 'solid' | 'dashed' | 'curved';
  arrowThickness?: number;
  // Box properties
  boxStyle?: 'solid' | 'dashed' | 'dotted';
  boxThickness?: number;
  borderRadius?: number;
  // Finger pointer properties
  fingerDirection?: 'up' | 'down' | 'left' | 'right';
  fingerStyle?: 'pointing' | 'tapping';
  // Circle properties
  circleStyle?: 'solid' | 'dashed' | 'dotted';
  circleThickness?: number;
  // Line properties
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  lineThickness?: number;
  lineStartX?: number;
  lineStartY?: number;
  lineEndX?: number;
  lineEndY?: number;
  // Common visual asset properties
  strokeColor?: string;
  fillColor?: string;
  strokeWidth?: number;
  animateIn?: 'fade' | 'scale' | 'slide' | 'draw' | 'none';
  animateOut?: 'fade' | 'scale' | 'slide' | 'none';
}

export interface TimelineItem {
  id: string;
  assetId: string;
  startTime: number; // in seconds
  duration: number;
  track: number;
  type: TimelineItemType;
  properties: ItemProperties;
  // New, modular, single animation preset per item (optional).
  // When present, renderers should ignore the legacy `animations` array.
  animation?: AnimationConfig;
  /**
   * @deprecated Use `animation` instead. Kept for backward compatibility and will be removed in a future release.
   */
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
  // Music library fetched at app load, used by Music tab
  musicLibrary: {
    tracks: MusicTrack[];
  };
}

// CC0/Public-domain music track metadata used by the Music Library
export interface MusicTrack {
  id: string;
  title: string;
  duration: number; // seconds
  genre: string; // e.g., Upbeat, Chill, Focused
  url: string; // Direct CDN/HTTPS URL
  license?: string; // Optional, e.g., "Public Domain (CC0)"
  source?: string; // Optional source page URL
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
