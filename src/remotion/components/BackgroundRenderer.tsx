import React, { useMemo } from 'react';
import { AbsoluteFill, Img, useVideoConfig, useCurrentFrame } from 'remotion';
import type { BackgroundConfig, GradientConfig } from '../../lib/types';
import { backgroundManager } from '../../lib/backgrounds';
import { generateGradientCSS } from '../../lib/backgrounds/gradients';
import { visualSettingsManager } from '../../lib/settings/VisualSettingsManager';

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
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();

  // Determine whether to reduce/disable motion
  const reduceMotion = useMemo(() => {
    try {
      // Explicit app preference wins, falling back to system
      const pref = visualSettingsManager.getReduceMotion?.();
      if (typeof pref === 'boolean') return pref;
    } catch {
      /* no-op */
    }
    if (typeof window !== 'undefined' && 'matchMedia' in window) {
      try {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      } catch {
        /* no-op */
      }
    }
    return false;
  }, []);

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

      case 'gradient': {
        if (!config.gradient) return baseStyle;
        // Subtle animated gradient: slowly rotate linear gradient angle when motion is allowed
        const g = { ...config.gradient } as GradientConfig;
        if (!reduceMotion && g.type === 'linear') {
          const baseAngle = g.angle ?? 45;
          const t = frame / (fps || 30);
          const wobble = Math.sin(t / 4) * 6; // ±6° over ~8s
          g.angle = baseAngle + wobble;
        }
        return {
          ...baseStyle,
          background: generateGradientCSS(g),
        };
      }

      case 'wallpaper':
        // Wallpaper will be handled by the Img component
        return baseStyle;

      default:
        return baseStyle;
    }
  }, [config, opacity, style, frame, fps, reduceMotion]);

  // Don't render anything if no background is configured
  if (!config || config.type === 'none') {
    return null;
  }

  // Handle wallpaper backgrounds
  if (config.type === 'wallpaper' && config.wallpaper) {
    const wallpaper = backgroundManager.getWallpaperById(
      config.wallpaper.assetId
    );

    if (!wallpaper) {
      console.warn(`Wallpaper not found: ${config.wallpaper.assetId}`);
      return null;
    }

    // Choose URL honoring reduced motion (prefer still image when available)
    const srcUrl =
      reduceMotion && (wallpaper.stillUrl || wallpaper.thumbnail)
        ? wallpaper.stillUrl || wallpaper.thumbnail
        : wallpaper.url;

    // Subtle auto-motion (Ken Burns-style) for static wallpapers when motion allowed
    const motionTransform = (() => {
      const isAnimated = wallpaper.animated || wallpaper.format === 'gif';
      if (reduceMotion || isAnimated) return undefined;
      const t = frame / (fps || 30);
      const translateX = Math.sin(t / 10) * 12; // px
      const translateY = Math.cos(t / 12) * 8; // px
      const scale = 1.03; // slight zoom-in
      return `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    })();

    const wallpaperStyle: React.CSSProperties = {
      ...backgroundStyle,
      opacity:
        (typeof backgroundStyle.opacity === 'number'
          ? backgroundStyle.opacity
          : 1) * config.wallpaper.opacity,
      mixBlendMode: config.wallpaper.blendMode,
      objectFit: 'cover',
      width: '100%',
      height: '100%',
      willChange: motionTransform ? 'transform' : undefined,
      transform: motionTransform,
    };

    return (
      <AbsoluteFill className={className}>
        <Img src={srcUrl} style={wallpaperStyle} />
      </AbsoluteFill>
    );
  }

  // Handle color and gradient backgrounds
  return <AbsoluteFill className={className} style={backgroundStyle} />;
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
