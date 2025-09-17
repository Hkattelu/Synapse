import React, { useCallback, useRef, useMemo } from 'react';
import { useMediaAssets } from '../state/hooks';
import type { TimelineItem, MediaAsset } from '../lib/types';
import type { EducationalTrack } from '../lib/educationalTypes';
import { LanguageIndicator, AnimationModeIndicator } from './CodeSyntaxPreview';
import { LazyTrackContent } from './LazyTrackContent';
import { VisualTrackClip } from './VisualTrackEnhancements';
import { VirtualizedTimelineItems } from './VirtualizedTimelineItems';
import {
  useIntersectionObserver,
  useResponsiveBreakpoint,
} from '../lib/performanceOptimizations';
import { Code, Monitor, Mic, User, Volume2 } from 'lucide-react';

interface EducationalTrackProps {
  track: EducationalTrack;
  items: TimelineItem[];
  isActive: boolean;
  trackHeight: number;
  timeToPixels: (time: number) => number;
  onItemDrop: (item: TimelineItem) => void;
  onItemMouseDown: (e: React.MouseEvent, item: TimelineItem) => void;
  onItemContextMenu?: (e: React.MouseEvent, item: TimelineItem) => void;
  onItemUpdate?: (item: TimelineItem) => void;
  selectedItems: string[];
  dragState: {
    isDragging: boolean;
    itemId: string | null;
  };
  // Performance optimization props
  containerWidth?: number;
  pixelsPerSecond?: number;
  zoom?: number;
  scrollLeft?: number;
  useVirtualization?: boolean;
}

const TRACK_ICONS = {
  code: Code,
  monitor: Monitor,
  mic: Mic,
  user: User,
};

export function EducationalTrack({
  track,
  items,
  isActive,
  trackHeight,
  timeToPixels,
  onItemDrop,
  onItemMouseDown,
  onItemContextMenu,
  onItemUpdate,
  selectedItems,
  dragState,
  containerWidth = 1000,
  pixelsPerSecond = 100,
  zoom = 1,
  scrollLeft = 0,
  useVirtualization = true,
}: EducationalTrackProps) {
  const { getMediaAssetById } = useMediaAssets();
  const breakpoint = useResponsiveBreakpoint();

  // Intersection observer for lazy loading
  const [trackElementRef, isTrackVisible] =
    useIntersectionObserver<HTMLDivElement>({
      threshold: 0.1,
      rootMargin: '100px',
    });

  const IconComponent =
    TRACK_ICONS[track.icon as keyof typeof TRACK_ICONS] || Code;

  // Create assets map for performance
  const assetsMap = useMemo(() => {
    const map = new Map<string, MediaAsset>();
    items.forEach((item) => {
      const asset = getMediaAssetById(item.assetId);
      if (asset) {
        map.set(item.assetId, asset);
      }
    });
    return map;
  }, [items, getMediaAssetById]);

  // Responsive track height based on breakpoint
  const responsiveTrackHeight = useMemo(() => {
    switch (breakpoint) {
      case 'mobile':
        return Math.max(60, trackHeight * 0.75);
      case 'tablet':
        return Math.max(70, trackHeight * 0.9);
      default:
        return trackHeight;
    }
  }, [breakpoint, trackHeight]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      // This will be handled by the parent timeline component
      // but we can add track-specific validation here
    },
    [onItemDrop]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  // Don't render track content until visible (lazy loading)
  if (!isTrackVisible) {
    return (
      <div
        ref={trackElementRef}
        className="educational-track relative"
        style={{ height: `${responsiveTrackHeight}px` }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-xs text-gray-500 animate-pulse">
            Loading track content...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={(el) => {
        (
          trackElementRef as React.MutableRefObject<HTMLDivElement | null>
        ).current = el;
      }}
      className="educational-track relative"
      style={{ height: `${responsiveTrackHeight}px` }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Track Content Area (full-row height; header moved to left column) */}
      <div className="absolute inset-0">
        {useVirtualization && containerWidth > 0 ? (
          // Use virtualized rendering for better performance
          <VirtualizedTimelineItems
            track={track}
            items={items}
            assets={assetsMap}
            containerWidth={containerWidth}
            trackHeight={responsiveTrackHeight}
            pixelsPerSecond={pixelsPerSecond}
            zoom={zoom}
            scrollLeft={scrollLeft}
            selectedItems={selectedItems}
            onItemMouseDown={onItemMouseDown}
            onItemContextMenu={onItemContextMenu}
            onItemUpdate={onItemUpdate}
          />
        ) : (
          // Fallback to traditional rendering
          <TraditionalTrackItems
            track={track}
            items={items}
            assetsMap={assetsMap}
            trackHeight={responsiveTrackHeight}
            timeToPixels={timeToPixels}
            selectedItems={selectedItems}
            dragState={dragState}
            onItemMouseDown={onItemMouseDown}
            onItemContextMenu={onItemContextMenu}
            onItemUpdate={onItemUpdate}
          />
        )}
      </div>
    </div>
  );
}

interface EducationalTimelineClipProps {
  item: TimelineItem;
  asset: MediaAsset | undefined;
  track: EducationalTrack;
  isSelected: boolean;
  isDragging: boolean;
  style: React.CSSProperties;
  onMouseDown: (e: React.MouseEvent) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}

function EducationalTimelineClip({
  item,
  asset,
  track,
  isSelected,
  isDragging,
  style,
  onMouseDown,
  onContextMenu,
}: EducationalTimelineClipProps) {
  return (
    <div
      className={`
        absolute rounded select-none border-2 transition-all overflow-hidden
        ${isSelected ? 'border-accent-yellow shadow-glow' : 'border-transparent'}
        ${isDragging ? 'z-10 cursor-grabbing' : 'cursor-grab'}
        hover:border-text-secondary
      `}
      style={{
        ...style,
        backgroundColor: track.color,
        borderColor: isSelected ? '#F59E0B' : track.color,
      }}
      onMouseDown={onMouseDown}
      onContextMenu={onContextMenu}
    >
      {/* Resize Handles */}
      <div className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize bg-text-primary/10 opacity-0 hover:opacity-100 transition-opacity" />
      <div className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize bg-text-primary/10 opacity-0 hover:opacity-100 transition-opacity" />

      {/* Clip Content (lazy) */}
      <div className="p-1.5 h-full flex flex-col justify-between text-[11px] overflow-hidden text-synapse-text-inverse">
        <LazyTrackContent
          track={track}
          item={item}
          asset={asset}
          maxLines={2}
          showLanguage={false}
          className="text-[10px]"
        />
        {/* Duration indicator */}
        <div className="text-text-secondary text-opacity-75 mt-0.5 text-[10px]">
          {Math.round(item.duration * 10) / 10}s
        </div>
      </div>
    </div>
  );
}

// Traditional track items rendering (fallback)
function TraditionalTrackItems({
  track,
  items,
  assetsMap,
  trackHeight,
  timeToPixels,
  selectedItems,
  dragState,
  onItemMouseDown,
  onItemContextMenu,
  onItemUpdate,
}: {
  track: EducationalTrack;
  items: TimelineItem[];
  assetsMap: Map<string, MediaAsset>;
  trackHeight: number;
  timeToPixels: (time: number) => number;
  selectedItems: string[];
  dragState: { isDragging: boolean; itemId: string | null };
  onItemMouseDown: (e: React.MouseEvent, item: TimelineItem) => void;
  onItemContextMenu?: (e: React.MouseEvent, item: TimelineItem) => void;
  onItemUpdate?: (item: TimelineItem) => void;
}) {
  return (
    <>
      {items
        .filter((item) => item.track === track.trackNumber)
        .map((item) => {
          const asset = assetsMap.get(item.assetId);
          const isSelected = selectedItems.includes(item.id);
          const isDragging =
            dragState.isDragging && dragState.itemId === item.id;

          // Use enhanced Visual track clip for Visual track
          if (track.id === 'visual') {
            const isDragging =
              dragState.isDragging && dragState.itemId === item.id;
            return (
              <VisualTrackClip
                key={item.id}
                item={item}
                asset={asset}
                track={track}
                isSelected={isSelected}
                isDragging={isDragging}
                style={{
                  left: `${timeToPixels(item.startTime)}px`,
                  width: `${timeToPixels(item.duration)}px`,
                  height: `${trackHeight - 16}px`, // Leave space for track header
                  top: '4px',
                }}
                onItemUpdate={onItemUpdate || (() => {})}
                onMouseDown={(e) => onItemMouseDown(e, item)}
                onContextMenu={
                  onItemContextMenu
                    ? (e) => onItemContextMenu(e, item)
                    : undefined
                }
              />
            );
          }

          return (
            <EducationalTimelineClip
              key={item.id}
              item={item}
              asset={asset}
              track={track}
              isSelected={isSelected}
              isDragging={isDragging}
              style={{
                left: `${timeToPixels(item.startTime)}px`,
                width: `${timeToPixels(item.duration)}px`,
                height: `${trackHeight - 8}px`,
                top: '4px',
              }}
              onMouseDown={(e) => onItemMouseDown(e, item)}
              onContextMenu={
                onItemContextMenu
                  ? (e) => onItemContextMenu(e, item)
                  : undefined
              }
            />
          );
        })}
    </>
  );
}
