import React, { memo, useMemo, useCallback, useRef, useEffect } from 'react';
import { 
  useVirtualization, 
  useMemoizedTrackContent, 
  TimelineCalculations,
  BatchUpdater 
} from '../lib/performanceOptimizations';
import { LazyTrackContent } from './LazyTrackContent';
import type { TimelineItem, MediaAsset } from '../lib/types';
import type { EducationalTrack } from '../lib/educationalTypes';

interface VirtualizedTimelineItemsProps {
  track: EducationalTrack;
  items: TimelineItem[];
  assets: Map<string, MediaAsset>;
  containerWidth: number;
  trackHeight: number;
  pixelsPerSecond: number;
  zoom: number;
  scrollLeft: number;
  selectedItems: string[];
  onItemMouseDown: (e: React.MouseEvent, item: TimelineItem) => void;
  onItemContextMenu?: (e: React.MouseEvent, item: TimelineItem) => void;
  onItemUpdate?: (item: TimelineItem) => void;
}

const ITEM_OVERSCAN = 3; // Number of items to render outside visible area
const MIN_ITEM_WIDTH = 20; // Minimum width for very short items

export const VirtualizedTimelineItems = memo(function VirtualizedTimelineItems({
  track,
  items,
  assets,
  containerWidth,
  trackHeight,
  pixelsPerSecond,
  zoom,
  scrollLeft,
  selectedItems,
  onItemMouseDown,
  onItemContextMenu,
  onItemUpdate,
}: VirtualizedTimelineItemsProps) {
  const batchUpdater = useRef(new BatchUpdater());

  // Filter items for this track
  const trackItems = useMemo(() => 
    items.filter(item => item.track === track.trackNumber),
    [items, track.trackNumber]
  );

  // Calculate item positions and dimensions
  const itemPositions = useMemo(() => {
    return trackItems.map(item => {
      const left = TimelineCalculations.getTimeToPixels(
        item.startTime,
        pixelsPerSecond,
        zoom,
        `item-${item.id}-left`
      );
      const width = Math.max(
        MIN_ITEM_WIDTH,
        TimelineCalculations.getTimeToPixels(
          item.duration,
          pixelsPerSecond,
          zoom,
          `item-${item.id}-width`
        )
      );

      return {
        item,
        left,
        width,
        right: left + width,
      };
    });
  }, [trackItems, pixelsPerSecond, zoom]);

  // Determine visible items based on scroll position
  const visibleItems = useMemo(() => {
    const viewportLeft = scrollLeft;
    const viewportRight = scrollLeft + containerWidth;

    return itemPositions.filter(({ left, right }) => {
      // Item is visible if it overlaps with viewport (with overscan)
      const overscanLeft = viewportLeft - (ITEM_OVERSCAN * MIN_ITEM_WIDTH);
      const overscanRight = viewportRight + (ITEM_OVERSCAN * MIN_ITEM_WIDTH);
      
      return right >= overscanLeft && left <= overscanRight;
    });
  }, [itemPositions, scrollLeft, containerWidth]);

  // Memoized track content for visible items
  const memoizedContent = useMemoizedTrackContent(
    track,
    visibleItems.map(v => v.item),
    assets,
    [zoom, scrollLeft] // Additional dependencies for re-memoization
  );

  // Batch item updates
  const handleItemUpdate = useCallback((item: TimelineItem) => {
    if (onItemUpdate) {
      batchUpdater.current.addUpdate(() => onItemUpdate(item));
    }
  }, [onItemUpdate]);

  // Cleanup batch updater on unmount
  useEffect(() => {
    return () => {
      batchUpdater.current.clear();
    };
  }, []);

  return (
    <div className="virtualized-timeline-items relative w-full h-full">
      {visibleItems.map(({ item, left, width }) => {
        const asset = assets.get(item.assetId);
        const isSelected = selectedItems.includes(item.id);

        return (
          <VirtualizedTimelineItem
            key={item.id}
            item={item}
            asset={asset}
            track={track}
            left={left}
            width={width}
            height={trackHeight - 16} // Account for track header
            isSelected={isSelected}
            onMouseDown={onItemMouseDown}
            onContextMenu={onItemContextMenu}
            onUpdate={handleItemUpdate}
          />
        );
      })}
    </div>
  );
});

// Individual timeline item component
const VirtualizedTimelineItem = memo(function VirtualizedTimelineItem({
  item,
  asset,
  track,
  left,
  width,
  height,
  isSelected,
  onMouseDown,
  onContextMenu,
  onUpdate,
}: {
  item: TimelineItem;
  asset: MediaAsset | undefined;
  track: EducationalTrack;
  left: number;
  width: number;
  height: number;
  isSelected: boolean;
  onMouseDown: (e: React.MouseEvent, item: TimelineItem) => void;
  onContextMenu?: (e: React.MouseEvent, item: TimelineItem) => void;
  onUpdate: (item: TimelineItem) => void;
}) {
  const itemRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      onMouseDown(e, item);
    },
    [onMouseDown, item]
  );

  // Optimize style object to prevent unnecessary re-renders
  const itemStyle = useMemo(() => ({
    position: 'absolute' as const,
    left: `${left}px`,
    width: `${width}px`,
    height: `${height}px`,
    top: '4px',
    backgroundColor: track.color,
    borderColor: isSelected ? '#F59E0B' : track.color,
  }), [left, width, height, track.color, isSelected]);

  return (
    <div
      ref={itemRef}
      className={`
        timeline-item rounded cursor-move select-none border-2 transition-all overflow-hidden
        ${isSelected ? 'border-accent-yellow shadow-glow z-10' : 'border-transparent'}
        hover:border-text-secondary
      `}
      style={itemStyle}
      onMouseDown={handleMouseDown}
      onContextMenu={onContextMenu ? (e) => onContextMenu(e, item) : undefined}
    >
      {/* Resize Handles */}
      <div className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize bg-text-primary bg-opacity-20 opacity-0 hover:opacity-100 transition-opacity" />
      <div className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize bg-text-primary bg-opacity-20 opacity-0 hover:opacity-100 transition-opacity" />

      {/* Item Content */}
      <div className="p-2 h-full flex flex-col justify-between text-xs overflow-hidden">
        <LazyTrackContent
          track={track}
          item={item}
          asset={asset}
          className="flex-1"
          maxLines={2}
          showLanguage={false}
        />
        
        {/* Duration indicator */}
        <div className="text-white mt-1 text-xs">
          {Math.round(item.duration * 10) / 10}s
        </div>
      </div>
    </div>
  );
});

// Performance monitoring wrapper
export const PerformanceMonitoredTimelineItems = memo(function PerformanceMonitoredTimelineItems(
  props: VirtualizedTimelineItemsProps
) {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(performance.now());

  useEffect(() => {
    renderCount.current += 1;
    const currentTime = performance.now();
    const renderTime = currentTime - lastRenderTime.current;

    if (process.env.NODE_ENV === 'development' && renderCount.current % 10 === 0) {
      console.log(`Timeline items render #${renderCount.current}: ${renderTime.toFixed(2)}ms`);
      console.log(`Visible items: ${props.items.filter(item => item.track === props.track.trackNumber).length}`);
      console.log(`Cache size: ${TimelineCalculations.getCacheSize()}`);
    }

    lastRenderTime.current = currentTime;
  });

  return <VirtualizedTimelineItems {...props} />;
});

// Utility hook for managing timeline item performance
export function useTimelineItemPerformance(
  items: TimelineItem[],
  containerWidth: number,
  zoom: number
) {
  const [performanceMetrics, setPerformanceMetrics] = React.useState({
    visibleItems: 0,
    totalItems: items.length,
    renderTime: 0,
    cacheHitRate: 0,
  });

  const updateMetrics = useCallback(() => {
    const startTime = performance.now();
    
    // Simulate render calculation
    const visibleItems = Math.min(items.length, Math.ceil(containerWidth / (100 * zoom)));
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    setPerformanceMetrics({
      visibleItems,
      totalItems: items.length,
      renderTime,
      cacheHitRate: TimelineCalculations.getCacheSize() > 0 ? 0.8 : 0, // Estimated
    });
  }, [items.length, containerWidth, zoom]);

  useEffect(() => {
    updateMetrics();
  }, [updateMetrics]);

  return performanceMetrics;
}