import React from 'react';
import { render } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { MainComposition } from '../remotion/MainComposition';
import type { MainCompositionProps } from '../remotion/types';
import type { TimelineItem, MediaAsset } from '../lib/types';

// Mock Remotion components
vi.mock('remotion', () => ({
  AbsoluteFill: ({ children, style }: any) => <div style={style}>{children}</div>,
  useVideoConfig: () => ({
    fps: 30, // This is always 30 in the mock
    width: 1920,
    height: 1080,
    durationInFrames: 1800,
  }),
  Sequence: ({ children, from, durationInFrames }: any) => (
    <div data-from={from} data-duration={durationInFrames}>
      {children}
    </div>
  ),
  Video: ({ src }: any) => <video src={src} />,
  Img: ({ src }: unknown) => <img src={src} alt="" />,
}));

describe('Remotion Integration', () => {
  it('integrates React state with Remotion compositions', () => {
    // Mock data that would come from React state
    const mediaAssets: MediaAsset[] = [
      {
        id: 'video-1',
        name: 'intro.mp4',
        type: 'video',
        url: 'blob:video-url',
        duration: 15,
        metadata: { fileSize: 2048, mimeType: 'video/mp4' },
        createdAt: new Date(),
      },
      {
        id: 'image-1',
        name: 'logo.png',
        type: 'image',
        url: 'blob:image-url',
        metadata: { fileSize: 512, mimeType: 'image/png' },
        createdAt: new Date(),
      },
    ];

    const timeline: TimelineItem[] = [
      {
        id: 'clip-1',
        assetId: 'video-1',
        startTime: 0,
        duration: 10,
        track: 0,
        type: 'video',
        properties: { volume: 0.8 },
        animations: [],
      },
      {
        id: 'clip-2',
        assetId: 'image-1',
        startTime: 5,
        duration: 8,
        track: 1,
        type: 'video', // Images are treated as video clips
        properties: { scale: 1.2, opacity: 0.9 },
        animations: [],
      },
    ];

    const props: MainCompositionProps = {
      timeline,
      mediaAssets,
      settings: {
        width: 1920,
        height: 1080,
        fps: 30,
        duration: 20,
        backgroundColor: '#1a1a1a',
      },
    };

    const { container } = render(<MainComposition {...props} />);

    // Verify the composition renders with correct background
    expect(container.firstChild).toHaveStyle({
      backgroundColor: '#1a1a1a',
    });

    // Verify video sequence is rendered
    const videoSequence = container.querySelector('[data-from="0"]');
    expect(videoSequence).toBeInTheDocument();
    expect(videoSequence).toHaveAttribute('data-duration', '300'); // 10 seconds * 30fps

    // Verify image sequence is rendered
    const imageSequence = container.querySelector('[data-from="150"]');
    expect(imageSequence).toBeInTheDocument();
    expect(imageSequence).toHaveAttribute('data-duration', '240'); // 8 seconds * 30fps

    // Verify media elements are rendered
    expect(container.querySelector('video[src="blob:video-url"]')).toBeInTheDocument();
    expect(container.querySelector('img[src="blob:image-url"]')).toBeInTheDocument();
  });

  it('handles empty timeline gracefully', () => {
    const props: MainCompositionProps = {
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

    const { container } = render(<MainComposition {...props} />);

    // Should render background but no sequences
    expect(container.firstChild).toHaveStyle({
      backgroundColor: '#000000',
    });

    expect(container.querySelectorAll('[data-from]')).toHaveLength(0);
  });

  it('calculates frame timing correctly', () => {
    const timeline: TimelineItem[] = [
      {
        id: 'clip-1',
        assetId: 'asset-1',
        startTime: 2.5, // 2.5 seconds
        duration: 3.75, // 3.75 seconds
        track: 0,
        type: 'video',
        properties: {},
        animations: [],
      },
    ];

    const mediaAssets: MediaAsset[] = [
      {
        id: 'asset-1',
        name: 'test.mp4',
        type: 'video',
        url: 'blob:test',
        duration: 10,
        metadata: { fileSize: 1024, mimeType: 'video/mp4' },
        createdAt: new Date(),
      },
    ];

    const props: MainCompositionProps = {
      timeline,
      mediaAssets,
      settings: {
        width: 1920,
        height: 1080,
        fps: 24, // Different fps to test calculation
        duration: 10,
        backgroundColor: '#000000',
      },
    };

    const { container } = render(<MainComposition {...props} />);

    // Should calculate using mock fps of 30: startFrame = Math.round(2.5 * 30) = 75, duration = Math.round(3.75 * 30) = 112
    const allSequences = container.querySelectorAll('[data-from]');
    expect(allSequences).toHaveLength(1);
    
    const sequence = allSequences[0];
    expect(sequence).toHaveAttribute('data-from', '75');
    expect(sequence).toHaveAttribute('data-duration', '113');
  });
});