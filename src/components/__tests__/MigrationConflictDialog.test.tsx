// Tests for migration conflict dialog components

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
  MigrationConflictDialog,
  MigrationPreviewDialog,
} from '../MigrationConflictDialog';
import type {
  MigrationConflict,
  EducationalTrack,
} from '../../lib/educationalTypes';
import { EDUCATIONAL_TRACKS } from '../../lib/educationalTypes';
import { beforeEach } from 'node:test';
import { beforeEach } from 'node:test';

// Mock data
const mockConflicts: MigrationConflict[] = [
  {
    itemId: 'item-1',
    currentTrack: 0,
    suggestedTrack: EDUCATIONAL_TRACKS[0], // Code track
    reason: 'Content appears to be code-related',
    alternatives: [EDUCATIONAL_TRACKS[1], EDUCATIONAL_TRACKS[2]], // Visual and Narration tracks
  },
  {
    itemId: 'item-2',
    currentTrack: 1,
    suggestedTrack: EDUCATIONAL_TRACKS[2], // Narration track
    reason: 'Audio content detected',
    alternatives: [EDUCATIONAL_TRACKS[3]], // You track
  },
];

const mockStatistics = {
  totalItems: 5,
  itemsByTrack: {
    Code: 2,
    Visual: 1,
    Narration: 1,
    You: 1,
  },
  itemsByType: {
    code: 2,
    video: 2,
    audio: 1,
    title: 0,
    'visual-asset': 0,
  },
  averageConfidence: 85,
  conflictCount: 2,
};

describe('MigrationConflictDialog', () => {
  const mockOnResolve = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render conflict dialog when open', () => {
    render(
      <MigrationConflictDialog
        conflicts={mockConflicts}
        onResolve={mockOnResolve}
        onCancel={mockOnCancel}
        isOpen={true}
      />
    );

    expect(screen.getByText('Resolve Migration Conflicts')).toBeInTheDocument();
    expect(screen.getByText('Timeline Item #1')).toBeInTheDocument();
    expect(screen.getByText('Timeline Item #2')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(
      <MigrationConflictDialog
        conflicts={mockConflicts}
        onResolve={mockOnResolve}
        onCancel={mockOnCancel}
        isOpen={false}
      />
    );

    expect(
      screen.queryByText('Resolve Migration Conflicts')
    ).not.toBeInTheDocument();
  });

  it('should display conflict details correctly', () => {
    render(
      <MigrationConflictDialog
        conflicts={mockConflicts}
        onResolve={mockOnResolve}
        onCancel={mockOnCancel}
        isOpen={true}
      />
    );

    // Check first conflict
    expect(
      screen.getByText('Content appears to be code-related')
    ).toBeInTheDocument();
    expect(screen.getByText('Code Track (Recommended)')).toBeInTheDocument();
    expect(screen.getByText('Currently on Track 1')).toBeInTheDocument();

    // Check second conflict
    expect(screen.getByText('Audio content detected')).toBeInTheDocument();
    expect(
      screen.getByText('Narration Track (Recommended)')
    ).toBeInTheDocument();
    expect(screen.getByText('Currently on Track 2')).toBeInTheDocument();
  });

  it('should show alternative tracks', () => {
    render(
      <MigrationConflictDialog
        conflicts={mockConflicts}
        onResolve={mockOnResolve}
        onCancel={mockOnCancel}
        isOpen={true}
      />
    );

    expect(screen.getAllByText('Alternative Options:')).toHaveLength(2);
    expect(screen.getByText('Visual Track')).toBeInTheDocument();
  });

  it('should allow track selection', async () => {
    render(
      <MigrationConflictDialog
        conflicts={mockConflicts}
        onResolve={mockOnResolve}
        onCancel={mockOnCancel}
        isOpen={true}
      />
    );

    // Click on an alternative track for the first conflict
    const visualTrackButton = screen.getAllByText('Visual Track')[0];
    const overrideButton = visualTrackButton
      .closest('.bg-gray-50')
      ?.querySelector('button');

    if (overrideButton) {
      fireEvent.click(overrideButton);
    }

    // Apply resolutions
    const applyButton = screen.getByText('Apply Resolutions');
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(mockOnResolve).toHaveBeenCalledWith([
        {
          conflictId: 'item-1',
          selectedTrack: EDUCATIONAL_TRACKS[1], // Visual track
          userOverride: true,
        },
        {
          conflictId: 'item-2',
          selectedTrack: EDUCATIONAL_TRACKS[2], // Narration track (default)
          userOverride: false,
        },
      ]);
    });
  });

  it('should handle cancel action', () => {
    render(
      <MigrationConflictDialog
        conflicts={mockConflicts}
        onResolve={mockOnResolve}
        onCancel={mockOnCancel}
        isOpen={true}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should show all available tracks section', () => {
    render(
      <MigrationConflictDialog
        conflicts={mockConflicts}
        onResolve={mockOnResolve}
        onCancel={mockOnCancel}
        isOpen={true}
      />
    );

    expect(screen.getAllByText('All Available Tracks:')).toHaveLength(2);

    // Should show all 4 educational tracks
    EDUCATIONAL_TRACKS.forEach((track) => {
      expect(screen.getAllByText(track.name).length).toBeGreaterThan(0);
    });
  });

  it('should display conflict count', () => {
    render(
      <MigrationConflictDialog
        conflicts={mockConflicts}
        onResolve={mockOnResolve}
        onCancel={mockOnCancel}
        isOpen={true}
      />
    );

    expect(screen.getByText('2 conflicts to resolve')).toBeInTheDocument();
  });
});

describe('MigrationPreviewDialog', () => {
  const mockOnProceed = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render preview dialog when open', () => {
    render(
      <MigrationPreviewDialog
        projectName="Test Project"
        statistics={mockStatistics}
        onProceed={mockOnProceed}
        onCancel={mockOnCancel}
        isOpen={true}
      />
    );

    expect(screen.getByText('Migration Preview')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Preview how "Test Project" will be migrated to educational tracks'
      )
    ).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(
      <MigrationPreviewDialog
        projectName="Test Project"
        statistics={mockStatistics}
        onProceed={mockOnProceed}
        onCancel={mockOnCancel}
        isOpen={false}
      />
    );

    expect(screen.queryByText('Migration Preview')).not.toBeInTheDocument();
  });

  it('should display statistics correctly', () => {
    render(
      <MigrationPreviewDialog
        projectName="Test Project"
        statistics={mockStatistics}
        onProceed={mockOnProceed}
        onCancel={mockOnCancel}
        isOpen={true}
      />
    );

    expect(screen.getByText('5')).toBeInTheDocument(); // Total items
    expect(screen.getByText('Total Items')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument(); // Average confidence
    expect(screen.getByText('Avg. Confidence')).toBeInTheDocument();
  });

  it('should show items by track', () => {
    render(
      <MigrationPreviewDialog
        projectName="Test Project"
        statistics={mockStatistics}
        onProceed={mockOnProceed}
        onCancel={mockOnCancel}
        isOpen={true}
      />
    );

    expect(screen.getByText('Items by Educational Track')).toBeInTheDocument();
    expect(screen.getByText('2 items')).toBeInTheDocument(); // Code track
    expect(screen.getAllByText('1 items')).toHaveLength(3); // Other tracks (Visual, Narration, You)
  });

  it('should show conflict warning when conflicts exist', () => {
    render(
      <MigrationPreviewDialog
        projectName="Test Project"
        statistics={mockStatistics}
        onProceed={mockOnProceed}
        onCancel={mockOnCancel}
        isOpen={true}
      />
    );

    expect(screen.getByText('2 conflicts detected')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Some items require manual track assignment and will need your review.'
      )
    ).toBeInTheDocument();
  });

  it('should not show conflict warning when no conflicts', () => {
    const statsWithoutConflicts = { ...mockStatistics, conflictCount: 0 };

    render(
      <MigrationPreviewDialog
        projectName="Test Project"
        statistics={statsWithoutConflicts}
        onProceed={mockOnProceed}
        onCancel={mockOnCancel}
        isOpen={true}
      />
    );

    expect(screen.queryByText('conflicts detected')).not.toBeInTheDocument();
  });

  it('should show different button text based on conflicts', () => {
    const { rerender } = render(
      <MigrationPreviewDialog
        projectName="Test Project"
        statistics={mockStatistics}
        onProceed={mockOnProceed}
        onCancel={mockOnCancel}
        isOpen={true}
      />
    );

    expect(screen.getByText('Proceed with Migration')).toBeInTheDocument();

    // Rerender without conflicts
    const statsWithoutConflicts = { ...mockStatistics, conflictCount: 0 };
    rerender(
      <MigrationPreviewDialog
        projectName="Test Project"
        statistics={statsWithoutConflicts}
        onProceed={mockOnProceed}
        onCancel={mockOnCancel}
        isOpen={true}
      />
    );

    expect(screen.getByText('Migrate Project')).toBeInTheDocument();
  });

  it('should handle proceed action', () => {
    render(
      <MigrationPreviewDialog
        projectName="Test Project"
        statistics={mockStatistics}
        onProceed={mockOnProceed}
        onCancel={mockOnCancel}
        isOpen={true}
      />
    );

    const proceedButton = screen.getByText('Proceed with Migration');
    fireEvent.click(proceedButton);

    expect(mockOnProceed).toHaveBeenCalled();
  });

  it('should handle cancel action', () => {
    render(
      <MigrationPreviewDialog
        projectName="Test Project"
        statistics={mockStatistics}
        onProceed={mockOnProceed}
        onCancel={mockOnCancel}
        isOpen={true}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should display migration information', () => {
    render(
      <MigrationPreviewDialog
        projectName="Test Project"
        statistics={mockStatistics}
        onProceed={mockOnProceed}
        onCancel={mockOnCancel}
        isOpen={true}
      />
    );

    expect(
      screen.getByText('What happens during migration:')
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Timeline items will be automatically assigned/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Track-specific default properties will be applied/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Your existing properties and animations will be preserved/
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(/A backup will be created for rollback/)
    ).toBeInTheDocument();
  });
});
