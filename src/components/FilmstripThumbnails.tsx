import React, { useMemo } from 'react';
import type { MediaAsset, TimelineItem } from '../lib/types';
import { generateThumbnailUrl } from '../lib/visualTrackEnhancements';

interface FilmstripThumbnailsProps {
  asset: MediaAsset | undefined;
  item: TimelineItem;
  height?: number; // px
  count?: number; // how many thumbnails to show
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
}

export const FilmstripThumbnails: React.FC<FilmstripThumbnailsProps> = ({
  asset,
  item,
  height = 24,
  count = 8,
  rounded = 'md',
}) => {
  const clips = useMemo(() => {
    if (!asset) return [] as { url: string; key: string }[];
    const duration = Math.max(0.01, item.duration || asset.duration || 1);
    const w = Math.round((height * 16) / 9);

    const list: { url: string; key: string }[] = [];
    for (let i = 0; i < count; i++) {
      const ratio = (i + 0.5) / count; // center of each segment
      const t = Math.min(duration * ratio, duration);
      const url = generateThumbnailUrl(asset, {
        width: w,
        height,
        quality: 0.7,
        format: 'jpeg',
        timestamp: t,
      } as any);
      list.push({ url, key: `${asset.id}-${i}` });
    }
    return list;
  }, [asset, item.duration, height, count]);

  if (!asset || clips.length === 0) return null;

  const roundedClass =
    rounded === 'full'
      ? 'rounded-full'
      : rounded === 'lg'
      ? 'rounded-lg'
      : rounded === 'md'
      ? 'rounded'
      : rounded === 'sm'
      ? 'rounded-sm'
      : '';

  return (
    <div className={`w-full flex gap-px ${roundedClass} overflow-hidden`}>
      {clips.map((c, idx) => (
        <div
          key={c.key}
          className="flex-1 bg-center bg-cover"
          style={{ backgroundImage: `url(${c.url})`, height: `${height}px` }}
          aria-label={`Thumbnail ${idx + 1}`}
        />
      ))}
    </div>
  );
};