// Export format validation and compatibility checking

import type {
  ExportSettings,
  VideoFormat,
  VideoCodec,
  AudioCodec,
} from '../types';

export interface ExportValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
  compatibilityIssues: ExportCompatibilityIssue[];
}

export interface ExportCompatibilityIssue {
  type: 'transparency' | 'codec' | 'format' | 'quality' | 'resolution';
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
  affectedSettings: string[];
}

export interface FormatCapabilities {
  supportsTransparency: boolean;
  supportedCodecs: VideoCodec[];
  supportedAudioCodecs: AudioCodec[];
  maxResolution?: { width: number; height: number };
  recommendedBitrates?: { min: number; max: number; optimal: number };
  browserSupport: {
    chrome: boolean;
    firefox: boolean;
    safari: boolean;
    edge: boolean;
  };
}

// Format capabilities database
const FORMAT_CAPABILITIES: Record<VideoFormat, FormatCapabilities> = {
  mp4: {
    supportsTransparency: false,
    supportedCodecs: ['h264', 'h265'],
    supportedAudioCodecs: ['aac', 'mp3'],
    maxResolution: { width: 7680, height: 4320 }, // 8K
    recommendedBitrates: { min: 1000, max: 50000, optimal: 8000 },
    browserSupport: {
      chrome: true,
      firefox: true,
      safari: true,
      edge: true,
    },
  },
  webm: {
    supportsTransparency: true,
    supportedCodecs: ['vp8', 'vp9'],
    supportedAudioCodecs: ['opus', 'vorbis'],
    maxResolution: { width: 7680, height: 4320 }, // 8K
    recommendedBitrates: { min: 500, max: 40000, optimal: 6000 },
    browserSupport: {
      chrome: true,
      firefox: true,
      safari: false,
      edge: true,
    },
  },
  mov: {
    supportsTransparency: true,
    supportedCodecs: ['h264', 'h265'],
    supportedAudioCodecs: ['aac'],
    maxResolution: { width: 7680, height: 4320 }, // 8K
    recommendedBitrates: { min: 2000, max: 100000, optimal: 15000 },
    browserSupport: {
      chrome: false,
      firefox: false,
      safari: true,
      edge: false,
    },
  },
  avi: {
    supportsTransparency: false,
    supportedCodecs: ['h264'],
    supportedAudioCodecs: ['mp3', 'aac'],
    maxResolution: { width: 1920, height: 1080 }, // Limited to Full HD
    recommendedBitrates: { min: 1000, max: 20000, optimal: 5000 },
    browserSupport: {
      chrome: false,
      firefox: false,
      safari: false,
      edge: false,
    },
  },
};

// Codec compatibility matrix
const CODEC_COMPATIBILITY: Record<
  VideoCodec,
  {
    formats: VideoFormat[];
    hardwareAcceleration: boolean;
    qualityEfficiency: 'low' | 'medium' | 'high' | 'excellent';
    fileSize: 'large' | 'medium' | 'small' | 'very-small';
    browserSupport: {
      chrome: boolean;
      firefox: boolean;
      safari: boolean;
      edge: boolean;
    };
  }
> = {
  h264: {
    formats: ['mp4', 'mov'],
    hardwareAcceleration: true,
    qualityEfficiency: 'high',
    fileSize: 'medium',
    browserSupport: {
      chrome: true,
      firefox: true,
      safari: true,
      edge: true,
    },
  },
  h265: {
    formats: ['mp4', 'mov'],
    hardwareAcceleration: true,
    qualityEfficiency: 'excellent',
    fileSize: 'small',
    browserSupport: {
      chrome: true,
      firefox: false,
      safari: true,
      edge: true,
    },
  },
  vp8: {
    formats: ['webm'],
    hardwareAcceleration: false,
    qualityEfficiency: 'medium',
    fileSize: 'medium',
    browserSupport: {
      chrome: true,
      firefox: true,
      safari: false,
      edge: true,
    },
  },
  vp9: {
    formats: ['webm'],
    hardwareAcceleration: true,
    qualityEfficiency: 'excellent',
    fileSize: 'small',
    browserSupport: {
      chrome: true,
      firefox: true,
      safari: false,
      edge: true,
    },
  },
  av1: {
    formats: ['webm'],
    hardwareAcceleration: false,
    qualityEfficiency: 'excellent',
    fileSize: 'very-small',
    browserSupport: {
      chrome: true,
      firefox: true,
      safari: false,
      edge: true,
    },
  },
};

/**
 * Validates export settings for compatibility and optimal configuration
 */
export function validateExportSettings(
  settings: ExportSettings
): ExportValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];
  const compatibilityIssues: ExportCompatibilityIssue[] = [];

  // Validate basic settings
  if (!settings.format) {
    errors.push('Export format is required');
  }

  if (!settings.codec) {
    errors.push('Video codec is required');
  }

  if (!settings.audioCodec) {
    errors.push('Audio codec is required');
  }

  if (!settings.quality) {
    errors.push('Export quality is required');
  }

  // Early return if basic validation fails
  if (errors.length > 0) {
    return {
      isValid: false,
      errors,
      warnings,
      recommendations,
      compatibilityIssues,
    };
  }

  const formatCaps = FORMAT_CAPABILITIES[settings.format];
  const codecInfo = CODEC_COMPATIBILITY[settings.codec];

  // Validate format and codec compatibility
  if (!formatCaps.supportedCodecs.includes(settings.codec)) {
    const issue: ExportCompatibilityIssue = {
      type: 'codec',
      severity: 'error',
      message: `Codec ${settings.codec} is not supported by format ${settings.format}`,
      suggestion: `Use one of these codecs instead: ${formatCaps.supportedCodecs.join(', ')}`,
      affectedSettings: ['format', 'codec'],
    };
    compatibilityIssues.push(issue);
    errors.push(issue.message);
  }

  // Validate audio codec compatibility
  if (!formatCaps.supportedAudioCodecs.includes(settings.audioCodec)) {
    const issue: ExportCompatibilityIssue = {
      type: 'codec',
      severity: 'error',
      message: `Audio codec ${settings.audioCodec} is not supported by format ${settings.format}`,
      suggestion: `Use one of these audio codecs instead: ${formatCaps.supportedAudioCodecs.join(', ')}`,
      affectedSettings: ['format', 'audioCodec'],
    };
    compatibilityIssues.push(issue);
    errors.push(issue.message);
  }

  // Validate transparency settings
  if (settings.transparentBackground) {
    if (!formatCaps.supportsTransparency) {
      const issue: ExportCompatibilityIssue = {
        type: 'transparency',
        severity: 'error',
        message: `Format ${settings.format} does not support transparent backgrounds`,
        suggestion: 'Use WebM or MOV format for transparency support',
        affectedSettings: ['format', 'transparentBackground'],
      };
      compatibilityIssues.push(issue);
      errors.push(issue.message);
    } else {
      // Transparency is supported, but provide recommendations
      if (settings.format === 'webm') {
        recommendations.push(
          'WebM with VP9 codec provides excellent transparency support and compression'
        );
      } else if (settings.format === 'mov') {
        recommendations.push(
          'MOV format provides high-quality transparency but larger file sizes'
        );
      }
    }
  }

  // Validate resolution
  if (settings.width && settings.height) {
    const maxRes = formatCaps.maxResolution;
    if (
      maxRes &&
      (settings.width > maxRes.width || settings.height > maxRes.height)
    ) {
      const issue: ExportCompatibilityIssue = {
        type: 'resolution',
        severity: 'warning',
        message: `Resolution ${settings.width}×${settings.height} exceeds recommended maximum for ${settings.format} (${maxRes.width}×${maxRes.height})`,
        suggestion: 'Consider reducing resolution or using a different format',
        affectedSettings: ['width', 'height', 'format'],
      };
      compatibilityIssues.push(issue);
      warnings.push(issue.message);
    }

    // Check for unusual aspect ratios
    const aspectRatio = settings.width / settings.height;
    if (aspectRatio < 0.5 || aspectRatio > 3) {
      warnings.push(
        `Unusual aspect ratio detected (${aspectRatio.toFixed(2)}:1). Ensure this is intentional.`
      );
    }

    // Check for very small resolutions
    if (settings.width < 480 || settings.height < 270) {
      warnings.push('Very low resolution may result in poor quality output');
    }
  }

  // Validate bitrate settings
  if (settings.bitrate) {
    const recBitrates = formatCaps.recommendedBitrates;
    if (recBitrates) {
      if (settings.bitrate < recBitrates.min) {
        warnings.push(
          `Bitrate ${settings.bitrate} kbps is below recommended minimum (${recBitrates.min} kbps)`
        );
      } else if (settings.bitrate > recBitrates.max) {
        warnings.push(
          `Bitrate ${settings.bitrate} kbps is above recommended maximum (${recBitrates.max} kbps)`
        );
      }
    }
  }

  // Audio bitrate validation
  if (settings.audioBitrate) {
    if (settings.audioBitrate < 64) {
      warnings.push(
        'Audio bitrate below 64 kbps may result in poor audio quality'
      );
    } else if (settings.audioBitrate > 320) {
      warnings.push(
        'Audio bitrate above 320 kbps provides diminishing returns'
      );
    }
  }

  // Browser compatibility warnings
  const browserSupport = formatCaps.browserSupport;
  const unsupportedBrowsers = Object.entries(browserSupport)
    .filter(([, supported]) => !supported)
    .map(([browser]) => browser);

  if (unsupportedBrowsers.length > 0) {
    const issue: ExportCompatibilityIssue = {
      type: 'format',
      severity: 'info',
      message: `Format ${settings.format} is not supported in: ${unsupportedBrowsers.join(', ')}`,
      suggestion: 'Consider MP4 format for maximum browser compatibility',
      affectedSettings: ['format'],
    };
    compatibilityIssues.push(issue);
  }

  // Quality and codec efficiency recommendations
  if (settings.quality === 'ultra' && codecInfo.qualityEfficiency === 'low') {
    recommendations.push(
      `Consider using a more efficient codec like H.265 or VP9 for ultra quality exports`
    );
  }

  if (settings.quality === 'low' && codecInfo.fileSize === 'large') {
    recommendations.push(
      `Consider using a more efficient codec to reduce file size at low quality`
    );
  }

  // Hardware acceleration recommendations
  if (
    !codecInfo.hardwareAcceleration &&
    (settings.width || 0) * (settings.height || 0) > 1920 * 1080
  ) {
    recommendations.push(
      `Codec ${settings.codec} doesn't support hardware acceleration. Consider H.264 or H.265 for faster encoding of high-resolution content`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    recommendations,
    compatibilityIssues,
  };
}

/**
 * Get transparency compatibility warning for current settings
 */
export function getTransparencyCompatibilityWarning(
  settings: ExportSettings
): string | null {
  if (!settings.transparentBackground) {
    return null;
  }

  const formatCaps = FORMAT_CAPABILITIES[settings.format];
  if (!formatCaps.supportsTransparency) {
    return `${settings.format.toUpperCase()} format does not support transparency. Switch to WebM or MOV format to enable transparent backgrounds.`;
  }

  return null;
}

/**
 * Check if transparency is supported by the current format
 */
export function isTransparencySupported(format: VideoFormat): boolean {
  return FORMAT_CAPABILITIES[format]?.supportsTransparency || false;
}

/**
 * Get recommended settings for a specific use case
 */
export function getRecommendedSettings(
  useCase: 'web' | 'social' | 'broadcast' | 'archive'
): Partial<ExportSettings> {
  switch (useCase) {
    case 'web':
      return {
        format: 'mp4',
        codec: 'h264',
        audioCodec: 'aac',
        quality: 'high',
        width: 1920,
        height: 1080,
        bitrate: 8000,
        audioBitrate: 128,
      };

    case 'social':
      return {
        format: 'mp4',
        codec: 'h264',
        audioCodec: 'aac',
        quality: 'high',
        width: 1080,
        height: 1920, // Vertical for social media
        bitrate: 6000,
        audioBitrate: 128,
      };

    case 'broadcast':
      return {
        format: 'mov',
        codec: 'h264',
        audioCodec: 'aac',
        quality: 'ultra',
        width: 1920,
        height: 1080,
        bitrate: 25000,
        audioBitrate: 256,
      };

    case 'archive':
      return {
        format: 'mov',
        codec: 'h265',
        audioCodec: 'aac',
        quality: 'ultra',
        bitrate: 15000,
        audioBitrate: 256,
      };

    default:
      return {};
  }
}

/**
 * Get format recommendations based on requirements
 */
export function getFormatRecommendations(requirements: {
  needsTransparency?: boolean;
  targetPlatform?: 'web' | 'mobile' | 'desktop' | 'broadcast';
  prioritizeFileSize?: boolean;
  prioritizeQuality?: boolean;
  prioritizeCompatibility?: boolean;
}): Array<{
  format: VideoFormat;
  codec: VideoCodec;
  reason: string;
  pros: string[];
  cons: string[];
}> {
  const recommendations: Array<{
    format: VideoFormat;
    codec: VideoCodec;
    reason: string;
    pros: string[];
    cons: string[];
  }> = [];

  if (requirements.needsTransparency) {
    recommendations.push({
      format: 'webm' as VideoFormat,
      codec: 'vp9' as VideoCodec,
      reason: 'Best transparency support with excellent compression',
      pros: [
        'Supports transparency',
        'Excellent compression',
        'Good browser support',
      ],
      cons: ['Not supported in Safari', 'Slower encoding'],
    });

    recommendations.push({
      format: 'mov' as VideoFormat,
      codec: 'h264' as VideoCodec,
      reason: 'High-quality transparency with broad software support',
      pros: ['Supports transparency', 'High quality', 'Professional standard'],
      cons: ['Larger file sizes', 'Limited browser support'],
    });
  } else {
    if (requirements.prioritizeCompatibility) {
      recommendations.push({
        format: 'mp4' as VideoFormat,
        codec: 'h264' as VideoCodec,
        reason: 'Maximum compatibility across all platforms and browsers',
        pros: [
          'Universal support',
          'Hardware acceleration',
          'Proven reliability',
        ],
        cons: ['No transparency support', 'Less efficient than newer codecs'],
      });
    }

    if (requirements.prioritizeFileSize) {
      recommendations.push({
        format: 'webm' as VideoFormat,
        codec: 'vp9' as VideoCodec,
        reason: 'Excellent compression efficiency for smaller file sizes',
        pros: ['Very efficient compression', 'Good quality', 'Open source'],
        cons: ['Not supported in Safari', 'Slower encoding'],
      });

      recommendations.push({
        format: 'mp4' as VideoFormat,
        codec: 'h265' as VideoCodec,
        reason: 'Better compression than H.264 with good compatibility',
        pros: [
          'Excellent compression',
          'Hardware acceleration',
          'High quality',
        ],
        cons: ['Limited browser support', 'Patent licensing'],
      });
    }

    if (requirements.prioritizeQuality) {
      recommendations.push({
        format: 'mov' as VideoFormat,
        codec: 'h265' as VideoCodec,
        reason: 'Professional quality with efficient compression',
        pros: [
          'Excellent quality',
          'Efficient compression',
          'Professional standard',
        ],
        cons: ['Limited browser support', 'Larger files than VP9'],
      });
    }
  }

  return recommendations.slice(0, 3); // Return top 3 recommendations
}

/**
 * Validate transparency settings specifically
 */
export function validateTransparencySettings(settings: ExportSettings): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!settings.transparentBackground) {
    return { isValid: true, errors, warnings };
  }

  // Check format support
  if (!isTransparencySupported(settings.format)) {
    errors.push(
      `Format ${settings.format} does not support transparent backgrounds`
    );
  }

  // Check codec compatibility with transparency
  if (settings.format === 'webm' && !['vp8', 'vp9'].includes(settings.codec)) {
    errors.push(
      `Codec ${settings.codec} does not support transparency in WebM format`
    );
  }

  if (settings.format === 'mov' && !['h264', 'h265'].includes(settings.codec)) {
    errors.push(
      `Codec ${settings.codec} does not support transparency in MOV format`
    );
  }

  // Warn about file size implications
  if (settings.transparentBackground && settings.quality === 'ultra') {
    warnings.push(
      'Transparent backgrounds with ultra quality will result in very large file sizes'
    );
  }

  // Warn about browser compatibility
  if (settings.format === 'webm') {
    warnings.push('WebM with transparency is not supported in Safari browsers');
  }

  if (settings.format === 'mov') {
    warnings.push(
      'MOV format is not supported for web playback in most browsers'
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
