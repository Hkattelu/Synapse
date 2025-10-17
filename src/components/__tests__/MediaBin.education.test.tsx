import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MediaBin } from '../MediaBin';

// Mock suggestTrackPlacement to be deterministic
vi.mock('../../lib/educationalPlacement', () => ({
  suggestTrackPlacement: (asset: any) => ({
    suggestedTrack: {
      id: asset.type === 'audio' ? 'narration' : 'visual',
      name: asset.type === 'audio' ? 'Narration' : 'Visual',
      trackNumber: asset.type === 'audio' ? 2 : 1,
      color: asset.type === 'audio' ? '#F59E0B' : '#10B981',
      icon: asset.type === 'audio' ? 'mic' : 'monitor',
      defaultProperties: {},
      allowedContentTypes: [asset.type],
      suggestedAnimations: [],
    },
    confidence: 0.86,
    reason: 'Based on asset type',
    alternatives: [],
  }),
}));

// Mock hooks used by MediaBin
vi.mock('../../state/hooks', () => ({
  useMediaAssets: () => ({
    mediaAssets: [
      {
        id: 'asset-1',
        name: 'intro-voice.mp3',
        type: 'audio',
        url: 'blob:audio',
        duration: 1,
        thumbnail: undefined,
        metadata: { fileSize: 1024, mimeType: 'audio/mp3' },
        createdAt: new Date(),
      },
    ],
    addMediaAsset: vi.fn(),
    removeMediaAsset: vi.fn(),
  }),
  useTimeline: () => ({ addTimelineItem: vi.fn() }),
}));

// Notifications noop
vi.mock('../../state/notifications', () => ({
  useNotifications: () => ({ notify: vi.fn() }),
}));

// Child components not under test
vi.mock('../Waveform', () => ({
  AudioWaveform: () => <div data-testid="waveform" />,
}));
vi.mock('../MusicLibrary', () => ({
  MusicLibrary: () => <div data-testid="music-lib" />,
}));

describe('MediaBin - suggested educational track badges', () => {
  it('reflects educational categorization in counts and uses MusicLibrary for audio', () => {
    render(<MediaBin />);

    // The header select should show Audio (1) based on mocked assets
    expect(screen.getByText(/Audio \(1\)/)).toBeInTheDocument();

    // Selecting audio shows the MusicLibrary instead of the grid
    const filter = screen.getByTitle('Content Type');
    (filter as HTMLSelectElement).value = 'audio';
    filter.dispatchEvent(new Event('change', { bubbles: true }));
    expect(screen.getByTestId('music-lib')).toBeInTheDocument();
  });
});
