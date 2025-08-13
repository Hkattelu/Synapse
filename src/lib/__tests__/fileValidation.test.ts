import { describe, it, expect } from 'vitest';
import { validateMediaAsset } from '../validation';
import { formatFileSize, formatDuration, getFileExtension, isVideoFile, isImageFile, isAudioFile } from '../utils';
import type { MediaAsset } from '../types';

describe('File Upload Validation', () => {
  const createMockMediaAsset = (overrides: Partial<MediaAsset> = {}): MediaAsset => ({
    id: 'test-id',
    name: 'test-file.mp4',
    type: 'video',
    url: 'blob:test-url',
    duration: 10.5,
    thumbnail: 'data:image/jpeg;base64,test',
    metadata: {
      fileSize: 1024 * 1024, // 1MB
      mimeType: 'video/mp4',
    },
    createdAt: new Date(),
    ...overrides,
  });

  describe('Media Asset Validation', () => {
    it('validates a complete valid media asset', () => {
      const asset = createMockMediaAsset();
      const result = validateMediaAsset(asset);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects asset with invalid ID', () => {
      const asset = createMockMediaAsset({ id: '' });
      const result = validateMediaAsset(asset);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'id')).toBe(true);
    });

    it('rejects asset with empty name', () => {
      const asset = createMockMediaAsset({ name: '' });
      const result = validateMediaAsset(asset);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'name')).toBe(true);
    });

    it('rejects asset with invalid type', () => {
      const asset = createMockMediaAsset({ type: 'invalid' as any });
      const result = validateMediaAsset(asset);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'type')).toBe(true);
    });

    it('rejects asset with invalid URL', () => {
      const asset = createMockMediaAsset({ url: 'not-a-url' });
      const result = validateMediaAsset(asset);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'url')).toBe(true);
    });

    it('rejects asset with negative duration', () => {
      const asset = createMockMediaAsset({ duration: -5 });
      const result = validateMediaAsset(asset);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'duration')).toBe(true);
    });

    it('accepts asset without duration (for images)', () => {
      const asset = createMockMediaAsset({ 
        type: 'image',
        duration: undefined,
      });
      const result = validateMediaAsset(asset);
      
      expect(result.isValid).toBe(true);
    });

    it('rejects asset with invalid metadata', () => {
      const asset = createMockMediaAsset({
        metadata: {
          fileSize: -100,
          mimeType: '',
        },
      });
      const result = validateMediaAsset(asset);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'metadata.fileSize')).toBe(true);
      expect(result.errors.some(e => e.field === 'metadata.mimeType')).toBe(true);
    });

    it('rejects asset with invalid creation date', () => {
      const asset = createMockMediaAsset({ createdAt: 'invalid-date' as any });
      const result = validateMediaAsset(asset);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'createdAt')).toBe(true);
    });
  });

  describe('File Size Formatting', () => {
    it('formats bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0.0 B');
      expect(formatFileSize(512)).toBe('512.0 B');
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.0 GB');
    });

    it('handles large file sizes', () => {
      const largeSize = 2.5 * 1024 * 1024 * 1024; // 2.5 GB
      expect(formatFileSize(largeSize)).toBe('2.5 GB');
    });
  });

  describe('Duration Formatting', () => {
    it('formats seconds correctly', () => {
      expect(formatDuration(0)).toBe('0:00');
      expect(formatDuration(30)).toBe('0:30');
      expect(formatDuration(60)).toBe('1:00');
      expect(formatDuration(90)).toBe('1:30');
      expect(formatDuration(3661)).toBe('1:01:01');
    });

    it('handles fractional seconds', () => {
      expect(formatDuration(30.7)).toBe('0:30');
      expect(formatDuration(90.9)).toBe('1:30');
    });
  });

  describe('File Extension Utilities', () => {
    it('extracts file extensions correctly', () => {
      expect(getFileExtension('video.mp4')).toBe('mp4');
      expect(getFileExtension('image.JPEG')).toBe('jpeg');
      expect(getFileExtension('audio.wav')).toBe('wav');
      expect(getFileExtension('file.with.multiple.dots.txt')).toBe('txt');
      expect(getFileExtension('no-extension')).toBe('');
    });
  });

  describe('MIME Type Detection', () => {
    it('detects video files correctly', () => {
      expect(isVideoFile('video/mp4')).toBe(true);
      expect(isVideoFile('video/webm')).toBe(true);
      expect(isVideoFile('video/ogg')).toBe(true);
      expect(isVideoFile('image/jpeg')).toBe(false);
      expect(isVideoFile('audio/mp3')).toBe(false);
    });

    it('detects image files correctly', () => {
      expect(isImageFile('image/jpeg')).toBe(true);
      expect(isImageFile('image/png')).toBe(true);
      expect(isImageFile('image/gif')).toBe(true);
      expect(isImageFile('video/mp4')).toBe(false);
      expect(isImageFile('audio/wav')).toBe(false);
    });

    it('detects audio files correctly', () => {
      expect(isAudioFile('audio/mp3')).toBe(true);
      expect(isAudioFile('audio/wav')).toBe(true);
      expect(isAudioFile('audio/ogg')).toBe(true);
      expect(isAudioFile('video/mp4')).toBe(false);
      expect(isAudioFile('image/png')).toBe(false);
    });
  });
});

describe('File Upload Edge Cases', () => {
  it('handles files with special characters in names', () => {
    const asset = {
      id: 'test-id',
      name: 'file with spaces & symbols!@#.mp4',
      type: 'video' as const,
      url: 'blob:test-url',
      metadata: {
        fileSize: 1024,
        mimeType: 'video/mp4',
      },
      createdAt: new Date(),
    };

    const result = validateMediaAsset(asset);
    expect(result.isValid).toBe(true);
  });

  it('handles very long file names', () => {
    const longName = 'a'.repeat(255) + '.mp4';
    const asset = {
      id: 'test-id',
      name: longName,
      type: 'video' as const,
      url: 'blob:test-url',
      metadata: {
        fileSize: 1024,
        mimeType: 'video/mp4',
      },
      createdAt: new Date(),
    };

    const result = validateMediaAsset(asset);
    expect(result.isValid).toBe(true);
  });

  it('handles zero-byte files', () => {
    const asset = {
      id: 'test-id',
      name: 'empty.mp4',
      type: 'video' as const,
      url: 'blob:test-url',
      metadata: {
        fileSize: 0,
        mimeType: 'video/mp4',
      },
      createdAt: new Date(),
    };

    const result = validateMediaAsset(asset);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.field === 'metadata.fileSize')).toBe(true);
  });

  it('handles files with unusual MIME types', () => {
    const asset = {
      id: 'test-id',
      name: 'video.mkv',
      type: 'video' as const,
      url: 'blob:test-url',
      metadata: {
        fileSize: 1024,
        mimeType: 'video/x-matroska',
      },
      createdAt: new Date(),
    };

    const result = validateMediaAsset(asset);
    expect(result.isValid).toBe(true);
  });
});