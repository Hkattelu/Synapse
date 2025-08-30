// Color validation utilities

export interface ColorValidationResult {
  isValid: boolean;
  normalizedColor?: string;
  error?: string;
}

/**
 * Validates if a string is a valid CSS color value
 */
export function validateColor(color: string): ColorValidationResult {
  if (!color || typeof color !== 'string') {
    return {
      isValid: false,
      error: 'Color must be a non-empty string'
    };
  }

  const trimmedColor = color.trim();
  
  if (!trimmedColor) {
    return {
      isValid: false,
      error: 'Color cannot be empty or whitespace only'
    };
  }

  // Test color validity using a temporary DOM element
  const testElement = document.createElement('div');
  testElement.style.color = '';
  testElement.style.color = trimmedColor;
  
  if (testElement.style.color === '') {
    return {
      isValid: false,
      error: `Invalid CSS color value: ${trimmedColor}`
    };
  }

  return {
    isValid: true,
    normalizedColor: trimmedColor
  };
}

/**
 * Validates hex color format specifically
 */
export function validateHexColor(color: string): ColorValidationResult {
  if (!color || typeof color !== 'string') {
    return {
      isValid: false,
      error: 'Color must be a non-empty string'
    };
  }

  const trimmedColor = color.trim();
  const hexPattern = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/;
  
  if (!hexPattern.test(trimmedColor)) {
    return {
      isValid: false,
      error: `Invalid hex color format: ${trimmedColor}. Expected format: #RGB, #RRGGBB, or #RRGGBBAA`
    };
  }

  return {
    isValid: true,
    normalizedColor: trimmedColor.toLowerCase()
  };
}

/**
 * Validates RGB/RGBA color format
 */
export function validateRgbColor(color: string): ColorValidationResult {
  if (!color || typeof color !== 'string') {
    return {
      isValid: false,
      error: 'Color must be a non-empty string'
    };
  }

  const trimmedColor = color.trim();
  const rgbPattern = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)$/;
  const match = trimmedColor.match(rgbPattern);
  
  if (!match) {
    return {
      isValid: false,
      error: `Invalid RGB/RGBA color format: ${trimmedColor}. Expected format: rgb(r, g, b) or rgba(r, g, b, a)`
    };
  }

  const [, r, g, b, a] = match;
  const red = parseInt(r, 10);
  const green = parseInt(g, 10);
  const blue = parseInt(b, 10);
  const alpha = a ? parseFloat(a) : 1;

  if (red < 0 || red > 255 || green < 0 || green > 255 || blue < 0 || blue > 255) {
    return {
      isValid: false,
      error: `RGB values must be between 0 and 255. Got: r=${red}, g=${green}, b=${blue}`
    };
  }

  if (alpha < 0 || alpha > 1) {
    return {
      isValid: false,
      error: `Alpha value must be between 0 and 1. Got: ${alpha}`
    };
  }

  return {
    isValid: true,
    normalizedColor: trimmedColor
  };
}

/**
 * Validates HSL/HSLA color format
 */
export function validateHslColor(color: string): ColorValidationResult {
  if (!color || typeof color !== 'string') {
    return {
      isValid: false,
      error: 'Color must be a non-empty string'
    };
  }

  const trimmedColor = color.trim();
  const hslPattern = /^hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*(?:,\s*([\d.]+))?\s*\)$/;
  const match = trimmedColor.match(hslPattern);
  
  if (!match) {
    return {
      isValid: false,
      error: `Invalid HSL/HSLA color format: ${trimmedColor}. Expected format: hsl(h, s%, l%) or hsla(h, s%, l%, a)`
    };
  }

  const [, h, s, l, a] = match;
  const hue = parseFloat(h);
  const saturation = parseFloat(s);
  const lightness = parseFloat(l);
  const alpha = a ? parseFloat(a) : 1;

  if (hue < 0 || hue >= 360) {
    return {
      isValid: false,
      error: `Hue value must be between 0 and 359. Got: ${hue}`
    };
  }

  if (saturation < 0 || saturation > 100) {
    return {
      isValid: false,
      error: `Saturation value must be between 0 and 100. Got: ${saturation}`
    };
  }

  if (lightness < 0 || lightness > 100) {
    return {
      isValid: false,
      error: `Lightness value must be between 0 and 100. Got: ${lightness}`
    };
  }

  if (alpha < 0 || alpha > 1) {
    return {
      isValid: false,
      error: `Alpha value must be between 0 and 1. Got: ${alpha}`
    };
  }

  return {
    isValid: true,
    normalizedColor: trimmedColor
  };
}

/**
 * Validates CSS named colors
 */
export function validateNamedColor(color: string): ColorValidationResult {
  if (!color || typeof color !== 'string') {
    return {
      isValid: false,
      error: 'Color must be a non-empty string'
    };
  }

  const trimmedColor = color.trim().toLowerCase();
  
  // List of valid CSS named colors (subset for validation)
  const namedColors = new Set([
    'aliceblue', 'antiquewhite', 'aqua', 'aquamarine', 'azure', 'beige', 'bisque', 'black',
    'blanchedalmond', 'blue', 'blueviolet', 'brown', 'burlywood', 'cadetblue', 'chartreuse',
    'chocolate', 'coral', 'cornflowerblue', 'cornsilk', 'crimson', 'cyan', 'darkblue',
    'darkcyan', 'darkgoldenrod', 'darkgray', 'darkgreen', 'darkgrey', 'darkkhaki',
    'darkmagenta', 'darkolivegreen', 'darkorange', 'darkorchid', 'darkred', 'darksalmon',
    'darkseagreen', 'darkslateblue', 'darkslategray', 'darkslategrey', 'darkturquoise',
    'darkviolet', 'deeppink', 'deepskyblue', 'dimgray', 'dimgrey', 'dodgerblue', 'firebrick',
    'floralwhite', 'forestgreen', 'fuchsia', 'gainsboro', 'ghostwhite', 'gold', 'goldenrod',
    'gray', 'green', 'greenyellow', 'grey', 'honeydew', 'hotpink', 'indianred', 'indigo',
    'ivory', 'khaki', 'lavender', 'lavenderblush', 'lawngreen', 'lemonchiffon', 'lightblue',
    'lightcoral', 'lightcyan', 'lightgoldenrodyellow', 'lightgray', 'lightgreen', 'lightgrey',
    'lightpink', 'lightsalmon', 'lightseagreen', 'lightskyblue', 'lightslategray',
    'lightslategrey', 'lightsteelblue', 'lightyellow', 'lime', 'limegreen', 'linen',
    'magenta', 'maroon', 'mediumaquamarine', 'mediumblue', 'mediumorchid', 'mediumpurple',
    'mediumseagreen', 'mediumslateblue', 'mediumspringgreen', 'mediumturquoise',
    'mediumvioletred', 'midnightblue', 'mintcream', 'mistyrose', 'moccasin', 'navajowhite',
    'navy', 'oldlace', 'olive', 'olivedrab', 'orange', 'orangered', 'orchid', 'palegoldenrod',
    'palegreen', 'paleturquoise', 'palevioletred', 'papayawhip', 'peachpuff', 'peru', 'pink',
    'plum', 'powderblue', 'purple', 'red', 'rosybrown', 'royalblue', 'saddlebrown', 'salmon',
    'sandybrown', 'seagreen', 'seashell', 'sienna', 'silver', 'skyblue', 'slateblue',
    'slategray', 'slategrey', 'snow', 'springgreen', 'steelblue', 'tan', 'teal', 'thistle',
    'tomato', 'turquoise', 'violet', 'wheat', 'white', 'whitesmoke', 'yellow', 'yellowgreen',
    'transparent'
  ]);

  if (!namedColors.has(trimmedColor)) {
    return {
      isValid: false,
      error: `Unknown CSS named color: ${trimmedColor}`
    };
  }

  return {
    isValid: true,
    normalizedColor: trimmedColor
  };
}

/**
 * Comprehensive color validation that tries all formats
 */
export function validateAnyColor(color: string): ColorValidationResult {
  if (!color || typeof color !== 'string') {
    return {
      isValid: false,
      error: 'Color must be a non-empty string'
    };
  }

  const trimmedColor = color.trim();

  // Try hex format first
  if (trimmedColor.startsWith('#')) {
    return validateHexColor(trimmedColor);
  }

  // Try RGB/RGBA format
  if (trimmedColor.startsWith('rgb')) {
    return validateRgbColor(trimmedColor);
  }

  // Try HSL/HSLA format
  if (trimmedColor.startsWith('hsl')) {
    return validateHslColor(trimmedColor);
  }

  // Try named color
  const namedResult = validateNamedColor(trimmedColor);
  if (namedResult.isValid) {
    return namedResult;
  }

  // Fall back to general CSS color validation
  return validateColor(trimmedColor);
}

/**
 * Validates color contrast ratio for accessibility
 */
export function validateColorContrast(foreground: string, background: string): {
  isValid: boolean;
  contrastRatio?: number;
  wcagLevel?: 'AA' | 'AAA' | 'fail';
  error?: string;
} {
  const fgResult = validateAnyColor(foreground);
  const bgResult = validateAnyColor(background);

  if (!fgResult.isValid) {
    return {
      isValid: false,
      error: `Invalid foreground color: ${fgResult.error}`
    };
  }

  if (!bgResult.isValid) {
    return {
      isValid: false,
      error: `Invalid background color: ${bgResult.error}`
    };
  }

  try {
    const contrastRatio = calculateContrastRatio(foreground, background);
    
    let wcagLevel: 'AA' | 'AAA' | 'fail' = 'fail';
    if (contrastRatio >= 7) {
      wcagLevel = 'AAA';
    } else if (contrastRatio >= 4.5) {
      wcagLevel = 'AA';
    }

    return {
      isValid: contrastRatio >= 4.5, // WCAG AA minimum
      contrastRatio,
      wcagLevel
    };
  } catch (error) {
    return {
      isValid: false,
      error: `Failed to calculate contrast ratio: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Calculate contrast ratio between two colors
 * Based on WCAG 2.1 guidelines
 */
function calculateContrastRatio(color1: string, color2: string): number {
  const luminance1 = getRelativeLuminance(color1);
  const luminance2 = getRelativeLuminance(color2);
  
  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Calculate relative luminance of a color
 */
function getRelativeLuminance(color: string): number {
  const rgb = hexToRgb(color);
  if (!rgb) {
    throw new Error(`Cannot convert color to RGB: ${color}`);
  }

  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
    const normalized = c / 255;
    return normalized <= 0.03928 
      ? normalized / 12.92 
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}