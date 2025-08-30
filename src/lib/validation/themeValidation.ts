// Theme validation utilities

import type { ThemeDefinition } from '../themes/types';
import { validateAnyColor, validateColorContrast, type ColorValidationResult } from './colorValidation';

export interface ThemeValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  colorValidation: Record<string, ColorValidationResult>;
  contrastIssues: Array<{
    foreground: string;
    background: string;
    contrastRatio: number;
    wcagLevel: 'AA' | 'AAA' | 'fail';
  }>;
}

export interface ThemeValidationOptions {
  strictColorValidation?: boolean;
  checkContrast?: boolean;
  requireAllColors?: boolean;
  allowCustomProperties?: boolean;
}

/**
 * Validates a complete theme definition
 */
export function validateTheme(
  theme: ThemeDefinition, 
  options: ThemeValidationOptions = {}
): ThemeValidationResult {
  const {
    strictColorValidation = true,
    checkContrast = true,
    requireAllColors = true,
    allowCustomProperties = false
  } = options;

  const errors: string[] = [];
  const warnings: string[] = [];
  const colorValidation: Record<string, ColorValidationResult> = {};
  const contrastIssues: ThemeValidationResult['contrastIssues'] = [];

  // Validate basic structure
  if (!theme) {
    errors.push('Theme definition is required');
    return { isValid: false, errors, warnings, colorValidation, contrastIssues };
  }

  // Validate required fields
  if (!theme.id || typeof theme.id !== 'string') {
    errors.push('Theme ID is required and must be a string');
  } else if (!/^[a-z0-9-]+$/.test(theme.id)) {
    errors.push('Theme ID must contain only lowercase letters, numbers, and hyphens');
  }

  if (!theme.name || typeof theme.name !== 'string') {
    errors.push('Theme name is required and must be a string');
  } else if (theme.name.trim().length === 0) {
    errors.push('Theme name cannot be empty');
  }

  if (!theme.category || !['light', 'dark', 'high-contrast'].includes(theme.category)) {
    errors.push('Theme category must be "light", "dark", or "high-contrast"');
  }

  // Validate colors object
  if (!theme.colors || typeof theme.colors !== 'object') {
    errors.push('Theme colors object is required');
    return { isValid: false, errors, warnings, colorValidation, contrastIssues };
  }

  // Required color properties
  const requiredColors = [
    'background', 'foreground', 'comment', 'keyword', 'string', 
    'number', 'operator', 'punctuation', 'function', 'variable',
    'type', 'class', 'constant', 'property', 'tag', 'attribute',
    'boolean', 'regex', 'escape', 'selection', 'lineHighlight',
    'cursor', 'diffAdded', 'diffRemoved', 'diffModified'
  ];

  // Validate each required color
  for (const colorKey of requiredColors) {
    const colorValue = theme.colors[colorKey as keyof typeof theme.colors];
    
    if (requireAllColors && !colorValue) {
      errors.push(`Missing required color: ${colorKey}`);
      continue;
    }

    if (colorValue) {
      const validation = validateAnyColor(colorValue);
      colorValidation[colorKey] = validation;

      if (!validation.isValid) {
        if (strictColorValidation) {
          errors.push(`Invalid color for ${colorKey}: ${validation.error}`);
        } else {
          warnings.push(`Invalid color for ${colorKey}: ${validation.error}`);
        }
      }
    }
  }

  // Check for unknown color properties
  if (!allowCustomProperties) {
    const knownColors = new Set(requiredColors);
    for (const colorKey in theme.colors) {
      if (!knownColors.has(colorKey)) {
        warnings.push(`Unknown color property: ${colorKey}`);
      }
    }
  }

  // Validate contrast ratios
  if (checkContrast && theme.colors.background && theme.colors.foreground) {
    const contrastResult = validateColorContrast(theme.colors.foreground, theme.colors.background);
    
    if (contrastResult.isValid && contrastResult.contrastRatio && contrastResult.wcagLevel) {
      contrastIssues.push({
        foreground: 'foreground',
        background: 'background',
        contrastRatio: contrastResult.contrastRatio,
        wcagLevel: contrastResult.wcagLevel
      });

      if (contrastResult.wcagLevel === 'fail') {
        warnings.push(`Poor contrast between foreground and background (${contrastResult.contrastRatio.toFixed(2)}:1). Consider improving for better accessibility.`);
      }
    }

    // Check comment contrast
    if (theme.colors.comment) {
      const commentContrast = validateColorContrast(theme.colors.comment, theme.colors.background);
      if (commentContrast.isValid && commentContrast.contrastRatio && commentContrast.wcagLevel) {
        contrastIssues.push({
          foreground: 'comment',
          background: 'background',
          contrastRatio: commentContrast.contrastRatio,
          wcagLevel: commentContrast.wcagLevel
        });

        if (commentContrast.wcagLevel === 'fail') {
          warnings.push(`Poor contrast for comments (${commentContrast.contrastRatio.toFixed(2)}:1). Comments may be hard to read.`);
        }
      }
    }
  }

  // Validate fonts object if present
  if (theme.fonts) {
    if (typeof theme.fonts !== 'object') {
      errors.push('Theme fonts must be an object');
    } else {
      // Validate font size
      if (theme.fonts.size !== undefined) {
        if (typeof theme.fonts.size !== 'number' || theme.fonts.size <= 0) {
          errors.push('Font size must be a positive number');
        } else if (theme.fonts.size < 8 || theme.fonts.size > 72) {
          warnings.push('Font size should typically be between 8 and 72 pixels');
        }
      }

      // Validate line height
      if (theme.fonts.lineHeight !== undefined) {
        if (typeof theme.fonts.lineHeight !== 'number' || theme.fonts.lineHeight <= 0) {
          errors.push('Line height must be a positive number');
        } else if (theme.fonts.lineHeight < 1 || theme.fonts.lineHeight > 3) {
          warnings.push('Line height should typically be between 1 and 3');
        }
      }

      // Validate font family strings
      if (theme.fonts.primary && typeof theme.fonts.primary !== 'string') {
        errors.push('Primary font must be a string');
      }

      if (theme.fonts.monospace && typeof theme.fonts.monospace !== 'string') {
        errors.push('Monospace font must be a string');
      }
    }
  }

  // Validate metadata if present
  if (theme.metadata) {
    if (typeof theme.metadata !== 'object') {
      errors.push('Theme metadata must be an object');
    } else {
      if (theme.metadata.author && typeof theme.metadata.author !== 'string') {
        warnings.push('Theme author should be a string');
      }

      if (theme.metadata.description && typeof theme.metadata.description !== 'string') {
        warnings.push('Theme description should be a string');
      }

      if (theme.metadata.version && typeof theme.metadata.version !== 'string') {
        warnings.push('Theme version should be a string');
      }

      if (theme.metadata.tags) {
        if (!Array.isArray(theme.metadata.tags)) {
          warnings.push('Theme tags should be an array');
        } else {
          theme.metadata.tags.forEach((tag, index) => {
            if (typeof tag !== 'string') {
              warnings.push(`Theme tag at index ${index} should be a string`);
            }
          });
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    colorValidation,
    contrastIssues
  };
}

/**
 * Validates theme compatibility with a specific category
 */
export function validateThemeCategory(theme: ThemeDefinition): {
  isValid: boolean;
  suggestedCategory?: 'light' | 'dark' | 'high-contrast';
  confidence?: number;
  reasoning?: string;
} {
  if (!theme.colors?.background || !theme.colors?.foreground) {
    return {
      isValid: false,
      reasoning: 'Cannot determine category without background and foreground colors'
    };
  }

  try {
    // Calculate luminance of background
    const bgLuminance = getColorLuminance(theme.colors.background);
    const fgLuminance = getColorLuminance(theme.colors.foreground);
    
    // Calculate contrast ratio
    const contrastRatio = (Math.max(bgLuminance, fgLuminance) + 0.05) / (Math.min(bgLuminance, fgLuminance) + 0.05);

    let suggestedCategory: 'light' | 'dark' | 'high-contrast';
    let confidence: number;
    let reasoning: string;

    // High contrast themes have very high contrast ratios
    if (contrastRatio >= 15) {
      suggestedCategory = 'high-contrast';
      confidence = 0.9;
      reasoning = `Very high contrast ratio (${contrastRatio.toFixed(2)}:1) suggests high-contrast theme`;
    }
    // Dark themes have dark backgrounds (low luminance)
    else if (bgLuminance < 0.2) {
      suggestedCategory = 'dark';
      confidence = bgLuminance < 0.1 ? 0.9 : 0.7;
      reasoning = `Low background luminance (${bgLuminance.toFixed(3)}) suggests dark theme`;
    }
    // Light themes have light backgrounds (high luminance)
    else if (bgLuminance > 0.8) {
      suggestedCategory = 'light';
      confidence = bgLuminance > 0.9 ? 0.9 : 0.7;
      reasoning = `High background luminance (${bgLuminance.toFixed(3)}) suggests light theme`;
    }
    // Medium luminance is harder to categorize
    else {
      suggestedCategory = bgLuminance > 0.5 ? 'light' : 'dark';
      confidence = 0.5;
      reasoning = `Medium background luminance (${bgLuminance.toFixed(3)}) makes categorization uncertain`;
    }

    const isValid = theme.category === suggestedCategory;

    return {
      isValid,
      suggestedCategory,
      confidence,
      reasoning
    };
  } catch (error) {
    return {
      isValid: false,
      reasoning: `Failed to analyze theme colors: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Get relative luminance of a color (simplified version)
 */
function getColorLuminance(color: string): number {
  // This is a simplified version - in a real implementation,
  // you'd want to properly parse all color formats
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d')!;
  
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  
  // Convert to relative luminance
  const [rNorm, gNorm, bNorm] = [r, g, b].map(c => {
    const normalized = c / 255;
    return normalized <= 0.03928 
      ? normalized / 12.92 
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rNorm + 0.7152 * gNorm + 0.0722 * bNorm;
}

/**
 * Create a fallback theme with safe default colors
 */
export function createFallbackTheme(originalTheme?: Partial<ThemeDefinition>): ThemeDefinition {
  const baseTheme: ThemeDefinition = {
    id: originalTheme?.id || 'fallback-theme',
    name: originalTheme?.name || 'Fallback Theme',
    category: originalTheme?.category || 'dark',
    colors: {
      background: '#1e1e1e',
      foreground: '#d4d4d4',
      comment: '#6a9955',
      keyword: '#c586c0',
      string: '#ce9178',
      number: '#b5cea8',
      operator: '#d4d4d4',
      punctuation: '#d4d4d4',
      function: '#dcdcaa',
      variable: '#9cdcfe',
      type: '#4ec9b0',
      class: '#4ec9b0',
      constant: '#4fc1ff',
      property: '#9cdcfe',
      tag: '#569cd6',
      attribute: '#92c5f8',
      boolean: '#569cd6',
      regex: '#d16969',
      escape: '#d7ba7d',
      selection: '#264f78',
      lineHighlight: '#2a2d2e',
      cursor: '#d4d4d4',
      diffAdded: '#144212',
      diffRemoved: '#5a1e1e',
      diffModified: '#1e3a8a',
    },
    fonts: {
      monospace: 'Consolas, "Courier New", monospace',
      size: 14,
      lineHeight: 1.5,
    },
    metadata: {
      author: 'System',
      description: 'Fallback theme used when the original theme fails validation',
      version: '1.0.0',
      tags: ['fallback', 'safe'],
    },
  };

  // Merge with original theme colors if they're valid
  if (originalTheme?.colors) {
    for (const [key, value] of Object.entries(originalTheme.colors)) {
      if (value && validateAnyColor(value).isValid) {
        (baseTheme.colors as any)[key] = value;
      }
    }
  }

  return baseTheme;
}