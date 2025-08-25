import { useMemo } from 'react';
import * as RemotionNS from 'remotion';
import type { AnimationConfig } from '../../lib/types';

export type AnimationStyles = {
  transform?: string;
  opacity?: number;
  // When true, caller should set overflow hidden on container
  needsOverflowHidden?: boolean;
};

export function useAnimationStyles(
  animation: AnimationConfig | undefined,
  opts: { startFrame: number; durationInFrames: number }
): AnimationStyles {
  const hasUCF = 'useCurrentFrame' in (RemotionNS as any);
  const frame: number = hasUCF
    ? (
        RemotionNS as unknown as { useCurrentFrame: () => number }
      ).useCurrentFrame()
    : 0;
  const hasUVC = 'useVideoConfig' in (RemotionNS as any);
  const vc = hasUVC
    ? (
        RemotionNS as unknown as {
          useVideoConfig: () => { fps: number; width: number; height: number };
        }
      ).useVideoConfig()
    : { fps: 30, width: 1920, height: 1080 };
  const { fps, width, height } = vc;
  const { startFrame, durationInFrames } = opts;

  return useMemo<AnimationStyles>(() => {
    if (!animation) return {};

    const rel = Math.max(0, frame - startFrame);

    switch (animation.preset) {
      case 'slide': {
        const duration = Math.max(1, animation.duration);
        const cfg =
          animation.easing === 'bouncy'
            ? { damping: 5, stiffness: 120, mass: 0.7 }
            : animation.easing === 'stiff'
              ? { damping: 30, stiffness: 280, mass: 1 }
              : { damping: 200, stiffness: 100, mass: 1 };

        const springFn = (RemotionNS as any).spring as
          | ((args: any) => number)
          | undefined;
        const interp = (RemotionNS as any).interpolate as
          | ((
              input: number,
              inputRange: [number, number],
              outputRange: [number, number]
            ) => number)
          | undefined;

        const prog = springFn
          ? springFn({
              frame: Math.min(rel, duration),
              fps,
              config: cfg,
              durationInFrames: duration,
            })
          : Math.min(1, Math.max(0, rel / duration));
        let tx = 0;
        let ty = 0;
        const offX = width; // off-screen distance
        const offY = height;
        const lerp =
          interp ??
          ((v: number, [a, b]: [number, number], [c, d]: [number, number]) =>
            c + (d - c) * ((v - a) / (b - a)));
        switch (animation.direction) {
          case 'left':
            tx = lerp(prog, [0, 1], [-offX, 0]);
            break;
          case 'right':
            tx = lerp(prog, [0, 1], [offX, 0]);
            break;
          case 'up':
            ty = lerp(prog, [0, 1], [-offY, 0]);
            break;
          case 'down':
            ty = lerp(prog, [0, 1], [offY, 0]);
            break;
        }
        const opacity = lerp(prog, [0, 1], [0, 1]);
        const transform = `translate(${tx}px, ${ty}px)`;
        return { transform, opacity };
      }

      case 'kenBurns': {
        const p = Math.min(1, rel / Math.max(1, durationInFrames));
        const intensity = Math.max(0, Math.min(1, animation.intensity));
        let transform = '';
        const interp = (RemotionNS as any).interpolate as
          | ((
              input: number,
              inputRange: [number, number],
              outputRange: [number, number]
            ) => number)
          | undefined;
        const lerp =
          interp ??
          ((v: number, [a, b]: [number, number], [c, d]: [number, number]) =>
            c + (d - c) * ((v - a) / (b - a)));
        switch (animation.direction) {
          case 'zoomIn': {
            const scale = lerp(p, [0, 1], [1, 1 + 0.1 * (0.5 + intensity)]);
            transform = `scale(${scale})`;
            break;
          }
          case 'zoomOut': {
            const scale = lerp(p, [0, 1], [1 + 0.1 * (0.5 + intensity), 1]);
            transform = `scale(${scale})`;
            break;
          }
          case 'panLeft': {
            const tx = lerp(
              p,
              [0, 1],
              [width * 0.05 * intensity, -(width * 0.05) * intensity]
            );
            transform = `translateX(${tx}px)`;
            break;
          }
          case 'panRight': {
            const tx = lerp(
              p,
              [0, 1],
              [-(width * 0.05) * intensity, width * 0.05 * intensity]
            );
            transform = `translateX(${tx}px)`;
            break;
          }
        }
        return { transform, needsOverflowHidden: true };
      }

      // Other presets (typewriter, lineFocus) affect content, not container style
      default:
        return {};
    }
  }, [animation, durationInFrames, fps, frame, height, startFrame, width]);
}
