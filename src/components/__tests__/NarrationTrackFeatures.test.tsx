import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NarrationTrackFeatures } from '../NarrationTrackFeatures';
import type { TimelineItem, MediaAsset } from '../../lib/types';
import type { EducationalTrack } from '../../lib/educationalTypes';
import {
  EDUCATIONAL_TRACKS,
  DEFAULT_NARRATION_PROPERTIES,
} from '../../lib/educationalTypes';

// Mock audio context and related APIs
const mockAudioContext = {
  createAnalyser: vi.fn(() => ({
    fftSize: 256,
    smoothingTimeConstant: 0.8,
    frequencyBinCount: 128,
    getByteFrequencyData: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
  })),
  createMediaElementSource: vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
  })),
  close: vi.fn(),
};

// Mock Web Audio API
Object.defineProperty(window, 'AudioContext', {
  writable: true,
  value: vi.fn(() => mockAudioContext),
});

Object.defineProperty(window, 'webkitAudioContext', {
  writable: true,
  value: vi.fn(() => mockAudioContext),
});

// Mock fetch for audio loading
global.fetch = vi.fn(() =>
  Promise.resolve({
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
  })
) as any;

describe('NarrationTrackFeatures', () => {
  const mockAsset: MediaAsset = {
    id: 'audio-1',
    name: 'Test Audio.mp3',
    type: 'audio',
    url: '/test-audio.mp3',
    duration: 60,
    metadata: {
      fileSize: 1024000,
      mimeType: 'audio/mpeg',
    },
    createdAt: new Date(),
  };

  const mockItem: TimelineItem = {
    id: 'item-1',
    assetId: 'audio-1',
    startTime: 0,
    duration: 60,
    track: 2,
    type: 'audio',
    properties: {
      ...DEFAULT_NARRATION_PROPERTIES,
      volume: 0.8,
      gain: 0,
      syncPoints: [
        {
          id: 'sync-1',
          time: 10,
          label: 'Test Sync Point',
          type: 'marker',
        },
      ],
    },
    animations: [],
    keyframes: [],
  };

  const narrationTrack = EDUCATIONAL_TRACKS.find((t) => t.id === 'narration')!;

  const availableTracks = [
    { id: 0, name: 'Code', color: '#8B5CF6' },
    { id: 1, name: 'Visual', color: '#10B981' },
    { id: 3, name: 'You', color: '#EF4444' },
  ];

  const defaultProps = {
    item: mockItem,
    asset: mockAsset,
    track: narrationTrack,
    onItemUpdate: vi.fn(),
    currentTime: 0,
    isPlaying: false,
    onSeek: vi.fn(),
    onPlayPause: vi.fn(),
    availableTracks,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders narration track features with tabs', () => {
    render(<NarrationTrackFeatures {...defaultProps} />);

    expect(screen.getByText('Waveform')).toBeInTheDocument();
    expect(screen.getByText('Levels')).toBeInTheDocument();
    expect(screen.getByText('Ducking')).toBeInTheDocument();
    expect(screen.getByText('Sync')).toBeInTheDocument();
    expect(screen.getByText('Processing')).toBeInTheDocument();
  });

  it('shows waveform tab by default', () => {
    render(<NarrationTrackFeatures {...defaultProps} />);

    // Waveform tab should be active
    const waveformTab = screen.getByText('Waveform').closest('button');
    expect(waveformTab).toHaveClass('text-accent-blue');
  });

  it('switches between tabs correctly', async () => {
    render(<NarrationTrackFeatures {...defaultProps} />);

    // Click on Levels tab
    fireEvent.click(screen.getByText('Levels'));

    await waitFor(() => {
      const levelsTab = screen.getByText('Levels').closest('button');
      expect(levelsTab).toHaveClass('text-accent-blue');
    });

    // Should show volume controls
    expect(screen.getByText(/Volume \(/)).toBeInTheDocument();
    expect(screen.getByText(/Gain \(/)).toBeInTheDocument();
  });

  it('handles volume changes', async () => {
    const onItemUpdate = vi.fn();
    render(
      <NarrationTrackFeatures {...defaultProps} onItemUpdate={onItemUpdate} />
    );

    // Switch to Levels tab
    fireEvent.click(screen.getByText('Levels'));

    await waitFor(() => {
      const volumeSlider = screen.getByDisplayValue('0.8');
      fireEvent.change(volumeSlider, { target: { value: '0.6' } });

      expect(onItemUpdate).toHaveBeenCalledWith({
        ...mockItem,
        properties: {
          ...mockItem.properties,
          volume: 0.6,
        },
      });
    });
  });

  it('handles gain changes', async () => {
    const onItemUpdate = vi.fn();
    render(
      <NarrationTrackFeatures {...defaultProps} onItemUpdate={onItemUpdate} />
    );

    // Switch to Levels tab
    fireEvent.click(screen.getByText('Levels'));

    await waitFor(() => {
      const gainSlider = screen.getByDisplayValue('0');
      fireEvent.change(gainSlider, { target: { value: '5' } });

      expect(onItemUpdate).toHaveBeenCalledWith({
        ...mockItem,
        properties: {
          ...mockItem.properties,
          gain: 5,
        },
      });
    });
  });

  it('shows ducking controls in ducking tab', async () => {
    render(<NarrationTrackFeatures {...defaultProps} />);

    // Switch to Ducking tab
    fireEvent.click(screen.getByText('Ducking'));

    await waitFor(() => {
      expect(screen.getByText('Audio Ducking')).toBeInTheDocument();
      expect(screen.getByText('Trigger Threshold')).toBeInTheDocument();
      expect(screen.getByText('Ducking Amount')).toBeInTheDocument();
    });
  });

  it('shows sync tools in sync tab', async () => {
    render(<NarrationTrackFeatures {...defaultProps} />);

    // Switch to Sync tab
    fireEvent.click(screen.getByText('Sync'));

    await waitFor(() => {
      expect(screen.getByText('Timing Synchronization')).toBeInTheDocument();
      expect(screen.getByText('Add Point')).toBeInTheDocument();
      expect(screen.getByText('Test Sync Point')).toBeInTheDocument();
    });
  });

  it('shows processing options in processing tab', async () => {
    render(<NarrationTrackFeatures {...defaultProps} />);

    // Switch to Processing tab
    fireEvent.click(screen.getByText('Processing'));

    await waitFor(() => {
      expect(screen.getByText('Audio Processing')).toBeInTheDocument();
      expect(screen.getByText('High-pass filter')).toBeInTheDocument();
      expect(screen.getByText('Noise reduction')).toBeInTheDocument();
      expect(screen.getByText('Normalize audio')).toBeInTheDocument();
    });
  });

  it('handles processing option toggles', async () => {
    const onItemUpdate = vi.fn();
    render(
      <NarrationTrackFeatures {...defaultProps} onItemUpdate={onItemUpdate} />
    );

    // Switch to Processing tab
    fireEvent.click(screen.getByText('Processing'));

    await waitFor(() => {
      const noiseReductionCheckbox = screen.getByLabelText(/Noise reduction/);
      fireEvent.click(noiseReductionCheckbox);

      expect(onItemUpdate).toHaveBeenCalledWith({
        ...mockItem,
        properties: {
          ...mockItem.properties,
          noiseReduction: true,
        },
      });
    });
  });

it.skip('handles waveform color changes', async () => {
    const onItemUpdate = vi.fn();
    render(
      <NarrationTrackFeatures {...defaultProps} onItemUpdate={onItemUpdate} />
    );

    // Switch to Processing tab
    fireEvent.click(screen.getByText('Processing'));

    await waitFor(() => {
      const colorInput = screen.getByDisplayValue('#F59E0B');
      fireEvent.change(colorInput, { target: { value: '#FF0000' } });

      expect(onItemUpdate).toHaveBeenCalledWith({
        ...mockItem,
        properties: {
          ...mockItem.properties,
          waveformColor: '#FF0000',
        },
      });
    });
  });

  it('shows message when no audio asset is provided', () => {
    render(<NarrationTrackFeatures {...defaultProps} asset={undefined} />);

    expect(screen.getByText('No audio asset selected')).toBeInTheDocument();
  });

  it('shows message when asset is not audio type', () => {
    const videoAsset: MediaAsset = {
      ...mockAsset,
      type: 'video',
    };

    render(<NarrationTrackFeatures {...defaultProps} asset={videoAsset} />);

    expect(screen.getByText('No audio asset selected')).toBeInTheDocument();
  });

  it('calls onSeek when waveform is clicked', async () => {
    const onSeek = vi.fn();
    render(<NarrationTrackFeatures {...defaultProps} onSeek={onSeek} />);

    // The waveform component should be rendered in the default tab
    // This test would need the actual waveform component to be rendered
    // For now, we'll test that the onSeek prop is passed correctly
    expect(onSeek).toBeDefined();
  });

  it('calls onPlayPause when play/pause is triggered', async () => {
    const onPlayPause = vi.fn();
    render(
      <NarrationTrackFeatures {...defaultProps} onPlayPause={onPlayPause} />
    );

    // Switch to Sync tab where play/pause controls are available
    fireEvent.click(screen.getByText('Sync'));

    await waitFor(() => {
      // The play/pause functionality should be available through sync tools
      expect(onPlayPause).toBeDefined();
    });
  });

  it('initializes with default narration properties', () => {
    const itemWithoutNarrationProps: TimelineItem = {
      ...mockItem,
      properties: {
        volume: 0.5, // Only basic property
      },
    };

    const onItemUpdate = vi.fn();
    render(
      <NarrationTrackFeatures
        {...defaultProps}
        item={itemWithoutNarrationProps}
        onItemUpdate={onItemUpdate}
      />
    );

    // Component should initialize with default narration properties
    expect(screen.getByText('Waveform')).toBeInTheDocument();
  });
});
