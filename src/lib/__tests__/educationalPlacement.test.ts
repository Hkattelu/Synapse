// Unit tests for educational placement system

import { describe, it, expect, beforeEach } from 'vitest';
import type { MediaAsset, TimelineItem } from '../types';
import {
  suggestTrackPlacement,
  validateTrackPlacement,
  suggestBatchTrackPlacement,
  getTrackUsageStatistics
} from '../educationalPlacement';
import { EDUCATIONAL_TRACKS, getEducationalTrackByName } from '../educationalTypes';

// Test data factories
function createMockMediaAsset(overrides: Partial<MediaAsset> = {}): MediaAsset {
  return {
    id: 'test-asset-1',
    name: 'test-file.txt',
    type: 'code',
    url: 'https://example.com/test.txt',
    duration: 10,
    metadata: {
      fileSize: 1024,
      mimeType: 'text/plain',
      ...overrides.metadata
    },
    createdAt: new Date(),
    ...overrides
  };
}

function createMockTimelineItem(overrides: Partial<TimelineItem> = {}): TimelineItem {
  return {
    id: 'test-item-1',
    assetId: 'test-asset-1',
    startTime: 0,
    duration: 10,
    track: 0,
    type: 'code',
    properties: {},
    animations: [],
    keyframes: [],
    ...overrides
  };
}

describe('suggestTrackPlacement', () => {
  describe('basic content type mapping', () => {
    it('should suggest Code track for code assets', () => {
      const asset = createMockMediaAsset({
        type: 'code',
        name: 'example.js',
        metadata: {
          fileSize: 1024,
          mimeType: 'text/javascript',
          language: 'javascript'
        }
      });

      const suggestion = suggestTrackPlacement(asset);

      expect(suggestion.suggestedTrack.name).toBe('Code');
      expect(suggestion.confidence).toBeGreaterThan(0.9);
      expect(suggestion.reason).toContain('Code');
    });

    it('should suggest Narration track for audio assets', () => {
      const asset = createMockMediaAsset({
        type: 'audio',
        name: 'narration.mp3',
        metadata: {
          fileSize: 2048,
          mimeType: 'audio/mpeg'
        }
      });

      const suggestion = suggestTrackPlacement(asset);

      expect(suggestion.suggestedTrack.name).toBe('Narration');
      expect(suggestion.confidence).toBeGreaterThan(0.8);
    });

    it('should suggest Visual track for video assets by default', () => {
      const asset = createMockMediaAsset({
        type: 'video',
        name: 'demo.mp4',
        metadata: {
          fileSize: 10240,
          mimeType: 'video/mp4',
          width: 1920,
          height: 1080
        }
      });

      const suggestion = suggestTrackPlacement(asset);

      expect(suggestion.suggestedTrack.name).toBe('Visual');
      expect(suggestion.confidence).toBeGreaterThan(0.6);
    });

    it('should suggest Visual track for visual assets', () => {
      const asset = createMockMediaAsset({
        type: 'visual-asset',
        name: 'arrow.svg',
        metadata: {
          fileSize: 512,
          mimeType: 'image/svg+xml',
          visualAssetType: 'arrow'
        }
      });

      const suggestion = suggestTrackPlacement(asset);

      expect(suggestion.suggestedTrack.name).toBe('Visual');
      expect(suggestion.confidence).toBeGreaterThan(0.8);
    });
  });

  describe('advanced content analysis patterns', () => {
    it('should detect screen recordings and suggest Visual track', () => {
      const asset = createMockMediaAsset({
        type: 'video',
        name: 'screen-recording-demo.mp4',
        metadata: {
          fileSize: 20480,
          mimeType: 'video/mp4'
        }
      });

      const suggestion = suggestTrackPlacement(asset);

      expect(suggestion.suggestedTrack.name).toBe('Visual');
      expect(suggestion.confidence).toBeGreaterThan(0.85);
      expect(suggestion.reason).toContain('Screen recording');
    });

    it('should detect talking head videos and suggest You track', () => {
      const asset = createMockMediaAsset({
        type: 'video',
        name: 'talking-head-intro.mp4',
        metadata: {
          fileSize: 15360,
          mimeType: 'video/mp4'
        }
      });

      const suggestion = suggestTrackPlacement(asset);

      expect(suggestion.suggestedTrack.name).toBe('You');
      expect(suggestion.confidence).toBeGreaterThan(0.9);
      expect(suggestion.reason).toContain('Personal video');
    });

    it('should detect webcam videos and suggest You track', () => {
      const asset = createMockMediaAsset({
        type: 'video',
        name: 'webcam-presentation.mp4',
        metadata: {
          fileSize: 12288,
          mimeType: 'video/mp4'
        }
      });

      const suggestion = suggestTrackPlacement(asset);

      expect(suggestion.suggestedTrack.name).toBe('You');
      expect(suggestion.confidence).toBeGreaterThan(0.9);
    });

    it('should detect code files by extension', () => {
      const codeFiles = [
        'example.js',
        'component.tsx',
        'styles.css',
        'main.py',
        'App.java',
        'script.php'
      ];

      codeFiles.forEach(filename => {
        const asset = createMockMediaAsset({
          type: 'code',
          name: filename
        });

        const suggestion = suggestTrackPlacement(asset);
        expect(suggestion.suggestedTrack.name).toBe('Code');
        expect(suggestion.confidence).toBeGreaterThan(0.9);
      });
    });

    it('should detect voiceover audio and suggest Narration track', () => {
      const asset = createMockMediaAsset({
        type: 'audio',
        name: 'voiceover-explanation.wav',
        metadata: {
          fileSize: 5120,
          mimeType: 'audio/wav'
        }
      });

      const suggestion = suggestTrackPlacement(asset);

      expect(suggestion.suggestedTrack.name).toBe('Narration');
      expect(suggestion.confidence).toBeGreaterThan(0.9);
      expect(suggestion.reason).toContain('Voiceover');
    });

    it('should detect background music and suggest Narration track', () => {
      const asset = createMockMediaAsset({
        type: 'audio',
        name: 'background-music.mp3',
        metadata: {
          fileSize: 3072,
          mimeType: 'audio/mpeg'
        }
      });

      const suggestion = suggestTrackPlacement(asset);

      expect(suggestion.suggestedTrack.name).toBe('Narration');
      expect(suggestion.confidence).toBeGreaterThan(0.7);
    });

    it('should detect educational diagrams and suggest Visual track', () => {
      const asset = createMockMediaAsset({
        type: 'image',
        name: 'architecture-diagram.png',
        metadata: {
          fileSize: 2048,
          mimeType: 'image/png',
          width: 800,
          height: 600
        }
      });

      const suggestion = suggestTrackPlacement(asset);

      expect(suggestion.suggestedTrack.name).toBe('Visual');
      expect(suggestion.confidence).toBeGreaterThan(0.85);
    });
  });

  describe('contextual adjustments', () => {
    it('should boost confidence when content matches selected track', () => {
      const asset = createMockMediaAsset({
        type: 'code',
        name: 'example.js'
      });

      const context = {
        selectedTrack: 0 // Code track
      };

      const suggestion = suggestTrackPlacement(asset, context);

      expect(suggestion.suggestedTrack.name).toBe('Code');
      expect(suggestion.confidence).toBeGreaterThan(0.95);
      expect(suggestion.reason).toContain('matches selected track');
    });

    it('should maintain consistency with recent track usage', () => {
      const asset = createMockMediaAsset({
        type: 'video',
        name: 'demo.mp4'
      });

      const existingItems = [
        createMockTimelineItem({ track: 1, type: 'video' }), // Visual track
        createMockTimelineItem({ track: 1, type: 'video' }), // Visual track
        createMockTimelineItem({ track: 1, type: 'visual-asset' }) // Visual track
      ];

      const context = {
        existingItems,
        currentTime: 10
      };

      const suggestion = suggestTrackPlacement(asset, context);

      expect(suggestion.suggestedTrack.name).toBe('Visual');
      expect(suggestion.reason).toContain('consistency');
    });

    it('should handle empty context gracefully', () => {
      const asset = createMockMediaAsset({
        type: 'code',
        name: 'test.js'
      });

      const suggestion = suggestTrackPlacement(asset, {});

      expect(suggestion.suggestedTrack.name).toBe('Code');
      expect(suggestion.confidence).toBeGreaterThan(0.9);
    });
  });

  describe('alternatives generation', () => {
    it('should provide meaningful alternatives for video content', () => {
      const asset = createMockMediaAsset({
        type: 'video',
        name: 'tutorial.mp4'
      });

      const suggestion = suggestTrackPlacement(asset);

      // Video content can only go on Visual and You tracks, so only 1 alternative
      expect(suggestion.alternatives).toHaveLength(1);
      expect(suggestion.alternatives.some(alt => alt.name === 'You')).toBe(true);
    });

    it('should provide alternatives for code content', () => {
      const asset = createMockMediaAsset({
        type: 'code',
        name: 'example.py'
      });

      const suggestion = suggestTrackPlacement(asset);

      expect(suggestion.alternatives.length).toBeGreaterThan(0);
      expect(suggestion.alternatives.some(alt => alt.name === 'Visual')).toBe(true);
    });

    it('should not include the suggested track in alternatives', () => {
      const asset = createMockMediaAsset({
        type: 'audio',
        name: 'narration.mp3'
      });

      const suggestion = suggestTrackPlacement(asset);

      expect(suggestion.alternatives.every(alt => alt.id !== suggestion.suggestedTrack.id)).toBe(true);
    });
  });

  describe('unknown content types', () => {
    it('should provide fallback suggestion for unknown content types', () => {
      const asset = createMockMediaAsset({
        // @ts-expect-error - Testing unknown type
        type: 'unknown',
        name: 'mystery-file.xyz'
      });

      const suggestion = suggestTrackPlacement(asset);

      expect(suggestion.suggestedTrack.name).toBe('Visual');
      expect(suggestion.confidence).toBe(0.5);
      expect(suggestion.reason).toContain('Unknown content type');
    });
  });
});

describe('validateTrackPlacement', () => {
  it('should validate appropriate placements', () => {
    const asset = createMockMediaAsset({
      type: 'code',
      name: 'example.js'
    });
    const codeTrack = getEducationalTrackByName('Code')!;

    const validation = validateTrackPlacement(asset, codeTrack);

    expect(validation.isValid).toBe(true);
    expect(validation.conflicts).toHaveLength(0);
  });

  it('should detect invalid placements', () => {
    const asset = createMockMediaAsset({
      type: 'audio',
      name: 'narration.mp3'
    });
    const codeTrack = getEducationalTrackByName('Code')!;

    const validation = validateTrackPlacement(asset, codeTrack);

    expect(validation.isValid).toBe(false);
    expect(validation.conflicts.length).toBeGreaterThan(0);
    expect(validation.conflicts[0]).toContain('audio content is not typically placed on Code track');
  });

  it('should provide warnings for suboptimal placements', () => {
    const asset = createMockMediaAsset({
      type: 'video',
      name: 'talking-head.mp4'
    });
    const visualTrack = getEducationalTrackByName('Visual')!;

    const validation = validateTrackPlacement(asset, visualTrack);

    expect(validation.isValid).toBe(true);
    expect(validation.warnings.length).toBeGreaterThan(0);
    expect(validation.warnings[0]).toContain('Consider placing');
  });

  it('should provide suggestions for invalid placements', () => {
    const asset = createMockMediaAsset({
      type: 'audio',
      name: 'voice.wav'
    });
    const visualTrack = getEducationalTrackByName('Visual')!;

    const validation = validateTrackPlacement(asset, visualTrack);

    expect(validation.isValid).toBe(false);
    expect(validation.suggestion).toBeDefined();
    expect(validation.suggestion!.suggestedTrack.name).toBe('Narration');
  });

  it('should warn about video on Code track', () => {
    const asset = createMockMediaAsset({
      type: 'video',
      name: 'demo.mp4'
    });
    const codeTrack = getEducationalTrackByName('Code')!;

    const validation = validateTrackPlacement(asset, codeTrack);

    expect(validation.warnings.some(w => w.includes('syntax highlighting'))).toBe(true);
  });

  it('should warn about audio not on Narration track', () => {
    const asset = createMockMediaAsset({
      type: 'audio',
      name: 'sound.mp3'
    });
    const visualTrack = getEducationalTrackByName('Visual')!;

    const validation = validateTrackPlacement(asset, visualTrack);

    expect(validation.warnings.some(w => w.includes('Narration track'))).toBe(true);
  });
});

describe('suggestBatchTrackPlacement', () => {
  it('should handle multiple assets', () => {
    const assets = [
      createMockMediaAsset({ type: 'code', name: 'main.js' }),
      createMockMediaAsset({ type: 'audio', name: 'narration.mp3' }),
      createMockMediaAsset({ type: 'video', name: 'screen-recording.mp4' })
    ];

    const suggestions = suggestBatchTrackPlacement(assets);

    expect(suggestions).toHaveLength(3);
    expect(suggestions[0].suggestedTrack.name).toBe('Code');
    expect(suggestions[1].suggestedTrack.name).toBe('Narration');
    expect(suggestions[2].suggestedTrack.name).toBe('Visual');
  });

  it('should apply context to all assets', () => {
    const assets = [
      createMockMediaAsset({ type: 'video', name: 'demo1.mp4' }),
      createMockMediaAsset({ type: 'video', name: 'demo2.mp4' })
    ];

    const context = {
      selectedTrack: 1 // Visual track
    };

    const suggestions = suggestBatchTrackPlacement(assets, context);

    suggestions.forEach(suggestion => {
      expect(suggestion.suggestedTrack.name).toBe('Visual');
    });
  });

  it('should handle empty asset array', () => {
    const suggestions = suggestBatchTrackPlacement([]);
    expect(suggestions).toHaveLength(0);
  });
});

describe('getTrackUsageStatistics', () => {
  it('should calculate track usage correctly', () => {
    const items = [
      createMockTimelineItem({ track: 0, type: 'code' }), // Code track
      createMockTimelineItem({ track: 0, type: 'code' }), // Code track
      createMockTimelineItem({ track: 1, type: 'video' }), // Visual track
      createMockTimelineItem({ track: 2, type: 'audio' }), // Narration track
      createMockTimelineItem({ track: 3, type: 'video' })  // You track
    ];

    const stats = getTrackUsageStatistics(items);

    expect(stats.totalItems).toBe(5);
    expect(stats.trackUsage.Code).toBe(2);
    expect(stats.trackUsage.Visual).toBe(1);
    expect(stats.trackUsage.Narration).toBe(1);
    expect(stats.trackUsage.You).toBe(1);
  });

  it('should calculate content type distribution', () => {
    const items = [
      createMockTimelineItem({ track: 0, type: 'code' }),
      createMockTimelineItem({ track: 1, type: 'video' }),
      createMockTimelineItem({ track: 1, type: 'video' }),
      createMockTimelineItem({ track: 2, type: 'audio' })
    ];

    const stats = getTrackUsageStatistics(items);

    expect(stats.contentTypeDistribution.code.Code).toBe(1);
    expect(stats.contentTypeDistribution.video.Visual).toBe(2);
    expect(stats.contentTypeDistribution.audio.Narration).toBe(1);
  });

  it('should handle empty timeline', () => {
    const stats = getTrackUsageStatistics([]);

    expect(stats.totalItems).toBe(0);
    expect(stats.trackUsage.Code).toBe(0);
    expect(stats.trackUsage.Visual).toBe(0);
    expect(stats.trackUsage.Narration).toBe(0);
    expect(stats.trackUsage.You).toBe(0);
  });

  it('should handle items with invalid track numbers', () => {
    const items = [
      createMockTimelineItem({ track: 0, type: 'code' }),
      createMockTimelineItem({ track: 99, type: 'video' }), // Invalid track
      createMockTimelineItem({ track: 1, type: 'video' })
    ];

    const stats = getTrackUsageStatistics(items);

    expect(stats.totalItems).toBe(3);
    expect(stats.trackUsage.Code).toBe(1);
    expect(stats.trackUsage.Visual).toBe(1);
    // Invalid track item should not be counted
  });
});

describe('edge cases and error handling', () => {
  it('should handle assets with missing metadata', () => {
    const asset = createMockMediaAsset({
      type: 'video',
      name: 'test.mp4',
      metadata: {
        fileSize: 1024,
        mimeType: 'video/mp4'
        // Missing other metadata
      }
    });

    const suggestion = suggestTrackPlacement(asset);

    expect(suggestion.suggestedTrack).toBeDefined();
    expect(suggestion.confidence).toBeGreaterThan(0);
  });

  it('should handle assets with empty names', () => {
    const asset = createMockMediaAsset({
      type: 'code',
      name: '',
      metadata: {
        fileSize: 1024,
        mimeType: 'text/plain'
      }
    });

    const suggestion = suggestTrackPlacement(asset);

    expect(suggestion.suggestedTrack.name).toBe('Code');
  });

  it('should handle very long asset names', () => {
    const longName = 'a'.repeat(1000) + '.js';
    const asset = createMockMediaAsset({
      type: 'code',
      name: longName
    });

    const suggestion = suggestTrackPlacement(asset);

    expect(suggestion.suggestedTrack.name).toBe('Code');
  });

  it('should handle special characters in asset names', () => {
    const asset = createMockMediaAsset({
      type: 'code',
      name: 'test-file_with@special#chars$.js'
    });

    const suggestion = suggestTrackPlacement(asset);

    expect(suggestion.suggestedTrack.name).toBe('Code');
  });
});