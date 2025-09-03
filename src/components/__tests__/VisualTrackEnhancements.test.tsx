// Tests for Visual track enhancement components
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
  VisualTrackClip,
  SideBySideLayoutControls,
  OptimizationSuggestions,
  EnhancedThumbnail,
} from '../VisualTrackEnhancements';
import { EDUCATIONAL_TRACKS } from '../../lib/educationalTypes';
import type { TimelineItem, MediaAsset } from '../../lib/types';
import type { ScreenRecordingAnalysis } from '../../lib/visualTrackEnhancements';

// Mock the media assets hook
vi.mock('../../state/hooks', () => ({
  useMediaAssets: () => ({
    getMediaAssetById: vi.fn(),
  }),
}));

// Mock Lucide React icons
vi.mock('lucide-react/dist/esm/icons/monitor.js', () => ({
  default: ({ className }: { className?: string }) => <div className={className} data-testid="monitor-icon" />,
}));

vi.mock('lucide-react/dist/esm/icons/play.js', () => ({
  default: ({ className }: { className?: string }) => <div className={className} data-testid="play-icon" />,
}));

vi.mock('lucide-react/dist/esm/icons/code.js', () => ({
  default: ({ className }: { className?: string }) => <div className={className} data-testid="code-icon" />,
}));

vi.mock('lucide-react/dist/esm/icons/mouse-pointer.js', () => ({
  default: ({ className }: { className?: string }) => <div className={className} data-testid="mouse-pointer-icon" />,
}));

vi.mock('lucide-react/dist/esm/icons/maximize.js', () => ({
  default: ({ className }: { className?: string }) => <div className={className} data-testid="maximize-icon" />,
}));

vi.mock('lucide-react/dist/esm/icons/zap.js', () => ({
  default: ({ className }: { className?: string }) => <div className={className} data-testid="zap-icon" />,
}));

vi.mock('lucide-react/dist/esm/icons/eye.js', () => ({
  default: ({ className }: { className?: string }) => <div className={className} data-testid="eye-icon" />,
}));

vi.mock('lucide-react/dist/esm/icons/arrow-right.js', () => ({
  default: ({ className }: { className?: string }) => <div className={className} data-testid="arrow-right-icon" />,
}));

const mockVisualTrack = EDUCATIONAL_TRACKS.find(t => t.id === 'visual')!;

const mockVideoAsset: MediaAsset = {
  id: 'video-1',
  name: 'screen-recording-demo.mp4',
  type: 'video',
  url: 'https://example.com/video.mp4',
  duration: 120,
  metadata: {
    width: 1920,
    height: 1080,
    fps: 30,
    fileSize: 50000000,
    mimeType: 'video/mp4',
  },
  thumbnail: 'https://example.com/thumbnail.jpg',
  createdAt: new Date(),
};

const mockTimelineItem: TimelineItem = {
  id: 'item-1',
  assetId: 'video-1',
  startTime: 0,
  duration: 10,
  track: 1,
  type: 'video',
  properties: {},
  animations: [],
  keyframes: [],
};

const mockScreenRecordingAnalysis: ScreenRecordingAnalysis = {
  isScreenRecording: true,
  confidence: 0.8,
  characteristics: {
    hasUIElements: true,
    hasCodeContent: true,
    hasMouseCursor: false,
    hasApplicationWindows: true,
    aspectRatio: 16/9,
    resolution: { width: 1920, height: 1080 },
  },
  optimizationSuggestions: [
    {
      type: 'focus',
      description: 'Focus on code editor area for better readability',
      parameters: { focusArea: 'center', zoomLevel: 1.2 },
      confidence: 0.8,
    },
    {
      type: 'highlight',
      description: 'Add highlights to draw attention to important UI elements',
      parameters: { highlightStyle: 'glow', color: '#F59E0B' },
      confidence: 0.6,
    },
  ],
};

describe('VisualTrackClip', () => {
  const defaultProps = {
    item: mockTimelineItem,
    asset: mockVideoAsset,
    track: mockVisualTrack,
    isSelected: false,
    style: { left: '0px', width: '100px', height: '60px', top: '4px' },
    onItemUpdate: vi.fn(),
  };

  it('renders visual track clip with asset name', () => {
    render(<VisualTrackClip {...defaultProps} />);
    
    expect(screen.getByText('screen-recording-demo.mp4')).toBeInTheDocument();
    expect(screen.getAllByTestId('monitor-icon').length).toBeGreaterThan(0);
  });

  it('displays screen recording indicators', () => {
    render(<VisualTrackClip {...defaultProps} />);
    
    // Should show screen recording indicators based on filename analysis
    expect(screen.getByText('Screen Recording')).toBeInTheDocument();
  });

  it('shows thumbnail preview when available', () => {
    render(<VisualTrackClip {...defaultProps} />);
    
    const thumbnailElement = document.querySelector('[style*="background-image"]');
    expect(thumbnailElement).toBeInTheDocument();
  });

  it('displays video duration', () => {
    render(<VisualTrackClip {...defaultProps} />);
    
    expect(screen.getByText('10s')).toBeInTheDocument();
  });

  it('shows animation menu button on hover', () => {
    render(<VisualTrackClip {...defaultProps} />);
    
    const animationButton = screen.getByTitle('Animation Presets');
    expect(animationButton).toBeInTheDocument();
    expect(screen.getByTestId('zap-icon')).toBeInTheDocument();
  });

  it('opens animation presets menu when clicked', async () => {
    render(<VisualTrackClip {...defaultProps} />);
    
    const animationButton = screen.getByTitle('Animation Presets');
    fireEvent.click(animationButton);
    
    await waitFor(() => {
      expect(screen.getByText('Animation Presets')).toBeInTheDocument();
    });
  });

  it('applies animation preset when selected', async () => {
    const onItemUpdate = vi.fn();
    render(<VisualTrackClip {...defaultProps} onItemUpdate={onItemUpdate} />);
    
    const animationButton = screen.getByTitle('Animation Presets');
    fireEvent.click(animationButton);
    
    await waitFor(() => {
      expect(screen.getByText('Animation Presets')).toBeInTheDocument();
    });
    
    // Click on the first available preset (which should be "Zoom Focus (Custom Point)" based on screen recording analysis)
    const presetButtons = screen.getAllByRole('button');
    const firstPresetButton = presetButtons.find(button => 
      button.textContent?.includes('Zoom Focus') || 
      button.textContent?.includes('Callout')
    );
    
    if (firstPresetButton) {
      fireEvent.click(firstPresetButton);
      expect(onItemUpdate).toHaveBeenCalled();
    }
  });

  it('handles missing asset gracefully', () => {
    render(<VisualTrackClip {...defaultProps} asset={undefined} />);
    
    expect(screen.getByText('Visual Content')).toBeInTheDocument();
  });
});

describe('SideBySideLayoutControls', () => {
  const mockCodeItems: TimelineItem[] = [
    {
      ...mockTimelineItem,
      id: 'code-1',
      type: 'code',
      track: 0,
    },
  ];

  const mockVisualItems: TimelineItem[] = [
    {
      ...mockTimelineItem,
      id: 'visual-1',
      type: 'video',
      track: 1,
    },
  ];

  const defaultProps = {
    onLayoutChange: vi.fn(),
    codeItems: mockCodeItems,
    visualItems: mockVisualItems,
  };

  it('renders layout controls when both code and visual items exist', () => {
    render(<SideBySideLayoutControls {...defaultProps} />);
    
    expect(screen.getByText('Side-by-Side Layout')).toBeInTheDocument();
  });

  it('does not render when no code items', () => {
    render(<SideBySideLayoutControls {...defaultProps} codeItems={[]} />);
    
    expect(screen.queryByText('Side-by-Side Layout')).not.toBeInTheDocument();
  });

  it('does not render when no visual items', () => {
    render(<SideBySideLayoutControls {...defaultProps} visualItems={[]} />);
    
    expect(screen.queryByText('Side-by-Side Layout')).not.toBeInTheDocument();
  });

  it('opens layout options menu when clicked', () => {
    render(<SideBySideLayoutControls {...defaultProps} />);
    
    const layoutButton = screen.getByText('Side-by-Side Layout');
    fireEvent.click(layoutButton);
    
    expect(screen.getByText('Choose Layout')).toBeInTheDocument();
    expect(screen.getByText('Code Left, Visual Right')).toBeInTheDocument();
    expect(screen.getByText('Visual Left, Code Right')).toBeInTheDocument();
  });

  it('calls onLayoutChange when layout option is selected', () => {
    const onLayoutChange = vi.fn();
    render(<SideBySideLayoutControls {...defaultProps} onLayoutChange={onLayoutChange} />);
    
    const layoutButton = screen.getByText('Side-by-Side Layout');
    fireEvent.click(layoutButton);
    
    const leftRightOption = screen.getByText('Code Left, Visual Right');
    fireEvent.click(leftRightOption);
    
    expect(onLayoutChange).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'left-right',
        splitRatio: 0.5,
        gap: 16,
        alignment: 'start',
      })
    );
  });

  it('highlights current layout option', () => {
    const currentLayout = {
      type: 'left-right' as const,
      primaryContent: 'code' as const,
      splitRatio: 0.5,
      gap: 16,
      alignment: 'start' as const,
    };
    
    render(<SideBySideLayoutControls {...defaultProps} currentLayout={currentLayout} />);
    
    const layoutButton = screen.getByText('Side-by-Side Layout');
    fireEvent.click(layoutButton);
    
    const selectedOption = screen.getByText('Code Left, Visual Right').closest('button');
    expect(selectedOption).toHaveClass('border-accent-yellow');
  });
});

describe('OptimizationSuggestions', () => {
  const defaultProps = {
    analysis: mockScreenRecordingAnalysis,
    onApplyOptimization: vi.fn(),
  };

  it('renders optimization suggestions for screen recordings', () => {
    render(<OptimizationSuggestions {...defaultProps} />);
    
    expect(screen.getByText('Optimization Suggestions')).toBeInTheDocument();
    expect(screen.getByText('Focus on code editor area for better readability')).toBeInTheDocument();
    expect(screen.getByText('Add highlights to draw attention to important UI elements')).toBeInTheDocument();
  });

  it('shows confidence levels for suggestions', () => {
    render(<OptimizationSuggestions {...defaultProps} />);
    
    expect(screen.getByText('Confidence: 80%')).toBeInTheDocument();
    expect(screen.getByText('Confidence: 60%')).toBeInTheDocument();
  });

  it('calls onApplyOptimization when Apply button is clicked', () => {
    const onApplyOptimization = vi.fn();
    render(<OptimizationSuggestions {...defaultProps} onApplyOptimization={onApplyOptimization} />);
    
    const applyButtons = screen.getAllByText('Apply');
    fireEvent.click(applyButtons[0]);
    
    expect(onApplyOptimization).toHaveBeenCalledWith(
      mockScreenRecordingAnalysis.optimizationSuggestions[0]
    );
  });

  it('does not render for non-screen recordings', () => {
    const nonScreenRecordingAnalysis = {
      ...mockScreenRecordingAnalysis,
      isScreenRecording: false,
    };
    
    const { container } = render(
      <OptimizationSuggestions 
        {...defaultProps} 
        analysis={nonScreenRecordingAnalysis} 
      />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('does not render when no suggestions available', () => {
    const noSuggestionsAnalysis = {
      ...mockScreenRecordingAnalysis,
      optimizationSuggestions: [],
    };
    
    const { container } = render(
      <OptimizationSuggestions 
        {...defaultProps} 
        analysis={noSuggestionsAnalysis} 
      />
    );
    
    expect(container.firstChild).toBeNull();
  });
});

describe('EnhancedThumbnail', () => {
  const defaultProps = {
    asset: mockVideoAsset,
    className: 'test-thumbnail',
  };

  it('renders thumbnail with background image', () => {
    render(<EnhancedThumbnail {...defaultProps} />);
    
    const thumbnailElement = document.querySelector('[style*="background-image"]');
    expect(thumbnailElement).toBeInTheDocument();
  });

  it('shows play overlay for video assets', () => {
    render(<EnhancedThumbnail {...defaultProps} />);
    
    expect(screen.getByTestId('play-icon')).toBeInTheDocument();
  });

  it('does not show play overlay for image assets', () => {
    const imageAsset: MediaAsset = {
      ...mockVideoAsset,
      type: 'image',
    };
    
    render(<EnhancedThumbnail {...defaultProps} asset={imageAsset} />);
    
    expect(screen.queryByTestId('play-icon')).not.toBeInTheDocument();
  });

  it('displays screen recording indicators when enabled', () => {
    render(<EnhancedThumbnail {...defaultProps} showIndicators={true} />);
    
    expect(screen.getByText('Screen Recording')).toBeInTheDocument();
  });

  it('hides indicators when disabled', () => {
    render(<EnhancedThumbnail {...defaultProps} showIndicators={false} />);
    
    expect(screen.queryByText('Screen Recording')).not.toBeInTheDocument();
  });

  it('shows duration badge for video assets', () => {
    render(<EnhancedThumbnail {...defaultProps} />);
    
    expect(screen.getByText('120s')).toBeInTheDocument();
  });

  it('does not show duration badge for assets without duration', () => {
    const assetWithoutDuration: MediaAsset = {
      ...mockVideoAsset,
      duration: undefined,
    };
    
    render(<EnhancedThumbnail {...defaultProps} asset={assetWithoutDuration} />);
    
    expect(screen.queryByText(/\d+s/)).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<EnhancedThumbnail {...defaultProps} />);
    
    expect(container.firstChild).toHaveClass('test-thumbnail');
  });
});