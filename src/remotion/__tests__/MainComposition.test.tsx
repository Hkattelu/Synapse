import React from 'react';
import { render } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MainComposition } from '../MainComposition';
import type { MainCompositionProps } from '../types';
import type { TimelineItem, MediaAsset } from '../../lib/types';

// Mock Remotion hooks and components
vi.mock('remotion', () => ({
  AbsoluteFill: ({ children, style }: any) => <div style={style}>{children}</div>,
  useVideoConfig: () => ({
    fps: 30,
    width: 1920,
    height: 1080,
    durationInFrames: 1800,
  }),
}));

// Mock VideoSequence component
vi.mock('../VideoSequence', () => ({
  VideoSequence: ({ item, asset }: any) => (
    <div data-testid={`video-sequence-${item.id}`}>
      {asset.name} - {item.type}
    </div>
  ),
}));

const mockMediaAsset: MediaAsset = {
  id: 'asset-1',
  name: 'test-video.mp4',
  type: 'video',
  url: 'blob:test-url',
  duration: 10,
  metadata: {
    fileSize: 1024,
    mimeType: 'video/mp4',
  },
  createdAt: new Date(),
};

const mockTimelineItem: TimelineItem = {
  id: 'item-1',
  assetId: 'asset-1',
  startTime: 5,
  duration: 10,
  track: 0,
  type: 'video',
  properties: {},
  animations: [],
};

const defaultProps: MainCompositionProps = {
  timeline: [],
  mediaAssets: [],
  settings: {
    width: 1920,
    height: 1080,
    fps: 30,
    duration: 60,
    backgroundColor: '#000000',
  },
};

describe('MainComposition', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with empty timeline', () => {
    const { container } = render(<MainComposition {...defaultProps} />);
    
    expect(container.firstChild).toHaveStyle({
      backgroundColor: '#000000',
    });
  });

  it('renders timeline items as video sequences', () => {
    const props: MainCompositionProps = {
      ...defaultProps,
      timeline: [mockTimelineItem],
      mediaAssets: [mockMediaAsset],
    };

    const { getByTestId } = render(<MainComposition {...props} />);
    
    expect(getByTestId('video-sequence-item-1')).toBeInTheDocument();
    expect(getByTestId('video-sequence-item-1')).toHaveTextContent('test-video.mp4 - video');
  });

  it('filters out timeline items without matching assets', () => {
    const props: MainCompositionProps = {
      ...defaultProps,
      timeline: [mockTimelineItem],
      mediaAssets: [], // No matching asset
    };

    const { queryByTestId } = render(<MainComposition {...props} />);
    
    expect(queryByTestId('video-sequence-item-1')).not.toBeInTheDocument();
  });

  it('renders multiple timeline items', () => {
    const secondAsset: MediaAsset = {
      ...mockMediaAsset,
      id: 'asset-2',
      name: 'test-audio.mp3',
      type: 'audio',
    };

    const secondItem: TimelineItem = {
      ...mockTimelineItem,
      id: 'item-2',
      assetId: 'asset-2',
      type: 'audio',
    };

    const props: MainCompositionProps = {
      ...defaultProps,
      timeline: [mockTimelineItem, secondItem],
      mediaAssets: [mockMediaAsset, secondAsset],
    };

    const { getByTestId } = render(<MainComposition {...props} />);
    
    expect(getByTestId('video-sequence-item-1')).toBeInTheDocument();
    expect(getByTestId('video-sequence-item-2')).toBeInTheDocument();
  });

  it('applies background color from settings', () => {
    const props: MainCompositionProps = {
      ...defaultProps,
      settings: {
        ...defaultProps.settings,
        backgroundColor: '#ff0000',
      },
    };

    const { container } = render(<MainComposition {...props} />);
    
    expect(container.firstChild).toHaveStyle({
      backgroundColor: '#ff0000',
    });
  });
});