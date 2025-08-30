import React, { useMemo } from 'react';
import { AbsoluteFill, Img, useVideoConfig } from 'remotion';
import type { BackgroundConfig, GradientConfig } from '../../lib/types';
import { backgroundManager } from '../../lib/backgrounds';
import { generateGradientCSS } from '../../lib/backgrounds/gradients';

interface BackgroundRendererProps {
  config?: BackgroundConfig;
  opacity?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const BackgroundRenderer: React.FC<BackgroundRendererProps> = ({
  config,
  opacity = 1,
  className,
  style = {},
}) => {
  const { width, height } = useVideoConfig();

  const backgroundStyle = useMemo(() => {
    if (!config || config.type === 'none') {
      return {};
    }

    const baseStyle: React.CSSProperties = {
      opacity,
      ...style,
    };

    switch (config.type) {
      case 'color':
        return {
          ...baseStyle,
          backgroundColor: config.color,
        };

      case 'gradient':
        if (!config.gradient) return baseStyle;
        return {
          ...baseStyle,
          background: generateGradientCSS(config.gradient),
        };

      case 'wallpaper':
        // Wallpaper will be handled by the Img component
        return baseStyle;

      default:
        return baseStyle;
    }
  }, [config, opacity, style]);

  // Don't render anything if no background is configured
  if (!config || config.type === 'none') {
    return null;
  }

  // Handle wallpaper backgrounds
  if (config.type === 'wallpaper' && config.wallpaper) {
    const wallpaper = backgroundManager.getWallpaperById(config.wallpaper.assetId);
    
    if (!wallpaper) {
      console.warn(`Wallpaper not found: ${config.wallpaper.assetId}`);
      return null;
    }

    const wallpaperStyle: React.CSSProperties = {
      ...backgroundStyle,
      opacity: (typeof backgroundStyle.opacity === 'number' ? backgroundStyle.opacity : 1) * config.wallpaper.opacity,
      mixBlendMode: config.wallpaper.blendMode,
      objectFit: 'cover',
      width: '100%',
      height: '100%',
    };

    return (
      <AbsoluteFill className={className}>
        <Img
          src={wallpaper.url}
          style={wallpaperStyle}
        />
      </AbsoluteFill>
    );
  }

  // Handle color and gradient backgrounds
  return (
    <AbsoluteFill 
      className={className}
      style={backgroundStyle}
    />
  );
};

// Background layer component for proper layering
interface BackgroundLayerProps {
  backgroundConfig?: BackgroundConfig;
  globalBackgroundConfig?: BackgroundConfig;
  opacity?: number;
}

export const BackgroundLayer: React.FC<BackgroundLayerProps> = ({
  backgroundConfig,
  globalBackgroundConfig,
  opacity = 1,
}) => {
  // Item-level background takes precedence over global background
  const activeConfig = backgroundConfig || globalBackgroundConfig;

  if (!activeConfig || activeConfig.type === 'none') {
    return null;
  }

  return (
    <BackgroundRenderer
      config={activeConfig}
      opacity={opacity}
      style={{ zIndex: -1 }}
    />
  );
};