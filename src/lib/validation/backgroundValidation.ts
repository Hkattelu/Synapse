// Background validation utilities

import type { BackgroundConfig, GradientConfig } from '../types';
import type { WallpaperAsset } from '../backgrounds/types';
import { validateAnyColor, type ColorValidationResult } from './colorValidation';

export interface BackgroundValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  colorValidation?: Record<string, ColorValidationResult>;
}

export interface WallpaperValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fileValidation?: {
    format: boolean;
    size: boolean;
    dimensions: boolean;
  };
}

export interface GradientValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  colorValidation: Record<string, ColorValidationResult>;
}

/**
 * Validates a background configuration
 */
export function validateBackground(config: BackgroundConfig): BackgroundValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const colorValidation: Record<string, ColorValidationResult> = {};

  if (!config) {
    errors.push('Background configuration is required');
    return { isValid: false, errors, warnings, colorValidation };
  }

  // Validate type
  if (!config.type || !['none', 'color', 'gradient', 'wallpaper'].includes(config.type)) {
    errors.push('Background type must be "none", "color", "gradient", or "wallpaper"');
  }

  // Type-specific validation
  switch (config.type) {
    case 'color':
      if (!config.color) {
        errors.push('Color background requires a color value');
      } else {
        const validation = validateAnyColor(config.color);
        colorValidation.color = validation;
        if (!validation.isValid) {
          errors.push(`Invalid background color: ${validation.error}`);
        }
      }
      break;

    case 'gradient':
      if (!config.gradient) {
        errors.push('Gradient background requires gradient configuration');
      } else {
        const gradientResult = validateGradient(config.gradient);
        if (!gradientResult.isValid) {
          errors.push(...gradientResult.errors);
          warnings.push(...gradientResult.warnings);
        }
        Object.assign(colorValidation, gradientResult.colorValidation);
      }
      break;

    case 'wallpaper':
      if (!config.wallpaper) {
        errors.push('Wallpaper background requires wallpaper configuration');
      } else {
        const wallpaperResult = validateWallpaperConfig(config.wallpaper);
        if (!wallpaperResult.isValid) {
          errors.push(...wallpaperResult.errors);
          warnings.push(...wallpaperResult.warnings);
        }
      }
      break;

    case 'none':
      // No additional validation needed for 'none' type
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    colorValidation
  };
}

/**
 * Validates a gradient configuration
 */
export function validateGradient(config: GradientConfig): GradientValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const colorValidation: Record<string, ColorValidationResult> = {};

  if (!config) {
    errors.push('Gradient configuration is required');
    return { isValid: false, errors, warnings, colorValidation };
  }

  // Validate type
  if (!config.type || !['linear', 'radial'].includes(config.type)) {
    errors.push('Gradient type must be "linear" or "radial"');
  }

  // Validate colors array
  if (!config.colors || !Array.isArray(config.colors)) {
    errors.push('Gradient colors array is required');
  } else {
    if (config.colors.length < 2) {
      errors.push('Gradient must have at least 2 colors');
    }

    // Validate each color stop
    config.colors.forEach((colorStop, index) => {
      if (!colorStop) {
        errors.push(`Color stop ${index} is null or undefined`);
        return;
      }

      // Validate color value
      if (!colorStop.color) {
        errors.push(`Color stop ${index} is missing color value`);
      } else {
        const validation = validateAnyColor(colorStop.color);
        colorValidation[`color-${index}`] = validation;
        if (!validation.isValid) {
          errors.push(`Color stop ${index} has invalid color: ${validation.error}`);
        }
      }

      // Validate position
      if (typeof colorStop.position !== 'number') {
        errors.push(`Color stop ${index} is missing position value`);
      } else if (colorStop.position < 0 || colorStop.position > 1) {
        errors.push(`Color stop ${index} position must be between 0 and 1, got ${colorStop.position}`);
      }
    });

    // Check for duplicate positions
    if (config.colors.length > 1) {
      const positions = config.colors.map(c => c.position);
      const uniquePositions = new Set(positions);
      if (positions.length !== uniquePositions.size) {
        warnings.push('Multiple color stops have the same position');
      }

      // Check if positions are properly ordered
      const sortedPositions = [...positions].sort((a, b) => a - b);
      if (!positions.every((pos, index) => pos === sortedPositions[index])) {
        warnings.push('Color stops are not ordered by position');
      }
    }
  }

  // Type-specific validation
  if (config.type === 'linear') {
    if (config.angle !== undefined) {
      if (typeof config.angle !== 'number') {
        errors.push('Linear gradient angle must be a number');
      } else if (config.angle < 0 || config.angle >= 360) {
        warnings.push('Linear gradient angle should be between 0 and 359 degrees');
      }
    }
  } else if (config.type === 'radial') {
    if (config.centerX !== undefined) {
      if (typeof config.centerX !== 'number') {
        errors.push('Radial gradient centerX must be a number');
      } else if (config.centerX < 0 || config.centerX > 1) {
        warnings.push('Radial gradient centerX should be between 0 and 1');
      }
    }

    if (config.centerY !== undefined) {
      if (typeof config.centerY !== 'number') {
        errors.push('Radial gradient centerY must be a number');
      } else if (config.centerY < 0 || config.centerY > 1) {
        warnings.push('Radial gradient centerY should be between 0 and 1');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    colorValidation
  };
}

/**
 * Validates wallpaper configuration
 */
function validateWallpaperConfig(config: BackgroundConfig['wallpaper']): BackgroundValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!config) {
    errors.push('Wallpaper configuration is required');
    return { isValid: false, errors, warnings };
  }

  // Validate asset ID
  if (!config.assetId || typeof config.assetId !== 'string') {
    errors.push('Wallpaper asset ID is required and must be a string');
  }

  // Validate opacity
  if (typeof config.opacity !== 'number') {
    errors.push('Wallpaper opacity must be a number');
  } else if (config.opacity < 0 || config.opacity > 1) {
    errors.push('Wallpaper opacity must be between 0 and 1');
  }

  // Validate blend mode
  if (!config.blendMode || !['normal', 'multiply', 'overlay', 'soft-light'].includes(config.blendMode)) {
    errors.push('Wallpaper blend mode must be "normal", "multiply", "overlay", or "soft-light"');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates a wallpaper asset
 */
export function validateWallpaperAsset(asset: WallpaperAsset): WallpaperValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const fileValidation = {
    format: true,
    size: true,
    dimensions: true
  };

  if (!asset) {
    errors.push('Wallpaper asset is required');
    return { isValid: false, errors, warnings, fileValidation };
  }

  // Validate required fields
  if (!asset.id || typeof asset.id !== 'string') {
    errors.push('Wallpaper asset ID is required and must be a string');
  }

  if (!asset.name || typeof asset.name !== 'string') {
    errors.push('Wallpaper asset name is required and must be a string');
  }

  if (!asset.url || typeof asset.url !== 'string') {
    errors.push('Wallpaper asset URL is required and must be a string');
  } else {
    // Basic URL validation
    try {
      new URL(asset.url);
    } catch {
      // If it's not a valid URL, it might be a blob URL or data URL
      if (!asset.url.startsWith('blob:') && !asset.url.startsWith('data:')) {
        warnings.push('Wallpaper asset URL may not be valid');
      }
    }
  }

  if (!asset.thumbnail || typeof asset.thumbnail !== 'string') {
    errors.push('Wallpaper asset thumbnail is required and must be a string');
  }

  // Validate dimensions
  if (!asset.dimensions || typeof asset.dimensions !== 'object') {
    errors.push('Wallpaper asset dimensions are required');
    fileValidation.dimensions = false;
  } else {
    if (typeof asset.dimensions.width !== 'number' || asset.dimensions.width <= 0) {
      errors.push('Wallpaper asset width must be a positive number');
      fileValidation.dimensions = false;
    }

    if (typeof asset.dimensions.height !== 'number' || asset.dimensions.height <= 0) {
      errors.push('Wallpaper asset height must be a positive number');
      fileValidation.dimensions = false;
    }

    // Check for reasonable dimensions
    if (asset.dimensions.width > 8192 || asset.dimensions.height > 8192) {
      warnings.push('Wallpaper dimensions are very large and may cause performance issues');
    }

    if (asset.dimensions.width < 100 || asset.dimensions.height < 100) {
      warnings.push('Wallpaper dimensions are very small and may appear pixelated');
    }
  }

  // Validate category
  if (!asset.category || !['abstract', 'nature', 'tech', 'minimal', 'custom'].includes(asset.category)) {
    errors.push('Wallpaper asset category must be "abstract", "nature", "tech", "minimal", or "custom"');
  }

  // Validate optional fields
  if (asset.fileSize !== undefined) {
    if (typeof asset.fileSize !== 'number' || asset.fileSize < 0) {
      errors.push('Wallpaper asset file size must be a non-negative number');
      fileValidation.size = false;
    } else {
      // Check for reasonable file sizes (warn if > 10MB)
      if (asset.fileSize > 10 * 1024 * 1024) {
        warnings.push('Wallpaper file size is very large and may cause performance issues');
      }
    }
  }

  if (asset.format !== undefined) {
    if (!['jpg', 'png', 'svg', 'webp'].includes(asset.format)) {
      errors.push('Wallpaper asset format must be "jpg", "png", "svg", or "webp"');
      fileValidation.format = false;
    }
  }

  if (asset.tags !== undefined) {
    if (!Array.isArray(asset.tags)) {
      warnings.push('Wallpaper asset tags should be an array');
    } else {
      asset.tags.forEach((tag, index) => {
        if (typeof tag !== 'string') {
          warnings.push(`Wallpaper asset tag at index ${index} should be a string`);
        }
      });
    }
  }

  if (asset.author !== undefined && typeof asset.author !== 'string') {
    warnings.push('Wallpaper asset author should be a string');
  }

  if (asset.license !== undefined && typeof asset.license !== 'string') {
    warnings.push('Wallpaper asset license should be a string');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    fileValidation
  };
}

/**
 * Validates image file format and size
 */
export function validateImageFile(file: File): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  format?: string;
  estimatedDimensions?: { width: number; height: number };
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate file type
  const supportedTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'];
  if (!supportedTypes.includes(file.type)) {
    errors.push(`Unsupported image format: ${file.type}. Supported formats: JPEG, PNG, SVG, WebP`);
  }

  // Validate file size (max 50MB)
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    errors.push(`File size too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum allowed: 50MB`);
  }

  // Warn about large files
  const warningSize = 10 * 1024 * 1024; // 10MB
  if (file.size > warningSize) {
    warnings.push(`Large file size: ${(file.size / 1024 / 1024).toFixed(2)}MB. Consider optimizing for better performance`);
  }

  // Validate file name
  if (!file.name || file.name.trim().length === 0) {
    errors.push('File must have a valid name');
  }

  const format = file.type.split('/')[1];

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    format
  };
}

/**
 * Creates a fallback background configuration
 */
export function createFallbackBackground(originalConfig?: Partial<BackgroundConfig>): BackgroundConfig {
  // If original config exists and has a valid type, try to preserve it
  if (originalConfig?.type && ['none', 'color', 'gradient', 'wallpaper'].includes(originalConfig.type)) {
    switch (originalConfig.type) {
      case 'color':
        if (originalConfig.color && validateAnyColor(originalConfig.color).isValid) {
          return { type: 'color', color: originalConfig.color };
        }
        break;
      case 'gradient':
        if (originalConfig.gradient && validateGradient(originalConfig.gradient).isValid) {
          return { type: 'gradient', gradient: originalConfig.gradient };
        }
        break;
      case 'wallpaper':
        if (originalConfig.wallpaper) {
          const wallpaperResult = validateWallpaperConfig(originalConfig.wallpaper);
          if (wallpaperResult.isValid) {
            return { type: 'wallpaper', wallpaper: originalConfig.wallpaper };
          }
        }
        break;
    }
  }

  // Default fallback to no background
  return { type: 'none' };
}