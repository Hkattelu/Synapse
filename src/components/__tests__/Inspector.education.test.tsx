import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { Inspector } from '../Inspector';

// Mock hooks used by Inspector
vi.mock('../../state/hooks', () => ({
  useTimeline: () => ({
    // Selected item on Narration (track 2) to exercise educational track badge
    selectedTimelineItems: [
      {
        id: 'timeline-1',
        assetId: 'asset-1',
        type: 'audio',
        startTime: 0,
        duration: 3,
        track: 2,
        properties: {},
        animations: [],
        keyframes: [],
      },
    ],
    updateTimelineItem: vi.fn(),
  }),
  useMediaAssets: () => ({
    getMediaAssetById: (id: string) =>
      id
        ? {
            id,
            name: 'Narration Clip',
            type: 'audio',
            url: 'blob:audio',
            metadata: { fileSize: 1024, mimeType: 'audio/mp3' },
            createdAt: new Date(),
          }
        : undefined,
  }),
}));

// Keep animation preset hooks quiet (not used in this test path but imported in Inspector)
vi.mock('../../remotion/animations/presets', () => ({
  getApplicablePresets: () => [],
  getRecommendedPresetsFor: () => [],
}));

// Minimal stubs for child components imported by Inspector but not under test
vi.mock('../animation/PresetSelector', () => ({
  PresetSelector: () => <div />,
}));
vi.mock('../ui/VisualControlsTabs', () => ({
  VisualControlsTabs: () => <div />,
}));
vi.mock('../ui/ThemePicker', () => ({
  ThemePicker: () => <div />,
}));

describe('Inspector - Educational track badge', () => {
  it('renders the educational track badge and details for the selected item', () => {
    render(<Inspector />);

    // Header exists
    expect(screen.getByText(/Inspector/i)).toBeInTheDocument();

    // Type badge for AUDIO should be present in header
    expect(screen.getByText('AUDIO')).toBeInTheDocument();

// Educational track badge should show Narration with colored badge
    expect(screen.getAllByText('Narration')[0]).toBeInTheDocument();

    // Badge has an educational track title tooltip
    expect(
      screen.getByTitle(/Educational Track: Narration/i)
    ).toBeInTheDocument();

    // Clip information should show the track number
    expect(screen.getAllByText(/Track\s+3/i)[0]).toBeInTheDocument();
  });
});
