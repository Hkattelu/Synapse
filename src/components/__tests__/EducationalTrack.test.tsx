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
  };

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

  it('renders track header with correct name and icon', () => {
    render(<EducationalTrack {...defaultProps} />);

    expect(screen.getByText('Code')).toBeInTheDocument();
    expect(screen.getByText('Track 1')).toBeInTheDocument();
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

  it('renders code-specific preview for code track', () => {
    const props = {
      ...defaultProps,
      items: [mockTimelineItem],
    };

    render(<EducationalTrack {...props} />);

    expect(screen.getByText(/javascript/i)).toBeInTheDocument();
    // Code preview is tokenized; check textContent contains the expected snippet
    expect(
      screen.getAllByText(
        (content, element) =>
          element?.textContent?.includes('console.log("Hello World")') ?? false
      ).length
    ).toBeGreaterThan(0);
  });

  it('renders visual track with correct styling', () => {
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

    render(<EducationalTrack {...props} />);

    expect(screen.getByText('Visual')).toBeInTheDocument();
    expect(screen.getByText('Track 2')).toBeInTheDocument();
  });

  it('renders narration track with audio preview', () => {
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
    expect(screen.getByText('Audio • 80% vol')).toBeInTheDocument();
  });

  it('renders you track with talking head preview', () => {
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

    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByText('Talking Head')).toBeInTheDocument();
    expect(
      screen.getByText((content, element) => {
        return element?.textContent === '• bottom-right';
      })
    ).toBeInTheDocument();
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
    expect(clipElement).toHaveClass('opacity-75');
  });

  it('applies correct track colors', () => {
    render(<EducationalTrack {...defaultProps} />);

    const trackHeader = screen.getByText('Code').closest('div');
    expect(trackHeader).toHaveStyle({
      background: 'linear-gradient(135deg, #8B5CF6, #8B5CF6CC)',
    });
  });
});
