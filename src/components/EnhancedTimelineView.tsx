import React, { useState, useCallback } from 'react';
import { useTimeline } from '../state/hooks';
import type {
  TimelineItem,
  TimelineMarker,
  TimelineRegion,
} from '../lib/types';
import { AdvancedTimeline } from './AdvancedTimeline';
import { KeyframePropertiesPanel } from './KeyframePropertiesPanel';
import { TrackManager } from './TrackManager';
import { TimelineMarkerManager } from './TimelineMarkerManager';

interface EnhancedTimelineViewProps {
  className?: string;
}

type PanelType = 'keyframes' | 'tracks' | 'markers' | null;

export function EnhancedTimelineView({
  className = '',
}: EnhancedTimelineViewProps) {
  const { timeline, selectedItems, currentTime, setCurrentTime } =
    useTimeline();

  const [activePanel, setActivePanel] = useState<PanelType>('keyframes');
  const [selectedKeyframes, setSelectedKeyframes] = useState<string[]>([]);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

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
      setCurrentPlaybackTime(marker.time);
    },
    [setCurrentTime]
  );

  // Handle region navigation
  const handleRegionSelect = useCallback(
    (region: TimelineRegion) => {
      setCurrentTime(region.startTime);
      setCurrentPlaybackTime(region.startTime);
    },
    [setCurrentTime]
  );

  // Handle keyframe selection changes
  const handleKeyframeSelectionChange = useCallback((keyframes: string[]) => {
    setSelectedKeyframes(keyframes);
  }, []);

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
      {/* Left Sidebar - Track Manager */}
      {activePanel === 'tracks' && (
        <div
          className={`${getPanelWidth('tracks')} flex-shrink-0 transition-all duration-200`}
        >
          <TrackManager className="h-full" />
        </div>
      )}

      {/* Main Timeline Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Timeline Controls Header */}
        <div className="bg-gray-900 border-b border-gray-700 p-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Panel Toggle Buttons */}
            <div className="flex items-center space-x-1 bg-gray-800 rounded p-1">
              <button
                onClick={() => togglePanel('tracks')}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  activePanel === 'tracks'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
                title="Track Manager"
              >
                <svg
                  className="w-4 h-4 inline mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                  />
                </svg>
                Tracks
              </button>

              <button
                onClick={() => togglePanel('keyframes')}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  activePanel === 'keyframes'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
                title="Keyframe Properties"
              >
                <svg
                  className="w-4 h-4 inline mr-1"
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
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  activePanel === 'markers'
                    ? 'bg-green-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
                title="Timeline Markers"
              >
                <svg
                  className="w-4 h-4 inline mr-1"
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
            <div className="flex items-center space-x-2 bg-gray-800 rounded p-1">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 text-white hover:bg-gray-700 rounded transition-colors"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M15 14h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
              </button>

              <button
                onClick={() => {
                  setCurrentTime(0);
                  setCurrentPlaybackTime(0);
                }}
                className="p-2 text-white hover:bg-gray-700 rounded transition-colors"
                title="Go to Start"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                  />
                </svg>
              </button>

              <div className="text-xs text-gray-400 min-w-[60px] text-center">
                {Math.floor(currentPlaybackTime / 60)}:
                {(currentPlaybackTime % 60).toFixed(1).padStart(4, '0')}
              </div>
            </div>
          </div>

          {/* Timeline Status */}
          <div className="flex items-center space-x-4 text-sm text-gray-400">
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
            <span>Timeline Mode: Advanced</span>
          </div>
        </div>

        {/* Advanced Timeline */}
        <div className="flex-1 min-h-0">
          <AdvancedTimeline className="h-full w-full" />
        </div>
      </div>

      {/* Right Sidebar - Properties/Markers Panel */}
      {activePanel && (
        <div
          className={`${getPanelWidth(activePanel)} flex-shrink-0 transition-all duration-200`}
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
              currentTime={currentPlaybackTime}
              onMarkerSelect={handleMarkerSelect}
              onRegionSelect={handleRegionSelect}
            />
          )}
        </div>
      )}

      {/* Floating Timeline Info */}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 rounded px-3 py-2 text-xs text-white">
        <div>Items: {timeline.length}</div>
        <div>Selected: {selectedItems.length}</div>
        {selectedItem && selectedItem.keyframes.length > 0 && (
          <div>Keyframes: {selectedItem.keyframes.length}</div>
        )}
      </div>
    </div>
  );
}
