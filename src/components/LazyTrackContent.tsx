import React, { memo, Suspense, lazy } from 'react';
import { useIntersectionObserver, useOptimizedTrackPreview } from '../lib/performanceOptimizations';
import type { TimelineItem, MediaAsset } from '../lib/types';
import type { EducationalTrack } from '../lib/educationalTypes';

// Lazy load track-specific components
const CodeSyntaxPreview = lazy(() => 
  import('./CodeSyntaxPreview').then(module => ({ default: module.CodeSyntaxPreview }))
);

const CompactWaveform = lazy(() => 
  import('./WaveformVisualization').then(module => ({ default: module.CompactWaveform }))
);

const StaticLevelMeter = lazy(() => 
  import('./AudioLevelMeter').then(module => ({ default: module.StaticLevelMeter }))
);

interface LazyTrackContentProps {
  track: EducationalTrack;
  item: TimelineItem;
  asset: MediaAsset | undefined;
  className?: string;
  maxLines?: number;
  showLanguage?: boolean;
}

// Fallback loading component
function ContentSkeleton({ track }: { track: EducationalTrack }) {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-600 rounded mb-2" style={{ width: '70%' }} />
      <div className="h-3 bg-gray-700 rounded mb-1" style={{ width: '50%' }} />
      {track.id === 'code' && (
        <>
          <div className="h-3 bg-gray-700 rounded mb-1" style={{ width: '80%' }} />
          <div className="h-3 bg-gray-700 rounded" style={{ width: '60%' }} />
        </>
      )}
      {track.id === 'narration' && (
        <div className="h-4 bg-gray-700 rounded mt-2" />
      )}
    </div>
  );
}

// Optimized track content component
export const LazyTrackContent = memo(function LazyTrackContent({
  track,
  item,
  asset,
  className = '',
  maxLines = 2,
  showLanguage = false,
}: LazyTrackContentProps) {
  const [ref, isVisible] = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '100px',
  });

  const previewData = useOptimizedTrackPreview(track, item, asset);

  // Don't render content until visible
  if (!isVisible) {
    return (
      <div ref={ref as unknown as React.Ref<HTMLDivElement>} className={className}>
        <ContentSkeleton track={track} />
      </div>
    );
  }

  if (!previewData) {
    return (
      <div ref={ref as unknown as React.Ref<HTMLDivElement>} className={className}>
        <div className="text-xs text-gray-400 italic">No content available</div>
      </div>
    );
  }

  return (
    <div ref={ref as unknown as React.Ref<HTMLDivElement>} className={className}>
      <Suspense fallback={<ContentSkeleton track={track} />}>
        <TrackContentRenderer
          track={track}
          item={item}
          asset={asset}
          previewData={previewData}
          maxLines={maxLines}
          showLanguage={showLanguage}
        />
      </Suspense>
    </div>
  );
});

// Memoized content renderer
const TrackContentRenderer = memo(function TrackContentRenderer({
  track,
  item,
  asset,
  previewData,
  maxLines,
  showLanguage,
}: {
  track: EducationalTrack;
  item: TimelineItem;
  asset: MediaAsset | undefined;
  previewData: any;
  maxLines: number;
  showLanguage: boolean;
}) {
  switch (previewData.type) {
    case 'code':
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-xs">
            <span className="font-medium text-purple-300">
              {asset?.name || 'Code Block'}
            </span>
            {showLanguage && (
              <span className="px-1 py-0.5 bg-purple-600 bg-opacity-30 rounded text-xs">
                {previewData.language}
              </span>
            )}
          </div>
          {previewData.preview && (
            <CodeSyntaxPreview
              item={item}
              maxLines={maxLines}
              showLanguage={false}
              className="text-xs"
            />
          )}
          {previewData.animationMode !== 'none' && (
            <div className="text-xs text-purple-400">
              {previewData.animationMode} animation
            </div>
          )}
        </div>
      );

    case 'visual':
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-xs">
            <span className="font-medium text-green-300">
              {asset?.name || 'Visual Content'}
            </span>
            <span className="text-green-400">
              {previewData.isVideo ? 'Video' : 'Image'}
            </span>
          </div>
          {previewData.dimensions && (
            <div className="text-xs text-gray-400">{previewData.dimensions}</div>
          )}
          {previewData.thumbnail && (
            <div
              className="w-full h-6 bg-cover bg-center rounded opacity-75"
              style={{ backgroundImage: `url(${previewData.thumbnail})` }}
            />
          )}
        </div>
      );

    case 'narration':
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-xs">
            <span className="font-medium text-amber-300">
              {asset?.name || 'Audio Track'}
            </span>
            <span className="text-amber-400">
              {Math.round(previewData.volume * 100)}% vol
            </span>
          </div>
          {previewData.syncPoints > 0 && (
            <div className="text-xs text-blue-400">
              {previewData.syncPoints} sync points
            </div>
          )}
          <div className="flex items-center gap-2">
            {previewData.hasWaveform && asset?.url && (
              <CompactWaveform
                audioUrl={asset.url}
                width={80}
                height={12}
                color="#F59E0B"
                className="flex-1"
              />
            )}
            <StaticLevelMeter
              level={previewData.volume}
              width={16}
              height={8}
              color="#10B981"
            />
          </div>
          {previewData.hasDucking && (
            <div className="text-xs text-amber-400">Audio ducking enabled</div>
          )}
        </div>
      );

    case 'you':
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-xs">
            <span className="font-medium text-red-300">
              {asset?.name || 'Personal Video'}
            </span>
            <span className="text-red-400">
              {previewData.isTalkingHead ? 'Talking Head' : 'Personal'}
            </span>
          </div>
          {previewData.isTalkingHead && (
            <div className="text-xs text-gray-400">
              Position: {previewData.corner}
            </div>
          )}
          {previewData.thumbnail && (
            <div
              className={`w-full h-6 bg-cover bg-center opacity-75 ${
                previewData.isTalkingHead ? 'rounded-full' : 'rounded'
              }`}
              style={{ backgroundImage: `url(${previewData.thumbnail})` }}
            />
          )}
        </div>
      );

    default:
      return (
        <div className="space-y-1">
          <div className="text-xs font-medium text-gray-300">
            {previewData.name || 'Timeline Item'}
          </div>
          <div className="text-xs text-gray-400">{previewData.itemType}</div>
        </div>
      );
  }
});