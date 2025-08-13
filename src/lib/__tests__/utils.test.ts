import { describe, it, expect } from 'vitest';
import {
  generateId,
  formatTime,
  parseTimeString,
  calculateTimelineDuration,
  getTimelineItemsAtTime,
  findOverlappingItems,
  snapToGrid,
  clampTimelineItem,
  formatFileSize,
  createDefaultProject,
  createTimelineItemFromAsset,
  hexToRgb,
  rgbToHex,
  moveArrayItem,
  deepClone,
} from '../utils';
import type { TimelineItem, MediaAsset } from '../types';

describe('generateId', () => {
  it('should generate unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
    expect(typeof id1).toBe('string');
    expect(id1.length).toBeGreaterThan(0);
  });
});

describe('formatTime', () => {
  it('should format seconds correctly', () => {
    expect(formatTime(0)).toBe('00:00.00');
    expect(formatTime(65)).toBe('01:05.00');
    expect(formatTime(3661)).toBe('01:01:01.00');
    expect(formatTime(125.5)).toBe('02:05.15');
  });
});

describe('parseTimeString', () => {
  it('should parse time strings correctly', () => {
    expect(parseTimeString('00:30.00')).toBe(30);
    expect(parseTimeString('01:30.00')).toBe(90);
    expect(parseTimeString('01:01:30.00')).toBe(3690);
  });
});

describe('calculateTimelineDuration', () => {
  it('should return 0 for empty timeline', () => {
    expect(calculateTimelineDuration([])).toBe(0);
  });

  it('should calculate correct duration', () => {
    const timeline: TimelineItem[] = [
      {
        id: '1',
        assetId: 'asset1',
        startTime: 0,
        duration: 10,
        track: 0,
        type: 'video',
        properties: {},
        animations: [],
      },
      {
        id: '2',
        assetId: 'asset2',
        startTime: 5,
        duration: 15,
        track: 1,
        type: 'video',
        properties: {},
        animations: [],
      },
    ];
    expect(calculateTimelineDuration(timeline)).toBe(20); // 5 + 15
  });
});

describe('getTimelineItemsAtTime', () => {
  const timeline: TimelineItem[] = [
    {
      id: '1',
      assetId: 'asset1',
      startTime: 0,
      duration: 10,
      track: 0,
      type: 'video',
      properties: {},
      animations: [],
    },
    {
      id: '2',
      assetId: 'asset2',
      startTime: 5,
      duration: 10,
      track: 1,
      type: 'video',
      properties: {},
      animations: [],
    },
  ];

  it('should return items at specific time', () => {
    const itemsAt7 = getTimelineItemsAtTime(timeline, 7);
    expect(itemsAt7).toHaveLength(2);
    expect(itemsAt7.map((item) => item.id)).toEqual(['1', '2']);
  });

  it('should return empty array when no items at time', () => {
    const itemsAt20 = getTimelineItemsAtTime(timeline, 20);
    expect(itemsAt20).toHaveLength(0);
  });
});

describe('findOverlappingItems', () => {
  const timeline: TimelineItem[] = [
    {
      id: '1',
      assetId: 'asset1',
      startTime: 0,
      duration: 10,
      track: 0,
      type: 'video',
      properties: {},
      animations: [],
    },
    {
      id: '2',
      assetId: 'asset2',
      startTime: 5,
      duration: 10,
      track: 0,
      type: 'video',
      properties: {},
      animations: [],
    },
    {
      id: '3',
      assetId: 'asset3',
      startTime: 5,
      duration: 10,
      track: 1,
      type: 'video',
      properties: {},
      animations: [],
    },
  ];

  it('should find overlapping items on same track', () => {
    const overlapping = findOverlappingItems(timeline, timeline[0]);
    expect(overlapping).toHaveLength(1);
    expect(overlapping[0].id).toBe('2');
  });

  it('should not find overlapping items on different tracks', () => {
    const overlapping = findOverlappingItems(timeline, timeline[2]);
    expect(overlapping).toHaveLength(0);
  });
});

describe('snapToGrid', () => {
  it('should snap values to grid', () => {
    expect(snapToGrid(7, 5)).toBe(5);
    expect(snapToGrid(8, 5)).toBe(10);
    expect(snapToGrid(12.7, 2.5)).toBe(12.5);
  });
});

describe('clampTimelineItem', () => {
  const item: TimelineItem = {
    id: '1',
    assetId: 'asset1',
    startTime: 50,
    duration: 20,
    track: 0,
    type: 'video',
    properties: {},
    animations: [],
  };

  it('should clamp item within bounds', () => {
    const clamped = clampTimelineItem(item, 60);
    expect(clamped.startTime).toBe(50);
    expect(clamped.duration).toBe(10); // Reduced to fit within 60 seconds
  });

  it('should clamp negative start time', () => {
    const negativeItem = { ...item, startTime: -5 };
    const clamped = clampTimelineItem(negativeItem, 60);
    expect(clamped.startTime).toBe(0);
  });
});

describe('formatFileSize', () => {
  it('should format file sizes correctly', () => {
    expect(formatFileSize(500)).toBe('500.0 B');
    expect(formatFileSize(1024)).toBe('1.0 KB');
    expect(formatFileSize(1048576)).toBe('1.0 MB');
    expect(formatFileSize(1073741824)).toBe('1.0 GB');
  });
});

describe('createDefaultProject', () => {
  it('should create a valid default project', () => {
    const project = createDefaultProject('Test Project');
    expect(project.name).toBe('Test Project');
    expect(project.timeline).toEqual([]);
    expect(project.mediaAssets).toEqual([]);
    expect(project.settings.width).toBe(1920);
    expect(project.settings.height).toBe(1080);
    expect(project.version).toBe('1.0.0');
  });
});

describe('createTimelineItemFromAsset', () => {
  const asset: MediaAsset = {
    id: 'asset1',
    name: 'Test Video',
    type: 'video',
    url: 'https://example.com/video.mp4',
    duration: 120,
    metadata: {
      fileSize: 1024000,
      mimeType: 'video/mp4',
    },
    createdAt: new Date(),
  };

  it('should create timeline item from asset', () => {
    const item = createTimelineItemFromAsset(asset, 10, 1);
    expect(item.assetId).toBe('asset1');
    expect(item.startTime).toBe(10);
    expect(item.track).toBe(1);
    expect(item.duration).toBe(120);
    expect(item.type).toBe('video');
  });

  it('should handle image assets', () => {
    const imageAsset = {
      ...asset,
      type: 'image' as const,
      duration: undefined,
    };
    const item = createTimelineItemFromAsset(imageAsset, 0, 0);
    expect(item.type).toBe('video'); // Images are treated as video clips
    expect(item.duration).toBe(5); // Default duration for images
  });
});

describe('color utilities', () => {
  describe('hexToRgb', () => {
    it('should convert hex to RGB', () => {
      expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb('#00ff00')).toEqual({ r: 0, g: 255, b: 0 });
      expect(hexToRgb('0000ff')).toEqual({ r: 0, g: 0, b: 255 });
    });

    it('should return null for invalid hex', () => {
      expect(hexToRgb('invalid')).toBeNull();
    });
  });

  describe('rgbToHex', () => {
    it('should convert RGB to hex', () => {
      expect(rgbToHex(255, 0, 0)).toBe('#ff0000');
      expect(rgbToHex(0, 255, 0)).toBe('#00ff00');
      expect(rgbToHex(0, 0, 255)).toBe('#0000ff');
    });
  });
});

describe('moveArrayItem', () => {
  it('should move array items correctly', () => {
    const array = ['a', 'b', 'c', 'd'];
    const result = moveArrayItem(array, 1, 3);
    expect(result).toEqual(['a', 'c', 'd', 'b']);
  });
});

describe('deepClone', () => {
  it('should deep clone objects', () => {
    const original = {
      a: 1,
      b: { c: 2, d: [3, 4] },
      e: new Date('2023-01-01'),
    };
    const cloned = deepClone(original);

    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    expect(cloned.b).not.toBe(original.b);
    expect(cloned.b.d).not.toBe(original.b.d);
    expect(cloned.e).not.toBe(original.e);
  });

  it('should handle primitive values', () => {
    expect(deepClone(42)).toBe(42);
    expect(deepClone('hello')).toBe('hello');
    expect(deepClone(null)).toBe(null);
    expect(deepClone(undefined)).toBe(undefined);
  });
});
