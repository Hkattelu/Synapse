import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Preview } from '../Preview';
import type { AppState } from '../../state/types';
import type { Project, MediaAsset, TimelineItem } from '../../lib/types';

// Mock functions for hooks
const mockPlay = vi.fn();
const mockPause = vi.fn();
const mockSeek = vi.fn();
const mockSetVolume = vi.fn();
const mockToggleMute = vi.fn();

// Mock the hooks
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
  Player: React.forwardRef(({ onTimeUpdate, inputProps }: any, ref: any) => {
    if (ref) {
      ref.current = mockPlayerRef.current;
    }

    return (
      <div
        data-testid="remotion-player"
        data-input-props={JSON.stringify(inputProps)}
        onClick={() => onTimeUpdate && onTimeUpdate(150)}
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
    play: mockPlay,
    pause: mockPause,
    seek: mockSeek,
    setVolume: mockSetVolume,
    toggleMute: mockToggleMute,
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
  projects: [],
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
  isLoading: false,
};

describe('Preview Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState = { ...defaultState };
    mockPlayerRef.current.play.mockClear();
    mockPlayerRef.current.pause.mockClear();
    mockPlayerRef.current.seekTo.mockClear();
    mockPlay.mockClear();
    mockPause.mockClear();
    mockSeek.mockClear();
    mockSetVolume.mockClear();
    mockToggleMute.mockClear();
  });

  it('renders preview with project loaded', () => {
    render(<Preview />);

    expect(screen.getByTestId('remotion-player')).toBeInTheDocument();
    expect(screen.getByTitle('Play')).toBeInTheDocument();
    expect(screen.getByText('00:00.00')).toBeInTheDocument();
    expect(screen.getAllByText('01:00.00')).toHaveLength(2); // Timeline scrubber and main controls
  });

  it('renders empty state when no project is loaded', () => {
    mockState = {
      ...defaultState,
      project: null,
    };

    render(<Preview />);

    expect(screen.getByText('No Project Loaded')).toBeInTheDocument();
    expect(
      screen.getByText('Create or load a project to see the preview')
    ).toBeInTheDocument();
    expect(screen.queryByTestId('remotion-player')).not.toBeInTheDocument();
  });

  it('passes correct props to Remotion Player', () => {
    render(<Preview />);

    const player = screen.getByTestId('remotion-player');
    const inputProps = JSON.parse(
      player.getAttribute('data-input-props') || '{}'
    );

    expect(inputProps.timeline).toHaveLength(1);
    expect(inputProps.mediaAssets).toHaveLength(1);
    expect(inputProps.settings.width).toBe(1920);
    expect(inputProps.settings.height).toBe(1080);
  });

  it('handles play/pause button click', () => {
    render(<Preview />);

    const playButton = screen.getByTitle('Play');
    fireEvent.click(playButton);

    expect(mockPlay).toHaveBeenCalledTimes(1);
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

  it('handles pause button click when playing', () => {
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

    const pauseButton = screen.getByTitle('Pause');
    fireEvent.click(pauseButton);

    expect(mockPause).toHaveBeenCalledTimes(1);
  });

  it('handles skip backward button', () => {
    mockState = {
      ...defaultState,
      ui: {
        ...defaultState.ui,
        playback: {
          ...defaultState.ui.playback,
          currentTime: 20,
        },
      },
    };

    render(<Preview />);

    const skipBackwardButton = screen.getByTitle('Skip Backward 10s');
    fireEvent.click(skipBackwardButton);

    expect(mockSeek).toHaveBeenCalledWith(10);
  });

  it('handles skip forward button', () => {
    mockState = {
      ...defaultState,
      ui: {
        ...defaultState.ui,
        playback: {
          ...defaultState.ui.playback,
          currentTime: 20,
        },
      },
    };

    render(<Preview />);

    const skipForwardButton = screen.getByTitle('Skip Forward 10s');
    fireEvent.click(skipForwardButton);

    expect(mockSeek).toHaveBeenCalledWith(30);
  });

  it('handles frame backward button', () => {
    mockState = {
      ...defaultState,
      ui: {
        ...defaultState.ui,
        playback: {
          ...defaultState.ui.playback,
          currentTime: 1,
        },
      },
    };

    render(<Preview />);

    const frameBackwardButton = screen.getByTitle('Previous Frame');
    fireEvent.click(frameBackwardButton);

    expect(mockSeek).toHaveBeenCalledWith(1 - 1 / 30);
  });

  it('handles frame forward button', () => {
    mockState = {
      ...defaultState,
      ui: {
        ...defaultState.ui,
        playback: {
          ...defaultState.ui.playback,
          currentTime: 1,
        },
      },
    };

    render(<Preview />);

    const frameForwardButton = screen.getByTitle('Next Frame');
    fireEvent.click(frameForwardButton);

    expect(mockSeek).toHaveBeenCalledWith(1 + 1 / 30);
  });

  it('handles volume change', () => {
    render(<Preview />);

    const volumeSlider = screen.getByTitle('Volume');
    fireEvent.change(volumeSlider, { target: { value: '0.5' } });

    expect(mockSetVolume).toHaveBeenCalledWith(0.5);
  });

  it('handles mute toggle', () => {
    render(<Preview />);

    const muteButton = screen.getByTitle('Mute');
    fireEvent.click(muteButton);

    expect(mockToggleMute).toHaveBeenCalledTimes(1);
  });

  it('shows unmute button when muted', () => {
    mockState = {
      ...defaultState,
      ui: {
        ...defaultState.ui,
        playback: {
          ...defaultState.ui.playback,
          muted: true,
        },
      },
    };

    render(<Preview />);

    expect(screen.getByTitle('Unmute')).toBeInTheDocument();
  });

  it('formats time correctly with frame accuracy', () => {
    mockState = {
      ...defaultState,
      ui: {
        ...defaultState.ui,
        playback: {
          ...defaultState.ui.playback,
          currentTime: 125.75,
        },
      },
    };

    render(<Preview />);

    expect(screen.getByText('02:05.22')).toBeInTheDocument();
  });

  it('handles time updates from player', () => {
    render(<Preview />);

    const player = screen.getByTestId('remotion-player');
    fireEvent.click(player);

    expect(mockSeek).toHaveBeenCalledWith(5);
  });

  it('prevents seeking beyond duration bounds', () => {
    mockState = {
      ...defaultState,
      ui: {
        ...defaultState.ui,
        playback: {
          ...defaultState.ui.playback,
          currentTime: 59,
        },
      },
    };

    render(<Preview />);

    const skipForwardButton = screen.getByTitle('Skip Forward 10s');
    fireEvent.click(skipForwardButton);

    expect(mockSeek).toHaveBeenCalledWith(60);
  });

  it('prevents seeking below zero', () => {
    mockState = {
      ...defaultState,
      ui: {
        ...defaultState.ui,
        playback: {
          ...defaultState.ui.playback,
          currentTime: 5,
        },
      },
    };

    render(<Preview />);

    const skipBackwardButton = screen.getByTitle('Skip Backward 10s');
    fireEvent.click(skipBackwardButton);

    expect(mockSeek).toHaveBeenCalledWith(0);
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
    const inputProps = JSON.parse(
      player.getAttribute('data-input-props') || '{}'
    );

    expect(inputProps.timeline).toEqual([]);
    expect(inputProps.mediaAssets).toEqual([]);
  });
});
