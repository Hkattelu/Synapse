// Tests for Visual track enhancements
import { describe, it, expect } from 'vitest';
import {
  analyzeScreenRecording,
  getScreenRecordingIndicators,
  createSideBySideLayout,
  applySideBySideLayout,
  applyVisualAnimationPreset,
  getRecommendedPresetsForContent,
  VISUAL_ANIMATION_PRESETS,
} from '../visualTrackEnhancements';
import type { MediaAsset, TimelineItem } from '../types';

// Mock media assets for testing
const mockVideoAsset: MediaAsset = {
  id: 'video-1',
  name: 'screen-recording-demo.mp4',
  type: 'video',
  url: 'https://example.com/video.mp4',
  duration: 120,
  metadata: {
    width: 1920,
    height: 1080,
    fps: 30,
    fileSize: 50000000,
    mimeType: 'video/mp4',
  },
  createdAt: new Date(),
};

const mockCodeVideoAsset: MediaAsset = {
  id: 'video-2',
  name: 'coding-tutorial-vscode.mp4',
  type: 'video',
  url: 'https://example.com/code-video.mp4',
  duration: 300,
  metadata: {
    width: 2560,
    height: 1440,
    fps: 60,
    fileSize: 100000000,
    mimeType: 'video/mp4',
  },
  createdAt: new Date(),
};

const mockUltrawideAsset: MediaAsset = {
  id: 'video-3',
  name: 'ultrawide-screen-capture.mp4',
  type: 'video',
  url: 'https://example.com/ultrawide.mp4',
  duration: 180,
  metadata: {
    width: 3440,
    height: 1440,
    fps: 30,
    fileSize: 80000000,
    mimeType: 'video/mp4',
  },
  createdAt: new Date(),
};

const mockImageAsset: MediaAsset = {
  id: 'image-1',
  name: 'diagram.png',
  type: 'image',
  url: 'https://example.com/image.png',
  metadata: {
    width: 800,
    height: 600,
    fileSize: 500000,
    mimeType: 'image/png',
  },
  createdAt: new Date(),
};

const mockTimelineItem: TimelineItem = {
  id: 'item-1',
  assetId: 'video-1',
  startTime: 0,
  duration: 10,
  track: 1,
  type: 'video',
  properties: {},
  animations: [],
  keyframes: [],
};

describe('analyzeScreenRecording', () => {
  it('should detect screen recording from filename and dimensions', () => {
    const analysis = analyzeScreenRecording(mockVideoAsset);
    
    expect(analysis.isScreenRecording).toBe(true);
    expect(analysis.confidence).toBeGreaterThan(0.5);
    expect(analysis.characteristics.hasUIElements).toBe(true);
    expect(analysis.characteristics.aspectRatio).toBeCloseTo(16/9);
  });

  it('should detect code content from filename', () => {
    const analysis = analyzeScreenRecording(mockCodeVideoAsset);
    
    expect(analysis.isScreenRecording).toBe(true);
    expect(analysis.characteristics.hasCodeContent).toBe(true);
    expect(analysis.optimizationSuggestions.length).toBeGreaterThan(0);
  });

  it('should detect ultrawide screen recordings', () => {
    const analysis = analyzeScreenRecording(mockUltrawideAsset);
    
    expect(analysis.isScreenRecording).toBe(true);
    expect(analysis.characteristics.aspectRatio).toBeCloseTo(3440/1440);
    expect(analysis.optimizationSuggestions.some(s => s.type === 'crop')).toBe(true);
  });

  it('should not detect screen recording for regular images', () => {
    const analysis = analyzeScreenRecording(mockImageAsset);
    
    expect(analysis.isScreenRecording).toBe(false);
    expect(analysis.confidence).toBe(0);
  });

  it('should provide optimization suggestions for screen recordings', () => {
    const analysis = analyzeScreenRecording(mockCodeVideoAsset);
    
    expect(analysis.optimizationSuggestions.length).toBeGreaterThan(0);
    expect(analysis.optimizationSuggestions.some(s => s.type === 'focus')).toBe(true);
  });
});

describe('getScreenRecordingIndicators', () => {
  it('should return appropriate indicators for screen recordings', () => {
    const analysis = analyzeScreenRecording(mockCodeVideoAsset);
    const indicators = getScreenRecordingIndicators(analysis);
    
    expect(indicators.length).toBeGreaterThan(0);
    expect(indicators.some(i => i.type === 'screen-recording')).toBe(true);
    expect(indicators.some(i => i.type === 'code-content')).toBe(true);
  });

  it('should return ultrawide indicator for ultrawide content', () => {
    const analysis = analyzeScreenRecording(mockUltrawideAsset);
    const indicators = getScreenRecordingIndicators(analysis);
    
    expect(indicators.some(i => i.type === 'ultrawide')).toBe(true);
  });

  it('should return empty array for non-screen recordings', () => {
    const analysis = analyzeScreenRecording(mockImageAsset);
    const indicators = getScreenRecordingIndicators(analysis);
    
    expect(indicators.length).toBe(0);
  });
});

describe('createSideBySideLayout', () => {
  const mockCodeItem: TimelineItem = {
    ...mockTimelineItem,
    id: 'code-item',
    type: 'code',
    track: 0,
  };

  const mockVisualItem: TimelineItem = {
    ...mockTimelineItem,
    id: 'visual-item',
    type: 'video',
    track: 1,
  };

  it('should create default left-right layout', () => {
    const layout = createSideBySideLayout(mockCodeItem, mockVisualItem);
    
    expect(layout.type).toBe('left-right');
    expect(layout.primaryContent).toBe('code');
    expect(layout.splitRatio).toBe(0.5);
    expect(layout.gap).toBe(16);
  });

  it('should create custom layout type', () => {
    const layout = createSideBySideLayout(mockCodeItem, mockVisualItem, 'top-bottom');
    
    expect(layout.type).toBe('top-bottom');
  });
});

describe('applySideBySideLayout', () => {
  const mockCodeItem: TimelineItem = {
    ...mockTimelineItem,
    id: 'code-item',
    type: 'code',
    track: 0,
  };

  const mockVisualItem: TimelineItem = {
    ...mockTimelineItem,
    id: 'visual-item',
    type: 'video',
    track: 1,
  };

  it('should apply left-right layout positioning', () => {
    const layout = createSideBySideLayout(mockCodeItem, mockVisualItem, 'left-right');
    const items = [mockCodeItem, mockVisualItem];
    const result = applySideBySideLayout(items, layout);
    
    expect(result[0].properties.x).toBe(0);
    expect(result[0].properties.scale).toBe(0.5);
    expect(result[1].properties.x).toBeGreaterThan(0.5);
    expect(result[1].properties.scale).toBe(0.5);
  });

  it('should apply top-bottom layout positioning', () => {
    const layout = createSideBySideLayout(mockCodeItem, mockVisualItem, 'top-bottom');
    const items = [mockCodeItem, mockVisualItem];
    const result = applySideBySideLayout(items, layout);
    
    expect(result[0].properties.y).toBe(0);
    expect(result[1].properties.y).toBeGreaterThan(0.5);
  });

  it('should not modify non-code/visual items', () => {
    const audioItem: TimelineItem = {
      ...mockTimelineItem,
      id: 'audio-item',
      type: 'audio',
      track: 2,
    };
    
    const layout = createSideBySideLayout(mockCodeItem, mockVisualItem);
    const items = [audioItem];
    const result = applySideBySideLayout(items, layout);
    
    expect(result[0]).toEqual(audioItem);
  });
});

describe('VISUAL_ANIMATION_PRESETS', () => {
  it('should contain expected preset types', () => {
    const presetTypes = VISUAL_ANIMATION_PRESETS.map(p => p.type);
    
    expect(presetTypes).toContain('highlight');
    expect(presetTypes).toContain('zoom-focus');
    expect(presetTypes).toContain('callout');
    expect(presetTypes).toContain('pan');
    expect(presetTypes).toContain('reveal');
  });

  it('should have valid preset configurations', () => {
    VISUAL_ANIMATION_PRESETS.forEach(preset => {
      expect(preset.id).toBeTruthy();
      expect(preset.name).toBeTruthy();
      expect(preset.description).toBeTruthy();
      expect(preset.duration).toBeGreaterThan(0);
      expect(preset.parameters).toBeDefined();
    });
  });
});

describe('applyVisualAnimationPreset', () => {
  it('should apply highlight preset properties', () => {
    const highlightPreset = VISUAL_ANIMATION_PRESETS.find(p => p.type === 'highlight')!;
    const result = applyVisualAnimationPreset(mockTimelineItem, highlightPreset);
    
    expect(result.properties.strokeColor).toBeDefined();
    expect(result.properties.strokeWidth).toBe(3);
  });

  it('should apply zoom-focus preset properties', () => {
    const zoomPreset = VISUAL_ANIMATION_PRESETS.find(p => p.type === 'zoom-focus')!;
    const result = applyVisualAnimationPreset(mockTimelineItem, zoomPreset);
    
    expect(result.properties.autoFocus).toBe(true);
    expect(result.properties.focusPointX).toBeDefined();
    expect(result.properties.focusPointY).toBeDefined();
    expect(result.properties.focusScale).toBeDefined();
  });

  it('should apply custom parameters', () => {
    const zoomPreset = VISUAL_ANIMATION_PRESETS.find(p => p.type === 'zoom-focus')!;
    const customParams = { focusPointX: 0.8, focusPointY: 0.2 };
    const result = applyVisualAnimationPreset(mockTimelineItem, zoomPreset, customParams);
    
    expect(result.properties.focusPointX).toBe(0.8);
    expect(result.properties.focusPointY).toBe(0.2);
  });

  it('should preserve existing item properties', () => {
    const itemWithProps: TimelineItem = {
      ...mockTimelineItem,
      properties: {
        x: 100,
        y: 200,
        opacity: 0.8,
      },
    };
    
    const preset = VISUAL_ANIMATION_PRESETS[0];
    const result = applyVisualAnimationPreset(itemWithProps, preset);
    
    expect(result.properties.x).toBe(100);
    expect(result.properties.y).toBe(200);
    expect(result.properties.opacity).toBe(0.8);
  });
});

describe('getRecommendedPresetsForContent', () => {
  it('should recommend appropriate presets for screen recordings with code', () => {
    const analysis = analyzeScreenRecording(mockCodeVideoAsset);
    const presets = getRecommendedPresetsForContent(mockCodeVideoAsset, analysis);
    
    expect(presets.length).toBeGreaterThan(0);
    expect(presets.some(p => p.type === 'zoom-focus')).toBe(true);
    expect(presets.some(p => p.type === 'highlight')).toBe(true);
  });

  it('should recommend different presets for regular screen recordings', () => {
    const analysis = analyzeScreenRecording(mockVideoAsset);
    const presets = getRecommendedPresetsForContent(mockVideoAsset, analysis);
    
    expect(presets.length).toBeGreaterThan(0);
    expect(presets.some(p => p.type === 'callout')).toBe(true);
  });

  it('should recommend presets for regular video content', () => {
    const regularVideo: MediaAsset = {
      ...mockVideoAsset,
      name: 'regular-video.mp4',
    };
    
    const analysis = analyzeScreenRecording(regularVideo);
    const presets = getRecommendedPresetsForContent(regularVideo, analysis);
    
    expect(presets.length).toBeGreaterThan(0);
    // For regular video content (non-screen recording), we expect zoom-focus and callout presets
    expect(presets.some(p => p.type === 'zoom-focus' || p.type === 'reveal')).toBe(true);
  });

  it('should handle assets without analysis', () => {
    const presets = getRecommendedPresetsForContent(mockVideoAsset);
    
    expect(presets.length).toBeGreaterThan(0);
  });
});