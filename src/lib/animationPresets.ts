import type { AnimationPreset } from './types';

// Predefined animation presets
export const ANIMATION_PRESETS: AnimationPreset[] = [
  // Entrance animations
  {
    id: 'fade-in',
    name: 'Fade In',
    type: 'entrance',
    duration: 0.5,
    easing: 'easeOut',
    parameters: {
      opacity: { from: 0, to: 1 },
    },
  },
  {
    id: 'slide-in-left',
    name: 'Slide In Left',
    type: 'entrance',
    duration: 0.8,
    easing: 'easeOut',
    parameters: {
      x: { from: -100, to: 0 },
      opacity: { from: 0, to: 1 },
    },
  },
  {
    id: 'slide-in-right',
    name: 'Slide In Right',
    type: 'entrance',
    duration: 0.8,
    easing: 'easeOut',
    parameters: {
      x: { from: 100, to: 0 },
      opacity: { from: 0, to: 1 },
    },
  },
  {
    id: 'slide-in-up',
    name: 'Slide In Up',
    type: 'entrance',
    duration: 0.8,
    easing: 'easeOut',
    parameters: {
      y: { from: 50, to: 0 },
      opacity: { from: 0, to: 1 },
    },
  },
  {
    id: 'slide-in-down',
    name: 'Slide In Down',
    type: 'entrance',
    duration: 0.8,
    easing: 'easeOut',
    parameters: {
      y: { from: -50, to: 0 },
      opacity: { from: 0, to: 1 },
    },
  },
  {
    id: 'scale-in',
    name: 'Scale In',
    type: 'entrance',
    duration: 0.6,
    easing: 'easeOut',
    parameters: {
      scale: { from: 0.5, to: 1 },
      opacity: { from: 0, to: 1 },
    },
  },
  {
    id: 'zoom-in',
    name: 'Zoom In',
    type: 'entrance',
    duration: 0.6,
    easing: 'easeOut',
    parameters: {
      scale: { from: 0, to: 1 },
      opacity: { from: 0, to: 1 },
    },
  },
  {
    id: 'bounce-in',
    name: 'Bounce In',
    type: 'entrance',
    duration: 1.0,
    easing: 'bounce',
    parameters: {
      scale: { from: 0.3, to: 1 },
      opacity: { from: 0, to: 1 },
    },
  },
  {
    id: 'rotate-in',
    name: 'Rotate In',
    type: 'entrance',
    duration: 0.8,
    easing: 'easeOut',
    parameters: {
      rotation: { from: -180, to: 0 },
      scale: { from: 0.5, to: 1 },
      opacity: { from: 0, to: 1 },
    },
  },
  {
    id: 'typewriter',
    name: 'Typewriter',
    type: 'entrance',
    duration: 2.0,
    easing: 'linear',
    parameters: {
      textReveal: true,
      showCursor: true,
    },
  },

  // Exit animations
  {
    id: 'fade-out',
    name: 'Fade Out',
    type: 'exit',
    duration: 0.5,
    easing: 'easeIn',
    parameters: {
      opacity: { from: 1, to: 0 },
    },
  },
  {
    id: 'slide-out-left',
    name: 'Slide Out Left',
    type: 'exit',
    duration: 0.8,
    easing: 'easeIn',
    parameters: {
      x: { from: 0, to: -100 },
      opacity: { from: 1, to: 0 },
    },
  },
  {
    id: 'slide-out-right',
    name: 'Slide Out Right',
    type: 'exit',
    duration: 0.8,
    easing: 'easeIn',
    parameters: {
      x: { from: 0, to: 100 },
      opacity: { from: 1, to: 0 },
    },
  },
  {
    id: 'slide-out-up',
    name: 'Slide Out Up',
    type: 'exit',
    duration: 0.8,
    easing: 'easeIn',
    parameters: {
      y: { from: 0, to: -50 },
      opacity: { from: 1, to: 0 },
    },
  },
  {
    id: 'slide-out-down',
    name: 'Slide Out Down',
    type: 'exit',
    duration: 0.8,
    easing: 'easeIn',
    parameters: {
      y: { from: 0, to: 50 },
      opacity: { from: 1, to: 0 },
    },
  },
  {
    id: 'scale-out',
    name: 'Scale Out',
    type: 'exit',
    duration: 0.6,
    easing: 'easeIn',
    parameters: {
      scale: { from: 1, to: 0.5 },
      opacity: { from: 1, to: 0 },
    },
  },
  {
    id: 'zoom-out',
    name: 'Zoom Out',
    type: 'exit',
    duration: 0.6,
    easing: 'easeIn',
    parameters: {
      scale: { from: 1, to: 0 },
      opacity: { from: 1, to: 0 },
    },
  },

  // Emphasis animations
  {
    id: 'pulse',
    name: 'Pulse',
    type: 'emphasis',
    duration: 1.0,
    easing: 'easeInOut',
    parameters: {
      scale: { from: 1, to: 1.1, back: true },
    },
  },
  {
    id: 'shake',
    name: 'Shake',
    type: 'emphasis',
    duration: 0.6,
    easing: 'easeInOut',
    parameters: {
      x: { oscillate: [-5, 5, -5, 5, 0] },
    },
  },
  {
    id: 'wobble',
    name: 'Wobble',
    type: 'emphasis',
    duration: 1.0,
    easing: 'easeInOut',
    parameters: {
      rotation: { oscillate: [-15, 15, -10, 10, -5, 5, 0] },
    },
  },
  {
    id: 'flash',
    name: 'Flash',
    type: 'emphasis',
    duration: 0.75,
    easing: 'easeInOut',
    parameters: {
      opacity: { oscillate: [1, 0, 1, 0, 1] },
    },
  },
  {
    id: 'rubber-band',
    name: 'Rubber Band',
    type: 'emphasis',
    duration: 1.0,
    easing: 'easeInOut',
    parameters: {
      scale: { oscillate: [1, 1.25, 0.75, 1.15, 0.95, 1] },
    },
  },

  // Transition animations
  {
    id: 'crossfade',
    name: 'Crossfade',
    type: 'transition',
    duration: 1.0,
    easing: 'easeInOut',
    parameters: {
      opacity: { from: 0, to: 1 },
    },
  },
  {
    id: 'wipe-left',
    name: 'Wipe Left',
    type: 'transition',
    duration: 1.0,
    easing: 'easeInOut',
    parameters: {
      clipPath: { from: 'inset(0 100% 0 0)', to: 'inset(0 0 0 0)' },
    },
  },
  {
    id: 'wipe-right',
    name: 'Wipe Right',
    type: 'transition',
    duration: 1.0,
    easing: 'easeInOut',
    parameters: {
      clipPath: { from: 'inset(0 0 0 100%)', to: 'inset(0 0 0 0)' },
    },
  },
];

// Helper functions for animation management
export function getAnimationsByType(
  type: 'entrance' | 'exit' | 'emphasis' | 'transition'
): AnimationPreset[] {
  return ANIMATION_PRESETS.filter((preset) => preset.type === type);
}

export function getAnimationById(id: string): AnimationPreset | undefined {
  return ANIMATION_PRESETS.find((preset) => preset.id === id);
}

export function getCompatibleAnimations(
  itemType: 'video' | 'code' | 'title' | 'audio'
): AnimationPreset[] {
  // All animations are compatible with all item types for now
  // In the future, we could add item-type-specific restrictions
  return ANIMATION_PRESETS;
}

// Animation parameter utilities
export interface AnimationParameterValue {
  from?: number | string;
  to?: number | string;
  back?: boolean; // For emphasis animations that return to original state
  oscillate?: (number | string)[]; // For complex emphasis animations
}

export interface AnimationParameters {
  [key: string]: AnimationParameterValue;
}

// Validate animation parameters
export function validateAnimationParameters(
  parameters: AnimationParameters
): boolean {
  for (const [key, value] of Object.entries(parameters)) {
    if (typeof value === 'object' && value !== null) {
      // Check if it has valid properties
      const hasFrom = 'from' in value;
      const hasTo = 'to' in value;
      const hasOscillate =
        'oscillate' in value && Array.isArray(value.oscillate);

      if (!hasFrom && !hasTo && !hasOscillate) {
        return false;
      }
    }
  }
  return true;
}

// Create custom animation preset
export function createCustomAnimationPreset(
  name: string,
  type: 'entrance' | 'exit' | 'emphasis' | 'transition',
  duration: number,
  parameters: AnimationParameters,
  easing: string = 'easeOut'
): AnimationPreset {
  return {
    id: `custom-${Date.now()}`,
    name,
    type,
    duration,
    easing,
    parameters,
  };
}
