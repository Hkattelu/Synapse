import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VideoSequence } from '../VideoSequence';

// Mock remotion primitives used by VideoSequence
vi.mock('remotion', () => ({
  AbsoluteFill: ({ children, style }: any) => (
    <div data-testid="abs" style={style}>
      {children}
    </div>
  ),
  Sequence: ({ children }: any) => <div data-testid="seq">{children}</div>,
  Video: (props: any) => <video data-testid="video" {...props} />,
  Img: (props: any) => <img data-testid="img" {...props} />,
  useVideoConfig: () => ({ height: 1080 }),
}));

describe('VideoSequence - Talking head overlay', () => {
  it('renders talking head with a high z-index to appear on top', () => {
    const item: any = {
      id: 'v1',
      track: 0,
      type: 'video',
      properties: {
        talkingHeadEnabled: true,
        talkingHeadPosition: 'bottom-right',
      },
    };

    const asset: any = {
      type: 'video',
      url: 'http://example.com/video.mp4',
      name: 'video.mp4',
    };

    const { container } = render(
      <VideoSequence
        item={item}
        asset={asset}
        startFrame={0}
        durationInFrames={100}
      />
    );

    const videoEl = screen.getByTestId('video');
    const bubble = videoEl.parentElement as HTMLElement;
    expect(bubble).toBeTruthy();
    expect(bubble.style.zIndex).toBe('1000');
  });
});