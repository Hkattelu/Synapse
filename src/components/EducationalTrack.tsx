import React, { useCallback, useRef, useMemo } from 'react';
import { useMediaAssets } from '../state/hooks';
import type { TimelineItem, MediaAsset } from '../lib/types';
import type { EducationalTrack } from '../lib/educationalTypes';
import { CodeSyntaxPreview, LanguageIndicator, AnimationModeIndicator } from './CodeSyntaxPreview';
import { VisualTrackClip } from './VisualTrackEnhancements';
import { CompactWaveform } from './WaveformVisualization';
import { StaticLevelMeter } from './AudioLevelMeter';
import { VirtualizedTimelineItems } from './VirtualizedTimelineItems';
import { useIntersectionObserver, useResponsiveBreakpoint } from '../lib/performanceOptimizations';
import { Code, Monitor, Mic, User, Volume2 } from 'lucide-react';

interface EducationalTrackProps {
  track: EducationalTrack;
  items: TimelineItem[];
  isActive: boolean;
  trackHeight: number;
  timeToPixels: (time: number) => number;
  onItemDrop: (item: TimelineItem) => void;
  onItemMouseDown: (e: React.MouseEvent, item: TimelineItem) => void;
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
  const trackRef = useRef<HTMLDivElement>(null);
  const breakpoint = useResponsiveBreakpoint();
  
  // Intersection observer for lazy loading
  const [trackElementRef, isTrackVisible] = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '100px',
  });

  const IconComponent = TRACK_ICONS[track.icon as keyof typeof TRACK_ICONS] || Code;

  // Create assets map for performance
  const assetsMap = useMemo(() => {
    const map = new Map<string, MediaAsset>();
    items.forEach(item => {
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
          <div className="text-xs text-gray-500 animate-pulse">Loading track content...</div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={(el) => {
        trackRef.current = el;
        trackElementRef.current = el;
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
            onItemUpdate={onItemUpdate}
          />
        )}
      </div>
    </div>
  );
}

interface EducationalTrackHeaderProps {
  track: EducationalTrack;
  IconComponent: React.ComponentType<{ className?: string }>;
  height: number;
  breakpoint: 'mobile' | 'tablet' | 'desktop';
}

function EducationalTrackHeader({ track, IconComponent, height, breakpoint }: EducationalTrackHeaderProps) {
  // Deprecated: header is now rendered in the left sticky column by EducationalTimeline
  return null;
}

interface EducationalTimelineClipProps {
  item: TimelineItem;
  asset: MediaAsset | undefined;
  track: EducationalTrack;
  isSelected: boolean;
  isDragging: boolean;
  style: React.CSSProperties;
  onMouseDown: (e: React.MouseEvent) => void;
}

function EducationalTimelineClip({
  item,
  asset,
  track,
  isSelected,
  isDragging,
  style,
  onMouseDown,
}: EducationalTimelineClipProps) {
  const getClipContent = () => {
    switch (track.id) {
      case 'code':
        return <CodeClipPreview item={item} asset={asset} />;
      case 'visual':
        return <VisualClipPreview item={item} asset={asset} />;
      case 'narration':
        return <NarrationClipPreview item={item} asset={asset} />;
      case 'you':
        return <YouClipPreview item={item} asset={asset} />;
      default:
        return <DefaultClipPreview item={item} asset={asset} />;
    }
  };

  return (
    <div
      className={`
        absolute rounded cursor-move select-none border-2 transition-all overflow-hidden
        ${isSelected ? 'border-accent-yellow shadow-glow' : 'border-transparent'}
        ${isDragging ? 'opacity-75 z-10' : 'opacity-100'}
        hover:border-text-secondary
      `}
      style={{
        ...style,
        backgroundColor: `${track.color}22`,
        borderColor: isSelected ? '#F59E0B' : track.color,
      }}
      onMouseDown={onMouseDown}
    >
      {/* Resize Handles */}
      <div className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize bg-text-primary bg-opacity-20 opacity-0 hover:opacity-100 transition-opacity" />
      <div className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize bg-text-primary bg-opacity-20 opacity-0 hover:opacity-100 transition-opacity" />

      {/* Clip Content */}
      <div className="p-1.5 h-full flex flex-col justify-between text-[11px] overflow-hidden">
        {getClipContent()}
        
        {/* Duration indicator */}
        <div className="text-text-secondary text-opacity-75 mt-0.5 text-[10px]">
          {Math.round(item.duration * 10) / 10}s
        </div>
      </div>
    </div>
  );
}

// Track-specific clip preview components
function CodeClipPreview({ item, asset }: { item: TimelineItem; asset: MediaAsset | undefined }) {
  const codeText = item.properties.codeText || asset?.metadata.codeContent || '';
  const language = item.properties.language || asset?.metadata.language || 'javascript';
  const animationMode = item.properties.animationMode || 'typing';
  
  return (
    <div className="flex-1 overflow-hidden">
      <div className="font-medium text-text-primary truncate flex items-center gap-1 mb-0.5 text-[11px]">
        <Code className="w-3 h-3" />
        {asset?.name || 'Code Block'}
      </div>
      
      <div className="flex items-center gap-1 mb-0.5">
        <LanguageIndicator language={language} className="text-[10px]" />
        {animationMode !== 'none' && (
          <AnimationModeIndicator mode={animationMode} className="text-[10px]" />
        )}
      </div>
      
      {codeText && (
        <CodeSyntaxPreview 
          item={item} 
          maxLines={2} 
          showLanguage={false}
          className="text-[10px]"
        />
      )}
      
      {!codeText && (
        <div className="text-xs text-text-secondary opacity-75 italic">
          No code content
        </div>
      )}
    </div>
  );
}

function VisualClipPreview({ item, asset }: { item: TimelineItem; asset: MediaAsset | undefined }) {
  return (
    <div className="flex-1 overflow-hidden">
      <div className="font-medium text-text-primary truncate flex items-center gap-1 text-[11px]">
        <Monitor className="w-3 h-3" />
        {asset?.name || 'Visual Content'}
      </div>
      <div className="text-[10px] text-text-secondary mt-0.5">
        {asset?.type === 'video' ? 'Video' : 'Image'}
        {asset?.metadata.width && asset?.metadata.height && (
          <span className="ml-1">
            {asset.metadata.width}×{asset.metadata.height}
          </span>
        )}
      </div>
      {asset?.thumbnail && (
        <div 
          className="w-full h-6 bg-cover bg-center rounded mt-1 opacity-75"
          style={{ backgroundImage: `url(${asset.thumbnail})` }}
        />
      )}
    </div>
  );
}

function NarrationClipPreview({ item, asset }: { item: TimelineItem; asset: MediaAsset | undefined }) {
  const volume = item.properties.volume || 0.8;
  const hasAudioDucking = item.properties.ducking?.enabled;
  const syncPointsCount = item.properties.syncPoints?.length || 0;
  
  return (
    <div className="flex-1 overflow-hidden">
      <div className="font-medium text-text-primary truncate flex items-center gap-1 text-[11px]">
        <Mic className="w-3 h-3" />
        {asset?.name || 'Audio Track'}
        {hasAudioDucking && (
          <Volume2 className="w-3 h-3 text-accent-yellow" title="Audio ducking enabled" />
        )}
      </div>
      
      <div className="text-[10px] text-text-secondary mt-0.5 flex items-center gap-2">
        <span>Audio • {Math.round(volume * 100)}% vol</span>
        {syncPointsCount > 0 && (
          <span className="text-accent-blue">• {syncPointsCount} sync points</span>
        )}
      </div>
      
      {/* Enhanced waveform visualization */}
      <div className="mt-1 h-4 flex items-center gap-1">
        {asset?.url ? (
          <CompactWaveform
            audioUrl={asset.url}
            width={120}
            height={16}
            color="#F59E0B"
            className="flex-1"
          />
        ) : (
          // Fallback placeholder waveform
          <div className="flex items-center gap-px flex-1 h-4">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="bg-current opacity-50 flex-1"
                style={{ 
                  height: `${Math.random() * 100}%`,
                  minHeight: '2px'
                }}
              />
            ))}
          </div>
        )}
        
        {/* Audio level indicator */}
        <StaticLevelMeter
          level={volume}
          width={20}
          height={12}
          color="#10B981"
          className="ml-1"
        />
      </div>
      
      {/* Audio processing indicators */}
      {(item.properties.noiseReduction || item.properties.normalize || item.properties.highPassFilter) && (
        <div className="text-xs text-accent-blue mt-1 flex items-center gap-1">
          {item.properties.noiseReduction && <span>NR</span>}
          {item.properties.normalize && <span>NORM</span>}
          {item.properties.highPassFilter && <span>HPF</span>}
        </div>
      )}
    </div>
  );
}

function YouClipPreview({ item, asset }: { item: TimelineItem; asset: MediaAsset | undefined }) {
  const isTalkingHead = item.properties.talkingHeadEnabled;
  
  return (
    <div className="flex-1 overflow-hidden">
      <div className="font-medium text-text-primary truncate flex items-center gap-1">
        <User className="w-3 h-3" />
        {asset?.name || 'Personal Video'}
      </div>
      <div className="text-xs text-text-secondary mt-1">
        {isTalkingHead ? 'Talking Head' : 'Personal Video'}
        {isTalkingHead && item.properties.talkingHeadCorner && (
          <span className="ml-1">• {item.properties.talkingHeadCorner}</span>
        )}
      </div>
      {asset?.thumbnail && (
        <div 
          className={`w-full h-6 bg-cover bg-center mt-1 opacity-75 ${
            isTalkingHead ? 'rounded-full' : 'rounded'
          }`}
          style={{ backgroundImage: `url(${asset.thumbnail})` }}
        />
      )}
    </div>
  );
}

function DefaultClipPreview({ item, asset }: { item: TimelineItem; asset: MediaAsset | undefined }) {
  return (
    <div className="flex-1 overflow-hidden">
      <div className="font-medium text-text-primary truncate">
        {asset?.name || 'Timeline Item'}
      </div>
      <div className="text-xs text-text-secondary mt-1">
        {item.type}
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
  onItemUpdate?: (item: TimelineItem) => void;
}) {
  return (
    <>
      {items
        .filter(item => item.track === track.trackNumber)
        .map((item) => {
          const asset = assetsMap.get(item.assetId);
          const isSelected = selectedItems.includes(item.id);
          const isDragging = dragState.isDragging && dragState.itemId === item.id;

          // Use enhanced Visual track clip for Visual track
          if (track.id === 'visual') {
            return (
              <VisualTrackClip
                key={item.id}
                item={item}
                asset={asset}
                track={track}
                isSelected={isSelected}
                style={{
                  left: `${timeToPixels(item.startTime)}px`,
                  width: `${timeToPixels(item.duration)}px`,
                  height: `${trackHeight - 16}px`, // Leave space for track header
                  top: '4px',
                }}
                onItemUpdate={onItemUpdate || (() => {})}
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
            />
          );
        })}
    </>
  );
}