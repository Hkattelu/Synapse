import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
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
  it('shows badge with suggested track for media assets', () => {
render(<MediaBin />);

// Switch filter to You to avoid MusicLibrary replacing grid for audio
    const filter = screen.getByTitle('Content Type');
    (filter as HTMLSelectElement).value = 'you';
    filter.dispatchEvent(new Event('change', { bubbles: true }));

    // Since our mocked asset is audio, the grid may hide it under MusicLibrary when 'audio' is selected.
    // For this test, assert that the suggested track badge logic is wired by checking the badge title exists somewhere.
    const badge = screen.getByTitle(/Suggested Track: Narration/i);
    expect(badge).toBeInTheDocument();

    // Badge should be present with title containing suggestion details
    const badge = screen.getByTitle(/Suggested Track: Narration/i);
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Narration');
  });
});
