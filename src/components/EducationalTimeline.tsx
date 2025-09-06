import React, { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import { useTimeline, useMediaAssets, useUI, usePlayback } from '../state/hooks';
import { EducationalTrack } from './EducationalTrack';
import { suggestTrackPlacement, validateTrackPlacement } from '../lib/educationalPlacement';
import { 
  useThrottledScroll, 
  useResizeObserver, 
  useResponsiveBreakpoint,
  TimelineCalculations 
} from '../lib/performanceOptimizations';
import type { TimelineItem, MediaAsset } from '../lib/types';
import type { EducationalTrack as EducationalTrackType, UIMode, PlacementSuggestion } from '../lib/educationalTypes';
import { EDUCATIONAL_TRACKS, getEducationalTrackByNumber } from '../lib/educationalTypes';
import { Settings, Eye, EyeOff } from 'lucide-react';
import { ContentAdditionToolbar } from './ContentAdditionToolbar';
import { FLAGS } from '../lib/flags';

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

const TRACK_HEIGHT = 80; // Base track height (header moved to left column)
const MIN_NONEMPTY_TRACK_HEIGHT = 56; // Minimum height to keep clips usable
const MIN_EMPTY_TRACK_HEIGHT = 28; // Collapsed height for empty tracks
const HEADER_COL_WIDTH = 200; // Left sticky header column width (px)
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
  const breakpoint = useResponsiveBreakpoint();
  const { playback, seek } = usePlayback();

  const timelineRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null); // right scrollable area
  const [currentMode, setCurrentMode] = useState<'simplified' | 'advanced'>(mode);
  const [placementWarnings, setPlacementWarnings] = useState<PlacementWarning[]>([]);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragType: null,
    itemId: null,
    startX: 0,
    startTime: 0,
    startDuration: 0,
    startTrack: 0,
  });

  // Resize observer for container dimensions (observe the scroll container)
  const containerRef = useResizeObserver(
    useCallback((entry) => {
      setContainerSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    }, [])
  );

  // Calculate timeline dimensions with responsive adjustments
  const maxDuration = Math.max(timelineDuration, 60); // Minimum 60 seconds
  // Determine which tracks are non-empty
  const nonEmptyTrackIds = useMemo(() => {
    const set = new Set<number>();
    timeline.forEach((t) => set.add(t.track));
    return new Set(Array.from(set));
  }, [timeline]);

  // Compute responsive per-track height to try to fit all non-empty tracks
  const baseTrackHeight = breakpoint === 'mobile' ? 56 : breakpoint === 'tablet' ? 64 : TRACK_HEIGHT;

  const { perTrackHeight, totalTimelineHeight } = useMemo(() => {
    const emptyCount = EDUCATIONAL_TRACKS.filter(t => !nonEmptyTrackIds.has(t.trackNumber)).length;
    const nonEmptyCount = EDUCATIONAL_TRACKS.length - emptyCount;

    if (containerSize.height <= 0 || nonEmptyCount <= 0) {
      // Fallback
      const h = baseTrackHeight;
      return {
        perTrackHeight: EDUCATIONAL_TRACKS.map((t) => ({ id: t.id, height: nonEmptyTrackIds.has(t.trackNumber) ? h : Math.max(MIN_EMPTY_TRACK_HEIGHT, Math.round(h * 0.5)) })),
        totalTimelineHeight: EDUCATIONAL_TRACKS.length * h,
      };
    }

    const reservedForEmpty = emptyCount * MIN_EMPTY_TRACK_HEIGHT;

    // Preferred height for non-empty tracks
    const desiredHeight = baseTrackHeight;
    const totalIfDesired = nonEmptyCount * desiredHeight + reservedForEmpty;

    let chosenHeight: number;
    if (totalIfDesired <= containerSize.height) {
      // Plenty of space: use desired height (no vertical scroll)
      chosenHeight = desiredHeight;
    } else {
      // Try to fit; if too many tracks, this may still overflow and enable vertical scrolling
      const availableForNonEmpty = Math.max(0, containerSize.height - reservedForEmpty);
      const fitted = Math.floor(availableForNonEmpty / Math.max(1, nonEmptyCount));
      chosenHeight = Math.max(MIN_NONEMPTY_TRACK_HEIGHT, fitted);
    }

    const per = EDUCATIONAL_TRACKS.map((t) => ({
      id: t.id,
      height: nonEmptyTrackIds.has(t.trackNumber) ? chosenHeight : MIN_EMPTY_TRACK_HEIGHT,
    }));

    const total = per.reduce((sum, r) => sum + r.height, 0);
    return { perTrackHeight: per, totalTimelineHeight: total };
  }, [EDUCATIONAL_TRACKS, nonEmptyTrackIds, containerSize.height, baseTrackHeight]);

  const timelineWidth = TimelineCalculations.getTimeToPixels(
    maxDuration, 
    PIXELS_PER_SECOND, 
    ui.timeline.zoom,
    'timeline-width'
  );

  // Convert time to pixels with caching
  const timeToPixels = useCallback(
    (time: number) => {
      return TimelineCalculations.getTimeToPixels(
        time, 
        PIXELS_PER_SECOND, 
        ui.timeline.zoom,
        `timeline-${time}`
      );
    },
    [ui.timeline.zoom]
  );

  // Convert pixels to time with caching
  const pixelsToTime = useCallback(
    (pixels: number) => {
      return TimelineCalculations.getPixelsToTime(
        pixels, 
        PIXELS_PER_SECOND, 
        ui.timeline.zoom,
        `timeline-${pixels}`
      );
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

  // Utility: prevent overlap by adjusting start/duration to nearest free slot
  const resolveNoOverlap = useCallback((
    trackNumber: number,
    start: number,
    duration: number,
    excludeItemId?: string
  ): { start: number; duration: number } => {
    const items = timeline
      .filter((i) => i.track === trackNumber && i.id !== excludeItemId)
      .sort((a, b) => a.startTime - b.startTime);

    let proposedStart = Math.max(0, start);
    let proposedEnd = proposedStart + duration;

    // Push to the right until no overlap
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const itEnd = it.startTime + it.duration;
      const overlaps = !(proposedEnd <= it.startTime || proposedStart >= itEnd);
      if (overlaps) {
        proposedStart = itEnd;
        proposedEnd = proposedStart + duration;
      }
    }

    // Clamp to next neighbor if needed (shrink to fit)
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (proposedStart < it.startTime) {
        const nextStart = it.startTime;
        if (proposedEnd > nextStart) {
          proposedEnd = nextStart;
          duration = Math.max(MIN_CLIP_DURATION, proposedEnd - proposedStart);
        }
        break;
      }
    }

    return { start: proposedStart, duration: Math.max(MIN_CLIP_DURATION, duration) };
  }, [timeline]);

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

      const xRaw = e.clientX - rect.left + ui.timeline.scrollPosition;
      const x = Math.max(0, xRaw - HEADER_COL_WIDTH);
      const y = e.clientY - rect.top;

      let startTime = snapToGrid(pixelsToTime(x));
      
      // Determine target track
      let finalTrack: EducationalTrackType;
      
      if (targetTrack) {
        // Dropped on specific educational track
        finalTrack = targetTrack;
      } else {
        // Calculate track from Y position using per-track dynamic heights
        let acc = 0;
        let trackIndex = 0;
        for (let i = 0; i < perTrackHeight.length; i++) {
          acc += perTrackHeight[i].height;
          if (y < acc) { trackIndex = i; break; }
          if (i === perTrackHeight.length - 1) trackIndex = i;
        }
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

      // Adjust to avoid overlap on this track
      const adjusted = resolveNoOverlap(finalTrack.trackNumber, Math.max(0, startTime), asset.duration || 5);

      // Create timeline item
      const newItem: Omit<TimelineItem, 'id'> = {
        assetId: asset.id,
        startTime: adjusted.start,
        duration: adjusted.duration,
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

      const xContent = Math.max(0, e.clientX - rect.left + ui.timeline.scrollPosition - HEADER_COL_WIDTH);
      const clipX = timeToPixels(item.startTime);
      const clipWidth = timeToPixels(item.duration);

      // Determine drag type based on mouse position
      let dragType: 'move' | 'resize-left' | 'resize-right' = 'move';
      const relativeX = xContent - clipX;

      if (relativeX < 10) {
        dragType = 'resize-left';
      } else if (relativeX > clipWidth - 10) {
        dragType = 'resize-right';
      }

      setDragState({
        isDragging: true,
        dragType,
        itemId: item.id,
        startX: xContent,
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

      const currentX = Math.max(0, e.clientX - rect.left + ui.timeline.scrollPosition - HEADER_COL_WIDTH);
      const currentY = e.clientY - rect.top;
      const deltaX = currentX - dragState.startX;
      const deltaTime = pixelsToTime(deltaX);

      if (dragState.dragType === 'move') {
        let newStartTime = snapToGrid(
          Math.max(0, dragState.startTime + deltaTime)
        );
        
        // Calculate new track based on dynamic per-track heights
        let acc = 0;
        let trackIndex = 0;
        for (let i = 0; i < perTrackHeight.length; i++) {
          acc += perTrackHeight[i].height;
          if (currentY < acc) { trackIndex = i; break; }
          if (i === perTrackHeight.length - 1) trackIndex = i;
        }
        const newTrack = Math.max(0, Math.min(trackIndex, EDUCATIONAL_TRACKS.length - 1));

        // Enforce no overlap on target track using current item duration
        const thisItem = timeline.find((t) => t.id === dragState.itemId);
        const dur = thisItem ? thisItem.duration : 1;
        const adjustedMove = resolveNoOverlap(newTrack, newStartTime, dur, dragState.itemId || undefined);
        moveTimelineItem(dragState.itemId, adjustedMove.start, newTrack);
      } else if (dragState.dragType === 'resize-left') {
        let newStartTime = snapToGrid(
          Math.max(0, dragState.startTime + deltaTime)
        );
        let newDuration = Math.max(
          MIN_CLIP_DURATION,
          dragState.startDuration - deltaTime
        );

        // Clamp against previous neighbor to avoid overlap
        const itemsSameTrack = timeline
          .filter((i) => i.track === dragState.startTrack && i.id !== dragState.itemId)
          .sort((a, b) => a.startTime - b.startTime);
        const prev = itemsSameTrack.filter((i) => i.startTime <= dragState.startTime).pop();
        if (prev) {
          const prevEnd = prev.startTime + prev.duration;
          if (newStartTime < prevEnd) {
            const deltaBlock = prevEnd - newStartTime;
            newStartTime = prevEnd;
            newDuration = Math.max(MIN_CLIP_DURATION, newDuration - deltaBlock);
          }
        }

        moveTimelineItem(dragState.itemId, newStartTime, dragState.startTrack);
        resizeTimelineItem(dragState.itemId, newDuration);
      } else if (dragState.dragType === 'resize-right') {
        let newDuration = Math.max(
          MIN_CLIP_DURATION,
          dragState.startDuration + deltaTime
        );

        // Clamp against next neighbor to avoid overlap
        const itemsSameTrack = timeline
          .filter((i) => i.track === dragState.startTrack && i.id !== dragState.itemId)
          .sort((a, b) => a.startTime - b.startTime);
        const next = itemsSameTrack.find((i) => i.startTime >= dragState.startTime);
        if (next) {
          const maxEnd = next.startTime;
          const maxDuration = Math.max(MIN_CLIP_DURATION, maxEnd - dragState.startTime);
          if (newDuration > maxDuration) newDuration = maxDuration;
        }
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


  // Handle scroll with throttling for performance
  const handleScroll = useThrottledScroll(
    useCallback((scrollLeft: number, _scrollTop: number) => {
      updateTimelineView({ scrollPosition: scrollLeft });
    }, [updateTimelineView]),
    16 // ~60fps
  );

  // Dismiss placement warning
  const dismissPlacementWarning = useCallback((itemId: string) => {
    setPlacementWarnings(prev => 
      prev.map(w => w.itemId === itemId ? { ...w, show: false } : w)
    );
  }, []);

  // Playhead scrubbing state
  const [isScrubbing, setIsScrubbing] = useState(false);

  // Helper to compute time from mouse X within the scrollable grid
  const computeTimeFromClientX = useCallback((clientX: number) => {
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    const xContent = Math.max(0, clientX - rect.left + ui.timeline.scrollPosition - HEADER_COL_WIDTH);
    return Math.max(0, Math.min(maxDuration, pixelsToTime(xContent)));
  }, [ui.timeline.scrollPosition, pixelsToTime, maxDuration]);

  const handleScrubStart = useCallback((e: React.MouseEvent) => {
    // Ignore scrubbing if a clip drag initiated (propagation is stopped in clip handler)
    setIsScrubbing(true);
    const t = computeTimeFromClientX(e.clientX);
    seek(t);
  }, [computeTimeFromClientX, seek]);

  const handleScrubMove = useCallback((e: MouseEvent) => {
    if (!isScrubbing) return;
    const t = computeTimeFromClientX(e.clientX);
    seek(t);
  }, [isScrubbing, computeTimeFromClientX, seek]);

  const handleScrubEnd = useCallback(() => {
    setIsScrubbing(false);
  }, []);

  // Apply suggested placement
  const applySuggestedPlacement = useCallback((itemId: string, suggestion: PlacementSuggestion) => {
    const item = timeline.find(t => t.id === itemId);
    if (item) {
      moveTimelineItem(itemId, item.startTime, suggestion.suggestedTrack.trackNumber);
      dismissPlacementWarning(itemId);
    }
  }, [timeline, moveTimelineItem, dismissPlacementWarning]);

  // Add global mouse event listeners for dragging and scrubbing
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (dragState.isDragging) handleMouseMove(e as any);
      if (isScrubbing) handleScrubMove(e);
    };

    const handleGlobalMouseUp = () => {
      if (dragState.isDragging) handleMouseUp();
      if (isScrubbing) handleScrubEnd();
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [dragState.isDragging, isScrubbing, handleMouseMove, handleMouseUp, handleScrubMove, handleScrubEnd]);

  return (
    <div
      className={`educational-timeline bg-background-secondary border-t border-border-subtle flex flex-col ${className}`}
    >
      {/* Educational Timeline Header */}
      <div className="educational-timeline-header bg-background-tertiary border-b border-border-subtle p-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-text-primary">Educational Timeline</span>
          
          {/* Mode Toggle (behind ADVANCED_UI flag) */}
          {FLAGS.ADVANCED_UI && (
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
          )}

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

          {/* Inline quick-add actions */}
          <div className="ml-4 flex items-center">
            <ContentAdditionToolbar variant="inline" />
          </div>
        </div>

        <div className="text-xs text-text-tertiary">
          Duration: {Math.round(timelineDuration * 10) / 10}s
        </div>
      </div>

      {/* Timeline Content (grid with sticky left headers) */}
      <div
        ref={(el) => {
          scrollRef.current = el as HTMLDivElement;
          containerRef.current = el as HTMLDivElement;
        }}
        className="educational-timeline-content overflow-auto flex-1"
        onScroll={(e) => {
          const target = e.currentTarget;
          handleScroll(target.scrollLeft, target.scrollTop);
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={handleTimelineClick}
        onMouseDown={handleScrubStart}
      >
        <div
          ref={timelineRef}
          className="educational-timeline-grid relative grid"
          style={{
            gridTemplateColumns: `${HEADER_COL_WIDTH}px 1fr`,
            width: `${HEADER_COL_WIDTH + timelineWidth}px`,
            height: `${totalTimelineHeight}px`,
            minHeight: `${totalTimelineHeight}px`,
          }}
        >
          {/* Grid Lines overlay (right content column only) */}
          {ui.timeline.snapToGrid && (
            <div
              className="pointer-events-none absolute top-0 bottom-0"
              style={{ left: `${HEADER_COL_WIDTH}px`, right: 0 }}
            >
              {Array.from({ length: Math.ceil(maxDuration / ui.timeline.gridSize) }).map((_, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 border-l border-border-subtle opacity-30"
                  style={{ left: `${timeToPixels(i * ui.timeline.gridSize)}px` }}
                />
              ))}
            </div>
          )}

          {/* Playhead overlay */}
          <div
            className="pointer-events-none absolute top-0 bottom-0 z-30"
            style={{ left: `${HEADER_COL_WIDTH + timeToPixels(playback.currentTime)}px` }}
          >
            <div style={{ position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: 'var(--synapse-playhead)' }} />
            <div style={{ position: 'absolute', top: -6, left: -5, width: 10, height: 10, backgroundColor: 'var(--synapse-playhead)', borderRadius: 2 }} />
          </div>

          {/* Rows: Header cell + Content cell per track */}
          {EDUCATIONAL_TRACKS.map((track) => {
            const row = perTrackHeight.find((r) => r.id === track.id)!;
            const rowStyle: React.CSSProperties = { height: `${row.height}px` };
            return (
              <React.Fragment key={track.id}>
                {/* Left sticky header cell */}
                <div
                  className="sticky left-0 z-20 bg-background-tertiary border-b border-border-subtle flex items-center gap-2 px-3"
                  style={{ ...rowStyle, width: `${HEADER_COL_WIDTH}px` }}
                >
                  {/* Compact header content */}
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-semibold"
                    style={{ backgroundColor: track.color }}
                    title={`Track ${track.trackNumber + 1}`}
                  >
                    {track.name[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-text-primary truncate">{track.name}</div>
                    <div className="text-[10px] text-text-tertiary">Track {track.trackNumber + 1}</div>
                  </div>
                </div>

                {/* Right content cell */}
                <div className="relative border-b border-border-subtle" style={rowStyle}>
                  <EducationalTrack
                    track={track}
                    items={timeline}
                    isActive={false}
                    trackHeight={row.height}
                    timeToPixels={timeToPixels}
                    onItemDrop={(item) => handleSmartDrop(new DragEvent('drop') as any, track)}
                    onItemMouseDown={handleClipMouseDown}
                    selectedItems={selectedItems}
                    dragState={dragState}
                    // Performance optimization props
                    containerWidth={containerSize.width}
                    pixelsPerSecond={PIXELS_PER_SECOND}
                    zoom={ui.timeline.zoom}
                    scrollLeft={ui.timeline.scrollPosition}
                    useVirtualization={breakpoint === 'desktop' && timeline.length > 20}
                  />
                </div>
              </React.Fragment>
            );
          })}
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