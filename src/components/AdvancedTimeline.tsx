import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  useTimeline,
  useMediaAssets,
  useUI,
  usePlayback,
  useProject,
} from '../state/hooks';
import { useProjectStore } from '../state/projectStore';
import type { TimelineItem, MediaAsset, Keyframe } from '../lib/types';
import { KeyframeManager, createKeyframe } from '../lib/keyframes';

interface AdvancedTimelineProps {
  className?: string;
}

interface DragState {
  isDragging: boolean;
  dragType: 'move' | 'resize-left' | 'resize-right' | 'keyframe' | null;
  itemId: string | null;
  keyframeId?: string | null;
  startX: number;
  startY: number;
  startTime: number;
  startDuration: number;
  startTrack: number;
}

const TRACK_HEIGHT = 80; // Increased for keyframe editing
const PIXELS_PER_SECOND = 100;

export function AdvancedTimeline({ className = '' }: AdvancedTimelineProps) {
  const {
    timeline,
    selectedItems,
    addTimelineItem,
    moveTimelineItem,
    resizeTimelineItem,
    updateTimelineItem,
    selectTimelineItems,
    clearTimelineSelection,
    timelineDuration,
  } = useTimeline();

  const { getMediaAssetById } = useMediaAssets();
  const { ui, updateTimelineView } = useUI();
  const { playback, seek } = usePlayback();
  const { project } = useProject();

  const timelineRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragType: null,
    itemId: null,
    keyframeId: null,
    startX: 0,
    startY: 0,
    startTime: 0,
    startDuration: 0,
    startTrack: 0,
  });

  const [showKeyframes, setShowKeyframes] = useState(true);
  const [selectedKeyframes, setSelectedKeyframes] = useState<string[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Track fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () =>
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Calculate timeline dimensions using project duration as a floor
  const compositionDuration = project?.settings?.duration ?? 0;
  const maxDuration = Math.max(timelineDuration, compositionDuration, 60);
  const timelineWidth = maxDuration * PIXELS_PER_SECOND * ui.timeline.zoom;
  const maxTrack = Math.max(...timeline.map((item) => item.track), 3);
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

  // Handle timeline item drop
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

      const newItem: Omit<TimelineItem, 'id'> = {
        assetId: asset.id,
        startTime: Math.max(0, startTime),
        duration: asset.duration || 5,
        track: Math.max(0, track),
        type: asset.type === 'image' ? 'video' : asset.type,
        properties: {
          opacity: 1,
          scale: 1,
          x: 0,
          y: 0,
          rotation: 0,
        },
        animations: [],
        keyframes: [],
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

  // Add keyframe to selected item
  const addKeyframe = useCallback(
    (property: string, time: number, value: any) => {
      if (selectedItems.length !== 1) return;

      const itemId = selectedItems[0];
      const item = timeline.find((item) => item.id === itemId);
      if (!item) return;

      const keyframe = createKeyframe(time, { [property]: value });
      const updatedItem = KeyframeManager.addKeyframe(item, keyframe);

      updateTimelineItem(itemId, { keyframes: updatedItem.keyframes });
    },
    [selectedItems, timeline, updateTimelineItem]
  );

  // Handle keyframe click
  const handleKeyframeClick = useCallback(
    (e: React.MouseEvent, keyframeId: string, itemId: string) => {
      e.preventDefault();
      e.stopPropagation();

      if (!e.ctrlKey && !e.metaKey) {
        setSelectedKeyframes([keyframeId]);
      } else {
        setSelectedKeyframes((prev) =>
          prev.includes(keyframeId)
            ? prev.filter((id) => id !== keyframeId)
            : [...prev, keyframeId]
        );
      }
    },
    []
  );

  // Handle keyframe drag start
  const handleKeyframeDragStart = useCallback(
    (e: React.MouseEvent, keyframe: Keyframe, itemId: string) => {
      e.preventDefault();
      e.stopPropagation();

      const rect = timelineRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left + ui.timeline.scrollPosition;

      setDragState({
        isDragging: true,
        dragType: 'keyframe',
        itemId,
        keyframeId: keyframe.id,
        startX: x,
        startY: e.clientY - rect.top,
        startTime: keyframe.time,
        startDuration: 0,
        startTrack: 0,
      });
    },
    [ui.timeline.scrollPosition]
  );

  // Handle double-click to add keyframe
  const handleTimelineDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (selectedItems.length !== 1) return;

      const rect = timelineRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left + ui.timeline.scrollPosition;
      const clickTime = pixelsToTime(x);

      const itemId = selectedItems[0];
      const item = timeline.find((item) => item.id === itemId);
      if (!item) return;

      // Add keyframe at current time with current property values
      const time = Math.max(
        0,
        Math.min(clickTime - item.startTime, item.duration)
      );
      addKeyframe('opacity', time, item.properties.opacity || 1);
    },
    [
      selectedItems,
      timeline,
      ui.timeline.scrollPosition,
      pixelsToTime,
      addKeyframe,
    ]
  );

  // Handle mouse move for keyframe dragging
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragState.isDragging || !dragState.itemId) return;

      const rect = timelineRef.current?.getBoundingClientRect();
      if (!rect) return;

      const currentX = e.clientX - rect.left + ui.timeline.scrollPosition;

      if (dragState.dragType === 'keyframe' && dragState.keyframeId) {
        const deltaTime = pixelsToTime(currentX - dragState.startX);
        const newTime = snapToGrid(
          Math.max(0, dragState.startTime + deltaTime)
        );

        const item = timeline.find((item) => item.id === dragState.itemId);
        if (!item) return;

        const clampedTime = Math.min(newTime, item.duration);
        const updatedItem = KeyframeManager.updateKeyframe(
          item,
          dragState.keyframeId,
          { time: clampedTime }
        );

        updateTimelineItem(dragState.itemId, {
          keyframes: updatedItem.keyframes,
        });
      }
    },
    [
      dragState,
      ui.timeline.scrollPosition,
      pixelsToTime,
      snapToGrid,
      timeline,
      updateTimelineItem,
    ]
  );

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setDragState({
      isDragging: false,
      dragType: null,
      itemId: null,
      keyframeId: null,
      startX: 0,
      startY: 0,
      startTime: 0,
      startDuration: 0,
      startTrack: 0,
    });
  }, []);

  // Auto-generate keyframes from presets
  const generateKeyframesFromPresets = useCallback(
    (itemId: string) => {
      const item = timeline.find((item) => item.id === itemId);
      if (!item) return;

      const updatedItem = KeyframeManager.generateKeyframesFromPresets(item);
      updateTimelineItem(itemId, { keyframes: updatedItem.keyframes });
    },
    [timeline, updateTimelineItem]
  );

  // Fit to duration
  const handleFitToDuration = useCallback(() => {
    const viewport = scrollRef.current;
    if (!viewport) return;
    const available = Math.max(1, viewport.clientWidth - 16);
    const contentWidth = timeToPixels(maxDuration) / ui.timeline.zoom; // width at zoom=1
    const targetZoom = Math.max(0.1, Math.min(5, available / contentWidth));
    updateTimelineView({ zoom: targetZoom, scrollPosition: 0 });
    viewport.scrollLeft = 0;
  }, [
    scrollRef,
    timeToPixels,
    maxDuration,
    ui.timeline.zoom,
    updateTimelineView,
  ]);

  // Delete selected keyframes
  const deleteSelectedKeyframes = useCallback(() => {
    selectedKeyframes.forEach((keyframeId) => {
      const item = timeline.find((item) =>
        (item.keyframes ?? []).some((k) => k.id === keyframeId)
      );
      if (!item) return;

      const updatedItem = KeyframeManager.removeKeyframe(item, keyframeId);
      updateTimelineItem(item.id, { keyframes: updatedItem.keyframes });
    });

    setSelectedKeyframes([]);
  }, [selectedKeyframes, timeline, updateTimelineItem]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();

        // Delete selected keyframes first, then selected clips
        if (selectedKeyframes.length > 0) {
          deleteSelectedKeyframes();
        } else if (selectedItems.length > 0) {
          // Delete selected timeline items
          selectedItems.forEach((itemId) => {
            const item = timeline.find((item) => item.id === itemId);
            if (item) {
              // Remove from timeline using the project store
              const { deleteClip } = useProjectStore.getState();
              deleteClip(itemId);
            }
          });
          clearTimelineSelection();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    deleteSelectedKeyframes,
    selectedKeyframes,
    selectedItems,
    timeline,
    clearTimelineSelection,
  ]);

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
      className={`advanced-timeline bg-background-secondary border-t border-border-subtle flex flex-col ${className}`}
    >
      {/* Advanced Timeline Header */}
      <div className="timeline-header bg-background-tertiary border-b border-border-subtle p-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-text-secondary">Advanced Timeline</span>

          {/* Timeline Mode Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowKeyframes(!showKeyframes)}
              className={`px-2 py-1 text-xs rounded ${
                showKeyframes
                  ? 'bg-synapse-primary text-synapse-text-inverse'
                  : 'bg-synapse-surface-hover text-synapse-text-secondary'
              } hover:bg-synapse-primary-hover transition-colors`}
              title="Toggle Keyframe View"
            >
              Keyframes
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() =>
                updateTimelineView({
                  zoom: Math.max(0.1, ui.timeline.zoom - 0.2),
                })
              }
              className="p-1 text-text-secondary hover:text-text-primary transition-colors"
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
              onClick={() =>
                updateTimelineView({
                  zoom: Math.min(5, ui.timeline.zoom + 0.2),
                })
              }
              className="p-1 text-text-secondary hover:text-text-primary transition-colors"
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

          {/* Snap Toggle */}
          <button
            onClick={() =>
              updateTimelineView({ snapToGrid: !ui.timeline.snapToGrid })
            }
            className={`px-2 py-1 text-xs rounded ${
              ui.timeline.snapToGrid
                ? 'bg-synapse-primary text-synapse-text-inverse'
                : 'bg-synapse-surface-hover text-synapse-text-secondary'
            } hover:bg-synapse-primary-hover transition-colors`}
          >
            Snap
          </button>
          <button
            onClick={handleFitToDuration}
            className="ml-2 px-2 py-1 text-xs rounded bg-synapse-surface-hover text-text-secondary hover:text-text-primary hover:bg-synapse-surface-active transition-colors"
            title="Fit to duration"
          >
            Fit
          </button>

          {/* Auto-Generate Keyframes */}
          {selectedItems.length === 1 && (
            <button
              onClick={() => generateKeyframesFromPresets(selectedItems[0])}
              className="px-2 py-1 text-xs rounded bg-synapse-success text-synapse-text-inverse hover:opacity-90 transition-colors"
              title="Generate keyframes from animation presets"
            >
              Auto-Animate
            </button>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-xs text-text-tertiary">
            Duration: {Math.round(timelineDuration * 10) / 10}s
          </div>
          {selectedKeyframes.length > 0 && (
            <div className="text-text-primary">
              {selectedKeyframes.length} keyframe
              {selectedKeyframes.length > 1 ? 's' : ''} selected
            </div>
          )}
        </div>
      </div>

      {/* Timeline Content */}
      <div
        ref={scrollRef}
        className="timeline-content overflow-x-auto overflow-y-hidden flex-1"
        onScroll={(e) => {
          const scrollLeft = e.currentTarget.scrollLeft;
          updateTimelineView({ scrollPosition: scrollLeft });
        }}
        onWheel={(e) => {
          if (e.shiftKey) {
            e.preventDefault();
            const delta = Math.sign(e.deltaY) * -0.2;
            const newZoom = Math.max(
              0.1,
              Math.min(5, ui.timeline.zoom + delta)
            );
            updateTimelineView({ zoom: newZoom });
          } else {
            const el = e.currentTarget as HTMLDivElement;
            const delta = e.deltaY !== 0 ? e.deltaY : e.deltaX;
            if (delta !== 0) {
              e.preventDefault();
              el.scrollLeft += delta;
              updateTimelineView({ scrollPosition: el.scrollLeft });
            }
          }
        }}
      >
        {/* Time Ruler */}
        <div
          className="sticky top-0 z-40 bg-background-secondary border-b border-border-subtle"
          style={{ width: `${timelineWidth}px`, height: '32px' }}
        >
          {Array.from({ length: Math.ceil(maxDuration) + 1 }).map((_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 flex flex-col justify-between text-xs text-text-secondary font-medium"
              style={{ left: `${timeToPixels(i)}px` }}
            >
              <div className="border-l border-border-subtle h-full" />
              <div className="absolute bottom-2 -left-4 w-8 text-center bg-background-secondary px-1 rounded">
                {Math.floor(i / 60)}:{(i % 60).toString().padStart(2, '0')}
              </div>
            </div>
          ))}
        </div>

        <div
          ref={timelineRef}
          className="timeline-canvas relative cursor-crosshair"
          style={{
            width: `${timelineWidth}px`,
            height: `${timelineHeight}px`,
            minHeight: '400px',
          }}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
          }}
          onDoubleClick={handleTimelineDoubleClick}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              clearTimelineSelection();
              setSelectedKeyframes([]);

              // Seek to clicked time
              const rect = timelineRef.current?.getBoundingClientRect();
              if (rect) {
                const x = e.clientX - rect.left;
                const clickedTime = pixelsToTime(x);
                seek(Math.max(0, clickedTime));
              }
            }
          }}
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
              <div className="absolute left-2 top-2 text-xs text-text-secondary font-medium bg-background-secondary/80 px-2 py-1 rounded flex items-center gap-1">
                <div className="relative group">
                  <button
                    className="p-1 rounded hover:bg-synapse-surface-hover text-text-tertiary hover:text-text-primary"
                    aria-describedby={`adv-tip-${trackIndex}`}
                    aria-label={`Tips for track ${trackIndex + 1}`}
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 18h.01" />
                      <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                      <circle cx="12" cy="12" r="9" />
                    </svg>
                  </button>
                  <div
                    role="tooltip"
                    id={`adv-tip-${trackIndex}`}
                    className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-background-tertiary border border-border-subtle text-text-primary text-xs rounded-md shadow-lg w-64"
                  >
                    <div className="px-3 py-2 border-b border-border-subtle font-medium">
                      Advanced Timeline Tips
                    </div>
                    <div className="px-3 py-2">
                      <ul className="list-disc pl-4 space-y-1">
                        <li>Double-click to add keyframes</li>
                        <li>Drag keyframes to retime</li>
                        <li>Use Snap and Zoom for alignment</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Playhead - Hidden when fullscreen is active */}
          {!isFullscreen && (
            <div
              className="absolute top-0 bottom-0 w-0.5 pointer-events-none z-50"
              style={{
                left: `${timeToPixels(playback.currentTime)}px`,
                backgroundColor: 'var(--synapse-playhead)',
              }}
            >
              {/* Playhead Handle */}
              <div
                className="absolute -top-2 -left-2 w-4 h-4 rounded-full border-2 shadow-lg pointer-events-auto cursor-pointer"
                style={{
                  backgroundColor: 'var(--synapse-playhead)',
                  borderColor: 'var(--synapse-background)',
                }}
              >
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-background-tertiary/90 text-text-primary text-xs px-2 py-1 rounded whitespace-nowrap">
                  {Math.floor(playback.currentTime / 60)}:
                  {(playback.currentTime % 60).toFixed(1).padStart(4, '0')}
                </div>
              </div>
            </div>
          )}

          {/* Timeline Items with Keyframes */}
          {timeline.map((item) => {
            const asset = getMediaAssetById(item.assetId);
            const isSelected = selectedItems.includes(item.id);

            return (
              <AdvancedTimelineClip
                key={item.id}
                item={item}
                asset={asset}
                isSelected={isSelected}
                showKeyframes={showKeyframes}
                selectedKeyframes={selectedKeyframes}
                timeToPixels={timeToPixels}
                onKeyframeClick={handleKeyframeClick}
                onKeyframeDragStart={handleKeyframeDragStart}
                onItemSelect={() => selectTimelineItems([item.id])}
                style={{
                  left: `${timeToPixels(item.startTime)}px`,
                  top: `${item.track * TRACK_HEIGHT + 4}px`,
                  width: `${timeToPixels(item.duration)}px`,
                  height: `${TRACK_HEIGHT - 8}px`,
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface AdvancedTimelineClipProps {
  item: TimelineItem;
  asset: MediaAsset | undefined;
  isSelected: boolean;
  showKeyframes: boolean;
  selectedKeyframes: string[];
  timeToPixels: (time: number) => number;
  onKeyframeClick: (
    e: React.MouseEvent,
    keyframeId: string,
    itemId: string
  ) => void;
  onKeyframeDragStart: (
    e: React.MouseEvent,
    keyframe: Keyframe,
    itemId: string
  ) => void;
  onItemSelect: () => void;
  style: React.CSSProperties;
}

function AdvancedTimelineClip({
  item,
  asset,
  isSelected,
  showKeyframes,
  selectedKeyframes,
  timeToPixels,
  onKeyframeClick,
  onKeyframeDragStart,
  onItemSelect,
  style,
}: AdvancedTimelineClipProps) {
  const getClipColor = (type: string) => {
    switch (type) {
      case 'video':
        return 'bg-synapse-clip-video';
      case 'audio':
        return 'bg-synapse-clip-audio';
      case 'code':
        return 'bg-synapse-clip-code';
      case 'title':
        return 'bg-synapse-clip-text';
      default:
        return 'bg-synapse-surface-active';
    }
  };

  return (
    <div
      className={`
        absolute rounded cursor-move select-none border-2 transition-all
        ${getClipColor(item.type)}
        ${isSelected ? 'border-synapse-warning shadow-synapse-sm' : 'border-transparent'}
        hover:border-synapse-border-hover
      `}
      style={style}
      onClick={onItemSelect}
    >
      {/* Resize Handles */}
      <div className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize bg-synapse-text-primary bg-opacity-20 opacity-0 hover:opacity-100 transition-opacity" />
      <div className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize bg-synapse-text-primary bg-opacity-20 opacity-0 hover:opacity-100 transition-opacity" />

      {/* Clip Content */}
      <div className="p-2 h-full flex flex-col justify-between text-synapse-text-inverse text-xs overflow-hidden">
        <div className="font-medium truncate">
          {asset?.name || 'Unknown Asset'}
        </div>
        <div className="opacity-75">
          {Math.round(item.duration * 10) / 10}s
          {(item.keyframes?.length ?? 0) > 0 && (
            <span className="ml-2 text-yellow-400">
              ●{item.keyframes?.length ?? 0}
            </span>
          )}
        </div>
      </div>

      {/* Keyframes */}
      {showKeyframes &&
        isSelected &&
        (item.keyframes ?? []).map((keyframe) => (
          <div
            key={keyframe.id}
            className={`
            absolute w-2 h-2 rounded-full cursor-pointer transition-all
            ${selectedKeyframes.includes(keyframe.id) ? 'bg-synapse-warning scale-125' : 'bg-synapse-text-primary'}
            hover:scale-110 shadow-md border border-synapse-surface
          `}
            style={{
              left: `${timeToPixels(keyframe.time)}px`,
              top: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 10,
            }}
            onClick={(e) => onKeyframeClick(e, keyframe.id, item.id)}
            onMouseDown={(e) => onKeyframeDragStart(e, keyframe, item.id)}
            title={`Keyframe at ${keyframe.time.toFixed(2)}s: ${Object.keys(keyframe.properties).join(', ')}`}
          />
        ))}
    </div>
  );
}
