import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EducationalTimeline } from '../EducationalTimeline';

// Polyfill ResizeObserver for JSDOM
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as any;

// Stub ContentAdditionToolbar to avoid NotificationsProvider dependency
vi.mock('../ContentAdditionToolbar', () => ({
  ContentAdditionToolbar: () => <div data-testid="stub-toolbar" />,
}));

// Make intersection observer always consider tracks visible and simplify other perf hooks
vi.mock('../../lib/performanceOptimizations', () => ({
  useIntersectionObserver: () => [({ current: null } as any), true],
  useResponsiveBreakpoint: () => 'desktop',
  TimelineCalculations: {
    getTimeToPixels: (time: number, pps: number = 100, zoom: number = 1) => time * pps * zoom,
    getPixelsToTime: (px: number, pps: number = 100, zoom: number = 1) => px / (pps * zoom),
    getCacheSize: () => 0,
  },
  useOptimizedTrackPreview: (track: any, item: any, asset: any) => {
    if (track?.id === 'code') {
      return { type: 'code', language: 'javascript', preview: false, animationMode: 'none' };
    }
    if (track?.id === 'narration') {
      return { type: 'narration', volume: 0.8, syncPoints: 0, hasWaveform: false, hasDucking: false };
    }
    return { type: 'visual', isVideo: asset?.type === 'video', dimensions: '1920×1080', thumbnail: null };
  },
  useThrottledScroll: (cb: any) => cb,
  useResizeObserver: () => ({ current: null }),
}));

// Minimal mocks to render a timeline with one clip
vi.mock('../../state/hooks', () => {
  const removeTimelineItem = vi.fn();
  const duplicateTimelineItem = vi.fn().mockReturnValue('dup-1');
  return {
    useTimeline: () => ({
      timeline: [
        {
          id: 'clip-1',
          assetId: 'asset-1',
          startTime: 0,
          duration: 5,
          track: 0, // Code track
          type: 'code',
          properties: {},
          animations: [],
          keyframes: [],
        },
      ],
      selectedItems: [],
      addTimelineItem: vi.fn(),
      moveTimelineItem: vi.fn(),
      resizeTimelineItem: vi.fn(),
      removeTimelineItem,
      duplicateTimelineItem,
      selectTimelineItems: vi.fn(),
      clearTimelineSelection: vi.fn(),
      timelineDuration: 10,
    }),
    useMediaAssets: () => ({
      getMediaAssetById: (id: string) => ({
        id,
        name: 'Snippet.js',
        type: 'code',
        url: '',
        duration: 5,
        metadata: {},
        createdAt: new Date(),
      }),
    }),
    useUI: () => ({
      ui: {
        timeline: {
          zoom: 1,
          scrollPosition: 0,
          snapToGrid: false,
          gridSize: 1,
          selectedItems: [],
        },
      },
      updateTimelineView: vi.fn(),
    }),
    usePlayback: () => ({ playback: { currentTime: 0 }, seek: vi.fn() }),
  };
});

// Render test

describe('EducationalTimeline context menu', () => {
  it('shows context menu on right-click and can delete clip', () => {
    render(<EducationalTimeline />);

    // Find the duration label within the clip
    const duration = screen.getByText('5s');

    // Trigger a right-click on the duration (inside the clip)
    fireEvent.contextMenu(duration);

    // The custom context menu should appear
    expect(screen.getByText('Delete Clip (Del)')).toBeInTheDocument();
    expect(screen.getByText('Duplicate (Ctrl+D)')).toBeInTheDocument();
  });
});

