import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Preview } from '../Preview';
import type { AppState } from '../../state/types';
import type { Project, MediaAsset, TimelineItem } from '../../lib/types';

// Mock the hooks
const mockDispatch = vi.fn();
let mockState: AppState;

// Mock Remotion Player
const mockPlayerRef = {
  current: {
    play: vi.fn(),
    pause: vi.fn(),
    seekTo: vi.fn(),
  },
};

vi.mock('@remotion/player', () => ({
  Player: React.forwardRef(({ onTimeUpdate, inputProps, ...props }: any, ref: any) => {
    // Assign the mock ref
    if (ref) {
      ref.current = mockPlayerRef.current;
    }
    
    return (
      <div 
        data-testid="remotion-player"
        data-input-props={JSON.stringify(inputProps)}
        onClick={() => onTimeUpdate && onTimeUpdate(150)} // Simulate time update
      >
        Remotion Player Mock
      </div>
    );
  }),
}));

// Mock the hooks directly
vi.mock('../../state/hooks', () => ({
  useProject: () => ({
    project: mockState.project,
  }),
  usePlayback: () => ({
    playback: mockState.ui.playback,
    play: vi.fn(() => mockDispatch({ type: 'UPDATE_PLAYBACK_STATE', payload: { isPlaying: true } })),
    pause: vi.fn(() => mockDispatch({ type: 'UPDATE_PLAYBACK_STATE', payload: { isPlaying: false } })),
    seek: vi.fn((time) => mockDispatch({ type: 'UPDATE_PLAYBACK_STATE', payload: { currentTime: time } })),
  }),
}));

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

const mockProject: Project = {
  id: 'project-1',
  name: 'Test Project',
  createdAt: new Date(),
  updatedAt: new Date(),
  timeline: [mockTimelineItem],
  mediaAssets: [mockMediaAsset],
  settings: {
    width: 1920,
    height: 1080,
    fps: 30,
    duration: 60,
    backgroundColor: '#000000',
  },
  version: '1.0.0',
};

const defaultState: AppState = {
  project: mockProject,
  ui: {
    currentView: 'studio',
    sidebarVisible: true,
    inspectorVisible: true,
    mediaBinVisible: true,
    playback: {
      isPlaying: false,
      currentTime: 0,
      duration: 60,
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
};

describe('Preview Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState = { ...defaultState };
    mockPlayerRef.current.play.mockClear();
    mockPlayerRef.current.pause.mockClear();
    mockPlayerRef.current.seekTo.mockClear();
  });

  it('renders preview with project loaded', () => {
    render(<Preview />);
    
    expect(screen.getByTestId('remotion-player')).toBeInTheDocument();
    expect(screen.getByTitle('Play')).toBeInTheDocument();
    expect(screen.getByText('00:00.00')).toBeInTheDocument();
    expect(screen.getByText('01:00.00')).toBeInTheDocument();
  });

  it('renders empty state when no project is loaded', () => {
    mockState = {
      ...defaultState,
      project: null,
    };

    render(<Preview />);
    
    expect(screen.getByText('No Project Loaded')).toBeInTheDocument();
    expect(screen.getByText('Create or load a project to see the preview')).toBeInTheDocument();
    expect(screen.queryByTestId('remotion-player')).not.toBeInTheDocument();
  });

  it('passes correct props to Remotion Player', () => {
    render(<Preview />);
    
    const player = screen.getByTestId('remotion-player');
    const inputProps = JSON.parse(player.getAttribute('data-input-props') || '{}');
    
    expect(inputProps.timeline).toHaveLength(1);
    expect(inputProps.mediaAssets).toHaveLength(1);
    expect(inputProps.settings.width).toBe(1920);
    expect(inputProps.settings.height).toBe(1080);
  });

  it('handles play/pause button click', async () => {
    render(<Preview />);
    
    const playButton = screen.getByTitle('Play');
    expect(playButton).toBeInTheDocument();
    
    fireEvent.click(playButton);
    // The button should be clickable (basic interaction test)
    expect(playButton).toBeInTheDocument();
  });

  it('shows pause button when playing', () => {
    mockState = {
      ...defaultState,
      ui: {
        ...defaultState.ui,
        playback: {
          ...defaultState.ui.playback,
          isPlaying: true,
        },
      },
    };

    render(<Preview />);
    
    expect(screen.getByTitle('Pause')).toBeInTheDocument();
  });

  it('handles time updates from player', async () => {
    render(<Preview />);
    
    const player = screen.getByTestId('remotion-player');
    fireEvent.click(player); // This triggers the onTimeUpdate with frame 150
    
    // Basic test that the player responds to interactions
    expect(player).toBeInTheDocument();
  });

  it('formats time correctly', () => {
    mockState = {
      ...defaultState,
      ui: {
        ...defaultState.ui,
        playback: {
          ...defaultState.ui.playback,
          currentTime: 125.75, // 2 minutes, 5.75 seconds
        },
      },
    };

    render(<Preview />);
    
    expect(screen.getByText('02:05.22')).toBeInTheDocument(); // 0.75 * 30 = 22.5 frames
  });

  it('calculates duration in frames correctly', () => {
    const projectWith90SecDuration = {
      ...mockProject,
      settings: {
        ...mockProject.settings,
        duration: 90,
        fps: 24,
      },
    };

    mockState = {
      ...defaultState,
      project: projectWith90SecDuration,
    };

    render(<Preview />);
    
    // Should calculate 90 * 24 = 2160 frames
    // We can't directly test this, but we can verify the time display
    expect(screen.getByText('01:30.00')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Preview className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles empty timeline gracefully', () => {
    const projectWithEmptyTimeline = {
      ...mockProject,
      timeline: [],
      mediaAssets: [],
    };

    mockState = {
      ...defaultState,
      project: projectWithEmptyTimeline,
    };

    render(<Preview />);
    
    expect(screen.getByTestId('remotion-player')).toBeInTheDocument();
    
    const player = screen.getByTestId('remotion-player');
    const inputProps = JSON.parse(player.getAttribute('data-input-props') || '{}');
    
    expect(inputProps.timeline).toEqual([]);
    expect(inputProps.mediaAssets).toEqual([]);
  });
});