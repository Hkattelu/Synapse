// Export validation tests

import {
  validateExportSettings,
  getTransparencyCompatibilityWarning,
  isTransparencySupported,
  getFormatRecommendations,
  validateTransparencySettings,
  getRecommendedSettings,
} from '../exportValidation';
import type { ExportSettings } from '../../types';

describe('Export Validation', () => {
  describe('validateExportSettings', () => {
    it('should validate basic export settings', () => {
      const settings: ExportSettings = {
        format: 'mp4',
        codec: 'h264',
        audioCodec: 'aac',
        quality: 'high',
        width: 1920,
        height: 1080,
      };

      const result = validateExportSettings(settings);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect incompatible codec and format combinations', () => {
      const settings: ExportSettings = {
        format: 'mp4',
        codec: 'vp9', // VP9 not supported in MP4
        audioCodec: 'aac',
        quality: 'high',
      };

      const result = validateExportSettings(settings);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Codec vp9 is not supported by format mp4'
      );
    });

    it('should detect incompatible audio codec combinations', () => {
      const settings: ExportSettings = {
        format: 'webm',
        codec: 'vp9',
        audioCodec: 'aac', // AAC not supported in WebM
        quality: 'high',
      };

      const result = validateExportSettings(settings);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Audio codec aac is not supported by format webm'
      );
    });

    it('should validate transparency settings', () => {
      const settings: ExportSettings = {
        format: 'mp4', // MP4 doesn't support transparency
        codec: 'h264',
        audioCodec: 'aac',
        quality: 'high',
        transparentBackground: true,
      };

      const result = validateExportSettings(settings);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Format mp4 does not support transparent backgrounds'
      );
    });

    it('should warn about high resolution settings', () => {
      const settings: ExportSettings = {
        format: 'mp4',
        codec: 'h264',
        audioCodec: 'aac',
        quality: 'high',
        width: 8192,
        height: 4320,
      };

      const result = validateExportSettings(settings);
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should provide recommendations for transparency', () => {
      const settings: ExportSettings = {
        format: 'webm',
        codec: 'vp9',
        audioCodec: 'opus',
        quality: 'high',
        transparentBackground: true,
      };

      const result = validateExportSettings(settings);
      expect(result.isValid).toBe(true);
      expect(result.recommendations).toContain(
        'WebM with VP9 codec provides excellent transparency support and compression'
      );
    });
  });

  describe('isTransparencySupported', () => {
    it('should correctly identify transparency support', () => {
      expect(isTransparencySupported('webm')).toBe(true);
      expect(isTransparencySupported('mov')).toBe(true);
      expect(isTransparencySupported('mp4')).toBe(false);
      expect(isTransparencySupported('avi')).toBe(false);
    });
  });

  describe('getTransparencyCompatibilityWarning', () => {
    it('should return null for non-transparent exports', () => {
      const settings: ExportSettings = {
        format: 'mp4',
        codec: 'h264',
        audioCodec: 'aac',
        quality: 'high',
        transparentBackground: false,
      };

      const warning = getTransparencyCompatibilityWarning(settings);
      expect(warning).toBeNull();
    });

    it('should return warning for incompatible formats', () => {
      const settings: ExportSettings = {
        format: 'mp4',
        codec: 'h264',
        audioCodec: 'aac',
        quality: 'high',
        transparentBackground: true,
      };

      const warning = getTransparencyCompatibilityWarning(settings);
      expect(warning).toContain('MP4 format does not support transparency');
    });

    it('should return null for compatible formats', () => {
      const settings: ExportSettings = {
        format: 'webm',
        codec: 'vp9',
        audioCodec: 'opus',
        quality: 'high',
        transparentBackground: true,
      };

      const warning = getTransparencyCompatibilityWarning(settings);
      expect(warning).toBeNull();
    });
  });

  describe('validateTransparencySettings', () => {
    it('should validate compatible transparency settings', () => {
      const settings: ExportSettings = {
        format: 'webm',
        codec: 'vp9',
        audioCodec: 'opus',
        quality: 'high',
        transparentBackground: true,
      };

      const result = validateTransparencySettings(settings);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect incompatible transparency settings', () => {
      const settings: ExportSettings = {
        format: 'mp4',
        codec: 'h264',
        audioCodec: 'aac',
        quality: 'high',
        transparentBackground: true,
      };

      const result = validateTransparencySettings(settings);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should warn about browser compatibility', () => {
      const settings: ExportSettings = {
        format: 'webm',
        codec: 'vp9',
        audioCodec: 'opus',
        quality: 'high',
        transparentBackground: true,
      };

      const result = validateTransparencySettings(settings);
      expect(result.warnings).toContain(
        'WebM with transparency is not supported in Safari browsers'
      );
    });
  });

  describe('getFormatRecommendations', () => {
    it('should recommend transparency-compatible formats', () => {
      const recommendations = getFormatRecommendations({
        needsTransparency: true,
      });

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].format).toBe('webm');
      expect(recommendations[0].codec).toBe('vp9');
    });

    it('should recommend compatibility-focused formats', () => {
      const recommendations = getFormatRecommendations({
        prioritizeCompatibility: true,
      });

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].format).toBe('mp4');
      expect(recommendations[0].codec).toBe('h264');
    });

    it('should recommend file-size optimized formats', () => {
      const recommendations = getFormatRecommendations({
        prioritizeFileSize: true,
      });

      expect(recommendations.length).toBeGreaterThan(0);
      const formats = recommendations.map((r) => r.format);
      expect(formats).toContain('webm');
    });
  });

  describe('getRecommendedSettings', () => {
    it('should return web-optimized settings', () => {
      const settings = getRecommendedSettings('web');

      expect(settings.format).toBe('mp4');
      expect(settings.codec).toBe('h264');
      expect(settings.width).toBe(1920);
      expect(settings.height).toBe(1080);
    });

    it('should return social media optimized settings', () => {
      const settings = getRecommendedSettings('social');

      expect(settings.format).toBe('mp4');
      expect(settings.codec).toBe('h264');
      expect(settings.width).toBe(1080);
      expect(settings.height).toBe(1920); // Vertical format
    });

    it('should return broadcast quality settings', () => {
      const settings = getRecommendedSettings('broadcast');

      expect(settings.format).toBe('mov');
      expect(settings.quality).toBe('ultra');
      expect(settings.bitrate).toBeGreaterThan(20000);
    });

    it('should return archive quality settings', () => {
      const settings = getRecommendedSettings('archive');

      expect(settings.format).toBe('mov');
      expect(settings.codec).toBe('h265');
      expect(settings.quality).toBe('ultra');
    });
  });
});
