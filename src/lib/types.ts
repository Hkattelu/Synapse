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
  muted?: boolean;
  solo?: boolean;
}

export interface TimelineMarker {
  id: string;
  time: number;
  label: string;
  color?: string;
}

export interface TimelineRegion {
  id: string;
  startTime: number;
  endTime: number;
  label: string;
  color?: string;
  locked?: boolean;
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
