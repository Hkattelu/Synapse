import { useMemo } from 'react';
import * as RemotionNS from 'remotion';
import type { AnimationConfig } from '../../lib/types';

export function useTypewriterCount(
  animation: AnimationConfig | undefined,
  totalChars: number,
  startFrame: number
) {
  const hasUCF = 'useCurrentFrame' in (RemotionNS as any);
  const frame: number = hasUCF
    ? (
        RemotionNS as unknown as { useCurrentFrame: () => number }
      ).useCurrentFrame()
    : 0;
  const hasUVC = 'useVideoConfig' in (RemotionNS as any);
  const fps = hasUVC
    ? (
        RemotionNS as unknown as { useVideoConfig: () => { fps: number } }
      ).useVideoConfig().fps
    : 30;

  return useMemo(() => {
    if (!animation || animation.preset !== 'typewriter') return totalChars;
    const rel = Math.max(0, frame - startFrame);
    const cps = Math.max(1, animation.speedCps);
    const charsPerFrame = cps / fps;
    return Math.min(totalChars, Math.floor(rel * charsPerFrame));
  }, [animation, fps, frame, startFrame, totalChars]);
}

export function parseActiveLines(input: string): {
  start: number;
  end: number;
} {
  const trimmed = String(input || '').trim();
  if (!trimmed) return { start: 1, end: 1 };
  if (trimmed.includes('-')) {
    const [a, b] = trimmed
      .split('-', 2)
      .map((n) => Math.max(1, parseInt(n.trim(), 10) || 1));
    return { start: Math.min(a, b), end: Math.max(a, b) };
  }
  const n = Math.max(1, parseInt(trimmed, 10) || 1);
  return { start: n, end: n };
}
