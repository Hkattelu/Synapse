import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  detectTalkingHead,
  optimizeTalkingHeadSettings,
  getPiPPositionCoordinates,
  getPiPSizeDimensions,
  PRESENTATION_TEMPLATES,
  applyPresentationTemplate,
  validateYouTrackContent,
  generatePersonalVideoTransitions,
  type TalkingHeadDetectionResult,
  type PiPPosition,
  type PiPSize,
} from '../youTrackFeatures';
import type { TimelineItem } from '../types';

// Mock HTMLVideoElement and Canvas API
const mockVideoElement = {
  videoWidth: 1920,
  videoHeight: 1080,
} as HTMLVideoElement;

const mockCanvas = {
  width: 1920,
  height: 1080,
  getContext: vi.fn(() => ({
    drawImage: vi.fn(),
    getImageData: vi.fn(() => {
      // Create mock image data with skin tone pixels
      const data = new Uint8ClampedArray(1920 * 1080 * 4);
      // Fill with skin tone values (R > 95, G > 40, B > 20, and other conditions)
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 150; // R
        data[i + 1] = 100; // G
        data[i + 2] = 80; // B
        data[i + 3] = 255; // A
      }
      return { data };
    }),
  })),
};

// Mock document.createElement
Object.defineProperty(document, 'createElement', {
  value: vi.fn((tagName: string) => {
    if (tagName === 'canvas') {
      return mockCanvas;
    }
    return {};
  }),
});

describe('youTrackFeatures', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('detectTalkingHead', () => {
    it('detects face in video with good confidence', async () => {
      const result = await detectTalkingHead(mockVideoElement);

      expect(result.hasFace).toBe(true);
      expect(result.faceConfidence).toBeGreaterThan(0);
      expect(result.faceBounds).toBeDefined();
      expect(result.suggestions).toBeInstanceOf(Array);
    });

    it('provides suggestions when face confidence is low', async () => {
      // Mock low skin tone detection
      const mockLowConfidenceCanvas = {
        ...mockCanvas,
        getContext: vi.fn(() => ({
          drawImage: vi.fn(),
          getImageData: vi.fn(() => {
            // Create mock image data with very few skin tone pixels
            const data = new Uint8ClampedArray(1920 * 1080 * 4);
            // Fill with non-skin tone values
            for (let i = 0; i < data.length; i += 4) {
              data[i] = 50; // R
              data[i + 1] = 50; // G
              data[i + 2] = 50; // B
              data[i + 3] = 255; // A
            }
            return { data };
          }),
        })),
      };

      vi.mocked(document.createElement).mockReturnValue(
        mockLowConfidenceCanvas
      );

      const result = await detectTalkingHead(mockVideoElement);

      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions[0]).toContain('No face detected');
    });

    it('handles canvas context failure gracefully', async () => {
      const mockFailedCanvas = {
        ...mockCanvas,
        getContext: vi.fn(() => null),
      };

      vi.mocked(document.createElement).mockReturnValue(mockFailedCanvas);

      const result = await detectTalkingHead(mockVideoElement);

      expect(result.hasFace).toBe(false);
      expect(result.faceConfidence).toBe(0);
      expect(result.suggestions).toContain(
        'Unable to analyze video - canvas not supported'
      );
    });
  });

  describe('optimizeTalkingHeadSettings', () => {
    it('enables talking head mode when face is detected', () => {
      const detectionResult: TalkingHeadDetectionResult = {
        hasFace: true,
        faceConfidence: 85,
        faceBounds: { x: 100, y: 50, width: 200, height: 300 },
        isOptimal: true,
        suggestions: [],
      };

      const optimized = optimizeTalkingHeadSettings(detectionResult, {});

      expect(optimized.talkingHeadEnabled).toBe(true);
      expect(optimized.talkingHeadCorner).toBe('bottom-right');
      expect(optimized.talkingHeadSize).toBe('md');
    });

    it('enables background removal for high confidence detection', () => {
      const detectionResult: TalkingHeadDetectionResult = {
        hasFace: true,
        faceConfidence: 75,
        faceBounds: { x: 100, y: 50, width: 200, height: 300 },
        isOptimal: true,
        suggestions: [],
      };

      const optimized = optimizeTalkingHeadSettings(detectionResult, {});

      expect(optimized.backgroundRemoval).toBe(true);
      expect(optimized.backgroundBlur).toBe(0.8);
    });

    it('uses larger size for lower confidence detection', () => {
      const detectionResult: TalkingHeadDetectionResult = {
        hasFace: true,
        faceConfidence: 50,
        faceBounds: { x: 100, y: 50, width: 200, height: 300 },
        isOptimal: false,
        suggestions: [],
      };

      const optimized = optimizeTalkingHeadSettings(detectionResult, {});

      expect(optimized.talkingHeadSize).toBe('lg');
    });

    it('preserves existing properties', () => {
      const detectionResult: TalkingHeadDetectionResult = {
        hasFace: true,
        faceConfidence: 85,
        faceBounds: { x: 100, y: 50, width: 200, height: 300 },
        isOptimal: true,
        suggestions: [],
      };

      const existingProperties = { volume: 0.5, customProperty: 'test' };
      const optimized = optimizeTalkingHeadSettings(
        detectionResult,
        existingProperties
      );

      expect(optimized.volume).toBe(0.9); // Should be updated
      expect(optimized.customProperty).toBe('test'); // Should be preserved
    });
  });

  describe('getPiPPositionCoordinates', () => {
    const containerSize = { width: 1920, height: 1080 };
    const pipSize = { width: 400, height: 300 };

    it('calculates top-left position correctly', () => {
      const position = getPiPPositionCoordinates(
        'top-left',
        containerSize,
        pipSize
      );
      expect(position).toEqual({ x: 20, y: 20 });
    });

    it('calculates bottom-right position correctly', () => {
      const position = getPiPPositionCoordinates(
        'bottom-right',
        containerSize,
        pipSize
      );
      expect(position).toEqual({ x: 1500, y: 760 }); // 1920-400-20, 1080-300-20
    });

    it('calculates center position correctly', () => {
      const position = getPiPPositionCoordinates(
        'center',
        containerSize,
        pipSize
      );
      expect(position).toEqual({ x: 760, y: 390 }); // (1920-400)/2, (1080-300)/2
    });

    it('defaults to top-left for unknown position', () => {
      const position = getPiPPositionCoordinates(
        'custom' as PiPPosition,
        containerSize,
        pipSize
      );
      expect(position).toEqual({ x: 20, y: 20 });
    });
  });

  describe('getPiPSizeDimensions', () => {
    const containerSize = { width: 1920, height: 1080 };

    it('calculates small size correctly', () => {
      const size = getPiPSizeDimensions('small', containerSize);
      expect(size.width).toBe(384); // 20% of 1920
      expect(size.height).toBe(216); // Maintain 16:9 aspect ratio
    });

    it('calculates medium size correctly', () => {
      const size = getPiPSizeDimensions('medium', containerSize);
      expect(size.width).toBe(576); // 30% of 1920
      expect(size.height).toBe(324); // Maintain 16:9 aspect ratio
    });

    it('calculates large size correctly', () => {
      const size = getPiPSizeDimensions('large', containerSize);
      expect(size.width).toBe(768); // 40% of 1920
      expect(size.height).toBe(432); // Maintain 16:9 aspect ratio
    });

    it('defaults to medium size for unknown size', () => {
      const size = getPiPSizeDimensions('custom' as PiPSize, containerSize);
      expect(size.width).toBe(480); // 25% of 1920 (default)
      expect(size.height).toBe(270); // Maintain 16:9 aspect ratio
    });
  });

  describe('PRESENTATION_TEMPLATES', () => {
    it('contains expected templates', () => {
      expect(PRESENTATION_TEMPLATES).toHaveLength(4);

      const templateIds = PRESENTATION_TEMPLATES.map((t) => t.id);
      expect(templateIds).toContain('professional-corner');
      expect(templateIds).toContain('center-stage');
      expect(templateIds).toContain('split-screen');
      expect(templateIds).toContain('picture-frame');
    });

    it('has valid template structure', () => {
      PRESENTATION_TEMPLATES.forEach((template) => {
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('description');
        expect(template).toHaveProperty('pipConfig');
        expect(template).toHaveProperty('backgroundOptions');
        expect(template).toHaveProperty('overlays');
        expect(template).toHaveProperty('animations');
      });
    });
  });

  describe('applyPresentationTemplate', () => {
    const mockItem: TimelineItem = {
      id: 'test-item',
      type: 'video',
      src: '/test.mp4',
      startTime: 0,
      duration: 30,
    };

    it('applies professional corner template correctly', () => {
      const template = PRESENTATION_TEMPLATES.find(
        (t) => t.id === 'professional-corner'
      )!;
      const properties = applyPresentationTemplate(template, mockItem);

      expect(properties.talkingHeadEnabled).toBe(true);
      expect(properties.talkingHeadCorner).toBe('bottom-right');
      expect(properties.talkingHeadSize).toBe('md');
      expect(properties.backgroundBlur).toBe(0.6);
      expect(properties.presentationTemplate).toBe('professional-corner');
    });

    it('applies center stage template correctly', () => {
      const template = PRESENTATION_TEMPLATES.find(
        (t) => t.id === 'center-stage'
      )!;
      const properties = applyPresentationTemplate(template, mockItem);

      expect(properties.talkingHeadEnabled).toBe(true);
      expect(properties.talkingHeadSize).toBe('lg');
      expect(properties.backgroundRemoval).toBe(true);
      expect(properties.presentationTemplate).toBe('center-stage');
    });

    it('includes template overlays', () => {
      const template = PRESENTATION_TEMPLATES.find(
        (t) => t.id === 'professional-corner'
      )!;
      const properties = applyPresentationTemplate(template, mockItem);

      expect(properties.templateOverlays).toEqual(template.overlays);
    });
  });

  describe('validateYouTrackContent', () => {
    it('validates video content as valid', () => {
      const videoItem: TimelineItem = {
        id: 'test-item',
        type: 'video',
        src: '/test.mp4',
        startTime: 0,
        duration: 30,
        properties: {
          talkingHeadEnabled: true,
          volume: 0.8,
        },
      };

      const validation = validateYouTrackContent(videoItem);

      expect(validation.isValid).toBe(true);
      expect(validation.warnings).toHaveLength(0);
    });

    it('warns about non-video content', () => {
      const audioItem: TimelineItem = {
        id: 'test-item',
        type: 'audio',
        src: '/test.mp3',
        startTime: 0,
        duration: 30,
      };

      const validation = validateYouTrackContent(audioItem);

      expect(validation.isValid).toBe(false);
      expect(validation.warnings).toContain(
        'You track is optimized for video content'
      );
      expect(validation.suggestions).toContain(
        'Consider moving non-video content to appropriate tracks'
      );
    });

    it('suggests enabling talking head mode', () => {
      const videoItem: TimelineItem = {
        id: 'test-item',
        type: 'video',
        src: '/test.mp4',
        startTime: 0,
        duration: 30,
        properties: {
          talkingHeadEnabled: false,
        },
      };

      const validation = validateYouTrackContent(videoItem);

      expect(validation.suggestions).toContain(
        'Enable talking head mode for better personal video presentation'
      );
    });

    it('suggests increasing volume for low audio', () => {
      const videoItem: TimelineItem = {
        id: 'test-item',
        type: 'video',
        src: '/test.mp4',
        startTime: 0,
        duration: 30,
        properties: {
          volume: 0.5,
        },
      };

      const validation = validateYouTrackContent(videoItem);

      expect(validation.suggestions).toContain(
        'Consider increasing audio volume for better narration clarity'
      );
    });
  });

  describe('generatePersonalVideoTransitions', () => {
    it('generates transitions between video segments', () => {
      const items: TimelineItem[] = [
        {
          id: 'item1',
          type: 'video',
          src: '/video1.mp4',
          startTime: 0,
          duration: 10,
          properties: { talkingHeadCorner: 'bottom-right' },
        },
        {
          id: 'item2',
          type: 'video',
          src: '/video2.mp4',
          startTime: 10,
          duration: 10,
          properties: { talkingHeadCorner: 'bottom-left' },
        },
        {
          id: 'item3',
          type: 'video',
          src: '/video3.mp4',
          startTime: 20,
          duration: 10,
          properties: { talkingHeadCorner: 'bottom-left' },
        },
      ];

      const transitions = generatePersonalVideoTransitions(items);

      expect(transitions).toHaveLength(2);

      // First transition (different positions) should use slide
      expect(transitions[0]).toEqual({
        fromItem: 'item1',
        toItem: 'item2',
        transition: {
          type: 'slide',
          duration: 0.5,
          easing: 'ease-in-out',
        },
      });

      // Second transition (same positions) should use crossfade
      expect(transitions[1]).toEqual({
        fromItem: 'item2',
        toItem: 'item3',
        transition: {
          type: 'crossfade',
          duration: 0.5,
          easing: 'ease-in-out',
        },
      });
    });

    it('returns empty array for single item', () => {
      const items: TimelineItem[] = [
        {
          id: 'item1',
          type: 'video',
          src: '/video1.mp4',
          startTime: 0,
          duration: 10,
        },
      ];

      const transitions = generatePersonalVideoTransitions(items);

      expect(transitions).toHaveLength(0);
    });

    it('returns empty array for no items', () => {
      const transitions = generatePersonalVideoTransitions([]);

      expect(transitions).toHaveLength(0);
    });
  });
});
