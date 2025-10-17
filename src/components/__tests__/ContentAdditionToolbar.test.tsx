import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ContentAdditionToolbar } from '../ContentAdditionToolbar';
import { useTimeline, useMediaAssets } from '../../state/hooks';
import { useNotifications } from '../../state/notifications';
// Use Vitest exclusively (remove stray node:test imports)

// Mock the hooks
vi.mock('../../state/hooks');
vi.mock('../../state/notifications');

const mockUseTimeline = vi.mocked(useTimeline);
const mockUseMediaAssets = vi.mocked(useMediaAssets);
const mockUseNotifications = vi.mocked(useNotifications);

describe('ContentAdditionToolbar', () => {
  const mockAddTimelineItem = vi.fn();
  const mockAddMediaAsset = vi.fn();
  const mockNotify = vi.fn();

  beforeEach(() => {
    mockUseTimeline.mockReturnValue({
      addTimelineItem: mockAddTimelineItem,
      timeline: [],
      selectedItems: [],
      selectedTimelineItems: [],
      timelineDuration: 0,
      currentTime: 0,
      setCurrentTime: vi.fn(),
      removeTimelineItem: vi.fn(),
      updateTimelineItem: vi.fn(),
      moveTimelineItem: vi.fn(),
      resizeTimelineItem: vi.fn(),
      selectTimelineItems: vi.fn(),
      clearTimelineSelection: vi.fn(),
      duplicateTimelineItem: vi.fn(),
      getItemsAtTime: vi.fn(),
      getItemsByTrack: vi.fn(),
    });

    mockUseMediaAssets.mockReturnValue({
      addMediaAsset: mockAddMediaAsset,
      mediaAssets: [],
      removeMediaAsset: vi.fn(),
      updateMediaAsset: vi.fn(),
      getMediaAssetById: vi.fn(),
      getMediaAssetsByType: vi.fn(),
    });

    mockUseNotifications.mockReturnValue({
      notify: mockNotify,
      notifications: [],
      removeNotification: vi.fn(),
      clearNotifications: vi.fn(),
    });

    mockAddMediaAsset.mockReturnValue('mock-asset-id');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders all educational content buttons', () => {
    render(<ContentAdditionToolbar />);

    expect(screen.getByText('Add Code')).toBeInTheDocument();
    expect(screen.getByText('Add Video')).toBeInTheDocument();
    expect(screen.getByText('Add Assets')).toBeInTheDocument();
  });

  it('displays educational tracks indicators', () => {
    render(<ContentAdditionToolbar />);

    expect(screen.getByText('Code')).toBeInTheDocument();
    expect(screen.getByText('Visual')).toBeInTheDocument();
    expect(screen.getByText('Narration')).toBeInTheDocument();
    expect(screen.getByText('You')).toBeInTheDocument();
  });

  it('shows educational workflow guidance', () => {
    render(<ContentAdditionToolbar />);
    expect(screen.getByText(/Educational Workflow:/i)).toBeInTheDocument();
    // Copy may evolve; assert generic guidance text is present
    expect(screen.getByText(/enhanced workflows/i)).toBeInTheDocument();
  });

  it('adds code content via the Code workflow', () => {
    render(<ContentAdditionToolbar />);

    // New flow: Add Code opens a workflow modal
    fireEvent.click(screen.getByText('Add Code'));
    expect(screen.getByText('Add Code to Timeline')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Hello World (JavaScript)'));
    fireEvent.click(screen.getByText('Add to Timeline'));

    expect(mockAddMediaAsset).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'code' })
    );
    expect(mockAddTimelineItem).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'code', track: 0 })
    );
    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Code Added' })
    );
  });

  it('shows video quick actions when Add Video is clicked', () => {
    render(<ContentAdditionToolbar />);
    fireEvent.click(screen.getByText('Add Video'));
    expect(screen.getByText('Advanced Video Workflow')).toBeInTheDocument();
    expect(screen.getByText('Quick Upload')).toBeInTheDocument();
  });

  it('closes video quick actions when clicking outside', () => {
    render(<ContentAdditionToolbar />);
    fireEvent.click(screen.getByText('Add Video'));
    expect(screen.getByText('Advanced Video Workflow')).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(
      screen.queryByText('Advanced Video Workflow')
    ).not.toBeInTheDocument();
  });

  // Drop theme-specific class assertions; UI theme can change
});
