import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Timeline } from '../Timeline';
import type { AppState } from '../../state/types';
import type { Project, MediaAsset, TimelineItem } from '../../lib/types';

// Mock the hooks
const mockDispatch = vi.fn();
let mockState: AppState;

// Mock the hooks directly
vi.mock('../../state/hooks', () => ({
  useTimeline: () => ({
    timeline: mockState.project?.timeline || [],
    selectedItems: mockState.ui.timeline.selectedItems,
    addTimelineItem: vi.fn((item) =>
      mockDispatch({
        type: 'ADD_TIMELINE_ITEM',
        payload: { ...item, id: 'new-id' },
      })
    ),
    moveTimelineItem: vi.fn((id, startTime, track) =>
      mockDispatch({
        type: 'MOVE_TIMELINE_ITEM',
        payload: { id, startTime, track },
      })
    ),
    resizeTimelineItem: vi.fn((id, duration) =>
      mockDispatch({ type: 'RESIZE_TIMELINE_ITEM', payload: { id, duration } })
    ),
    selectTimelineItems: vi.fn((ids) =>
      mockDispatch({ type: 'SELECT_TIMELINE_ITEMS', payload: ids })
    ),
    clearTimelineSelection: vi.fn(() =>
      mockDispatch({ type: 'CLEAR_TIMELINE_SELECTION' })
    ),
    timelineDuration:
      mockState.project?.timeline.reduce(
        (max, item) => Math.max(max, item.startTime + item.duration),
        0
      ) || 0,
  }),
  useMediaAssets: () => ({
    getMediaAssetById: (id: string) =>
      mockState.project?.mediaAssets.find((asset) => asset.id === id),
  }),
  useUI: () => ({
    ui: mockState.ui,
    updateTimelineView: vi.fn((updates) =>
      mockDispatch({ type: 'UPDATE_TIMELINE_VIEW', payload: updates })
    ),
  }),
}));

const defaultState: AppState = {
  project: {
    id: 'test-project',
    name: 'Test Project',
    createdAt: new Date(),
    updatedAt: new Date(),
    timeline: [],
    mediaAssets: [],
    settings: {
      width: 1920,
      height: 1080,
      fps: 30,
      duration: 60,
      backgroundColor: '#000000',
      audioSampleRate: 48000,
    },
    version: '1.0.0',
  },
  projects: [],
  ui: {
    currentView: 'studio',
    sidebarVisible: true,
    inspectorVisible: true,
    mediaBinVisible: true,
    playback: {
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 1,
      muted: false,
    },
    timeline: {
      zoom: 1,
      scrollPosition: 0,
      selectedItems: [],
      snapToGrid: true,
      gridSize: 1,
    },
  },
  lastSaved: null,
  isDirty: false,
  isLoading: false,
};

// Mock media asset
const mockMediaAsset: MediaAsset = {
  id: 'asset-1',
  name: 'test-video.mp4',
  type: 'video',
  url: 'blob:test-url',
  duration: 10,
  metadata: {
    fileSize: 1024,
    mimeType: 'video/mp4',
  },
  createdAt: new Date(),
};

// Mock timeline item
const mockTimelineItem: TimelineItem = {
  id: 'item-1',
  assetId: 'asset-1',
  startTime: 5,
  duration: 10,
  track: 0,
  type: 'video',
  properties: {},
  animations: [],
};

const renderTimeline = (state: Partial<AppState> = {}) => {
  // Update the mock state
  mockState = {
    ...defaultState,
    ...state,
    project: state.project
      ? { ...defaultState.project!, ...state.project }
      : defaultState.project,
    ui: state.ui ? { ...defaultState.ui, ...state.ui } : defaultState.ui,
  };

  return render(<Timeline />);
};

describe('Timeline Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState = { ...defaultState };
  });

  it('renders timeline with header and controls', () => {
    renderTimeline();

    expect(screen.getByText('Timeline')).toBeInTheDocument();
    expect(screen.getByTitle('Zoom Out')).toBeInTheDocument();
    expect(screen.getByTitle('Zoom In')).toBeInTheDocument();
    expect(screen.getByText('Snap')).toBeInTheDocument();
    expect(screen.getByText('Duration: 0s')).toBeInTheDocument();
  });

  it('displays zoom level correctly', () => {
    renderTimeline({
      ui: {
        ...defaultState.ui,
        timeline: { ...defaultState.ui.timeline, zoom: 1.5 },
      },
    });

    expect(screen.getByText('150%')).toBeInTheDocument();
  });

  it('renders timeline items correctly', () => {
    renderTimeline({
      project: {
        ...defaultState.project!,
        timeline: [mockTimelineItem],
        mediaAssets: [mockMediaAsset],
      },
    });

    expect(screen.getByText('test-video.mp4')).toBeInTheDocument();
    expect(screen.getByText('10s')).toBeInTheDocument();
  });

  it('handles zoom in', async () => {
    renderTimeline();

    const zoomInButton = screen.getByTitle('Zoom In');
    fireEvent.click(zoomInButton);

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'UPDATE_TIMELINE_VIEW',
        payload: { zoom: 1.2 },
      });
    });
  });

  it('handles zoom out', async () => {
    renderTimeline({
      ui: {
        ...defaultState.ui,
        timeline: { ...defaultState.ui.timeline, zoom: 1.5 },
      },
    });

    const zoomOutButton = screen.getByTitle('Zoom Out');
    fireEvent.click(zoomOutButton);

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'UPDATE_TIMELINE_VIEW',
        payload: { zoom: 1.3 },
      });
    });
  });

  it('toggles snap to grid', async () => {
    renderTimeline();

    const snapButton = screen.getByText('Snap');
    fireEvent.click(snapButton);

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'UPDATE_TIMELINE_VIEW',
        payload: { snapToGrid: false },
      });
    });
  });

  it('handles drag and drop from media bin', async () => {
    const { container } = renderTimeline({
      project: {
        ...defaultState.project!,
        mediaAssets: [mockMediaAsset],
      },
    });

    const timeline = container.querySelector('.timeline-canvas');
    expect(timeline).toBeInTheDocument();

    // Simulate drop - just verify the function is called with the asset ID
    fireEvent.drop(timeline!, {
      dataTransfer: {
        getData: () => mockMediaAsset.id,
      },
      clientX: 100,
      clientY: 50,
    });

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'ADD_TIMELINE_ITEM',
        payload: expect.objectContaining({
          assetId: mockMediaAsset.id,
          type: 'video',
        }),
      });
    });
  });

  it('selects timeline item on click', async () => {
    const { container } = renderTimeline({
      project: {
        ...defaultState.project!,
        timeline: [mockTimelineItem],
        mediaAssets: [mockMediaAsset],
      },
    });

    const timelineClip = screen.getByText('test-video.mp4').closest('div');
    expect(timelineClip).toBeInTheDocument();

    // Mock getBoundingClientRect for timeline
    const timeline = container.querySelector('.timeline-canvas');
    vi.spyOn(timeline!, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 1000,
      height: 200,
    } as DOMRect);

    fireEvent.mouseDown(timelineClip!, {
      clientX: 100,
      clientY: 50,
    });

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SELECT_TIMELINE_ITEMS',
        payload: [mockTimelineItem.id],
      });
    });
  });

  it('clears selection when clicking empty timeline', async () => {
    const { container } = renderTimeline({
      project: {
        ...defaultState.project!,
        timeline: [mockTimelineItem],
        mediaAssets: [mockMediaAsset],
      },
      ui: {
        ...defaultState.ui,
        timeline: {
          ...defaultState.ui.timeline,
          selectedItems: [mockTimelineItem.id],
        },
      },
    });

    const timeline = container.querySelector('.timeline-canvas');

    // Create a mock event where target equals currentTarget (clicking empty space)
    const mockEvent = {
      target: timeline,
      currentTarget: timeline,
    };

    fireEvent.click(timeline!, mockEvent);

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'CLEAR_TIMELINE_SELECTION',
      });
    });
  });

  it('displays track labels', () => {
    renderTimeline();

    expect(screen.getByText('Track 1')).toBeInTheDocument();
    expect(screen.getByText('Track 2')).toBeInTheDocument();
    expect(screen.getByText('Track 3')).toBeInTheDocument();
    expect(screen.getByText('Track 4')).toBeInTheDocument();
  });

  it('shows grid lines when snap to grid is enabled', () => {
    const { container } = renderTimeline({
      ui: {
        ...defaultState.ui,
        timeline: { ...defaultState.ui.timeline, snapToGrid: true },
      },
    });

    const gridLines = container.querySelectorAll(
      '.border-l.border-border-subtle.opacity-30'
    );
    expect(gridLines.length).toBeGreaterThan(0);
  });

  it('handles scroll events', async () => {
    const { container } = renderTimeline();

    const timelineContent = container.querySelector('.timeline-content');
    expect(timelineContent).toBeInTheDocument();

    // Mock the scrollLeft property
    Object.defineProperty(timelineContent, 'scrollLeft', {
      value: 100,
      writable: true,
    });

    fireEvent.scroll(timelineContent!);

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'UPDATE_TIMELINE_VIEW',
        payload: { scrollPosition: 100 },
      });
    });
  });

  it('displays timeline duration correctly', () => {
    renderTimeline({
      project: {
        ...defaultState.project!,
        timeline: [
          { ...mockTimelineItem, startTime: 0, duration: 5 },
          { ...mockTimelineItem, id: 'item-2', startTime: 10, duration: 8 },
        ],
        mediaAssets: [mockMediaAsset],
      },
    });

    // Duration should be the end time of the last clip (10 + 8 = 18)
    expect(screen.getByText('Duration: 18s')).toBeInTheDocument();
  });

  it('applies correct styling to selected items', () => {
    const { container } = renderTimeline({
      project: {
        ...defaultState.project!,
        timeline: [mockTimelineItem],
        mediaAssets: [mockMediaAsset],
      },
      ui: {
        ...defaultState.ui,
        timeline: {
          ...defaultState.ui.timeline,
          selectedItems: [mockTimelineItem.id],
        },
      },
    });

    // Find the timeline clip container (not just the text)
    const timelineClip = container.querySelector('.border-accent-yellow');
    expect(timelineClip).toBeInTheDocument();
    expect(timelineClip).toHaveClass('bg-accent-blue'); // Should also have the video color
  });

  it('applies correct color based on clip type', () => {
    const audioAsset: MediaAsset = {
      ...mockMediaAsset,
      id: 'audio-asset',
      name: 'test-audio.mp3',
      type: 'audio',
    };

    const audioItem: TimelineItem = {
      ...mockTimelineItem,
      id: 'audio-item',
      assetId: 'audio-asset',
      type: 'audio',
    };

    const { container } = renderTimeline({
      project: {
        ...defaultState.project!,
        timeline: [mockTimelineItem, audioItem],
        mediaAssets: [mockMediaAsset, audioAsset],
      },
    });

    // Check that both color classes exist in the DOM
    const videoClip = container.querySelector('.bg-accent-blue');
    const audioClip = container.querySelector('.bg-accent-green');

    expect(videoClip).toBeInTheDocument();
    expect(audioClip).toBeInTheDocument();
  });

  it('handles minimum zoom level', async () => {
    renderTimeline({
      ui: {
        ...defaultState.ui,
        timeline: { ...defaultState.ui.timeline, zoom: 0.1 },
      },
    });

    const zoomOutButton = screen.getByTitle('Zoom Out');
    fireEvent.click(zoomOutButton);

    // Should not go below 0.1
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'UPDATE_TIMELINE_VIEW',
        payload: { zoom: 0.1 },
      });
    });
  });

  it('handles maximum zoom level', async () => {
    renderTimeline({
      ui: {
        ...defaultState.ui,
        timeline: { ...defaultState.ui.timeline, zoom: 5 },
      },
    });

    const zoomInButton = screen.getByTitle('Zoom In');
    fireEvent.click(zoomInButton);

    // Should not go above 5
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'UPDATE_TIMELINE_VIEW',
        payload: { zoom: 5 },
      });
    });
  });
});
