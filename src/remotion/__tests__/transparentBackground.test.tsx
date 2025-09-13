import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MainComposition } from '../MainComposition';
import { CodeSequence } from '../CodeSequence';
import type { MainCompositionProps, CodeSequenceProps } from '../types';
import type { TimelineItem, MediaAsset, ExportSettings } from '../../lib/types';

// Mock Remotion hooks
vi.mock('remotion', () => ({
  AbsoluteFill: ({ children, style }: any) => (
    <div data-testid="absolute-fill" style={style}>
      {children}
    </div>
  ),
  Sequence: ({ children, from, durationInFrames }: any) => (
    <div
      data-testid="sequence"
      data-from={from}
      data-duration={durationInFrames}
    >
      {children}
    </div>
  ),
  useCurrentFrame: () => 0,
  useVideoConfig: () => ({ fps: 30, width: 1920, height: 1080 }),
  interpolate: (frame: number, input: number[], output: number[]) => output[0],
}));

// Mock BackgroundRenderer
vi.mock('../components/BackgroundRenderer', () => ({
  BackgroundRenderer: ({ config, style }: any) => (
    <div
      data-testid="background-renderer"
      data-config={JSON.stringify(config)}
      style={style}
    />
  ),
}));

// Mock theme manager
vi.mock('../../lib/themes', () => ({
  themeManager: {
    getTheme: () => ({
      colors: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        comment: '#6a9955',
        keyword: '#569cd6',
        string: '#ce9178',
        number: '#b5cea8',
        operator: '#d4d4d4',
        punctuation: '#d4d4d4',
        function: '#dcdcaa',
        variable: '#9cdcfe',
        type: '#4ec9b0',
        class: '#4ec9b0',
        constant: '#4fc1ff',
        property: '#9cdcfe',
        tag: '#569cd6',
        attribute: '#92c5f8',
        boolean: '#569cd6',
        regex: '#d16969',
        escape: '#d7ba7d',
        selection: '#264f78',
        lineHighlight: '#2a2d2e',
        cursor: '#d4d4d4',
        diffAdded: '#144212',
        diffRemoved: '#5a1e1e',
        diffModified: '#1e3a8a',
      },
    }),
    recordThemeUsage: vi.fn(),
  },
}));

// Mock other dependencies
vi.mock('diff', () => ({
  diffLines: () => [],
}));

vi.mock('../../lib/format', () => ({
  formatCode: (code: string) => Promise.resolve(code),
}));

vi.mock('prismjs', () => ({
  highlight: (code: string) => code,
  languages: { javascript: {} },
}));

vi.mock('../animations/useAnimationStyles', () => ({
  useAnimationStyles: () => ({}),
}));

vi.mock('../animations/useCodeContentEffects', () => ({
  parseActiveLines: () => ({ start: 1, end: 10 }),
  useTypewriterCount: () => 0,
}));

vi.mock('../animations/useDiffAnimations', () => ({
  useDiffAnimations: () => ({
    animatedHtml: 'console.log("test");',
    needsSpecialStyling: false,
  }),
}));

describe('Transparent Background Export', () => {
  const mockCodeItem: TimelineItem = {
    id: 'code-1',
    assetId: 'asset-1',
    startTime: 0,
    duration: 10,
    track: 0,
    type: 'code',
    properties: {
      codeText: 'console.log("Hello World");',
      language: 'javascript',
      theme: 'dark',
      backgroundType: 'gradient',
      backgroundGradient: {
        type: 'linear',
        colors: [
          { color: '#ff0000', position: 0 },
          { color: '#0000ff', position: 1 },
        ],
        angle: 45,
      },
    },
    animations: [],
    keyframes: [],
  };

  const mockMediaAssets: MediaAsset[] = [];

  describe('MainComposition', () => {
    it('should use transparent background when export settings specify it', () => {
      const exportSettings: ExportSettings = {
        format: 'mov',
        codec: 'h264',
        quality: 'high',
        audioCodec: 'aac',
        transparentBackground: true,
        includeWallpaper: false,
        includeGradient: false,
      };

      const props: MainCompositionProps = {
        timeline: [mockCodeItem],
        mediaAssets: mockMediaAssets,
        settings: {
          width: 1920,
          height: 1080,
          fps: 30,
          duration: 10,
          backgroundColor: '#000000',
        },
        exportSettings,
      };

      const { container } = render(<MainComposition {...props} />);

      const absoluteFill = container.querySelector(
        '[data-testid="absolute-fill"]'
      );
      expect(absoluteFill).toHaveStyle({
        'background-color': 'rgba(0, 0, 0, 0)',
      });
    });

    it('should use normal background when transparent export is disabled', () => {
      const exportSettings: ExportSettings = {
        format: 'mp4',
        codec: 'h264',
        quality: 'high',
        audioCodec: 'aac',
        transparentBackground: false,
      };

      const props: MainCompositionProps = {
        timeline: [mockCodeItem],
        mediaAssets: mockMediaAssets,
        settings: {
          width: 1920,
          height: 1080,
          fps: 30,
          duration: 10,
          backgroundColor: '#123456',
        },
        exportSettings,
      };

      const { container } = render(<MainComposition {...props} />);

      const absoluteFill = container.querySelector(
        '[data-testid="absolute-fill"]'
      );
      expect(absoluteFill).toHaveStyle({ backgroundColor: '#123456' });
    });
  });

  describe('CodeSequence', () => {
    it('should exclude gradient background when transparent export excludes gradients', () => {
      const exportSettings: ExportSettings = {
        format: 'mov',
        codec: 'h264',
        quality: 'high',
        audioCodec: 'aac',
        transparentBackground: true,
        includeWallpaper: true,
        includeGradient: false,
      };

      const props: CodeSequenceProps = {
        item: mockCodeItem,
        startFrame: 0,
        durationInFrames: 300,
        exportSettings,
      };

      const { container } = render(<CodeSequence {...props} />);

      // Should not render background when gradient is excluded
      const backgroundRenderer = container.querySelector(
        '[data-testid="background-renderer"]'
      );
      expect(backgroundRenderer).not.toBeInTheDocument();
    });

    it('should include gradient background when transparent export includes gradients', () => {
      const exportSettings: ExportSettings = {
        format: 'mov',
        codec: 'h264',
        quality: 'high',
        audioCodec: 'aac',
        transparentBackground: true,
        includeWallpaper: true,
        includeGradient: true,
      };

      const props: CodeSequenceProps = {
        item: mockCodeItem,
        startFrame: 0,
        durationInFrames: 300,
        exportSettings,
      };

      const { container } = render(<CodeSequence {...props} />);

      // Should render background when gradient is included
      const backgroundRenderer = container.querySelector(
        '[data-testid="background-renderer"]'
      );
      expect(backgroundRenderer).toBeInTheDocument();
    });

    it('should exclude wallpaper background when transparent export excludes wallpapers', () => {
      const wallpaperItem: TimelineItem = {
        ...mockCodeItem,
        properties: {
          ...mockCodeItem.properties,
          backgroundType: 'wallpaper',
          backgroundWallpaper: 'wallpaper-asset-id',
        },
      };

      const exportSettings: ExportSettings = {
        format: 'mov',
        codec: 'h264',
        quality: 'high',
        audioCodec: 'aac',
        transparentBackground: true,
        includeWallpaper: false,
        includeGradient: true,
      };

      const props: CodeSequenceProps = {
        item: wallpaperItem,
        startFrame: 0,
        durationInFrames: 300,
        exportSettings,
      };

      const { container } = render(<CodeSequence {...props} />);

      // Should not render background when wallpaper is excluded
      const backgroundRenderer = container.querySelector(
        '[data-testid="background-renderer"]'
      );
      expect(backgroundRenderer).not.toBeInTheDocument();
    });

    it('should use transparent container background when transparent export is enabled', () => {
      const exportSettings: ExportSettings = {
        format: 'mov',
        codec: 'h264',
        quality: 'high',
        audioCodec: 'aac',
        transparentBackground: true,
        includeWallpaper: false,
        includeGradient: false,
      };

      const props: CodeSequenceProps = {
        item: mockCodeItem,
        startFrame: 0,
        durationInFrames: 300,
        exportSettings,
      };

      const { container } = render(<CodeSequence {...props} />);

      // The container should have transparent background
      const absoluteFill = container.querySelector(
        '[data-testid="absolute-fill"]'
      );
      expect(absoluteFill).toHaveStyle({
        'background-color': 'rgba(0, 0, 0, 0)',
      });
    });

    it('should render normally when no export settings provided', () => {
      const props: CodeSequenceProps = {
        item: mockCodeItem,
        startFrame: 0,
        durationInFrames: 300,
      };

      const { container } = render(<CodeSequence {...props} />);

      // Should render background normally when no export settings
      const backgroundRenderer = container.querySelector(
        '[data-testid="background-renderer"]'
      );
      expect(backgroundRenderer).toBeInTheDocument();
    });
  });
});
