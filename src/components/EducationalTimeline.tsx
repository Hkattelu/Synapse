import React, { useCallback, useRef, useState, useEffect } from 'react';
import { useTimeline, useMediaAssets, useUI } from '../state/hooks';
import { EducationalTrack } from './EducationalTrack';
import { suggestTrackPlacement, validateTrackPlacement } from '../lib/educationalPlacement';
import type { TimelineItem, MediaAsset } from '../lib/types';
import type { EducationalTrack as EducationalTrackType, UIMode, PlacementSuggestion } from '../lib/educationalTypes';
import { EDUCATIONAL_TRACKS, getEducationalTrackByNumber } from '../lib/educationalTypes';
import Settings from 'lucide-react/dist/esm/icons/settings.js';
import Eye from 'lucide-react/dist/esm/icons/eye.js';
import EyeOff from 'lucide-react/dist/esm/icons/eye-off.js';

interface EducationalTimelineProps {
  className?: string;
  mode?: 'simplified' | 'advanced';
  onModeChange?: (mode: 'simplified' | 'advanced') => void;
}

interface DragState {
  isDragging: boolean;
  dragType: 'move' | 'resize-left' | 'resize-right' | null;
  itemId: string | null;
  startX: number;
  startTime: number;
  startDuration: number;
  startTrack: number;
}

interface PlacementWarning {
  itemId: string;
  suggestion: PlacementSuggestion;
  show: boolean;
}

const TRACK_HEIGHT = 80; // Increased for educational track headers
const PIXELS_PER_SECOND = 100;
const MIN_CLIP_DURATION = 0.1;

export function EducationalTimeline({ 
  className = '', 
  mode = 'simplified',
  onModeChange 
}: EducationalTimelineProps) {
  const {
    timeline,
    selectedItems,
    addTimelineItem,
    moveTimelineItem,
    resizeTimelineItem,
    selectTimelineItems,
    clearTimelineSelection,
    timelineDuration,
  } = useTimeline();

  const { getMediaAssetById } = useMediaAssets();
  const { ui, updateTimelineView } = useUI();

  const timelineRef = useRef<HTMLDivElement>(null);
  const [currentMode, setCurrentMode] = useState<'simplified' | 'advanced'>(mode);
  const [placementWarnings, setPlacementWarnings] = useState<PlacementWarning[]>([]);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragType: null,
    itemId: null,
    startX: 0,
    startTime: 0,
    startDuration: 0,
    startTrack: 0,
  });

  // Calculate timeline dimensions
  const maxDuration = Math.max(timelineDuration, 60); // Minimum 60 seconds
  const timelineWidth = maxDuration * PIXELS_PER_SECOND * ui.timeline.zoom;
  const timelineHeight = EDUCATIONAL_TRACKS.length * TRACK_HEIGHT;

  // Convert time to pixels
  const timeToPixels = useCallback(
    (time: number) => {
      return time * PIXELS_PER_SECOND * ui.timeline.zoom;
    },
    [ui.timeline.zoom]
  );

  // Convert pixels to time
  const pixelsToTime = useCallback(
    (pixels: number) => {
      return pixels / (PIXELS_PER_SECOND * ui.timeline.zoom);
    },
    [ui.timeline.zoom]
  );

  // Snap time to grid
  const snapToGrid = useCallback(
    (time: number) => {
      if (!ui.timeline.snapToGrid) return time;
      const gridSize = ui.timeline.gridSize;
      return Math.round(time / gridSize) * gridSize;
    },
    [ui.timeline.snapToGrid, ui.timeline.gridSize]
  );

  // Handle mode switching
  const handleModeChange = useCallback(
    (newMode: 'simplified' | 'advanced') => {
      setCurrentMode(newMode);
      onModeChange?.(newMode);
      
      // Update timeline view state to reflect mode change
      updateTimelineView({ 
        timelineMode: newMode === 'simplified' ? 'standard' : 'advanced' 
      });
    },
    [onModeChange, updateTimelineView]
  );

  // Smart content placement with suggestions
  const handleSmartDrop = useCallback(
    (e: React.DragEvent, targetTrack?: EducationalTrackType) => {
      e.preventDefault();

      const assetId = e.dataTransfer.getData('application/json');
      if (!assetId) return;

      const asset = getMediaAssetById(assetId);
      if (!asset) return;

      const rect = timelineRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left + ui.timeline.scrollPosition;
      const y = e.clientY - rect.top;

      const startTime = snapToGrid(pixelsToTime(x));
      
      // Determine target track
      let finalTrack: EducationalTrackType;
      
      if (targetTrack) {
        // Dropped on specific educational track
        finalTrack = targetTrack;
      } else {
        // Calculate track from Y position
        const trackIndex = Math.floor(y / TRACK_HEIGHT);
        finalTrack = EDUCATIONAL_TRACKS[Math.max(0, Math.min(trackIndex, EDUCATIONAL_TRACKS.length - 1))];
      }

      // Get smart placement suggestion
      const suggestion = suggestTrackPlacement(asset, {
        existingItems: timeline,
        currentTime: startTime,
        selectedTrack: finalTrack.trackNumber,
      });

      // Validate placement
      const validation = validateTrackPlacement(asset, finalTrack);

      // Create timeline item
      const newItem: Omit<TimelineItem, 'id'> = {
        assetId: asset.id,
        startTime: Math.max(0, startTime),
        duration: asset.duration || 5,
        track: finalTrack.trackNumber,
        type: asset.type === 'image' ? 'video' : asset.type,
        properties: {
          ...finalTrack.defaultProperties,
        },
        animations: [],
        keyframes: [],
      };

      const addedItem = addTimelineItem(newItem);

      // Show placement warning if needed
      if (!validation.isValid || validation.warnings.length > 0) {
        setPlacementWarnings(prev => [
          ...prev.filter(w => w.itemId !== addedItem.id),
          {
            itemId: addedItem.id,
            suggestion,
            show: true,
          }
        ]);

        // Auto-hide warning after 5 seconds
        setTimeout(() => {
          setPlacementWarnings(prev => 
            prev.map(w => w.itemId === addedItem.id ? { ...w, show: false } : w)
          );
        }, 5000);
      }
    },
    [
      getMediaAssetById,
      ui.timeline.scrollPosition,
      ui.timeline.zoom,
      pixelsToTime,
      snapToGrid,
      addTimelineItem,
      timeline,
    ]
  );

  // Handle drop from MediaBin
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      handleSmartDrop(e);
    },
    [handleSmartDrop]
  );

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  // Handle clip mouse down
  const handleClipMouseDown = useCallback(
    (e: React.MouseEvent, item: TimelineItem) => {
      e.preventDefault();
      e.stopPropagation();

      const rect = timelineRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left + ui.timeline.scrollPosition;
      const clipX = timeToPixels(item.startTime);
      const clipWidth = timeToPixels(item.duration);

      // Determine drag type based on mouse position
      let dragType: 'move' | 'resize-left' | 'resize-right' = 'move';
      const relativeX = x - clipX;

      if (relativeX < 10) {
        dragType = 'resize-left';
      } else if (relativeX > clipWidth - 10) {
        dragType = 'resize-right';
      }

      setDragState({
        isDragging: true,
        dragType,
        itemId: item.id,
        startX: x,
        startTime: item.startTime,
        startDuration: item.duration,
        startTrack: item.track,
      });

      // Select the item if not already selected
      if (!selectedItems.includes(item.id)) {
        selectTimelineItems([item.id]);
      }
    },
    [
      ui.timeline.scrollPosition,
      timeToPixels,
      selectedItems,
      selectTimelineItems,
    ]
  );

  // Handle mouse move
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragState.isDragging || !dragState.itemId) return;

      const rect = timelineRef.current?.getBoundingClientRect();
      if (!rect) return;

      const currentX = e.clientX - rect.left + ui.timeline.scrollPosition;
      const currentY = e.clientY - rect.top;
      const deltaX = currentX - dragState.startX;
      const deltaTime = pixelsToTime(deltaX);

      if (dragState.dragType === 'move') {
        const newStartTime = snapToGrid(
          Math.max(0, dragState.startTime + deltaTime)
        );
        
        // Calculate new track based on educational tracks
        const trackIndex = Math.floor(currentY / TRACK_HEIGHT);
        const newTrack = Math.max(0, Math.min(trackIndex, EDUCATIONAL_TRACKS.length - 1));

        moveTimelineItem(dragState.itemId, newStartTime, newTrack);
      } else if (dragState.dragType === 'resize-left') {
        const newStartTime = snapToGrid(
          Math.max(0, dragState.startTime + deltaTime)
        );
        const newDuration = Math.max(
          MIN_CLIP_DURATION,
          dragState.startDuration - deltaTime
        );

        moveTimelineItem(dragState.itemId, newStartTime, dragState.startTrack);
        resizeTimelineItem(dragState.itemId, newDuration);
      } else if (dragState.dragType === 'resize-right') {
        const newDuration = Math.max(
          MIN_CLIP_DURATION,
          dragState.startDuration + deltaTime
        );
        resizeTimelineItem(dragState.itemId, newDuration);
      }
    },
    [
      dragState,
      ui.timeline.scrollPosition,
      pixelsToTime,
      snapToGrid,
      moveTimelineItem,
      resizeTimelineItem,
    ]
  );

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setDragState({
      isDragging: false,
      dragType: null,
      itemId: null,
      startX: 0,
      startTime: 0,
      startDuration: 0,
      startTrack: 0,
    });
  }, []);

  // Handle timeline click (for deselection)
  const handleTimelineClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        clearTimelineSelection();
      }
    },
    [clearTimelineSelection]
  );

  // Handle zoom
  const handleZoom = useCallback(
    (delta: number) => {
      const newZoom = Math.max(0.1, Math.min(5, ui.timeline.zoom + delta));
      updateTimelineView({ zoom: newZoom });
    },
    [ui.timeline.zoom, updateTimelineView]
  );

  // Handle scroll
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const scrollLeft = e.currentTarget.scrollLeft;
      updateTimelineView({ scrollPosition: scrollLeft });
    },
    [updateTimelineView]
  );

  // Dismiss placement warning
  const dismissPlacementWarning = useCallback((itemId: string) => {
    setPlacementWarnings(prev => 
      prev.map(w => w.itemId === itemId ? { ...w, show: false } : w)
    );
  }, []);

  // Apply suggested placement
  const applySuggestedPlacement = useCallback((itemId: string, suggestion: PlacementSuggestion) => {
    const item = timeline.find(t => t.id === itemId);
    if (item) {
      moveTimelineItem(itemId, item.startTime, suggestion.suggestedTrack.trackNumber);
      dismissPlacementWarning(itemId);
    }
  }, [timeline, moveTimelineItem, dismissPlacementWarning]);

  // Add global mouse event listeners
  useEffect(() => {
    if (dragState.isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        handleMouseMove(e as any);
      };

      const handleGlobalMouseUp = () => {
        handleMouseUp();
      };

      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      className={`educational-timeline bg-background-secondary border-t border-border-subtle flex flex-col ${className}`}
    >
      {/* Educational Timeline Header */}
      <div className="educational-timeline-header bg-background-tertiary border-b border-border-subtle p-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-text-primary">Educational Timeline</span>
          
          {/* Mode Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleModeChange(currentMode === 'simplified' ? 'advanced' : 'simplified')}
              className={`
                flex items-center space-x-2 px-3 py-1.5 text-xs rounded-md transition-all
                ${currentMode === 'simplified' 
                  ? 'bg-primary-600 text-white shadow-glow' 
                  : 'bg-neutral-700 text-text-secondary hover:bg-neutral-600'
                }
              `}
              title={`Switch to ${currentMode === 'simplified' ? 'Advanced' : 'Simplified'} Mode`}
              data-help-id="timeline-mode-toggle"
            >
              {currentMode === 'simplified' ? (
                <>
                  <Eye className="w-3 h-3" />
                  <span>Simplified</span>
                </>
              ) : (
                <>
                  <Settings className="w-3 h-3" />
                  <span>Advanced</span>
                </>
              )}
            </button>
          </div>

          {/* Timeline Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleZoom(-0.2)}
              className="p-1 text-text-secondary hover:text-text-primary transition-colors hover:bg-neutral-700 rounded"
              title="Zoom Out"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="text-xs text-text-tertiary min-w-[40px] text-center">
              {Math.round(ui.timeline.zoom * 100)}%
            </span>
            <button
              onClick={() => handleZoom(0.2)}
              className="p-1 text-text-secondary hover:text-text-primary transition-colors hover:bg-neutral-700 rounded"
              title="Zoom In"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {/* Snap to Grid Toggle */}
          <button
            onClick={() =>
              updateTimelineView({ snapToGrid: !ui.timeline.snapToGrid })
            }
            className={`px-2 py-1 text-xs rounded transition-colors ${
              ui.timeline.snapToGrid
                ? 'bg-primary-600 text-white shadow-glow'
                : 'bg-neutral-700 text-text-secondary hover:bg-neutral-600'
            }`}
            data-help-id="snap-toggle"
          >
            Snap
          </button>
        </div>

        <div className="text-xs text-text-tertiary">
          Duration: {Math.round(timelineDuration * 10) / 10}s
        </div>
      </div>

      {/* Timeline Content */}
      <div
        className="educational-timeline-content overflow-auto flex-1"
        onScroll={handleScroll}
      >
        <div
          ref={timelineRef}
          className="educational-timeline-canvas relative"
          style={{
            width: `${timelineWidth}px`,
            height: `${timelineHeight}px`,
            minHeight: `${EDUCATIONAL_TRACKS.length * TRACK_HEIGHT}px`,
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={handleTimelineClick}
        >
          {/* Grid Lines */}
          {ui.timeline.snapToGrid && (
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({
                length: Math.ceil(maxDuration / ui.timeline.gridSize),
              }).map((_, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 border-l border-border-subtle opacity-30"
                  style={{
                    left: `${timeToPixels(i * ui.timeline.gridSize)}px`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Educational Tracks */}
          {EDUCATIONAL_TRACKS.map((track, index) => (
            <div
              key={track.id}
              className="absolute left-0 right-0"
              style={{
                top: `${index * TRACK_HEIGHT}px`,
                height: `${TRACK_HEIGHT}px`,
              }}
            >
              <EducationalTrack
                track={track}
                items={timeline}
                isActive={false}
                trackHeight={TRACK_HEIGHT}
                timeToPixels={timeToPixels}
                onItemDrop={(item) => handleSmartDrop(new DragEvent('drop') as any, track)}
                onItemMouseDown={handleClipMouseDown}
                selectedItems={selectedItems}
                dragState={dragState}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Placement Warnings */}
      {placementWarnings
        .filter(warning => warning.show)
        .map(warning => (
          <PlacementWarningToast
            key={warning.itemId}
            warning={warning}
            onDismiss={() => dismissPlacementWarning(warning.itemId)}
            onApplySuggestion={() => applySuggestedPlacement(warning.itemId, warning.suggestion)}
          />
        ))}
    </div>
  );
}

interface PlacementWarningToastProps {
  warning: PlacementWarning;
  onDismiss: () => void;
  onApplySuggestion: () => void;
}

function PlacementWarningToast({ 
  warning, 
  onDismiss, 
  onApplySuggestion 
}: PlacementWarningToastProps) {
  return (
    <div className="fixed bottom-4 right-4 bg-background-tertiary border border-border-subtle rounded-lg shadow-lg p-4 max-w-sm z-50">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-accent-yellow bg-opacity-20 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-accent-yellow" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-text-primary mb-1">
            Track Placement Suggestion
          </h4>
          <p className="text-xs text-text-secondary mb-3">
            {warning.suggestion.reason}
          </p>
          <div className="flex space-x-2">
            <button
              onClick={onApplySuggestion}
              className="px-3 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
            >
              Move to {warning.suggestion.suggestedTrack.name}
            </button>
            <button
              onClick={onDismiss}
              className="px-3 py-1 text-xs bg-neutral-700 text-text-secondary rounded hover:bg-neutral-600 transition-colors"
            >
              Keep Here
            </button>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-text-tertiary hover:text-text-secondary transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}