import React, { useCallback, useRef, useState, useEffect } from 'react';
import { useTimeline, useMediaAssets, useUI } from '../state/hooks';
import type { TimelineItem, MediaAsset } from '../lib/types';

interface TimelineProps {
  className?: string;
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

const TRACK_HEIGHT = 60;
const PIXELS_PER_SECOND = 100;
const MIN_CLIP_DURATION = 0.1;
const SNAP_THRESHOLD = 10; // pixels

export function Timeline({ className = '' }: TimelineProps) {
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
  const maxTrack = Math.max(...timeline.map((item) => item.track), 3); // Minimum 4 tracks
  const timelineHeight = (maxTrack + 1) * TRACK_HEIGHT;

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

  // Handle drop from MediaBin
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
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
      const track = Math.floor(y / TRACK_HEIGHT);

      // Create timeline item
      const newItem: Omit<TimelineItem, 'id'> = {
        assetId: asset.id,
        startTime: Math.max(0, startTime),
        duration: asset.duration || 5, // Default 5 seconds for non-video assets
        track: Math.max(0, track),
        type: asset.type === 'image' ? 'video' : asset.type, // Images become video clips
        properties: {},
        animations: [],
        keyframes: [], // Initialize with empty keyframes
      };

      addTimelineItem(newItem);
    },
    [
      getMediaAssetById,
      ui.timeline.scrollPosition,
      ui.timeline.zoom,
      pixelsToTime,
      snapToGrid,
      addTimelineItem,
    ]
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
        const newTrack = Math.max(0, Math.floor(currentY / TRACK_HEIGHT));

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
      className={`timeline bg-background-secondary border-t border-border-subtle ${className}`}
    >
      {/* Timeline Header */}
      <div className="timeline-header bg-background-tertiary border-b border-border-subtle p-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-text-secondary">Timeline</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleZoom(-0.2)}
              className="p-1 text-text-secondary hover:text-text-primary transition-colors hover:bg-neutral-700 rounded"
              title="Zoom Out"
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
                  d="M20 12H4"
                />
              </svg>
            </button>
            <span className="text-xs text-text-tertiary">
              {Math.round(ui.timeline.zoom * 100)}%
            </span>
            <button
              onClick={() => handleZoom(0.2)}
              className="p-1 text-text-secondary hover:text-text-primary transition-colors hover:bg-neutral-700 rounded"
              title="Zoom In"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </div>
          <button
            onClick={() =>
              updateTimelineView({ snapToGrid: !ui.timeline.snapToGrid })
            }
            className={`px-2 py-1 text-xs rounded transition-colors ${
              ui.timeline.snapToGrid
                ? 'bg-primary-600 text-white shadow-glow'
                : 'bg-neutral-700 text-text-secondary hover:bg-neutral-600'
            }`}
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
        className="timeline-content overflow-auto"
        style={{ height: '200px' }}
        onScroll={handleScroll}
      >
        <div
          ref={timelineRef}
          className="timeline-canvas relative cursor-crosshair"
          style={{
            width: `${timelineWidth}px`,
            height: `${timelineHeight}px`,
            minHeight: '200px',
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

          {/* Track Lines */}
          {Array.from({ length: maxTrack + 1 }).map((_, trackIndex) => (
            <div
              key={trackIndex}
              className="absolute left-0 right-0 border-b border-border-subtle opacity-50"
              style={{
                top: `${trackIndex * TRACK_HEIGHT}px`,
                height: `${TRACK_HEIGHT}px`,
              }}
            >
              <div className="absolute left-2 top-2 text-xs text-text-tertiary">
                Track {trackIndex + 1}
              </div>
            </div>
          ))}

          {/* Timeline Items */}
          {timeline.map((item) => {
            const asset = getMediaAssetById(item.assetId);
            const isSelected = selectedItems.includes(item.id);
            const isDragging =
              dragState.isDragging && dragState.itemId === item.id;

            return (
              <TimelineClip
                key={item.id}
                item={item}
                asset={asset}
                isSelected={isSelected}
                isDragging={isDragging}
                style={{
                  left: `${timeToPixels(item.startTime)}px`,
                  top: `${item.track * TRACK_HEIGHT + 4}px`,
                  width: `${timeToPixels(item.duration)}px`,
                  height: `${TRACK_HEIGHT - 8}px`,
                }}
                onMouseDown={(e) => handleClipMouseDown(e, item)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface TimelineClipProps {
  item: TimelineItem;
  asset: MediaAsset | undefined;
  isSelected: boolean;
  isDragging: boolean;
  style: React.CSSProperties;
  onMouseDown: (e: React.MouseEvent) => void;
}

function TimelineClip({
  item,
  asset,
  isSelected,
  isDragging,
  style,
  onMouseDown,
}: TimelineClipProps) {
  const getClipColor = (type: string) => {
    switch (type) {
      case 'video':
        return 'bg-accent-blue';
      case 'audio':
        return 'bg-accent-green';
      case 'code':
        return 'bg-accent-mauve';
      case 'title':
        return 'bg-accent-peach';
      default:
        return 'bg-neutral-600';
    }
  };

  return (
    <div
      className={`
        absolute rounded cursor-move select-none border-2 transition-all
        ${getClipColor(item.type)}
        ${isSelected ? 'border-accent-yellow shadow-glow' : 'border-transparent'}
        ${isDragging ? 'opacity-75 z-10' : 'opacity-100'}
        hover:border-text-secondary
      `}
      style={style}
      onMouseDown={onMouseDown}
    >
      {/* Resize Handles */}
      <div className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize bg-text-primary bg-opacity-20 opacity-0 hover:opacity-100 transition-opacity" />
      <div className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize bg-text-primary bg-opacity-20 opacity-0 hover:opacity-100 transition-opacity" />

      {/* Clip Content */}
      <div className="p-2 h-full flex flex-col justify-between text-white text-xs overflow-hidden">
        <div className="font-medium truncate">
          {asset?.name || 'Unknown Asset'}
        </div>
        <div className="text-white text-opacity-75">
          {Math.round(item.duration * 10) / 10}s
        </div>
      </div>

      {/* Overlap Indicator */}
      {/* This would be calculated based on overlapping clips */}
    </div>
  );
}
