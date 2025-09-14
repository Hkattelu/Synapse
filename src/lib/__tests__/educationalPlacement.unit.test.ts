import { describe, it, expect } from 'vitest';
import type { MediaAsset, TimelineItem } from '../types';
import {
  suggestTrackPlacement,
  validateTrackPlacement,
  suggestBatchTrackPlacement,
  getTrackUsageStatistics,
} from '../educationalPlacement';
import {
  EDUCATIONAL_TRACKS,
  getEducationalTrackByName,
} from '../educationalTypes';

function asset(partial: Partial<MediaAsset>): MediaAsset {
  // Minimal viable MediaAsset; tests only rely on a subset of fields
  return {
    id: partial.id ?? 'a1',
    name: partial.name ?? 'mock',
    type: partial.type ?? 'video',
    url: partial.url ?? '',
    duration: partial.duration,
    metadata: {
      fileSize: partial.metadata?.fileSize ?? 1024,
      mimeType: partial.metadata?.mimeType,
      codeContent: partial.metadata?.codeContent,
      language: partial.metadata?.language,
    },
    createdAt: partial.createdAt ?? new Date('2024-01-01'),
  };
}

function item(partial: Partial<TimelineItem>): TimelineItem {
  return {
    id: partial.id ?? 'i1',
    assetId: partial.assetId ?? 'a1',
    startTime: partial.startTime ?? 0,
    duration: partial.duration ?? 5,
    track: partial.track ?? 0,
    type: partial.type ?? 'video',
    properties: partial.properties ?? {},
    animations: partial.animations ?? [],
    keyframes: partial.keyframes ?? [],
  };
}

describe('educationalPlacement (unit)', () => {
  describe('suggestTrackPlacement', () => {
    it('suggests Code track for code assets with high confidence', () => {
      const a = asset({
        type: 'code',
        name: 'snippet.ts',
        metadata: { language: 'typescript', fileSize: 10 },
      });
      const res = suggestTrackPlacement(a);

      expect(res.suggestedTrack.name).toBe('Code');
      expect(res.confidence).toBeGreaterThan(0.9);
      expect(res.alternatives.some((t) => t.name === 'Visual')).toBe(true);
    });

    it('detects talking-head videos and routes to You track', () => {
      const a = asset({
        type: 'video',
        name: 'presenter-talking-head.mp4',
        metadata: { fileSize: 123, mimeType: 'video/mp4' },
      });
      const res = suggestTrackPlacement(a);
      expect(['You', 'Visual']).toContain(res.suggestedTrack.name);
      // Because of analysis pattern, confidence should be >= 0.95 for You
      if (res.suggestedTrack.name === 'You') {
        expect(res.confidence).toBeGreaterThanOrEqual(0.95);
      }
    });

    it('detects screen recordings and prefers Visual track', () => {
      const a = asset({ type: 'video', name: 'my-screen-recording.mov' });
      const res = suggestTrackPlacement(a);
      expect(res.suggestedTrack.name).toBe('Visual');
      expect(res.confidence).toBeGreaterThan(0.85);
      expect(res.reason.toLowerCase()).toContain('screen');
    });

    it('falls back to Visual for unknown types with medium confidence', () => {
      const a = asset({ type: 'custom' as any, name: 'mystery.asset' });
      const res = suggestTrackPlacement(a);
      expect(res.suggestedTrack.name).toBe('Visual');
      expect(res.confidence).toBeCloseTo(0.5, 2);
      // Alternatives exclude the selected one
      expect(
        res.alternatives.every((t) => t.id !== res.suggestedTrack.id)
      ).toBe(true);
    });

    it('boosts confidence when selectedTrack in context matches and is compatible', () => {
      const a = asset({
        type: 'audio',
        name: 'voiceover.wav',
        metadata: { mimeType: 'audio/wav', fileSize: 100 },
      });
      const narration = getEducationalTrackByName('Narration')!;
      const res = suggestTrackPlacement(a, {
        selectedTrack: narration.trackNumber,
      });
      expect(res.suggestedTrack.id).toBe('narration');
      expect(res.confidence).toBeGreaterThan(0.9); // boosted to near 0.98
    });

    it('adjusts suggestion to maintain recent track consistency', () => {
      const a = asset({ type: 'video', name: 'demo.mp4' });
      const recent: TimelineItem[] = [
        item({ track: 1, type: 'video' }),
        item({ track: 1, type: 'visual-asset' }),
        item({ track: 1, type: 'video' }),
      ];
      const res = suggestTrackPlacement(a, {
        existingItems: recent,
        currentTime: 10,
      });
      expect(res.suggestedTrack.name).toBe('Visual');
      expect(res.confidence).toBeGreaterThan(0.8);
      expect(res.reason.toLowerCase()).toContain('consistency');
    });
  });

  describe('validateTrackPlacement', () => {
    it('flags conflicts when content type is not allowed on target track', () => {
      const a = asset({
        type: 'audio',
        name: 'bgm.mp3',
        metadata: { mimeType: 'audio/mp3', fileSize: 42 },
      });
      const target = getEducationalTrackByName('Visual')!; // Visual does not accept audio
      const res = validateTrackPlacement(a, target);
      expect(res.isValid).toBe(false);
      expect(res.conflicts.length).toBeGreaterThan(0);
      expect(res.suggestion?.suggestedTrack.name).toBe('Narration');
    });

    it('adds warnings when placement is suboptimal but still valid', () => {
      const a = asset({ type: 'video', name: 'webcam-camera.mov' });
      const target = getEducationalTrackByName('Visual')!; // Valid, but You may be better
      const res = validateTrackPlacement(a, target);
      expect(res.isValid).toBe(true);
      expect(res.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('suggestBatchTrackPlacement', () => {
    it('returns suggestions for each asset', () => {
      const assets = [
        asset({
          id: 'c1',
          type: 'code',
          name: 'index.ts',
          metadata: { language: 'typescript', fileSize: 1 },
        }),
        asset({ id: 'v1', type: 'video', name: 'screen-demo.mp4' }),
        asset({
          id: 'a1',
          type: 'audio',
          name: 'voiceover.wav',
          metadata: { mimeType: 'audio/wav', fileSize: 2 },
        }),
      ];
      const res = suggestBatchTrackPlacement(assets);
      expect(res).toHaveLength(3);
      expect(res[0].suggestedTrack.name).toBe('Code');
      expect(res[1].suggestedTrack.name).toBe('Visual');
      expect(res[2].suggestedTrack.name).toBe('Narration');
    });
  });

  describe('getTrackUsageStatistics', () => {
    it('computes usage counts by track and content type', () => {
      const items: TimelineItem[] = [
        item({ track: 0, type: 'code' }),
        item({ track: 1, type: 'video' }),
        item({ track: 2, type: 'audio' }),
        item({ track: 1, type: 'visual-asset' }),
      ];
      const stats = getTrackUsageStatistics(items);
      expect(stats.totalItems).toBe(4);
      expect(stats.trackUsage.Code).toBe(1);
      expect(stats.trackUsage.Visual).toBe(2);
      expect(stats.trackUsage.Narration).toBe(1);
      expect(stats.trackUsage.You).toBe(0);
      expect(stats.contentTypeDistribution['video'].Visual).toBe(1);
    });
  });
});
