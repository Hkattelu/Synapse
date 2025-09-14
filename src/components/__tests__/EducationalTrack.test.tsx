import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EducationalTrack } from '../EducationalTrack';
import { EDUCATIONAL_TRACKS } from '../../lib/educationalTypes';
import type { TimelineItem } from '../../lib/types';

// Mock the hooks
vi.mock('../../state/hooks', () => ({
  useMediaAssets: () => ({
    getMediaAssetById: vi.fn((id: string) => ({
      id,
      name: `Test Asset ${id}`,
      type: 'code',
      url: 'test-url',
      metadata: {
        fileSize: 1000,
        mimeType: 'text/plain',
        codeContent: 'console.log("Hello World");',
        language: 'javascript',
      },
      createdAt: new Date(),
    })),
  }),
}));

// Force tracks to be considered visible and simplify breakpoints
vi.mock('../../lib/performanceOptimizations', () => ({
  useIntersectionObserver: () => [{ current: null }, true],
  useResponsiveBreakpoint: () => 'desktop',
  useOptimizedTrackPreview: (track: any, item: any, asset: any) => {
    if (track?.id === 'code') {
      return {
        type: 'code',
        language: 'javascript',
        preview: false,
        animationMode: 'none',
      };
    }
    if (track?.id === 'narration') {
      return {
        type: 'narration',
        volume: 0.8,
        syncPoints: 0,
        hasWaveform: false,
        hasDucking: false,
      };
    }
    if (track?.id === 'you') {
      return {
        type: 'you',
        isTalkingHead: true,
        corner: 'bottom-right',
      };
    }
    return {
      type: 'visual',
      isVideo: asset?.type === 'video',
      dimensions: '1920×1080',
      thumbnail: null,
    };
  },
}));

describe('EducationalTrack', () => {
  const mockTimeToPixels = vi.fn((time: number) => time * 100);
  const mockOnItemDrop = vi.fn();
  const mockOnItemMouseDown = vi.fn();

  const defaultProps = {
    track: EDUCATIONAL_TRACKS[0], // Code track
    items: [],
    isActive: false,
    trackHeight: 60,
    timeToPixels: mockTimeToPixels,
    onItemDrop: mockOnItemDrop,
    onItemMouseDown: mockOnItemMouseDown,
    selectedItems: [],
    dragState: {
      isDragging: false,
      itemId: null,
    },
    useVirtualization: false, // Use traditional rendering in tests
  } as const;

  const mockTimelineItem: TimelineItem = {
    id: 'test-item-1',
    assetId: 'test-asset-1',
    startTime: 0,
    duration: 5,
    track: 0,
    type: 'code',
    properties: {
      codeText: 'console.log("Hello World");',
      language: 'javascript',
    },
    animations: [],
    keyframes: [],
  };

  it('renders track container without header (header moved to timeline)', () => {
    const { container } = render(<EducationalTrack {...defaultProps} />);

    expect(container.querySelector('.educational-track')).toBeInTheDocument();
  });

  it('renders timeline items for the correct track', () => {
    const props = {
      ...defaultProps,
      items: [mockTimelineItem],
    };

    render(<EducationalTrack {...props} />);

    expect(screen.getByText('Test Asset test-asset-1')).toBeInTheDocument();
    expect(screen.getByText('5s')).toBeInTheDocument();
  });

  it('renders code track clip with asset name', () => {
    const props = {
      ...defaultProps,
      items: [mockTimelineItem],
    };

    render(<EducationalTrack {...props} />);

    // In simplified UI, language label and code preview may be hidden; assert asset name is shown
    expect(screen.getByText('Test Asset test-asset-1')).toBeInTheDocument();
  });

  it('renders visual track items', () => {
    const visualTrack = EDUCATIONAL_TRACKS.find((t) => t.id === 'visual')!;
    const visualItem: TimelineItem = {
      ...mockTimelineItem,
      id: 'visual-item',
      track: 1,
      type: 'video',
    };

    const props = {
      ...defaultProps,
      track: visualTrack,
      items: [visualItem],
    };

    const { container } = render(<EducationalTrack {...props} />);

    expect(container.querySelector('.educational-track')).toBeInTheDocument();
  });

  it('renders narration track with minimal label', () => {
    const narrationTrack = EDUCATIONAL_TRACKS.find(
      (t) => t.id === 'narration'
    )!;
    const audioItem: TimelineItem = {
      ...mockTimelineItem,
      id: 'audio-item',
      track: 2,
      type: 'audio',
      properties: {
        volume: 0.8,
      },
    };

    const props = {
      ...defaultProps,
      track: narrationTrack,
      items: [audioItem],
    };

    render(<EducationalTrack {...props} />);

    expect(screen.getByText('Narration')).toBeInTheDocument();
  });

  it('renders you track with talking head preview info', () => {
    const youTrack = EDUCATIONAL_TRACKS.find((t) => t.id === 'you')!;
    const personalVideoItem: TimelineItem = {
      ...mockTimelineItem,
      id: 'personal-video-item',
      track: 3,
      type: 'video',
      properties: {
        talkingHeadEnabled: true,
        talkingHeadCorner: 'bottom-right',
      },
    };

    const props = {
      ...defaultProps,
      track: youTrack,
      items: [personalVideoItem],
    };

    render(<EducationalTrack {...props} />);

    // Minimal label shows 'Talking Head' and optionally the position
    expect(screen.getByText('Talking Head')).toBeInTheDocument();
  });

  it('highlights selected items', () => {
    const props = {
      ...defaultProps,
      items: [mockTimelineItem],
      selectedItems: ['test-item-1'],
    };

    render(<EducationalTrack {...props} />);

    // Find the timeline clip container (the one with the border styling)
    const clipElement = screen
      .getByText('Test Asset test-asset-1')
      .closest('.absolute.rounded.cursor-move');
    expect(clipElement).toHaveClass('border-accent-yellow');
  });

  it('shows dragging state for items being dragged', () => {
    const props = {
      ...defaultProps,
      items: [mockTimelineItem],
      dragState: {
        isDragging: true,
        itemId: 'test-item-1',
      },
    };

    render(<EducationalTrack {...props} />);

    // Find the timeline clip container (the one with the border styling)
    const clipElement = screen
      .getByText('Test Asset test-asset-1')
      .closest('.absolute.rounded.cursor-move');
    expect(clipElement).toHaveClass('z-10');
  });

  it('applies correct track colors to clip elements', () => {
    const props = {
      ...defaultProps,
      items: [mockTimelineItem],
      selectedItems: [],
    };

    render(<EducationalTrack {...props} />);

    const clipElement = screen
      .getByText('Test Asset test-asset-1')
      .closest('.absolute.rounded.cursor-move') as HTMLElement;
    expect(clipElement).toBeInTheDocument();
    expect(clipElement).toHaveStyle({ backgroundColor: EDUCATIONAL_TRACKS[0].color });
  });
});
