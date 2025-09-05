import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { useResponsiveBreakpoint, useResizeObserver } from '../lib/performanceOptimizations';
import { EducationalTimeline } from './EducationalTimeline';
import type { EducationalTrack } from '../lib/educationalTypes';
import { EDUCATIONAL_TRACKS } from '../lib/educationalTypes';

interface ResponsiveTimelineProps {
  className?: string;
  mode?: 'simplified' | 'advanced';
  onModeChange?: (mode: 'simplified' | 'advanced') => void;
}

interface ResponsiveConfig {
  trackHeight: number;
  headerHeight: number;
  toolbarHeight: number;
  showTrackLabels: boolean;
  showZoomControls: boolean;
  showModeToggle: boolean;
  compactMode: boolean;
  stackedLayout: boolean;
  maxVisibleTracks: number;
}

const RESPONSIVE_CONFIGS: Record<'mobile' | 'tablet' | 'desktop', ResponsiveConfig> = {
  mobile: {
    trackHeight: 60,
    headerHeight: 48,
    toolbarHeight: 56,
    showTrackLabels: false,
    showZoomControls: false,
    showModeToggle: false,
    compactMode: true,
    stackedLayout: true,
    maxVisibleTracks: 2,
  },
  tablet: {
    trackHeight: 70,
    headerHeight: 56,
    toolbarHeight: 64,
    showTrackLabels: true,
    showZoomControls: true,
    showModeToggle: false,
    compactMode: true,
    stackedLayout: false,
    maxVisibleTracks: 3,
  },
  desktop: {
    trackHeight: 80,
    headerHeight: 64,
    toolbarHeight: 72,
    showTrackLabels: true,
    showZoomControls: true,
    showModeToggle: true,
    compactMode: false,
    stackedLayout: false,
    maxVisibleTracks: 4,
  },
};

export function ResponsiveTimeline({
  className = '',
  mode = 'simplified',
  onModeChange,
}: ResponsiveTimelineProps) {
  const breakpoint = useResponsiveBreakpoint();
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [activeTrackIndex, setActiveTrackIndex] = useState(0);

  const config = RESPONSIVE_CONFIGS[breakpoint];

  // Resize observer for container dimensions
  const containerRef = useResizeObserver(
    useCallback((entry) => {
      setContainerSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    }, [])
  );

  // Visible tracks based on screen size and stacking
  const visibleTracks = useMemo(() => {
    if (!config.stackedLayout) {
      return EDUCATIONAL_TRACKS.slice(0, config.maxVisibleTracks);
    }

    // For stacked layout (mobile), show one track at a time
    return [EDUCATIONAL_TRACKS[activeTrackIndex]];
  }, [config.stackedLayout, config.maxVisibleTracks, activeTrackIndex]);

  // Track navigation for mobile
  const navigateTrack = useCallback((direction: 'prev' | 'next') => {
    setActiveTrackIndex(current => {
      if (direction === 'prev') {
        return current > 0 ? current - 1 : EDUCATIONAL_TRACKS.length - 1;
      } else {
        return current < EDUCATIONAL_TRACKS.length - 1 ? current + 1 : 0;
      }
    });
  }, []);

  // Swipe gesture handling for mobile
  useEffect(() => {
    if (breakpoint !== 'mobile') return;

    let startX = 0;
    let startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      
      const deltaX = endX - startX;
      const deltaY = endY - startY;

      // Only handle horizontal swipes
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX > 0) {
          navigateTrack('prev');
        } else {
          navigateTrack('next');
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('touchstart', handleTouchStart);
      container.addEventListener('touchend', handleTouchEnd);

      return () => {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [breakpoint, navigateTrack, containerRef]);

  if (breakpoint === 'mobile') {
    return (
      <div ref={containerRef} className={`responsive-timeline-mobile ${className}`}>
        <MobileTimelineView
          config={config}
          visibleTracks={visibleTracks}
          activeTrackIndex={activeTrackIndex}
          onNavigateTrack={navigateTrack}
          mode={mode}
          onModeChange={onModeChange}
        />
      </div>
    );
  }

  if (breakpoint === 'tablet') {
    return (
      <div ref={containerRef} className={`responsive-timeline-tablet ${className}`}>
        <TabletTimelineView
          config={config}
          visibleTracks={visibleTracks}
          containerSize={containerSize}
          mode={mode}
          onModeChange={onModeChange}
        />
      </div>
    );
  }

  // Desktop view - use full EducationalTimeline
  return (
    <div ref={containerRef} className={`responsive-timeline-desktop ${className}`}>
      <EducationalTimeline
        mode={mode}
        onModeChange={onModeChange}
        className="h-full"
      />
    </div>
  );
}

// Mobile timeline view with track navigation
function MobileTimelineView({
  config,
  visibleTracks,
  activeTrackIndex,
  onNavigateTrack,
  mode,
  onModeChange,
}: {
  config: ResponsiveConfig;
  visibleTracks: EducationalTrack[];
  activeTrackIndex: number;
  onNavigateTrack: (direction: 'prev' | 'next') => void;
  mode: 'simplified' | 'advanced';
  onModeChange?: (mode: 'simplified' | 'advanced') => void;
}) {
  const currentTrack = visibleTracks[0];

  return (
    <div className="mobile-timeline flex flex-col h-full bg-gray-900">
      {/* Mobile Header */}
      <div 
        className="mobile-timeline-header bg-gray-800 border-b border-gray-700 px-4 py-3"
        style={{ height: config.headerHeight }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onNavigateTrack('prev')}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              aria-label="Previous track"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="text-center">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                style={{ backgroundColor: currentTrack.color }}
              >
                {currentTrack.name[0]}
              </div>
              <div className="text-xs text-gray-400 mt-1">{currentTrack.name}</div>
            </div>
            
            <button
              onClick={() => onNavigateTrack('next')}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              aria-label="Next track"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Track indicator dots */}
          <div className="flex space-x-1">
            {EDUCATIONAL_TRACKS.map((_, index) => (
              <button
                key={index}
                onClick={() => onNavigateTrack(index > activeTrackIndex ? 'next' : 'prev')}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === activeTrackIndex ? 'bg-white' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Timeline Content */}
      <div className="flex-1 overflow-hidden">
        <EducationalTimeline
          mode={mode}
          onModeChange={onModeChange}
          className="h-full mobile-optimized"
        />
      </div>

      {/* Mobile Track Info */}
      <div className="mobile-track-info bg-gray-800 border-t border-gray-700 px-4 py-2">
        <div className="text-xs text-gray-400 text-center">
          Swipe left/right to switch tracks • {activeTrackIndex + 1} of {EDUCATIONAL_TRACKS.length}
        </div>
      </div>
    </div>
  );
}

// Tablet timeline view with compact layout
function TabletTimelineView({
  config,
  visibleTracks,
  containerSize,
  mode,
  onModeChange,
}: {
  config: ResponsiveConfig;
  visibleTracks: EducationalTrack[];
  containerSize: { width: number; height: number };
  mode: 'simplified' | 'advanced';
  onModeChange?: (mode: 'simplified' | 'advanced') => void;
}) {
  return (
    <div className="tablet-timeline h-full bg-gray-900">
      {/* Tablet Header */}
      <div 
        className="tablet-timeline-header bg-gray-800 border-b border-gray-700 px-4 py-3"
        style={{ height: config.headerHeight }}
      >
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-white">Educational Timeline</div>
          
          {config.showZoomControls && (
            <div className="flex items-center space-x-2">
              <button className="p-1 text-gray-400 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <span className="text-xs text-gray-400 min-w-[40px] text-center">100%</span>
              <button className="p-1 text-gray-400 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Visible tracks indicator */}
        <div className="flex items-center space-x-2 mt-2">
          {visibleTracks.map((track) => (
            <div
              key={track.id}
              className="flex items-center space-x-1 px-2 py-1 rounded bg-gray-700"
            >
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: track.color }}
              />
              <span className="text-xs text-gray-300">{track.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tablet Timeline Content */}
      <div className="flex-1 overflow-hidden">
        <EducationalTimeline
          mode={mode}
          onModeChange={onModeChange}
          className="h-full tablet-optimized"
        />
      </div>
    </div>
  );
}