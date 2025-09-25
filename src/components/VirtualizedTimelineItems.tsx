import React, { memo, useMemo, useCallback, useRef, useEffect } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import {
  useVirtualization,
  useMemoizedTrackContent,
  TimelineCalculations,
  BatchUpdater,
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
  const trackItems = useMemo(
    () => items.filter((item) => item.track === track.trackNumber),
    [items, track.trackNumber]
  );

  // Calculate item positions and dimensions
  const itemPositions = useMemo(() => {
    return trackItems.map((item) => {
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
      const overscanLeft = viewportLeft - ITEM_OVERSCAN * MIN_ITEM_WIDTH;
      const overscanRight = viewportRight + ITEM_OVERSCAN * MIN_ITEM_WIDTH;

      return right >= overscanLeft && left <= overscanRight;
    });
  }, [itemPositions, scrollLeft, containerWidth]);

  // Memoized track content for visible items
  const memoizedContent = useMemoizedTrackContent(
    track,
    visibleItems.map((v) => v.item),
    assets,
    [zoom, scrollLeft] // Additional dependencies for re-memoization
  );

  // Batch item updates
  const handleItemUpdate = useCallback(
    (item: TimelineItem) => {
      if (onItemUpdate) {
        batchUpdater.current.addUpdate(() => onItemUpdate(item));
      }
    },
    [onItemUpdate]
  );

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
  const itemStyle = useMemo(
    () => ({
      position: 'absolute' as const,
      left: `${left}px`,
      width: `${width}px`,
      height: `${height}px`,
      top: '4px',
      backgroundColor: track.color,
      borderColor: isSelected ? '#F59E0B' : track.color,
    }),
    [left, width, height, track.color, isSelected]
  );

  return (
    <div
      ref={itemRef}
      className={`
        group timeline-item rounded select-none border-2 transition-all overflow-hidden
        ${isSelected ? 'border-accent-yellow shadow-glow z-10' : 'border-transparent'}
        cursor-grab
        hover:border-text-secondary
      `}
      style={itemStyle}
      onMouseDown={handleMouseDown}
      onContextMenu={onContextMenu ? (e) => onContextMenu(e, item) : undefined}
    >
      {/* Resize Handles with grip icons */}
      <div className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize">
        <div className="absolute inset-0 bg-text-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-center opacity-0 group-hover:opacity-100 text-white/80">
          <ArrowLeftRight className="w-3 h-3" />
        </div>
      </div>
      <div className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize">
        <div className="absolute inset-0 bg-text-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-center opacity-0 group-hover:opacity-100 text-white/80">
          <ArrowLeftRight className="w-3 h-3" />
        </div>
      </div>

      {/* Bottom gradient overlay for text contrast */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-black/35 to-transparent" />
      {(() => {
        try {
          const steps = (item.properties as any).codeSteps as Array<{ duration: number }> | undefined;
          if (!steps || steps.length <= 1) return null;
          const total = steps.reduce((s, st) => s + Math.max(0, st.duration || 0), 0) || item.duration;
          let acc = 0;
          const markers: JSX.Element[] = [];
          for (let i = 0; i < steps.length - 1; i++) {
            acc += Math.max(0, steps[i].duration || 0);
            const ratio = total > 0 ? acc / total : (i + 1) / steps.length;
            const leftPx = Math.max(0, Math.min(width, ratio * width));
            markers.push(
              <div key={`v-step-${i}`} className="absolute bottom-0 w-[2px] h-3 bg-white/90" style={{ left: `${leftPx - 1}px` }} />
            );
          }
          return <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3">{markers}</div>;
        } catch {
          return null;
        }
      })()}

      {/* Item Content */}
      <div className="relative p-2 h-full flex flex-col justify-between text-xs overflow-hidden text-white" style={{ textShadow: '0 1px 1px rgba(0,0,0,0.5)' }}>
        <LazyTrackContent
          track={track}
          item={item}
          asset={asset}
          className="flex-1"
          maxLines={2}
          showLanguage={false}
        />

        {/* Duration indicator */}
        <div className="text-white/90 mt-1 text-xs">
          {Math.round(item.duration * 10) / 10}s
        </div>
      </div>
    </div>
  );
});

// Performance monitoring wrapper
export const PerformanceMonitoredTimelineItems = memo(
  function PerformanceMonitoredTimelineItems(
    props: VirtualizedTimelineItemsProps
  ) {
    const renderCount = useRef(0);
    const lastRenderTime = useRef(performance.now());

    useEffect(() => {
      renderCount.current += 1;
      const currentTime = performance.now();
      const renderTime = currentTime - lastRenderTime.current;

      if (
        process.env.NODE_ENV === 'development' &&
        renderCount.current % 10 === 0
      ) {
        console.log(
          `Timeline items render #${renderCount.current}: ${renderTime.toFixed(2)}ms`
        );
        console.log(
          `Visible items: ${props.items.filter((item) => item.track === props.track.trackNumber).length}`
        );
        console.log(`Cache size: ${TimelineCalculations.getCacheSize()}`);
      }

      lastRenderTime.current = currentTime;
    });

    return <VirtualizedTimelineItems {...props} />;
  }
);

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
    const visibleItems = Math.min(
      items.length,
      Math.ceil(containerWidth / (100 * zoom))
    );

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
