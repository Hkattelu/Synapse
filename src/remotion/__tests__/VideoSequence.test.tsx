import React from 'react';
import { render } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { VideoSequence } from '../VideoSequence';
import type { VideoSequenceProps } from '../types';
import type { TimelineItem, MediaAsset } from '../../lib/types';

// Mock Remotion components
vi.mock('remotion', () => ({
  AbsoluteFill: ({ children, style }: any) => (
    <div style={style}>{children}</div>
  ),
  Sequence: ({ children, from, durationInFrames }: any) => (
    <div data-from={from} data-duration={durationInFrames}>
      {children}
    </div>
  ),
  Video: ({ src, volume, playbackRate, muted, style }: any) => (
    <video
      src={src}
      data-volume={volume}
      data-playback-rate={playbackRate}
      data-muted={muted}
      style={style}
    />
  ),
  Img: ({ src, style }: any) => <img src={src} style={style} alt="" />,
  Audio: ({ src, volume, playbackRate, muted }: any) => (
    <audio
      src={src}
      data-volume={volume}
      data-playback-rate={playbackRate}
      data-muted={muted}
    />
  ),
  staticFile: (path: string) => `/static/${path}`,
  useVideoConfig: () => ({ width: 1920, height: 1080, fps: 30 }),
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
  properties: {
    x: 100,
    y: 50,
    scale: 1.5,
    rotation: 45,
    opacity: 0.8,
    volume: 0.7,
    playbackRate: 1.2,
  },
  animations: [],
  muted: true,
};

const defaultProps: VideoSequenceProps = {
  item: mockTimelineItem,
  asset: mockMediaAsset,
  startFrame: 150, // 5 seconds * 30fps
  durationInFrames: 300, // 10 seconds * 30fps
};

describe('VideoSequence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders video asset correctly', () => {
    const { container } = render(<VideoSequence {...defaultProps} />);

    const sequence = container.querySelector('[data-from="150"]');
    expect(sequence).toBeInTheDocument();
    expect(sequence).toHaveAttribute('data-duration', '300');

    const video = container.querySelector('video');
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute('src', 'blob:test-url');
    expect(video).toHaveAttribute('data-volume', '0.7');
    expect(video).toHaveAttribute('data-playback-rate', '1.2');
    expect(video).toHaveAttribute('data-muted', 'true');
  });

  it('renders image asset correctly', () => {
    const imageAsset: MediaAsset = {
      ...mockMediaAsset,
      type: 'image',
      name: 'test-image.jpg',
    };

    const imageItem: TimelineItem = {
      ...mockTimelineItem,
      type: 'video', // Images are treated as video clips
    };

    const props: VideoSequenceProps = {
      ...defaultProps,
      item: imageItem,
      asset: imageAsset,
    };

    const { container } = render(<VideoSequence {...props} />);

    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'blob:test-url');
  });

  it('renders audio asset correctly', () => {
    const audioAsset: MediaAsset = {
      ...mockMediaAsset,
      type: 'audio',
      name: 'test-audio.mp3',
    };

    const audioItem: TimelineItem = {
      ...mockTimelineItem,
      type: 'audio',
    };

    const props: VideoSequenceProps = {
      ...defaultProps,
      item: audioItem,
      asset: audioAsset,
    };

    const { container } = render(<VideoSequence {...props} />);

    // Ensure the audio element from Remotion is rendered with correct attributes
    const audio = container.querySelector('audio');
    expect(audio).toBeInTheDocument();
    expect(audio).toHaveAttribute('src', 'blob:test-url');
  });

  it('renders code asset correctly', () => {
    const codeAsset: MediaAsset = {
      ...mockMediaAsset,
      type: 'code',
      name: 'example.js',
    };

    const codeItem: TimelineItem = {
      ...mockTimelineItem,
      type: 'code',
      properties: {
        ...mockTimelineItem.properties,
        text: 'console.log("Hello World");',
      },
    };

    const props: VideoSequenceProps = {
      ...defaultProps,
      item: codeItem,
      asset: codeAsset,
    };

    const { container } = render(<VideoSequence {...props} />);

    expect(container).toHaveTextContent('console.log("Hello World");');
    // Just verify the content is rendered, not specific styles
    expect(container.querySelector('pre')).toBeInTheDocument();
  });

  it('applies transform properties correctly', () => {
    const { container } = render(<VideoSequence {...defaultProps} />);

    const transformDiv = container.querySelector('div[style*="transform"]');
    expect(transformDiv).toHaveStyle({
      transform: 'translate(100px, 50px) scale(1.5) rotate(45deg)',
      opacity: '0.8',
    });
  });

  it('applies track-based positioning', () => {
    const itemOnTrack2: TimelineItem = {
      ...mockTimelineItem,
      track: 2,
      properties: {
        x: 0,
        y: 0,
      },
    };

    const props: VideoSequenceProps = {
      ...defaultProps,
      item: itemOnTrack2,
    };

    const { container } = render(<VideoSequence {...props} />);

    // Track 2 should be positioned at y = 2 * (1080/4) = 540px
    const transformDiv = container.querySelector('div[style*="transform"]');
    expect(transformDiv).toHaveStyle({
      transform: 'translate(0px, 540px) scale(1) rotate(0deg)',
    });
  });

  it('uses default values for missing properties', () => {
    const itemWithoutProperties: TimelineItem = {
      ...mockTimelineItem,
      properties: {},
    };

    const props: VideoSequenceProps = {
      ...defaultProps,
      item: itemWithoutProperties,
    };

    const { container } = render(<VideoSequence {...props} />);

    const transformDiv = container.querySelector('div[style*="transform"]');
    expect(transformDiv).toHaveStyle({
      transform: 'translate(0px, 0px) scale(1) rotate(0deg)',
      opacity: '1',
    });

    const video = container.querySelector('video');
    expect(video).toHaveAttribute('data-volume', '1');
    expect(video).toHaveAttribute('data-playback-rate', '1');
  });
});
