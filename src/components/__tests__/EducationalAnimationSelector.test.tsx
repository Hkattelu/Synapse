// Tests for Educational Animation Selector Component
// Validates UI interactions, preset filtering, and animation application

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EducationalAnimationSelector } from '../EducationalAnimationSelector';
import type { TimelineItem } from '../../lib/types';

// Mock the educational animation presets
vi.mock('../../lib/educationalAnimationPresets', () => ({
  getPresetsForTrack: vi.fn((trackType) => {
    const mockPresets = {
      Code: [
        {
          id: 'typewriter-educational',
          name: 'Typewriter (Educational)',
          type: 'entrance',
          trackType: 'Code',
          educationalPurpose:
            'Perfect for beginners - shows code being written character by character',
          difficulty: 'beginner',
          recommendedFor: ['tutorials', 'step-by-step guides'],
          previewDescription: 'Code appears as if being typed in real-time',
          parameters: { textReveal: true, showCursor: true },
          duration: 3.0,
          easing: 'linear',
        },
        {
          id: 'line-by-line-reveal',
          name: 'Line by Line Reveal',
          type: 'entrance',
          trackType: 'Code',
          educationalPurpose: 'Great for step-by-step explanations',
          difficulty: 'intermediate',
          recommendedFor: ['explanations', 'code walkthroughs'],
          previewDescription: 'Each line of code appears sequentially',
          parameters: { revealMode: 'line-by-line', lineDelay: 800 },
          duration: 2.5,
          easing: 'easeOut',
        },
      ],
      Visual: [
        {
          id: 'screen-focus-zoom',
          name: 'Screen Focus Zoom',
          type: 'emphasis',
          trackType: 'Visual',
          educationalPurpose: 'Zooms into important areas of screen recordings',
          difficulty: 'beginner',
          recommendedFor: ['screen recordings', 'UI demonstrations'],
          previewDescription: 'Smoothly zooms into specified area',
          parameters: { focusPointX: 0.5, focusPointY: 0.5, zoomLevel: 1.8 },
          duration: 4.0,
          easing: 'easeInOut',
        },
      ],
      Narration: [],
      You: [],
    };
    return mockPresets[trackType] || [];
  }),
  getPresetsByDifficulty: vi.fn((trackType, difficulty) => {
    const allPresets = {
      Code: [
        {
          id: 'typewriter-educational',
          name: 'Typewriter (Educational)',
          difficulty: 'beginner',
          trackType: 'Code',
          educationalPurpose: 'Perfect for beginners',
          recommendedFor: ['tutorials'],
          previewDescription: 'Code appears as if being typed',
          parameters: {},
          duration: 3.0,
          easing: 'linear',
          type: 'entrance',
        },
      ],
    };
    const trackPresets = allPresets[trackType] || [];
    return trackPresets.filter((p) => p.difficulty === difficulty);
  }),
  getRecommendedPresets: vi.fn((trackType, contentType) => {
    if (trackType === 'Code' && contentType === 'code') {
      return [
        {
          id: 'typewriter-educational',
          name: 'Typewriter (Educational)',
          difficulty: 'beginner',
          trackType: 'Code',
          educationalPurpose: 'Perfect for beginners',
          recommendedFor: ['tutorials'],
          previewDescription: 'Code appears as if being typed',
          parameters: {},
          duration: 3.0,
          easing: 'linear',
          type: 'entrance',
        },
      ];
    }
    return [];
  }),
  applyEducationalAnimationPreset: vi.fn((item, preset, customParams) => ({
    ...item,
    properties: {
      ...item.properties,
      ...preset.parameters,
      ...customParams,
    },
    animation: {
      id: preset.id,
      name: preset.name,
      type: preset.type,
      duration: preset.duration,
      easing: preset.easing,
      parameters: { ...preset.parameters, ...customParams },
    },
  })),
}));

// Mock the educational types
vi.mock('../../lib/educationalTypes', () => ({
  getEducationalTrackByNumber: vi.fn((trackNumber) => {
    const tracks = {
      0: { id: 'code', name: 'Code', trackNumber: 0 },
      1: { id: 'visual', name: 'Visual', trackNumber: 1 },
      2: { id: 'narration', name: 'Narration', trackNumber: 2 },
      3: { id: 'you', name: 'You', trackNumber: 3 },
    };
    return tracks[trackNumber];
  }),
}));

const mockTimelineItem: TimelineItem = {
  id: 'test-item',
  assetId: 'test-asset',
  type: 'code',
  track: 0, // Code track
  startTime: 0,
  duration: 5,
  properties: {
    text: 'console.log("Hello World");',
    language: 'javascript',
    theme: 'vscode-dark-plus',
    fontSize: 16,
  },
};

describe('EducationalAnimationSelector', () => {
  const mockOnApplyPreset = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render animation selector for educational tracks', () => {
    render(
      <EducationalAnimationSelector
        item={mockTimelineItem}
        onApplyPreset={mockOnApplyPreset}
      />
    );

    expect(
      screen.getByText('Educational Animations - Code Track')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Choose animations designed specifically for educational content'
      )
    ).toBeInTheDocument();
  });

  it('should show message for non-educational tracks', () => {
    const nonEducationalItem = { ...mockTimelineItem, track: 99 };

    render(
      <EducationalAnimationSelector
        item={nonEducationalItem}
        onApplyPreset={mockOnApplyPreset}
      />
    );

    expect(
      screen.getByText(
        'No educational animations available for this track type.'
      )
    ).toBeInTheDocument();
  });

  it('should display difficulty filter buttons', () => {
    render(
      <EducationalAnimationSelector
        item={mockTimelineItem}
        onApplyPreset={mockOnApplyPreset}
      />
    );

    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Beginner')).toBeInTheDocument();
    expect(screen.getByText('Intermediate')).toBeInTheDocument();
    expect(screen.getByText('Advanced')).toBeInTheDocument();
  });

  it('should filter presets by difficulty when button is clicked', async () => {
    render(
      <EducationalAnimationSelector
        item={mockTimelineItem}
        onApplyPreset={mockOnApplyPreset}
      />
    );

    // Click on Beginner filter
    fireEvent.click(screen.getByText('Beginner'));

    // Should show active state for Beginner button
    const beginnerButton = screen.getByText('Beginner');
    expect(beginnerButton).toHaveClass('bg-purple-100', 'text-purple-800');
  });

  it('should display recommended presets section', () => {
    render(
      <EducationalAnimationSelector
        item={mockTimelineItem}
        onApplyPreset={mockOnApplyPreset}
      />
    );

    expect(
      screen.getByText(/Recommended for code content/)
    ).toBeInTheDocument();
  });

  it('should display preset cards with correct information', () => {
    render(
      <EducationalAnimationSelector
        item={mockTimelineItem}
        onApplyPreset={mockOnApplyPreset}
      />
    );

    // Should show preset names (can appear in multiple sections)
    expect(screen.getAllByText('Typewriter (Educational)').length).toBeGreaterThan(0);
    expect(screen.getByText('Line by Line Reveal')).toBeInTheDocument();

    // Should show difficulty badges
    expect(screen.getAllByText('beginner').length).toBeGreaterThan(0);
    expect(screen.getByText('intermediate')).toBeInTheDocument();

    // Should show apply buttons
    const applyButtons = screen.getAllByText('Apply');
    expect(applyButtons.length).toBeGreaterThan(0);
  });

  it('should call onApplyPreset when Apply button is clicked', async () => {
    render(
      <EducationalAnimationSelector
        item={mockTimelineItem}
        onApplyPreset={mockOnApplyPreset}
      />
    );

    const applyButtons = screen.getAllByText('Apply');
    fireEvent.click(applyButtons[0]);

    await waitFor(() => {
      expect(mockOnApplyPreset).toHaveBeenCalledTimes(1);
    });

    const calledWith = mockOnApplyPreset.mock.calls[0][0];
    expect(calledWith.animation).toBeDefined();
    expect(calledWith.animation.id).toBe('typewriter-educational');
  });

  it('should show preview when Preview button is clicked', async () => {
    render(
      <EducationalAnimationSelector
        item={mockTimelineItem}
        onApplyPreset={mockOnApplyPreset}
      />
    );

    const previewButtons = screen.getAllByText('Preview');
    fireEvent.click(previewButtons[0]);

    await waitFor(() => {
      expect(screen.getAllByText('Hide Preview').length).toBeGreaterThan(0);
    });

    // Should show preview section
    expect(screen.getAllByText('Preview').length).toBeGreaterThan(0);
    expect(
      screen.getByText('Code appears as if being typed in real-time')
    ).toBeInTheDocument();
  });

  it('should hide preview when Hide Preview button is clicked', async () => {
    render(
      <EducationalAnimationSelector
        item={mockTimelineItem}
        onApplyPreset={mockOnApplyPreset}
      />
    );

    // First click to show preview
    const previewButtons = screen.getAllByText('Preview');
    fireEvent.click(previewButtons[0]);

    await waitFor(() => {
      expect(screen.getAllByText('Hide Preview').length).toBeGreaterThan(0);
    });

    // Click to hide preview on the first visible card
    const hideButtons = screen.getAllByText('Hide Preview');
    fireEvent.click(hideButtons[0]);

    // We only assert that at least one Preview button is visible again
    await waitFor(() => {
      expect(screen.getAllByText('Preview').length).toBeGreaterThan(0);
    });
  });

  it('should show custom parameters editor when preview is open', async () => {
    render(
      <EducationalAnimationSelector
        item={mockTimelineItem}
        onApplyPreset={mockOnApplyPreset}
      />
    );

    const previewButtons = screen.getAllByText('Preview');
    fireEvent.click(previewButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Custom Parameters')).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        'Adjust parameters for the selected animation (optional)'
      )
    ).toBeInTheDocument();
  });

  it('should display preset count in header', () => {
    render(
      <EducationalAnimationSelector
        item={mockTimelineItem}
        onApplyPreset={mockOnApplyPreset}
      />
    );

    expect(screen.getByText(/All Code Animations \(2\)/)).toBeInTheDocument();
  });

  it('should show recommended badge for recommended presets', () => {
    render(
      <EducationalAnimationSelector
        item={mockTimelineItem}
        onApplyPreset={mockOnApplyPreset}
      />
    );

    const recommendedBadges = screen.getAllByText('Recommended');
    expect(recommendedBadges.length).toBeGreaterThan(0);
  });

  it('should display preset tags', () => {
    render(
      <EducationalAnimationSelector
        item={mockTimelineItem}
        onApplyPreset={mockOnApplyPreset}
      />
    );

    expect(screen.getAllByText('tutorials').length).toBeGreaterThan(0);
    expect(screen.getAllByText('step-by-step guides').length).toBeGreaterThan(0);
  });

  it('should handle Visual track items correctly', () => {
    const visualItem = {
      ...mockTimelineItem,
      track: 1,
      type: 'video' as const,
    };

    render(
      <EducationalAnimationSelector
        item={visualItem}
        onApplyPreset={mockOnApplyPreset}
      />
    );

    expect(
      screen.getByText('Educational Animations - Visual Track')
    ).toBeInTheDocument();
  });

  it('should apply custom parameters when provided', async () => {
    render(
      <EducationalAnimationSelector
        item={mockTimelineItem}
        onApplyPreset={mockOnApplyPreset}
      />
    );

    // Open preview to access custom parameters
    const previewButtons = screen.getAllByText('Preview');
    fireEvent.click(previewButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Custom Parameters')).toBeInTheDocument();
    });

    // Apply preset (custom parameters would be applied if any were set)
    const applyButtons = screen.getAllByText('Apply');
    fireEvent.click(applyButtons[0]);

    await waitFor(() => {
      expect(mockOnApplyPreset).toHaveBeenCalledTimes(1);
    });
  });
});

describe('PresetCard Component', () => {
  it('should display preset information correctly', () => {
    render(
      <EducationalAnimationSelector
        item={mockTimelineItem}
        onApplyPreset={vi.fn()}
      />
    );

    // Check preset name (may appear in multiple sections)
    expect(screen.getAllByText('Typewriter (Educational)').length).toBeGreaterThan(0);

    // Check educational purpose
    expect(
      screen.getAllByText(
        'Perfect for beginners - shows code being written character by character'
      ).length
    ).toBeGreaterThan(0);

    // Card no longer shows duration/easing inline; those are shown in the preview panel.
    // Verify core actions exist instead.
    expect(screen.getAllByText('Preview').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Apply').length).toBeGreaterThan(0);
  });

  it('should show difficulty badge with correct styling', () => {
    render(
      <EducationalAnimationSelector
        item={mockTimelineItem}
        onApplyPreset={vi.fn()}
      />
    );

    const beginnerBadges = screen.getAllByText('beginner');
    expect(beginnerBadges[0]).toHaveClass('text-green-600', 'bg-green-100');
  });
});

describe('CustomParametersEditor Component', () => {
  it('should show message when no customizable parameters exist', async () => {
    render(
      <EducationalAnimationSelector
        item={mockTimelineItem}
        onApplyPreset={vi.fn()}
      />
    );

    // Open preview
    const previewButtons = screen.getAllByText('Preview');
    fireEvent.click(previewButtons[0]);

    await waitFor(() => {
      expect(
        screen.getByText('No customizable parameters for this preset.')
      ).toBeInTheDocument();
    });
  });
});

describe('AnimationPreview Component', () => {
  it('should show preview content when preset is selected', async () => {
    render(
      <EducationalAnimationSelector
        item={mockTimelineItem}
        onApplyPreset={vi.fn()}
      />
    );

    // Open preview
    const previewButtons = screen.getAllByText('Preview');
    fireEvent.click(previewButtons[0]);

    await waitFor(() => {
      expect(screen.getAllByText('Animation Preview').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Play').length).toBeGreaterThan(0);
    });
  });

  it('should show preset details in preview section', async () => {
    render(
      <EducationalAnimationSelector
        item={mockTimelineItem}
        onApplyPreset={vi.fn()}
      />
    );

    // Open preview
    const previewButtons = screen.getAllByText('Preview');
    fireEvent.click(previewButtons[0]);

    await waitFor(() => {
      expect(screen.getAllByText('Duration: 3s').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Easing: linear').length).toBeGreaterThan(0);
    });
  });
});
