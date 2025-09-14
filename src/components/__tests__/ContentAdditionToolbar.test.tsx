import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { ContentAdditionToolbar } from '../ContentAdditionToolbar';
import { useTimeline, useMediaAssets } from '../../state/hooks';
import { useNotifications } from '../../state/notifications';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { afterEach } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

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

    expect(screen.getByText(/Educational Workflow:/)).toBeInTheDocument();
    expect(screen.getByText(/Code snippets → Code track/)).toBeInTheDocument();
  });

  it('adds code content when Add Code button is clicked', () => {
    render(<ContentAdditionToolbar />);

    const addCodeButton = screen.getByText('Add Code');
    fireEvent.click(addCodeButton);

    expect(mockAddMediaAsset).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'code',
        metadata: expect.objectContaining({
          language: 'javascript',
          codeContent: expect.stringContaining('console.log'),
        }),
      })
    );

    expect(mockAddTimelineItem).toHaveBeenCalledWith(
      expect.objectContaining({
        assetId: 'mock-asset-id',
        track: 0, // Code track
        type: 'code',
        properties: expect.objectContaining({
          language: 'javascript',
        }),
      })
    );

    expect(mockNotify).toHaveBeenCalledWith({
      type: 'success',
      title: 'Code Added',
      message: 'Code snippet added to Code track',
    });
  });

  it('shows video type menu when Add Video button is clicked', () => {
    render(<ContentAdditionToolbar />);

    const addVideoButton = screen.getByText('Add Video');
    fireEvent.click(addVideoButton);

    expect(screen.getByText('Screen Recording')).toBeInTheDocument();
    expect(screen.getByText('Talking Head')).toBeInTheDocument();
    expect(
      screen.getByText('For demonstrations and tutorials')
    ).toBeInTheDocument();
    expect(
      screen.getByText('For personal commentary and explanations')
    ).toBeInTheDocument();
  });

  it('closes video menu when clicking outside', () => {
    render(<ContentAdditionToolbar />);

    const addVideoButton = screen.getByText('Add Video');
    fireEvent.click(addVideoButton);

    expect(screen.getByText('Screen Recording')).toBeInTheDocument();

    // Click outside the menu
    fireEvent.mouseDown(document.body);

    expect(screen.queryByText('Screen Recording')).not.toBeInTheDocument();
  });

  it('applies correct styling classes', () => {
    render(<ContentAdditionToolbar />);

    const addCodeButton = screen.getByText('Add Code').closest('button');
    expect(addCodeButton).toHaveClass('content-addition-button');
    expect(addCodeButton).toHaveClass('bg-purple-600');

    const addVideoButton = screen.getByText('Add Video').closest('button');
    expect(addVideoButton).toHaveClass('content-addition-button');
    expect(addVideoButton).toHaveClass('bg-green-600');

    const addAssetsButton = screen.getByText('Add Assets').closest('button');
    expect(addAssetsButton).toHaveClass('content-addition-button');
    expect(addAssetsButton).toHaveClass('bg-amber-600');
  });

  it('shows visual feedback when buttons are clicked', () => {
    render(<ContentAdditionToolbar />);

    const addCodeButton = screen.getByText('Add Code').closest('button');
    fireEvent.click(addCodeButton!);

    expect(addCodeButton).toHaveClass('scale-105');
  });
});
