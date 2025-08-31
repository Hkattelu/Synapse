// Gradient configuration and utilities

import type { GradientConfig } from '../types';
import { validateGradient as validateGradientFull } from '../validation/backgroundValidation';

export interface GradientColorStop {
  color: string;
  position: number; // 0-1
}

export interface GradientPreset {
  id: string;
  name: string;
  gradient: GradientConfig;
  category: 'warm' | 'cool' | 'neutral' | 'vibrant' | 'monochrome';
  tags: string[];
}

// Built-in gradient presets
export const gradientPresets: GradientPreset[] = [
  // Warm gradients
  {
    id: 'sunset',
    name: 'Sunset',
    gradient: {
      type: 'linear',
      angle: 45,
      colors: [
        { color: '#ff7e5f', position: 0 },
        { color: '#feb47b', position: 1 }
      ]
    },
    category: 'warm',
    tags: ['orange', 'warm', 'sunset']
  },
  {
    id: 'fire',
    name: 'Fire',
    gradient: {
      type: 'linear',
      angle: 90,
      colors: [
        { color: '#ff416c', position: 0 },
        { color: '#ff4b2b', position: 1 }
      ]
    },
    category: 'warm',
    tags: ['red', 'fire', 'intense']
  },
  {
    id: 'golden-hour',
    name: 'Golden Hour',
    gradient: {
      type: 'radial',
      centerX: 0.5,
      centerY: 0.3,
      colors: [
        { color: '#ffeaa7', position: 0 },
        { color: '#fab1a0', position: 0.5 },
        { color: '#e17055', position: 1 }
      ]
    },
    category: 'warm',
    tags: ['gold', 'warm', 'radial']
  },

  // Cool gradients
  {
    id: 'ocean',
    name: 'Ocean',
    gradient: {
      type: 'linear',
      angle: 135,
      colors: [
        { color: '#667eea', position: 0 },
        { color: '#764ba2', position: 1 }
      ]
    },
    category: 'cool',
    tags: ['blue', 'purple', 'ocean']
  },
  {
    id: 'arctic',
    name: 'Arctic',
    gradient: {
      type: 'linear',
      angle: 180,
      colors: [
        { color: '#74b9ff', position: 0 },
        { color: '#0984e3', position: 1 }
      ]
    },
    category: 'cool',
    tags: ['blue', 'cold', 'arctic']
  },
  {
    id: 'mint',
    name: 'Mint',
    gradient: {
      type: 'radial',
      centerX: 0.5,
      centerY: 0.5,
      colors: [
        { color: '#00b894', position: 0 },
        { color: '#00cec9', position: 1 }
      ]
    },
    category: 'cool',
    tags: ['green', 'mint', 'fresh']
  },

  // Neutral gradients
  {
    id: 'silver',
    name: 'Silver',
    gradient: {
      type: 'linear',
      angle: 45,
      colors: [
        { color: '#bdc3c7', position: 0 },
        { color: '#2c3e50', position: 1 }
      ]
    },
    category: 'neutral',
    tags: ['gray', 'silver', 'metallic']
  },
  {
    id: 'charcoal',
    name: 'Charcoal',
    gradient: {
      type: 'linear',
      angle: 90,
      colors: [
        { color: '#434343', position: 0 },
        { color: '#000000', position: 1 }
      ]
    },
    category: 'neutral',
    tags: ['black', 'dark', 'charcoal']
  },

  // Vibrant gradients
  {
    id: 'rainbow',
    name: 'Rainbow',
    gradient: {
      type: 'linear',
      angle: 90,
      colors: [
        { color: '#ff0000', position: 0 },
        { color: '#ff8000', position: 0.17 },
        { color: '#ffff00', position: 0.33 },
        { color: '#00ff00', position: 0.5 },
        { color: '#0080ff', position: 0.67 },
        { color: '#8000ff', position: 0.83 },
        { color: '#ff00ff', position: 1 }
      ]
    },
    category: 'vibrant',
    tags: ['rainbow', 'colorful', 'vibrant']
  },
  {
    id: 'neon',
    name: 'Neon',
    gradient: {
      type: 'radial',
      centerX: 0.5,
      centerY: 0.5,
      colors: [
        { color: '#ff006e', position: 0 },
        { color: '#8338ec', position: 0.5 },
        { color: '#3a86ff', position: 1 }
      ]
    },
    category: 'vibrant',
    tags: ['neon', 'bright', 'electric']
  }
];

export class GradientBuilder {
  private config: GradientConfig;

  constructor(initialConfig?: Partial<GradientConfig>) {
    this.config = {
      type: 'linear',
      colors: [
        { color: '#ffffff', position: 0 },
        { color: '#000000', position: 1 }
      ],
      angle: 0,
      ...initialConfig
    };
  }

  // Type configuration
  setType(type: 'linear' | 'radial'): this {
    this.config.type = type;
    return this;
  }

  // Linear gradient configuration
  setAngle(angle: number): this {
    this.config.angle = this.normalizeAngle(angle);
    return this;
  }

  // Radial gradient configuration
  setCenter(x: number, y: number): this {
    this.config.centerX = this.clamp(x, 0, 1);
    this.config.centerY = this.clamp(y, 0, 1);
    return this;
  }

  // Color stop management
  setColors(colors: GradientColorStop[]): this {
    if (colors.length < 2) {
      throw new Error('Gradient must have at least 2 colors');
    }
    
    // Sort colors by position and validate
    const sortedColors = [...colors]
      .map(color => ({
        ...color,
        position: this.clamp(color.position, 0, 1)
      }))
      .sort((a, b) => a.position - b.position);

    this.config.colors = sortedColors;
    return this;
  }

  addColorStop(color: string, position: number): this {
    const normalizedPosition = this.clamp(position, 0, 1);
    const newColors = [...this.config.colors, { color, position: normalizedPosition }];
    return this.setColors(newColors);
  }

  removeColorStop(index: number): this {
    if (this.config.colors.length <= 2) {
      throw new Error('Cannot remove color stop: gradient must have at least 2 colors');
    }
    
    const newColors = this.config.colors.filter((_, i) => i !== index);
    this.config.colors = newColors;
    return this;
  }

  updateColorStop(index: number, updates: Partial<GradientColorStop>): this {
    if (index < 0 || index >= this.config.colors.length) {
      throw new Error('Invalid color stop index');
    }

    const updatedColors = [...this.config.colors];
    updatedColors[index] = {
      ...updatedColors[index],
      ...updates,
      position: updates.position !== undefined 
        ? this.clamp(updates.position, 0, 1) 
        : updatedColors[index].position
    };

    return this.setColors(updatedColors);
  }

  // Build the final gradient config
  build(): GradientConfig {
    return { ...this.config };
  }

  // Create a copy of the builder
  clone(): GradientBuilder {
    return new GradientBuilder(this.config);
  }

  // Utility methods
  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  private normalizeAngle(angle: number): number {
    return ((angle % 360) + 360) % 360;
  }
}

// Gradient validation (delegated to validation module)
export interface GradientValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateGradient(config: GradientConfig): GradientValidationResult {
  try {
    const result = validateGradientFull(config);
    return {
      isValid: result.isValid,
      errors: result.errors,
      warnings: result.warnings
    };
  } catch (error) {
    console.error('Gradient validation error:', error);
    return {
      isValid: false,
      errors: ['Validation module unavailable'],
      warnings: []
    };
  }
}

// Color validation helper
function isValidColor(color: string): boolean {
  // Create a temporary element to test color validity
  const tempElement = document.createElement('div');
  tempElement.style.color = color;
  return tempElement.style.color !== '';
}

// CSS generation
export function generateGradientCSS(config: GradientConfig): string {
  const colorStops = config.colors
    .map(({ color, position }) => `${color} ${(position * 100).toFixed(1)}%`)
    .join(', ');

  if (config.type === 'linear') {
    const angle = config.angle || 0;
    return `linear-gradient(${angle}deg, ${colorStops})`;
  } else {
    const centerX = (config.centerX || 0.5) * 100;
    const centerY = (config.centerY || 0.5) * 100;
    return `radial-gradient(circle at ${centerX.toFixed(1)}% ${centerY.toFixed(1)}%, ${colorStops})`;
  }
}

// Preset utilities
export function getGradientPresetsByCategory(category: GradientPreset['category']): GradientPreset[] {
  return gradientPresets.filter(preset => preset.category === category);
}

export function getGradientPresetById(id: string): GradientPreset | null {
  return gradientPresets.find(preset => preset.id === id) || null;
}

export function searchGradientPresets(query: string): GradientPreset[] {
  const lowerQuery = query.toLowerCase();
  return gradientPresets.filter(preset => 
    preset.name.toLowerCase().includes(lowerQuery) ||
    preset.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}