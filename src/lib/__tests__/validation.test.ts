import { describe, it, expect } from 'vitest';
import {
  validateMediaAsset,
  validateTimelineItem,
  validateAnimationPreset,
  validateProjectSettings,
  validateItemProperties,
} from '../validation';
import type {
  MediaAsset,
  TimelineItem,
  AnimationPreset,
  ProjectSettings,
  ItemProperties,
} from '../types';

describe('validateMediaAsset', () => {
  const validMediaAsset: MediaAsset = {
    id: 'asset-1',
    name: 'Test Video',
    type: 'video',
    url: 'https://example.com/video.mp4',
    duration: 120,
    metadata: {
      fileSize: 1024000,
      mimeType: 'video/mp4',
      width: 1920,
      height: 1080,
    },
    createdAt: new Date(),
  };

  it('should validate a correct media asset', () => {
    const result = validateMediaAsset(validMediaAsset);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject invalid ID', () => {
    const result = validateMediaAsset({ ...validMediaAsset, id: '' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'id',
      message: 'ID is required and must be a non-empty string',
    });
  });

  it('should reject invalid name', () => {
    const result = validateMediaAsset({ ...validMediaAsset, name: '' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'name',
      message: 'Name is required and must be a non-empty string',
    });
  });

  it('should reject invalid type', () => {
    const result = validateMediaAsset({
      ...validMediaAsset,
      type: 'invalid' as MediaAsset['type'],
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'type',
      message: 'Type must be one of: video, image, audio, code',
    });
  });

  it('should reject invalid URL', () => {
    const result = validateMediaAsset({ ...validMediaAsset, url: 'not-a-url' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'url',
      message: 'URL is required and must be a valid URL',
    });
  });

  it('should reject negative duration', () => {
    const result = validateMediaAsset({ ...validMediaAsset, duration: -10 });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'duration',
      message: 'Duration must be a positive number',
    });
  });

  it('should reject missing metadata', () => {
    const result = validateMediaAsset({
      ...validMediaAsset,
      metadata: undefined as unknown as MediaAsset['metadata'],
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'metadata',
      message: 'Metadata is required',
    });
  });
});

describe('validateTimelineItem', () => {
  const validTimelineItem: TimelineItem = {
    id: 'item-1',
    assetId: 'asset-1',
    startTime: 0,
    duration: 10,
    track: 0,
    type: 'video',
    properties: {},
    animations: [],
  };

  it('should validate a correct timeline item', () => {
    const result = validateTimelineItem(validTimelineItem);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject invalid start time', () => {
    const result = validateTimelineItem({
      ...validTimelineItem,
      startTime: -5,
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'startTime',
      message: 'Start time must be a non-negative number',
    });
  });

  it('should reject invalid duration', () => {
    const result = validateTimelineItem({ ...validTimelineItem, duration: 0 });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'duration',
      message: 'Duration must be a positive number',
    });
  });

  it('should reject invalid track', () => {
    const result = validateTimelineItem({ ...validTimelineItem, track: -1 });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'track',
      message: 'Track must be a non-negative number',
    });
  });

  it('should reject invalid type', () => {
    const result = validateTimelineItem({
      ...validTimelineItem,
      type: 'invalid' as TimelineItem['type'],
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'type',
      message: 'Type must be one of: video, code, title, audio',
    });
  });
});

describe('validateAnimationPreset', () => {
  const validAnimationPreset: AnimationPreset = {
    id: 'preset-1',
    name: 'Fade In',
    type: 'entrance',
    parameters: { opacity: 0 },
    duration: 1,
  };

  it('should validate a correct animation preset', () => {
    const result = validateAnimationPreset(validAnimationPreset);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject invalid name', () => {
    const result = validateAnimationPreset({
      ...validAnimationPreset,
      name: '',
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'name',
      message: 'Name is required and must be a non-empty string',
    });
  });

  it('should reject invalid type', () => {
    const result = validateAnimationPreset({
      ...validAnimationPreset,
      type: 'invalid' as AnimationPreset['type'],
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'type',
      message: 'Type must be one of: entrance, exit, emphasis, transition',
    });
  });

  it('should reject invalid duration', () => {
    const result = validateAnimationPreset({
      ...validAnimationPreset,
      duration: 0,
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'duration',
      message: 'Duration must be a positive number',
    });
  });
});

describe('validateProjectSettings', () => {
  const validProjectSettings: ProjectSettings = {
    width: 1920,
    height: 1080,
    fps: 30,
    duration: 60,
    backgroundColor: '#000000',
  };

  it('should validate correct project settings', () => {
    const result = validateProjectSettings(validProjectSettings);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject invalid width', () => {
    const result = validateProjectSettings({
      ...validProjectSettings,
      width: 0,
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'width',
      message: 'Width must be a positive number',
    });
  });

  it('should reject invalid fps', () => {
    const result = validateProjectSettings({
      ...validProjectSettings,
      fps: -1,
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'fps',
      message: 'FPS must be a positive number',
    });
  });
});

describe('validateItemProperties', () => {
  it('should validate empty properties', () => {
    const result = validateItemProperties({});
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate correct transform properties', () => {
    const properties: ItemProperties = {
      x: 100,
      y: 200,
      scale: 1.5,
      rotation: 45,
      opacity: 0.8,
    };
    const result = validateItemProperties(properties);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject invalid opacity', () => {
    const result = validateItemProperties({ opacity: 1.5 });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'opacity',
      message: 'Opacity must be a number between 0 and 1',
    });
  });

  it('should reject invalid scale', () => {
    const result = validateItemProperties({ scale: 0 });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'scale',
      message: 'Scale must be a positive number',
    });
  });

  it('should reject invalid volume', () => {
    const result = validateItemProperties({ volume: 2 });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'volume',
      message: 'Volume must be a number between 0 and 1',
    });
  });
});
