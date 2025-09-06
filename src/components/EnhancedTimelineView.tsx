import { useState, useCallback } from 'react';
import { useTimeline, usePlayback } from '../state/hooks';
import type {
  TimelineMarker,
  TimelineRegion,
} from '../lib/types';
import { AdvancedTimeline } from './AdvancedTimeline';
import { KeyframePropertiesPanel } from './KeyframePropertiesPanel';
import { TimelineMarkerManager } from './TimelineMarkerManager';

interface EnhancedTimelineViewProps {
  className?: string;
}

type PanelType = 'keyframes' | 'tracks' | 'markers' | null;

export function EnhancedTimelineView({
  className = '',
}: EnhancedTimelineViewProps) {
  const { timeline, selectedItems, setCurrentTime } =
    useTimeline();
  const { playback, togglePlayback, seek } = usePlayback();

  const [activePanel, setActivePanel] = useState<PanelType>('keyframes');
  const [selectedKeyframes, setSelectedKeyframes] = useState<string[]>([]);

  // Get selected timeline item
  const selectedItem =
    selectedItems.length === 1
      ? timeline.find((item) => item.id === selectedItems[0]) || null
      : null;

  // Handle panel toggle
  const togglePanel = useCallback((panel: PanelType) => {
    setActivePanel((current) => (current === panel ? null : panel));
  }, []);

  // Handle marker navigation
  const handleMarkerSelect = useCallback(
    (marker: TimelineMarker) => {
      setCurrentTime(marker.time);
      seek(marker.time);
    },
    [setCurrentTime, seek]
  );

  // Handle region navigation
  const handleRegionSelect = useCallback(
    (region: TimelineRegion) => {
      setCurrentTime(region.startTime);
      seek(region.startTime);
    },
    [setCurrentTime, seek]
  );

  // Panel width calculation
  const getPanelWidth = (panel: PanelType) => {
    switch (panel) {
      case 'keyframes':
        return 'w-80';
      case 'tracks':
        return 'w-64';
      case 'markers':
        return 'w-72';
      default:
        return 'w-0';
    }
  };

  return (
    <div className={`enhanced-timeline-view flex h-full ${className}`}>
      {/* Main Timeline Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Timeline Controls Header */}
        <div className="bg-background-tertiary border-b border-border-subtle px-3 py-2 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-4">
            {/* Panel Toggle Buttons - Simplified and Consistent */}
            <div className="flex items-center space-x-1 bg-synapse-surface rounded p-0.5">
              <button
                onClick={() => togglePanel('keyframes')}
                className={`px-3 py-1.5 text-xs rounded transition-colors ${activePanel === 'keyframes'
                  ? 'bg-synapse-primary text-synapse-text-inverse'
                  : 'text-text-secondary hover:text-text-primary hover:bg-synapse-surface-hover'
                  }`}
                title="Keyframe Properties"
              >
                <svg
                  className="w-3.5 h-3.5 inline mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Keyframes
              </button>

              <button
                onClick={() => togglePanel('markers')}
                className={`px-3 py-1.5 text-xs rounded transition-colors ${activePanel === 'markers'
                  ? 'bg-synapse-primary text-synapse-text-inverse'
                  : 'text-text-secondary hover:text-text-primary hover:bg-synapse-surface-hover'
                  }`}
                title="Timeline Markers"
              >
                <svg
                  className="w-3.5 h-3.5 inline mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Markers
              </button>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center space-x-1 bg-synapse-surface rounded p-0.5">
              <button
                onClick={togglePlayback}
                className="p-2.5 text-text-primary hover:bg-synapse-surface-hover rounded transition-colors"
                title={playback.isPlaying ? 'Pause' : 'Play'}
              >
                {playback.isPlaying ? (
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M8 5v14l11-7z"
                    />
                  </svg>
                )}
              </button>

              <button
                onClick={() => {
                  setCurrentTime(0);
                  seek(0);
                }}
                className="p-2.5 text-text-primary hover:bg-synapse-surface-hover rounded transition-colors"
                title="Go to Start"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z"
                  />
                </svg>
              </button>

              <div className="text-xs text-text-secondary min-w-[70px] text-center px-2 py-1">
                {Math.floor(playback.currentTime / 60)}:
                {(playback.currentTime % 60).toFixed(1).padStart(4, '0')}
              </div>
            </div>
          </div>

          {/* Timeline Status */}
          <div className="flex items-center space-x-3 text-xs text-text-secondary">
            {selectedItems.length > 0 && (
              <span>
                {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''}{' '}
                selected
              </span>
            )}
            {selectedKeyframes.length > 0 && (
              <span>
                {selectedKeyframes.length} keyframe
                {selectedKeyframes.length > 1 ? 's' : ''} selected
              </span>
            )}
          </div>
        </div>

        {/* Advanced Timeline - Fixed height to prevent movement */}
        <div className="flex-1 min-h-0 h-80">
          <AdvancedTimeline className="h-full w-full" />
        </div>
      </div>

      {/* Right Sidebar - Properties/Markers Panel */}
      {activePanel && (
        <div
          className={`${getPanelWidth(activePanel)} flex-shrink-0 transition-all duration-200 border-l border-border-subtle`}
        >
          {activePanel === 'keyframes' && (
            <KeyframePropertiesPanel
              className="h-full"
              selectedItem={selectedItem}
              selectedKeyframes={selectedKeyframes}
            />
          )}

          {activePanel === 'markers' && (
            <TimelineMarkerManager
              className="h-full"
              currentTime={playback.currentTime}
              onMarkerSelect={handleMarkerSelect}
              onRegionSelect={handleRegionSelect}
            />
          )}
        </div>
      )}
    </div>
  );
}
