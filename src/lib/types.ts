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
  locked?: boolean;
  muted?: boolean;
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
}

export interface UIState {
  currentView: 'dashboard' | 'studio';
  sidebarVisible: boolean;
  inspectorVisible: boolean;
  mediaBinVisible: boolean;
  playback: PlaybackState;
  timeline: TimelineViewState;
}
