// Keyframe animation system utilities

import type {
  Keyframe,
  ItemProperties,
  TimelineItem,
  GradientConfig,
  AnimationPreset,
} from './types';
import { generateId } from './utils';

// Easing functions for keyframe interpolation
export const EASING_FUNCTIONS = {
  linear: (t: number) => t,
  easeIn: (t: number) => t * t,
  easeOut: (t: number) => t * (2 - t),
  easeInOut: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  bounce: (t: number) => {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
      return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    } else if (t < 2.5 / 2.75) {
      return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    } else {
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    }
  },
  elastic: (t: number) => {
    return t === 0
      ? 0
      : t === 1
        ? 1
        : -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI);
  },
};

// KeyframeManager class for managing keyframe operations
export class KeyframeManager {
  // Create a new keyframe
  static createKeyframe(
    time: number,
    properties: Partial<ItemProperties>,
    easing: Keyframe['easing'] = 'linear'
  ): Keyframe {
    return {
      id: generateId(),
      time: Math.max(0, time),
      properties,
      easing,
    };
  }

  // Add keyframe to timeline item
  static addKeyframe(item: TimelineItem, keyframe: Keyframe): TimelineItem {
    // Ensure keyframe time is within item duration
    const adjustedKeyframe = {
      ...keyframe,
      time: Math.min(Math.max(0, keyframe.time), item.duration),
    };

    // Remove any existing keyframes at the same time for the same properties
    const filteredKeyframes = (item.keyframes ?? []).filter(
      (k) =>
        k.time !== adjustedKeyframe.time ||
        !this.hasOverlappingProperties(
          k.properties,
          adjustedKeyframe.properties
        )
    );

    return {
      ...item,
      keyframes: [...filteredKeyframes, adjustedKeyframe].sort(
        (a, b) => a.time - b.time
      ),
    };
  }

  // Remove keyframe from timeline item
  static removeKeyframe(item: TimelineItem, keyframeId: string): TimelineItem {
    return {
      ...item,
      keyframes: (item.keyframes ?? []).filter((k) => k.id !== keyframeId),
    };
  }

  // Update keyframe
  static updateKeyframe(
    item: TimelineItem,
    keyframeId: string,
    updates: Partial<Keyframe>
  ): TimelineItem {
    return {
      ...item,
      keyframes: (item.keyframes ?? [])
        .map((k) =>
          k.id === keyframeId
            ? {
                ...k,
                ...updates,
                time: Math.min(
                  Math.max(0, updates.time ?? k.time),
                  item.duration
                ),
              }
            : k
        )
        .sort((a, b) => a.time - b.time),
    };
  }

  // Get keyframes for a specific property
  static getPropertyKeyframes(
    item: TimelineItem,
    property: keyof ItemProperties
  ): Keyframe[] {
    const keyframes = item.keyframes ?? [];
    return keyframes
      .filter((k) => property in k.properties)
      .sort((a, b) => a.time - b.time);
  }

  // Interpolate property value at a specific time
  static interpolateProperty(
    item: TimelineItem,
    property: keyof ItemProperties,
    time: number
  ): ItemProperties[keyof ItemProperties] | undefined {
    const keyframes = this.getPropertyKeyframes(item, property);

    if (keyframes.length === 0) {
      return item.properties[property];
    }

    // Clamp time to item duration
    const clampedTime = Math.min(Math.max(0, time), item.duration);

    // Find surrounding keyframes
    let beforeKeyframe: Keyframe | null = null;
    let afterKeyframe: Keyframe | null = null;

    for (let i = 0; i < keyframes.length; i++) {
      if (keyframes[i].time <= clampedTime) {
        beforeKeyframe = keyframes[i];
      }
      if (keyframes[i].time >= clampedTime && !afterKeyframe) {
        afterKeyframe = keyframes[i];
        break;
      }
    }

    // If no keyframes found, use base property value
    if (!beforeKeyframe && !afterKeyframe) {
      return item.properties[property];
    }

    // If only one keyframe or exact match
    if (!afterKeyframe || beforeKeyframe?.time === clampedTime) {
      return beforeKeyframe?.properties[property] ?? item.properties[property];
    }

    if (!beforeKeyframe || afterKeyframe.time === clampedTime) {
      return afterKeyframe.properties[property] ?? item.properties[property];
    }

    // Interpolate between keyframes
    const beforeValue =
      beforeKeyframe.properties[property] ?? item.properties[property];
    const afterValue =
      afterKeyframe.properties[property] ?? item.properties[property];

    if (typeof beforeValue !== 'number' || typeof afterValue !== 'number') {
      // For non-numeric values, return the before value (no interpolation)
      return beforeValue;
    }

    const timeDiff = afterKeyframe.time - beforeKeyframe.time;
    const progress =
      timeDiff === 0 ? 0 : (clampedTime - beforeKeyframe.time) / timeDiff;
    const easedProgress =
      EASING_FUNCTIONS[beforeKeyframe.easing || 'linear'](progress);

    return beforeValue + (afterValue - beforeValue) * easedProgress;
  }

  // Get all interpolated properties at a specific time
  static getInterpolatedProperties(
    item: TimelineItem,
    time: number
  ): ItemProperties {
    const result: ItemProperties = { ...item.properties };

    // Get all unique properties that have keyframes
    const keyframedProperties = new Set<keyof ItemProperties>();
    (item.keyframes ?? []).forEach((k) => {
      Object.keys(k.properties).forEach((prop) => {
        keyframedProperties.add(prop as keyof ItemProperties);
      });
    });

    // Interpolate each keyframed property
    keyframedProperties.forEach((property) => {
      const interpolatedValue = this.interpolateProperty(item, property, time);
      if (interpolatedValue !== undefined) {
        (result as any)[property] = interpolatedValue;
      }
    });

    return result;
  }

  // Auto-generate keyframes from animation presets
  static generateKeyframesFromPresets(item: TimelineItem): TimelineItem {
    // Prefer the new single-preset field `animation`; when it is present,
    // ignore the legacy `animations` array. Fall back to the legacy list
    // only when the new field is absent to maintain backward compatibility.
    const presets = item.animation ? [item.animation] : item.animations ?? [];

    if (presets.length === 0) {
      return item;
    }

    const generatedKeyframes: Keyframe[] = [];

    presets.forEach((animation) => {
      // Only handle legacy-style presets that declare a `type` of
      // 'entrance' | 'exit' | 'emphasis'. Ignore other preset shapes.
      if (!this.isLegacyAnimationPreset(animation)) return;

      // Convert animation preset to keyframes based on type
      switch (animation.type) {
        case 'entrance':
          this.generateEntranceKeyframes(animation, generatedKeyframes);
          break;
        case 'exit':
          this.generateExitKeyframes(
            animation,
            item.duration,
            generatedKeyframes
          );
          break;
        case 'emphasis':
          this.generateEmphasisKeyframes(
            animation,
            item.duration,
            generatedKeyframes
          );
          break;
      }
    });

    return {
      ...item,
      keyframes: [
        ...((item.keyframes ?? []) as Keyframe[]),
        ...generatedKeyframes,
      ].sort((a, b) => a.time - b.time),
    };
  }

  // Optimize keyframes by removing redundant ones
  static optimizeKeyframes(item: TimelineItem): TimelineItem {
    const optimized: Keyframe[] = [];
    const keyframes = [...((item.keyframes ?? []) as Keyframe[])].sort((a, b) => a.time - b.time);

    for (let i = 0; i < keyframes.length; i++) {
      const current = keyframes[i];
      const previous = optimized[optimized.length - 1];

      // Skip keyframes that are identical to the previous one
      if (
        previous &&
        current.time === previous.time &&
        JSON.stringify(current.properties) ===
          JSON.stringify(previous.properties)
      ) {
        continue;
      }

      // Skip keyframes where values haven't changed from base properties
      if (
        Object.keys(current.properties).every(
          (key) =>
            current.properties[key as keyof ItemProperties] ===
            item.properties[key as keyof ItemProperties]
        )
      ) {
        continue;
      }

      optimized.push(current);
    }

    return {
      ...item,
      keyframes: optimized,
    };
  }

  // Validate keyframes
  static validateKeyframes(item: TimelineItem): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    (item.keyframes ?? []).forEach((keyframe, index) => {
      // Check time bounds
      if (keyframe.time < 0 || keyframe.time > item.duration) {
        errors.push(
          `Keyframe ${index + 1}: Time ${keyframe.time} is outside item duration (0-${item.duration})`
        );
      }

      // Check property values
      Object.entries(keyframe.properties).forEach(([key, value]) => {
        if (
          key === 'opacity' &&
          typeof value === 'number' &&
          (value < 0 || value > 1)
        ) {
          errors.push(
            `Keyframe ${index + 1}: Opacity value ${value} must be between 0 and 1`
          );
        }
        if (key === 'scale' && typeof value === 'number' && value < 0) {
          errors.push(
            `Keyframe ${index + 1}: Scale value ${value} cannot be negative`
          );
        }
      });
    });

    return { isValid: errors.length === 0, errors };
  }

  // Private helper methods

  // Narrow unknown preset shapes to the legacy preset used by keyframe generation
  private static isLegacyAnimationPreset(x: unknown): x is AnimationPreset {
    if (!x || typeof x !== 'object') return false;
    const obj = x as Record<string, unknown>;
    const type = obj.type;
    const duration = obj.duration;
    const params = obj.parameters;
    const hasType =
      typeof type === 'string' &&
      (type === 'entrance' || type === 'exit' || type === 'emphasis');
    const hasDuration = typeof duration === 'number';
    const hasParams = typeof params === 'object' && params !== null;
    return hasType && hasDuration && hasParams;
  }

  private static hasOverlappingProperties(
    props1: Partial<ItemProperties>,
    props2: Partial<ItemProperties>
  ): boolean {
    const keys1 = Object.keys(props1);
    const keys2 = Object.keys(props2);
    return keys1.some((key) => keys2.includes(key));
  }

  private static generateEntranceKeyframes(
    animation: any,
    keyframes: Keyframe[]
  ): void {
    // Example: fade in animation
    if (animation.parameters.opacity) {
      keyframes.push({
        id: generateId(),
        time: 0,
        properties: { opacity: animation.parameters.opacity.from || 0 },
        easing: 'easeOut',
      });
      keyframes.push({
        id: generateId(),
        time: animation.duration,
        properties: { opacity: animation.parameters.opacity.to || 1 },
        easing: 'easeOut',
      });
    }
  }

  private static generateExitKeyframes(
    animation: any,
    itemDuration: number,
    keyframes: Keyframe[]
  ): void {
    const startTime = itemDuration - animation.duration;

    if (animation.parameters.opacity) {
      keyframes.push({
        id: generateId(),
        time: startTime,
        properties: { opacity: animation.parameters.opacity.from || 1 },
        easing: 'easeIn',
      });
      keyframes.push({
        id: generateId(),
        time: itemDuration,
        properties: { opacity: animation.parameters.opacity.to || 0 },
        easing: 'easeIn',
      });
    }
  }

  private static generateEmphasisKeyframes(
    animation: any,
    itemDuration: number,
    keyframes: Keyframe[]
  ): void {
    const midTime = itemDuration / 2;

    if (animation.parameters.scale) {
      keyframes.push({
        id: generateId(),
        time: midTime - animation.duration / 2,
        properties: { scale: 1 },
        easing: 'easeInOut',
      });
      keyframes.push({
        id: generateId(),
        time: midTime,
        properties: { scale: animation.parameters.scale.to || 1.1 },
        easing: 'easeInOut',
      });
      keyframes.push({
        id: generateId(),
        time: midTime + animation.duration / 2,
        properties: { scale: 1 },
        easing: 'easeInOut',
      });
    }
  }
}

// Export utility functions
export function createKeyframe(
  time: number,
  properties: Partial<ItemProperties>,
  easing?: Keyframe['easing']
): Keyframe {
  return KeyframeManager.createKeyframe(time, properties, easing);
}

export function interpolateValue(
  startValue: number,
  endValue: number,
  progress: number,
  easing: keyof typeof EASING_FUNCTIONS = 'linear'
): number {
  const easedProgress = EASING_FUNCTIONS[easing](
    Math.max(0, Math.min(1, progress))
  );
  return startValue + (endValue - startValue) * easedProgress;
}

export function getKeyframeAtTime(
  keyframes: Keyframe[],
  time: number
): Keyframe | null {
  return keyframes.find((k) => Math.abs(k.time - time) < 0.01) || null;
}

export function getKeyframesInTimeRange(
  keyframes: Keyframe[],
  startTime: number,
  endTime: number
): Keyframe[] {
  return keyframes.filter((k) => k.time >= startTime && k.time <= endTime);
}

export function copyKeyframes(
  keyframes: Keyframe[],
  timeOffset: number = 0
): Keyframe[] {
  return keyframes.map((k) => ({
    ...k,
    id: generateId(),
    time: k.time + timeOffset,
    properties: { ...k.properties },
  }));
}
