// You track personal video features for Synapse Studio

import type { TimelineItem, ItemProperties } from './types';

// Talking head detection and optimization types
export interface TalkingHeadDetectionResult {
  hasFace: boolean;
  faceConfidence: number;
  faceBounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  isOptimal: boolean;
  suggestions: string[];
}

export interface TalkingHeadOptimization {
  cropToFace: boolean;
  enhanceAudio: boolean;
  stabilizeVideo: boolean;
  adjustLighting: boolean;
  removeBackground: boolean;
}

// Picture-in-picture positioning and sizing
export type PiPPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'center'
  | 'custom';

export type PiPSize = 'small' | 'medium' | 'large' | 'custom';

export interface PiPConfiguration {
  position: PiPPosition;
  size: PiPSize;
  customPosition?: { x: number; y: number };
  customSize?: { width: number; height: number };
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  shadow: boolean;
  opacity: number;
}

// Background removal and replacement
export interface BackgroundOptions {
  type: 'none' | 'blur' | 'remove' | 'replace' | 'greenscreen';
  blurAmount?: number;
  replacementImage?: string;
  replacementVideo?: string;
  chromaKeyColor?: string;
  chromaKeyTolerance?: number;
  edgeFeathering?: number;
}

// Professional presentation templates
export interface PresentationTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  pipConfig: PiPConfiguration;
  backgroundOptions: BackgroundOptions;
  overlays: PresentationOverlay[];
  animations: TemplateAnimation[];
}

export interface PresentationOverlay {
  id: string;
  type: 'title' | 'subtitle' | 'logo' | 'social' | 'progress' | 'custom';
  position: { x: number; y: number };
  size: { width: number; height: number };
  content: string;
  style: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    backgroundColor?: string;
    borderRadius?: number;
    padding?: number;
  };
  animation?: {
    entrance: string;
    exit: string;
    duration: number;
  };
}

export interface TemplateAnimation {
  id: string;
  name: string;
  target: 'pip' | 'overlay' | 'background';
  keyframes: Array<{
    time: number;
    properties: Record<string, any>;
  }>;
}

// Talking head detection (simplified implementation)
export function detectTalkingHead(
  videoElement: HTMLVideoElement
): Promise<TalkingHeadDetectionResult> {
  return new Promise((resolve) => {
    // Simplified face detection - in a real implementation, this would use
    // computer vision libraries like MediaPipe or TensorFlow.js
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      resolve({
        hasFace: false,
        faceConfidence: 0,
        isOptimal: false,
        suggestions: ['Unable to analyze video - canvas not supported'],
      });
      return;
    }

    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    ctx.drawImage(videoElement, 0, 0);

    // Simple heuristic-based detection
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Look for skin tone pixels in the upper portion of the video
    let skinPixels = 0;
    const upperHalf = Math.floor(canvas.height / 2);

    for (let y = 0; y < upperHalf; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const i = (y * canvas.width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Simple skin tone detection
        if (
          r > 95 &&
          g > 40 &&
          b > 20 &&
          Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
          Math.abs(r - g) > 15 &&
          r > g &&
          r > b
        ) {
          skinPixels++;
        }
      }
    }

    const skinRatio = skinPixels / (canvas.width * upperHalf);
    const hasFace = skinRatio > 0.02; // 2% skin tone pixels
    const faceConfidence = Math.min(skinRatio * 50, 100);

    const suggestions: string[] = [];
    if (!hasFace) {
      suggestions.push(
        'No face detected - ensure you are visible in the video'
      );
    } else if (faceConfidence < 30) {
      suggestions.push('Face detection confidence is low - improve lighting');
      suggestions.push('Move closer to the camera');
    }

    if (canvas.width < 1280) {
      suggestions.push(
        'Video resolution is low - use at least 720p for better quality'
      );
    }

    resolve({
      hasFace,
      faceConfidence,
      faceBounds: hasFace
        ? {
            x: Math.floor(canvas.width * 0.3),
            y: Math.floor(canvas.height * 0.1),
            width: Math.floor(canvas.width * 0.4),
            height: Math.floor(canvas.height * 0.6),
          }
        : undefined,
      isOptimal: hasFace && faceConfidence > 60,
      suggestions,
    });
  });
}

// Optimize talking head video settings
export function optimizeTalkingHeadSettings(
  detectionResult: TalkingHeadDetectionResult,
  currentProperties: Partial<ItemProperties>
): Partial<ItemProperties> {
  const optimized: Partial<ItemProperties> = { ...currentProperties };

  if (detectionResult.hasFace && detectionResult.faceBounds) {
    // Enable talking head mode
    optimized.talkingHeadEnabled = true;

    // Set optimal PiP configuration
    optimized.talkingHeadCorner = 'bottom-right';
    optimized.talkingHeadSize =
      detectionResult.faceConfidence > 70 ? 'md' : 'lg';

    // Enable background removal if face confidence is high
    if (detectionResult.faceConfidence > 60) {
      optimized.backgroundRemoval = true;
      optimized.backgroundBlur = 0.8;
    }

    // Adjust audio settings for talking head content
    optimized.volume = 0.9;
    optimized.audioEnhancement = true;
  }

  return optimized;
}

// Get PiP position coordinates
export function getPiPPositionCoordinates(
  position: PiPPosition,
  containerSize: { width: number; height: number },
  pipSize: { width: number; height: number }
): { x: number; y: number } {
  const margin = 20; // Margin from edges

  switch (position) {
    case 'top-left':
      return { x: margin, y: margin };
    case 'top-right':
      return { x: containerSize.width - pipSize.width - margin, y: margin };
    case 'bottom-left':
      return { x: margin, y: containerSize.height - pipSize.height - margin };
    case 'bottom-right':
      return {
        x: containerSize.width - pipSize.width - margin,
        y: containerSize.height - pipSize.height - margin,
      };
    case 'center':
      return {
        x: (containerSize.width - pipSize.width) / 2,
        y: (containerSize.height - pipSize.height) / 2,
      };
    default:
      return { x: margin, y: margin };
  }
}

// Get PiP size dimensions
export function getPiPSizeDimensions(
  size: PiPSize,
  containerSize: { width: number; height: number }
): { width: number; height: number } {
  const aspectRatio = 16 / 9; // Assume 16:9 aspect ratio for talking head videos

  switch (size) {
    case 'small':
      const smallWidth = Math.floor(containerSize.width * 0.2);
      return {
        width: smallWidth,
        height: Math.floor(smallWidth / aspectRatio),
      };
    case 'medium':
      const mediumWidth = Math.floor(containerSize.width * 0.3);
      return {
        width: mediumWidth,
        height: Math.floor(mediumWidth / aspectRatio),
      };
    case 'large':
      const largeWidth = Math.floor(containerSize.width * 0.4);
      return {
        width: largeWidth,
        height: Math.floor(largeWidth / aspectRatio),
      };
    default:
      const defaultWidth = Math.floor(containerSize.width * 0.25);
      return {
        width: defaultWidth,
        height: Math.floor(defaultWidth / aspectRatio),
      };
  }
}

// Professional presentation templates
export const PRESENTATION_TEMPLATES: PresentationTemplate[] = [
  {
    id: 'professional-corner',
    name: 'Professional Corner',
    description: 'Clean corner placement with subtle branding',
    thumbnail: '/templates/professional-corner.jpg',
    pipConfig: {
      position: 'bottom-right',
      size: 'medium',
      borderRadius: 8,
      borderWidth: 2,
      borderColor: '#ffffff',
      shadow: true,
      opacity: 1,
    },
    backgroundOptions: {
      type: 'blur',
      blurAmount: 0.6,
    },
    overlays: [
      {
        id: 'title-overlay',
        type: 'title',
        position: { x: 50, y: 50 },
        size: { width: 400, height: 60 },
        content: 'Your Title Here',
        style: {
          fontSize: 24,
          fontFamily: 'Inter, sans-serif',
          color: '#ffffff',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          borderRadius: 8,
          padding: 16,
        },
        animation: {
          entrance: 'fadeIn',
          exit: 'fadeOut',
          duration: 0.5,
        },
      },
    ],
    animations: [],
  },
  {
    id: 'center-stage',
    name: 'Center Stage',
    description: 'Full attention on the presenter',
    thumbnail: '/templates/center-stage.jpg',
    pipConfig: {
      position: 'center',
      size: 'large',
      borderRadius: 12,
      borderWidth: 0,
      borderColor: 'transparent',
      shadow: true,
      opacity: 1,
    },
    backgroundOptions: {
      type: 'remove',
    },
    overlays: [
      {
        id: 'name-badge',
        type: 'subtitle',
        position: { x: 0, y: -80 },
        size: { width: 200, height: 40 },
        content: 'Your Name',
        style: {
          fontSize: 18,
          fontFamily: 'Inter, sans-serif',
          color: '#ffffff',
          backgroundColor: 'rgba(59, 130, 246, 0.9)',
          borderRadius: 20,
          padding: 8,
        },
      },
    ],
    animations: [],
  },
  {
    id: 'split-screen',
    name: 'Split Screen',
    description: 'Side-by-side with content',
    thumbnail: '/templates/split-screen.jpg',
    pipConfig: {
      position: 'custom',
      size: 'custom',
      customPosition: { x: 0, y: 0 },
      customSize: { width: 50, height: 100 }, // 50% width, full height
      borderRadius: 0,
      borderWidth: 0,
      borderColor: 'transparent',
      shadow: false,
      opacity: 1,
    },
    backgroundOptions: {
      type: 'none',
    },
    overlays: [],
    animations: [],
  },
  {
    id: 'picture-frame',
    name: 'Picture Frame',
    description: 'Elegant framed presentation',
    thumbnail: '/templates/picture-frame.jpg',
    pipConfig: {
      position: 'bottom-left',
      size: 'medium',
      borderRadius: 16,
      borderWidth: 4,
      borderColor: '#d4af37',
      shadow: true,
      opacity: 1,
    },
    backgroundOptions: {
      type: 'blur',
      blurAmount: 0.8,
    },
    overlays: [
      {
        id: 'decorative-frame',
        type: 'custom',
        position: { x: -10, y: -10 },
        size: { width: 120, height: 120 },
        content: '',
        style: {
          backgroundColor: 'transparent',
          borderRadius: 20,
        },
      },
    ],
    animations: [],
  },
];

// Apply presentation template to timeline item
export function applyPresentationTemplate(
  template: PresentationTemplate,
  item: TimelineItem
): Partial<ItemProperties> {
  const properties: Partial<ItemProperties> = {
    // PiP configuration
    talkingHeadEnabled: true,
    talkingHeadCorner:
      template.pipConfig.position === 'bottom-right'
        ? 'bottom-right'
        : template.pipConfig.position === 'bottom-left'
          ? 'bottom-left'
          : template.pipConfig.position === 'top-right'
            ? 'top-right'
            : template.pipConfig.position === 'top-left'
              ? 'top-left'
              : 'bottom-right',
    talkingHeadSize:
      template.pipConfig.size === 'small'
        ? 'sm'
        : template.pipConfig.size === 'large'
          ? 'lg'
          : 'md',

    // Background options
    backgroundRemoval: template.backgroundOptions.type === 'remove',
    backgroundBlur:
      template.backgroundOptions.type === 'blur'
        ? template.backgroundOptions.blurAmount || 0.5
        : 0,

    // Visual styling
    borderRadius: template.pipConfig.borderRadius,
    borderWidth: template.pipConfig.borderWidth,
    borderColor: template.pipConfig.borderColor,
    shadow: template.pipConfig.shadow,
    opacity: template.pipConfig.opacity,

    // Template metadata
    presentationTemplate: template.id,
    templateOverlays: template.overlays,
  };

  return properties;
}

// Validate You track content
export function validateYouTrackContent(item: TimelineItem): {
  isValid: boolean;
  warnings: string[];
  suggestions: string[];
} {
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Check if it's video content
  if (item.type !== 'video') {
    warnings.push('You track is optimized for video content');
    suggestions.push('Consider moving non-video content to appropriate tracks');
  }

  // Check video properties if available
  if (item.properties) {
    if (!item.properties.talkingHeadEnabled) {
      suggestions.push(
        'Enable talking head mode for better personal video presentation'
      );
    }

    if (item.properties.volume && item.properties.volume < 0.7) {
      suggestions.push(
        'Consider increasing audio volume for better narration clarity'
      );
    }
  }

  return {
    isValid: warnings.length === 0,
    warnings,
    suggestions,
  };
}

// Generate smooth transitions between personal video segments
export function generatePersonalVideoTransitions(items: TimelineItem[]): Array<{
  fromItem: string;
  toItem: string;
  transition: {
    type: 'crossfade' | 'slide' | 'zoom' | 'flip';
    duration: number;
    easing: string;
  };
}> {
  const transitions: Array<{
    fromItem: string;
    toItem: string;
    transition: {
      type: 'crossfade' | 'slide' | 'zoom' | 'flip';
      duration: number;
      easing: string;
    };
  }> = [];

  for (let i = 0; i < items.length - 1; i++) {
    const currentItem = items[i];
    const nextItem = items[i + 1];

    // Determine best transition based on content similarity
    let transitionType: 'crossfade' | 'slide' | 'zoom' | 'flip' = 'crossfade';

    // If both items have similar PiP positions, use crossfade
    if (
      currentItem.properties?.talkingHeadCorner ===
      nextItem.properties?.talkingHeadCorner
    ) {
      transitionType = 'crossfade';
    } else {
      // Different positions, use slide
      transitionType = 'slide';
    }

    transitions.push({
      fromItem: currentItem.id,
      toItem: nextItem.id,
      transition: {
        type: transitionType,
        duration: 0.5,
        easing: 'ease-in-out',
      },
    });
  }

  return transitions;
}
