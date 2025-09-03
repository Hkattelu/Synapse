import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { EducationalTimeline } from '../EducationalTimeline';
import { AppProvider } from '../../state/context';
import type { AppState } from '../../state/types';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';

// Mock the hooks
vi.mock('../../state/hooks', () => ({
  useTimeline: () => ({
    timeline: [],
    selectedItems: [],
    addTimelineItem: vi.fn(),
    moveTimelineItem: vi.fn(),
    resizeTimelineItem: vi.fn(),
    selectTimelineItems: vi.fn(),
    clearTimelineSelection: vi.fn(),
    timelineDuration: 30,
  }),
  useMediaAssets: () => ({
    getMediaAssetById: vi.fn(),
  }),
  useUI: () => ({
    ui: {
      timeline: {
        zoom: 1,
        scrollPosition: 0,
        snapToGrid: true,
        gridSize: 1,
        showKeyframes: false,
        trackHeight: 80,
        selectedKeyframes: [],
        timelineMode: 'simplified' as const,
        verticalScrollPosition: 0,
        selectedItems: [],
      },
    },
    updateTimelineView: vi.fn(),
  }),
}));

// Mock Lucide React icons
vi.mock('lucide-react/dist/esm/icons/settings.js', () => ({
  default: ({ className }: { className?: string }) => <div className={className} data-testid="settings-icon" />,
}));

vi.mock('lucide-react/dist/esm/icons/eye.js', () => ({
  default: ({ className }: { className?: string }) => <div className={className} data-testid="eye-icon" />,
}));

vi.mock('lucide-react/dist/esm/icons/eye-off.js', () => ({
  default: ({ className }: { className?: string }) => <div className={className} data-testid="eye-off-icon" />,
}));

describe('EducationalTimeline', () => {
  const renderWithProvider = (component: React.ReactElement) => {
    const mockState: AppState = {
      project: null,
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
          playbackRate: 1,
        },
        timeline: {
          zoom: 1,
          scrollPosition: 0,
          selectedItems: [],
          snapToGrid: true,
          gridSize: 1,
          showKeyframes: false,
          trackHeight: 80,
          selectedKeyframes: [],
          timelineMode: 'simplified' as const,
          verticalScrollPosition: 0,
        },
        musicLibrary: {
          tracks: [],
        },
      },
      lastSaved: null,
      isDirty: false,
      isLoading: false,
    };

    return render(
      <AppProvider initialState={mockState}>
        {component}
      </AppProvider>
    );
  };

  it('renders educational timeline with header', () => {
    renderWithProvider(<EducationalTimeline />);
    
    expect(screen.getByText('Educational Timeline')).toBeInTheDocument();
    expect(screen.getByText('Simplified')).toBeInTheDocument();
  });

  it('displays mode toggle button', () => {
    renderWithProvider(<EducationalTimeline />);
    
    const modeToggle = screen.getByTitle('Switch to Advanced Mode');
    expect(modeToggle).toBeInTheDocument();
  });

  it('calls onModeChange when mode toggle is clicked', () => {
    const onModeChange = vi.fn();
    renderWithProvider(<EducationalTimeline onModeChange={onModeChange} />);
    
    const modeToggle = screen.getByTitle('Switch to Advanced Mode');
    fireEvent.click(modeToggle);
    
    expect(onModeChange).toHaveBeenCalledWith('advanced');
  });

  it('displays zoom controls', () => {
    renderWithProvider(<EducationalTimeline />);
    
    expect(screen.getByTitle('Zoom Out')).toBeInTheDocument();
    expect(screen.getByTitle('Zoom In')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('displays snap to grid toggle', () => {
    renderWithProvider(<EducationalTimeline />);
    
    expect(screen.getByText('Snap')).toBeInTheDocument();
  });

  it('displays timeline duration', () => {
    renderWithProvider(<EducationalTimeline />);
    
    expect(screen.getByText('Duration: 30s')).toBeInTheDocument();
  });

  it('renders with custom className', () => {
    const { container } = renderWithProvider(<EducationalTimeline className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('starts in simplified mode by default', () => {
    renderWithProvider(<EducationalTimeline />);
    
    expect(screen.getByText('Simplified')).toBeInTheDocument();
    expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
  });

  it('can be initialized in advanced mode', () => {
    renderWithProvider(<EducationalTimeline mode="advanced" />);
    
    expect(screen.getByText('Advanced')).toBeInTheDocument();
    expect(screen.getByTestId('settings-icon')).toBeInTheDocument();
  });
});