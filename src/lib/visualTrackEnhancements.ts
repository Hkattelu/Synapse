// Visual track enhancements for educational content
// Implements screen recording detection, optimization, and educational animation presets

import type { MediaAsset, TimelineItem, ItemProperties } from './types';
import type { EducationalTrack } from './educationalTypes';

// Screen recording detection types
export interface ScreenRecordingAnalysis {
  isScreenRecording: boolean;
  confidence: number;
  characteristics: {
    hasUIElements: boolean;
    hasCodeContent: boolean;
    hasMouseCursor: boolean;
    hasApplicationWindows: boolean;
    aspectRatio: number;
    resolution: { width: number; height: number };
  };
  optimizationSuggestions: ScreenRecordingOptimization[];
}

export interface ScreenRecordingOptimization {
  type: 'crop' | 'focus' | 'highlight' | 'zoom';
  description: string;
  parameters: Record<string, unknown>;
  confidence: number;
}

// Side-by-side layout configuration
export interface SideBySideLayout {
  type: 'left-right' | 'right-left' | 'top-bottom' | 'bottom-top';
  primaryContent: 'code' | 'visual';
  splitRatio: number; // 0.3 to 0.7, representing the split between content
  gap: number; // pixels
  alignment: 'start' | 'center' | 'end';
}

// Educational animation presets for Visual track
export interface VisualAnimationPreset {
  id: string;
  name: string;
  description: string;
  type: 'highlight' | 'zoom-focus' | 'callout' | 'pan' | 'reveal';
  parameters: Record<string, unknown>;
  duration: number; // seconds
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'bounce';
}

// Screen recording detection implementation
export function analyzeScreenRecording(
  asset: MediaAsset
): ScreenRecordingAnalysis {
  if (asset.type !== 'video') {
    return {
      isScreenRecording: false,
      confidence: 0,
      characteristics: {
        hasUIElements: false,
        hasCodeContent: false,
        hasMouseCursor: false,
        hasApplicationWindows: false,
        aspectRatio: 16 / 9,
        resolution: { width: 1920, height: 1080 },
      },
      optimizationSuggestions: [],
    };
  }

  const { width = 1920, height = 1080 } = asset.metadata;
  const aspectRatio = width / height;

  // Screen recording detection heuristics
  let confidence = 0;
  const characteristics = {
    hasUIElements: false,
    hasCodeContent: false,
    hasMouseCursor: false,
    hasApplicationWindows: false,
    aspectRatio,
    resolution: { width, height },
  };

  // Common screen recording aspect ratios
  const commonScreenRatios = [16 / 9, 16 / 10, 4 / 3, 21 / 9, 32 / 9];
  const isCommonScreenRatio = commonScreenRatios.some(
    (ratio) => Math.abs(aspectRatio - ratio) < 0.1
  );

  if (isCommonScreenRatio) {
    confidence += 0.3;
  }

  // High resolution suggests screen recording
  if (width >= 1920 || height >= 1080) {
    confidence += 0.2;
    characteristics.hasApplicationWindows = true;
  }

  // Ultra-wide or multiple monitor setups
  if (aspectRatio > 2.0) {
    confidence += 0.4;
    characteristics.hasApplicationWindows = true;
  }

  // Check filename for screen recording indicators
  const filename = asset.name.toLowerCase();
  const screenRecordingKeywords = [
    'screen',
    'recording',
    'capture',
    'demo',
    'tutorial',
    'walkthrough',
    'presentation',
    'desktop',
    'monitor',
  ];

  const hasScreenKeywords = screenRecordingKeywords.some((keyword) =>
    filename.includes(keyword)
  );

  if (hasScreenKeywords) {
    confidence += 0.3;
    characteristics.hasUIElements = true;
  }

  // Code-related keywords suggest code content
  const codeKeywords = [
    'code',
    'coding',
    'programming',
    'dev',
    'ide',
    'editor',
  ];
  const hasCodeKeywords = codeKeywords.some((keyword) =>
    filename.includes(keyword)
  );

  if (hasCodeKeywords) {
    confidence += 0.2;
    characteristics.hasCodeContent = true;
  }

  const isScreenRecording = confidence > 0.5;

  // Generate optimization suggestions
  const optimizationSuggestions: ScreenRecordingOptimization[] = [];

  if (isScreenRecording) {
    if (characteristics.hasCodeContent) {
      optimizationSuggestions.push({
        type: 'focus',
        description: 'Focus on code editor area for better readability',
        parameters: { focusArea: 'center', zoomLevel: 1.2 },
        confidence: 0.8,
      });
    }

    if (aspectRatio > 2.0) {
      optimizationSuggestions.push({
        type: 'crop',
        description: 'Crop to main content area to improve focus',
        parameters: { cropRatio: 16 / 9, position: 'center' },
        confidence: 0.7,
      });
    }

    if (characteristics.hasUIElements) {
      optimizationSuggestions.push({
        type: 'highlight',
        description:
          'Add highlights to draw attention to important UI elements',
        parameters: { highlightStyle: 'glow', color: '#F59E0B' },
        confidence: 0.6,
      });
    }
  }

  return {
    isScreenRecording,
    confidence,
    characteristics,
    optimizationSuggestions,
  };
}

// Side-by-side layout utilities
export function createSideBySideLayout(
  codeItem: TimelineItem,
  visualItem: TimelineItem,
  layoutType: SideBySideLayout['type'] = 'left-right'
): SideBySideLayout {
  return {
    type: layoutType,
    primaryContent: 'code', // Default to code as primary
    splitRatio: 0.5, // Equal split by default
    gap: 16, // 16px gap
    alignment: 'start',
  };
}

export function applySideBySideLayout(
  items: TimelineItem[],
  layout: SideBySideLayout
): TimelineItem[] {
  return items.map((item) => {
    const isCodeItem = item.type === 'code';
    const isVisualItem = item.type === 'video' || item.type === 'visual-asset';

    if (!isCodeItem && !isVisualItem) {
      return item;
    }

    // Apply layout-specific positioning
    const updatedProperties: Partial<ItemProperties> = {
      ...item.properties,
    };

    switch (layout.type) {
      case 'left-right':
        if (isCodeItem) {
          updatedProperties.x = 0;
          updatedProperties.scale = layout.splitRatio;
        } else if (isVisualItem) {
          updatedProperties.x = layout.splitRatio + layout.gap / 1920; // Normalize gap
          updatedProperties.scale = 1 - layout.splitRatio;
        }
        break;

      case 'right-left':
        if (isCodeItem) {
          updatedProperties.x = 1 - layout.splitRatio;
          updatedProperties.scale = layout.splitRatio;
        } else if (isVisualItem) {
          updatedProperties.x = 0;
          updatedProperties.scale = 1 - layout.splitRatio;
        }
        break;

      case 'top-bottom':
        if (isCodeItem) {
          updatedProperties.y = 0;
          updatedProperties.scale = layout.splitRatio;
        } else if (isVisualItem) {
          updatedProperties.y = layout.splitRatio + layout.gap / 1080; // Normalize gap
          updatedProperties.scale = 1 - layout.splitRatio;
        }
        break;

      case 'bottom-top':
        if (isCodeItem) {
          updatedProperties.y = 1 - layout.splitRatio;
          updatedProperties.scale = layout.splitRatio;
        } else if (isVisualItem) {
          updatedProperties.y = 0;
          updatedProperties.scale = 1 - layout.splitRatio;
        }
        break;
    }

    return {
      ...item,
      properties: updatedProperties,
    };
  });
}

// Educational animation presets for Visual track
export const VISUAL_ANIMATION_PRESETS: VisualAnimationPreset[] = [
  {
    id: 'highlight-glow',
    name: 'Highlight Glow',
    description: 'Add a glowing highlight effect to draw attention',
    type: 'highlight',
    parameters: {
      glowColor: '#F59E0B',
      glowIntensity: 0.8,
      pulseEffect: true,
      pulseDuration: 1.0,
    },
    duration: 2.0,
    easing: 'easeInOut',
  },
  {
    id: 'zoom-focus-center',
    name: 'Zoom Focus (Center)',
    description: 'Zoom into the center of the content for emphasis',
    type: 'zoom-focus',
    parameters: {
      focusPointX: 0.5,
      focusPointY: 0.5,
      zoomLevel: 1.5,
      transitionDuration: 1.0,
    },
    duration: 3.0,
    easing: 'easeOut',
  },
  {
    id: 'zoom-focus-custom',
    name: 'Zoom Focus (Custom Point)',
    description: 'Zoom into a specific area of the content',
    type: 'zoom-focus',
    parameters: {
      focusPointX: 0.5, // Will be customized
      focusPointY: 0.5, // Will be customized
      zoomLevel: 2.0,
      transitionDuration: 1.5,
    },
    duration: 4.0,
    easing: 'easeInOut',
  },
  {
    id: 'callout-arrow',
    name: 'Callout Arrow',
    description: 'Add an animated arrow pointing to important content',
    type: 'callout',
    parameters: {
      arrowDirection: 'down-right',
      arrowColor: '#EF4444',
      arrowSize: 'medium',
      animateIn: 'slide',
      animateOut: 'fade',
    },
    duration: 3.0,
    easing: 'bounce',
  },
  {
    id: 'callout-circle',
    name: 'Callout Circle',
    description: 'Add an animated circle to highlight specific areas',
    type: 'callout',
    parameters: {
      circleColor: '#10B981',
      circleStyle: 'dashed',
      strokeWidth: 3,
      animateIn: 'scale',
      pulseEffect: true,
    },
    duration: 2.5,
    easing: 'easeOut',
  },
  {
    id: 'pan-left-right',
    name: 'Pan Left to Right',
    description: 'Smoothly pan across the content from left to right',
    type: 'pan',
    parameters: {
      direction: 'left-to-right',
      panDistance: 0.3, // 30% of content width
      speed: 'slow',
    },
    duration: 4.0,
    easing: 'linear',
  },
  {
    id: 'pan-top-bottom',
    name: 'Pan Top to Bottom',
    description: 'Smoothly pan across the content from top to bottom',
    type: 'pan',
    parameters: {
      direction: 'top-to-bottom',
      panDistance: 0.4, // 40% of content height
      speed: 'medium',
    },
    duration: 3.5,
    easing: 'linear',
  },
  {
    id: 'reveal-wipe',
    name: 'Reveal Wipe',
    description: 'Reveal content with a wiping animation',
    type: 'reveal',
    parameters: {
      direction: 'left-to-right',
      revealStyle: 'wipe',
      featherEdge: true,
    },
    duration: 2.0,
    easing: 'easeInOut',
  },
  {
    id: 'reveal-iris',
    name: 'Reveal Iris',
    description: 'Reveal content with an expanding iris effect',
    type: 'reveal',
    parameters: {
      centerX: 0.5,
      centerY: 0.5,
      revealStyle: 'iris',
      shape: 'circle',
    },
    duration: 2.5,
    easing: 'easeOut',
  },
];

// Apply visual animation preset to timeline item
export function applyVisualAnimationPreset(
  item: TimelineItem,
  preset: VisualAnimationPreset,
  customParameters?: Record<string, unknown>
): TimelineItem {
  const parameters = { ...preset.parameters, ...customParameters };

  const updatedProperties: Partial<ItemProperties> = {
    ...item.properties,
  };

  switch (preset.type) {
    case 'highlight':
      updatedProperties.strokeColor = parameters.glowColor as string;
      updatedProperties.strokeWidth = 3;
      break;

    case 'zoom-focus':
      updatedProperties.autoFocus = true;
      updatedProperties.focusPointX = parameters.focusPointX as number;
      updatedProperties.focusPointY = parameters.focusPointY as number;
      updatedProperties.focusScale = parameters.zoomLevel as number;
      break;

    case 'callout':
      // Callout animations will be handled by overlay components
      break;

    case 'pan':
      updatedProperties.autoFocus = true;
      updatedProperties.focusScale = 1.2; // Slight zoom for better pan effect
      break;

    case 'reveal':
      updatedProperties.animateIn = 'fade';
      break;
  }

  return {
    ...item,
    properties: updatedProperties,
    // Store preset information for rendering
    animation: {
      preset: 'kenBurns' as const, // Map to existing animation system
      direction: 'zoomIn' as const,
      intensity: 0.5,
    },
  };
}

// Get appropriate animation presets for content type
export function getRecommendedPresetsForContent(
  asset: MediaAsset,
  analysis?: ScreenRecordingAnalysis
): VisualAnimationPreset[] {
  const recommended: VisualAnimationPreset[] = [];

  if (analysis?.isScreenRecording) {
    if (analysis.characteristics.hasCodeContent) {
      recommended.push(
        VISUAL_ANIMATION_PRESETS.find((p) => p.id === 'zoom-focus-center')!,
        VISUAL_ANIMATION_PRESETS.find((p) => p.id === 'highlight-glow')!,
        VISUAL_ANIMATION_PRESETS.find((p) => p.id === 'pan-left-right')!
      );
    } else {
      recommended.push(
        VISUAL_ANIMATION_PRESETS.find((p) => p.id === 'zoom-focus-custom')!,
        VISUAL_ANIMATION_PRESETS.find((p) => p.id === 'callout-arrow')!,
        VISUAL_ANIMATION_PRESETS.find((p) => p.id === 'pan-top-bottom')!
      );
    }
  } else {
    // Regular video content
    recommended.push(
      VISUAL_ANIMATION_PRESETS.find((p) => p.id === 'reveal-wipe')!,
      VISUAL_ANIMATION_PRESETS.find((p) => p.id === 'zoom-focus-center')!,
      VISUAL_ANIMATION_PRESETS.find((p) => p.id === 'callout-circle')!
    );
  }

  return recommended.filter(Boolean);
}

// Thumbnail generation utilities
export interface ThumbnailOptions {
  width: number;
  height: number;
  quality: number; // 0-1
  timestamp?: number; // seconds into video
  format: 'jpeg' | 'png' | 'webp';
}

export function generateThumbnailUrl(
  asset: MediaAsset,
  options: ThumbnailOptions = {
    width: 160,
    height: 90,
    quality: 0.8,
    format: 'jpeg',
  }
): string {
  // In a real implementation, this would generate actual thumbnails
  // For now, return a placeholder or existing thumbnail
  if (asset.thumbnail) {
    return asset.thumbnail;
  }

  // Generate placeholder thumbnail URL
  const { width, height } = options;
  return `https://via.placeholder.com/${width}x${height}/10B981/ffffff?text=Video`;
}

// Screen recording indicator utilities
export function getScreenRecordingIndicators(
  analysis: ScreenRecordingAnalysis
): Array<{ type: string; label: string; confidence: number }> {
  const indicators: Array<{ type: string; label: string; confidence: number }> =
    [];

  if (analysis.isScreenRecording) {
    indicators.push({
      type: 'screen-recording',
      label: 'Screen Recording',
      confidence: analysis.confidence,
    });
  }

  if (analysis.characteristics.hasCodeContent) {
    indicators.push({
      type: 'code-content',
      label: 'Contains Code',
      confidence: 0.8,
    });
  }

  if (analysis.characteristics.hasUIElements) {
    indicators.push({
      type: 'ui-elements',
      label: 'UI Elements',
      confidence: 0.7,
    });
  }

  if (analysis.characteristics.aspectRatio > 2.0) {
    indicators.push({
      type: 'ultrawide',
      label: 'Ultra-wide',
      confidence: 0.9,
    });
  }

  return indicators;
}
