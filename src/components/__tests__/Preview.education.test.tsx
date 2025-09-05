import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { vi } from 'vitest';
import { Preview } from '../Preview';

// Mock hooks used by Preview (project, playback, timeline)
const mockPlay = vi.fn();
const mockPause = vi.fn();
const mockSeek = vi.fn();
const mockSetVolume = vi.fn();
const mockToggleMute = vi.fn();

const makeHooksMock = (currentTime: number = 0.5) => ({
  useProject: () => ({
    project: {
      id: 'p1',
      name: 'Test Project',
      createdAt: new Date(),
      updatedAt: new Date(),
      timeline: [
        {
          id: 't1',
          assetId: 'a1',
          type: 'audio',
          startTime: 0,
          duration: 2,
          track: 2, // Narration
          properties: {},
          animations: [],
          keyframes: [],
        },
      ],
      mediaAssets: [
        {
          id: 'a1',
          name: 'Voice Over',
          type: 'audio',
          url: 'blob:audio',
          metadata: { fileSize: 1000, mimeType: 'audio/mp3' },
          createdAt: new Date(),
        },
      ],
      settings: { width: 1280, height: 720, fps: 30, duration: 5, backgroundColor: '#000000' },
      version: '1.0.0',
    },
  }),
  usePlayback: () => ({
    playback: {
      isPlaying: false,
      currentTime,
      muted: false,
      volume: 1,
    },
    play: mockPlay,
    pause: mockPause,
    seek: mockSeek,
    setVolume: mockSetVolume,
    toggleMute: mockToggleMute,
  }),
  useTimeline: () => ({
    timeline: [
      {
        id: 't1',
        assetId: 'a1',
        type: 'audio',
        startTime: 0,
        duration: 2,
        track: 2, // Narration
        properties: {},
        animations: [],
        keyframes: [],
      },
    ],
    updateTimelineItem: vi.fn(),
  }),
});

vi.mock('../../state/hooks', () => makeHooksMock());

// Silence Remotion Player in test
vi.mock('@remotion/player', () => ({
  Player: vi.fn().mockImplementation(({ children }) => <div data-testid="player">{children}</div>),
}));

// MainComposition is not under test
vi.mock('../../remotion/MainComposition', () => ({
  MainComposition: () => <div data-testid="main-composition" />,
}));

// Icons mocked
vi.mock('lucide-react/dist/esm/icons/eye.js', () => ({ default: (props: any) => <svg {...props} /> }));
vi.mock('lucide-react/dist/esm/icons/eye-off.js', () => ({ default: (props: any) => <svg {...props} /> }));

describe('Preview - Educational overlay toggle and persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default to overlay enabled
    window.localStorage.setItem('synapse-show-edu-overlay', 'true');
  });

  afterEach(() => {
    cleanup();
  });

  it('shows overlay when enabled and hides when toggled off, persisting the choice', () => {
    // Initial render (overlay enabled)
    const { unmount } = render(<Preview />);

    // Overlay content visible
    expect(screen.getByText('Now Playing')).toBeInTheDocument();
    expect(screen.getByText(/Narration Active/i)).toBeInTheDocument();

    // Toggle off via the "Tracks Overlay" button
    const toggleBtn = screen.getByRole('button', { name: /Tracks Overlay/i });
    fireEvent.click(toggleBtn);

    // Overlay content gone
    expect(screen.queryByText('Now Playing')).not.toBeInTheDocument();

    // Persisted to localStorage
    expect(window.localStorage.getItem('synapse-show-edu-overlay')).toBe('false');

    // Re-render to confirm persistence
    unmount();
    const makeHooksMockLate = makeHooksMock(0.7); // still within active item
    vi.doMock('../../state/hooks', () => makeHooksMockLate as any);
    render(<Preview />);

    expect(screen.queryByText('Now Playing')).not.toBeInTheDocument();

    // Toggle back on
    const toggleBtn2 = screen.getByRole('button', { name: /Tracks Overlay/i });
    fireEvent.click(toggleBtn2);
    expect(screen.getByText('Now Playing')).toBeInTheDocument();
  });
});

