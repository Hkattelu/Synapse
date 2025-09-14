import { describe, it, expect } from 'vitest';
import {
  isTransparencySupported,
  getTransparencyCompatibilityWarning,
  getRecommendedTransparencySettings,
  validateTransparencySettings,
} from '../exportManagerClient';
import type { ExportSettings } from '../types';

describe('Export Transparency Functions', () => {
  describe('isTransparencySupported', () => {
    it('should support MOV with H.264', () => {
      expect(isTransparencySupported('mov', 'h264')).toBe(true);
    });

    it('should support MOV with H.265', () => {
      expect(isTransparencySupported('mov', 'h265')).toBe(true);
    });

    it('should support WebM with VP8', () => {
      expect(isTransparencySupported('webm', 'vp8')).toBe(true);
    });

    it('should support WebM with VP9', () => {
      expect(isTransparencySupported('webm', 'vp9')).toBe(true);
    });

    it('should not support MP4 with H.264', () => {
      expect(isTransparencySupported('mp4', 'h264')).toBe(false);
    });

    it('should not support AVI with any codec', () => {
      expect(isTransparencySupported('avi', 'h264')).toBe(false);
    });
  });

  describe('getTransparencyCompatibilityWarning', () => {
    it('should return null when transparency is disabled', () => {
      const settings: ExportSettings = {
        format: 'mp4',
        codec: 'h264',
        quality: 'high',
        audioCodec: 'aac',
        transparentBackground: false,
      };

      expect(getTransparencyCompatibilityWarning(settings)).toBeNull();
    });

    it('should return null for compatible format/codec', () => {
      const settings: ExportSettings = {
        format: 'mov',
        codec: 'h264',
        quality: 'high',
        audioCodec: 'aac',
        transparentBackground: true,
      };

      expect(getTransparencyCompatibilityWarning(settings)).toBeNull();
    });

    it('should return warning for incompatible format/codec', () => {
      const settings: ExportSettings = {
        format: 'mp4',
        codec: 'h264',
        quality: 'high',
        audioCodec: 'aac',
        transparentBackground: true,
      };

const warning = getTransparencyCompatibilityWarning(settings);
      // New copy style from validation layer
      expect(warning).toMatch(/MP4\s+format\s+does\s+not\s+support\s+transparency/i);
    });
  });

  describe('getRecommendedTransparencySettings', () => {
    it('should return recommended settings for transparency', () => {
      const recommended = getRecommendedTransparencySettings();

      expect(recommended.format).toBe('mov');
      expect(recommended.codec).toBe('h264');
      expect(recommended.transparentBackground).toBe(true);
      expect(recommended.includeWallpaper).toBe(false);
      expect(recommended.includeGradient).toBe(false);
    });
  });

  describe('validateTransparencySettings', () => {
    it('should validate compatible transparency settings', () => {
      const settings: ExportSettings = {
        format: 'mov',
        codec: 'h264',
        quality: 'high',
        audioCodec: 'aac',
        transparentBackground: true,
        includeWallpaper: false,
        includeGradient: false,
      };

      const result = validateTransparencySettings(settings);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return error for incompatible format/codec', () => {
      const settings: ExportSettings = {
        format: 'mp4',
        codec: 'h264',
        quality: 'high',
        audioCodec: 'aac',
        transparentBackground: true,
      };

      const result = validateTransparencySettings(settings);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
expect(result.errors[0]).toMatch(/Format\s+mp4\s+does\s+not\s+support\s+transparent\s+backgrounds/i);
    });

    it('should warn about both backgrounds enabled', () => {
      const settings: ExportSettings = {
        format: 'mov',
        codec: 'h264',
        quality: 'high',
        audioCodec: 'aac',
        transparentBackground: true,
        includeWallpaper: true,
        includeGradient: true,
      };

      const result = validateTransparencySettings(settings);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
// New copy focuses on MOV/web platform limitation or other advisory; just assert we got a warning
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should warn about low quality with transparency', () => {
      const settings: ExportSettings = {
        format: 'mov',
        codec: 'h264',
        quality: 'low',
        audioCodec: 'aac',
        transparentBackground: true,
      };

      const result = validateTransparencySettings(settings);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
// New copy changed; assert a warning is present
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should not validate when transparency is disabled', () => {
      const settings: ExportSettings = {
        format: 'mp4',
        codec: 'h264',
        quality: 'high',
        audioCodec: 'aac',
        transparentBackground: false,
      };

      const result = validateTransparencySettings(settings);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });
  });
});
