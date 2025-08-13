// Utility functions for data transformations and calculations

import type {
  TimelineItem,
  MediaAsset,
  Project,
  ProjectSettings,
  TimelineItemType,
  ItemProperties,
} from './types';

// ID generation
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Time formatting utilities
export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const frames = Math.floor((seconds % 1) * 30); // Assuming 30fps for frame display

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${frames.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${frames.toString().padStart(2, '0')}`;
};

export const parseTimeString = (timeString: string): number => {
  const parts = timeString.split(':');
  let seconds = 0;

  if (parts.length === 3) {
    // HH:MM:SS.FF format
    const [hours, minutes, secondsAndFrames] = parts;
    const [secs, frames = '0'] = secondsAndFrames.split('.');
    seconds =
      parseInt(hours) * 3600 +
      parseInt(minutes) * 60 +
      parseInt(secs) +
      parseInt(frames) / 30;
  } else if (parts.length === 2) {
    // MM:SS.FF format
    const [minutes, secondsAndFrames] = parts;
    const [secs, frames = '0'] = secondsAndFrames.split('.');
    seconds = parseInt(minutes) * 60 + parseInt(secs) + parseInt(frames) / 30;
  }

  return seconds;
};

// Timeline calculations
export const calculateTimelineDuration = (timeline: TimelineItem[]): number => {
  if (timeline.length === 0) return 0;

  return Math.max(...timeline.map((item) => item.startTime + item.duration));
};

export const getTimelineItemsAtTime = (
  timeline: TimelineItem[],
  time: number
): TimelineItem[] => {
  return timeline.filter(
    (item) => time >= item.startTime && time < item.startTime + item.duration
  );
};

export const getTimelineItemsByTrack = (
  timeline: TimelineItem[]
): Map<number, TimelineItem[]> => {
  const trackMap = new Map<number, TimelineItem[]>();

  timeline.forEach((item) => {
    if (!trackMap.has(item.track)) {
      trackMap.set(item.track, []);
    }
    trackMap.get(item.track)!.push(item);
  });

  // Sort items within each track by start time
  trackMap.forEach((items) => {
    items.sort((a, b) => a.startTime - b.startTime);
  });

  return trackMap;
};

export const findOverlappingItems = (
  timeline: TimelineItem[],
  targetItem: TimelineItem
): TimelineItem[] => {
  return timeline.filter(
    (item) =>
      item.id !== targetItem.id &&
      item.track === targetItem.track &&
      !(
        item.startTime + item.duration <= targetItem.startTime ||
        item.startTime >= targetItem.startTime + targetItem.duration
      )
  );
};

export const snapToGrid = (value: number, gridSize: number): number => {
  return Math.round(value / gridSize) * gridSize;
};

export const clampTimelineItem = (
  item: TimelineItem,
  maxDuration: number
): TimelineItem => {
  const clampedStartTime = Math.max(0, Math.min(item.startTime, maxDuration));
  const maxItemDuration = maxDuration - clampedStartTime;
  const clampedDuration = Math.max(
    0.1,
    Math.min(item.duration, maxItemDuration)
  );

  return {
    ...item,
    startTime: clampedStartTime,
    duration: clampedDuration,
  };
};

// Media asset utilities
export const getAssetById = (
  assets: MediaAsset[],
  id: string
): MediaAsset | undefined => {
  return assets.find((asset) => asset.id === id);
};

export const filterAssetsByType = (
  assets: MediaAsset[],
  type: string
): MediaAsset[] => {
  return assets.filter((asset) => asset.type === type);
};

export const calculateTotalAssetSize = (assets: MediaAsset[]): number => {
  return assets.reduce((total, asset) => total + asset.metadata.fileSize, 0);
};

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

// Project utilities
export const createDefaultProject = (name: string): Project => {
  const now = new Date();

  return {
    id: generateId(),
    name,
    createdAt: now,
    updatedAt: now,
    timeline: [],
    mediaAssets: [],
    settings: createDefaultProjectSettings(),
    version: '1.0.0',
  };
};

export const createDefaultProjectSettings = (): ProjectSettings => {
  return {
    width: 1920,
    height: 1080,
    fps: 30,
    duration: 60, // 1 minute default
    backgroundColor: '#000000',
    audioSampleRate: 44100,
  };
};

export const updateProjectTimestamp = (project: Project): Project => {
  return {
    ...project,
    updatedAt: new Date(),
  };
};

// Timeline item creation utilities
export const createTimelineItemFromAsset = (
  asset: MediaAsset,
  startTime: number,
  track: number
): TimelineItem => {
  const itemType = asset.type === 'image' ? 'video' : asset.type; // Images are treated as video clips

  return {
    id: generateId(),
    assetId: asset.id,
    startTime,
    duration: asset.duration || 5, // Default 5 seconds for images
    track,
    type: itemType as TimelineItemType,
    properties: createDefaultItemProperties(itemType),
    animations: [],
    locked: false,
    muted: false,
  };
};

export const createDefaultItemProperties = (type: string): ItemProperties => {
  const baseProperties = {
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    opacity: 1,
  };

  switch (type) {
    case 'video':
    case 'audio':
      return {
        ...baseProperties,
        volume: 1,
        playbackRate: 1,
      };
    case 'code':
      return {
        ...baseProperties,
        language: 'javascript',
        theme: 'dark',
        fontSize: 16,
      };
    case 'title':
      return {
        ...baseProperties,
        text: 'Sample Text',
        fontFamily: 'Arial',
        color: '#ffffff',
        backgroundColor: 'transparent',
      };
    default:
      return baseProperties;
  }
};

// Color utilities
export const hexToRgb = (
  hex: string
): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

export const rgbToHex = (r: number, g: number, b: number): string => {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

// Array utilities
export const moveArrayItem = <T>(
  array: T[],
  fromIndex: number,
  toIndex: number
): T[] => {
  const newArray = [...array];
  const item = newArray.splice(fromIndex, 1)[0];
  newArray.splice(toIndex, 0, item);
  return newArray;
};

export const removeArrayItem = <T>(array: T[], index: number): T[] => {
  return array.filter((_, i) => i !== index);
};

export const insertArrayItem = <T>(array: T[], item: T, index: number): T[] => {
  const newArray = [...array];
  newArray.splice(index, 0, item);
  return newArray;
};

// Deep clone utility
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as T;
  if (obj instanceof Array) return obj.map((item) => deepClone(item)) as T;
  if (typeof obj === 'object') {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        (clonedObj as Record<string, unknown>)[key] = deepClone(
          (obj as Record<string, unknown>)[key]
        );
      }
    }
    return clonedObj;
  }
  return obj;
};
