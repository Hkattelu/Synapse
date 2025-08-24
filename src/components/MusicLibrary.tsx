import React from 'react';
import { useAppState } from '@/state/context';
import { useMediaAssets, useTimeline } from '@/state/hooks';
import type { MusicTrack, TimelineItem } from '@/lib/types';

interface MusicLibraryProps {
  className?: string;
}

export function MusicLibrary({ className = '' }: MusicLibraryProps) {
  const {
    ui: {
      musicLibrary: { tracks },
    },
  } = useAppState();
  const { addMediaAsset } = useMediaAssets();
  const { addTimelineItem, timeline } = useTimeline();

  const [playingId, setPlayingId] = React.useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  const onPlay = (track: MusicTrack) => {
    const el = audioRef.current;
    if (!el) return;
    if (playingId === track.id) {
      el.pause();
      setPlayingId(null);
      return;
    }
    el.src = track.url;
    el.currentTime = 0;
    el.play().catch(() => {/* ignore */});
    setPlayingId(track.id);
  };

  const onEnded = () => setPlayingId(null);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Determine first available audio track index
  const pickAudioTrackIndex = (): number => {
    const audioTracks = new Set(
      timeline.filter((i) => i.type === 'audio').map((i) => i.track)
    );
    if (audioTracks.size === 0) {
      // Create a new track at the end
      const maxTrack = timeline.length ? Math.max(...timeline.map((i) => i.track)) : -1;
      return maxTrack + 1;
    }
    // Use lowest existing audio track for now (simple rule)
    return Math.min(...Array.from(audioTracks.values()));
  };

  const addToTimeline = (track: MusicTrack) => {
    // 1) Create media asset
    const assetId = addMediaAsset({
      name: track.title,
      type: 'audio',
      url: track.url,
      duration: track.duration,
      metadata: {
        // We don't know exact size from the client without a HEAD request; use placeholder 1 byte min
        // Downstream logic doesn't depend on this value for remote assets
        fileSize: 1,
        mimeType: 'audio/mpeg',
      },
    });

    // 2) Pick track index and add timeline item at t=0 by default
    const trackIndex = pickAudioTrackIndex();
    const newItem: Omit<TimelineItem, 'id'> = {
      assetId,
      startTime: 0,
      duration: track.duration,
      track: trackIndex,
      type: 'audio',
      properties: { volume: 1 },
      animations: [],
      keyframes: [],
    };

    addTimelineItem(newItem);
  };

  // Group by genre for a nicer list
  const byGenre = React.useMemo(() => {
    const map = new Map<string, MusicTrack[]>();
    for (const t of tracks) {
      if (!map.has(t.genre)) map.set(t.genre, []);
      map.get(t.genre)!.push(t);
    }
    // Sort each group by title
    for (const arr of map.values()) arr.sort((a, b) => a.title.localeCompare(b.title));
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [tracks]);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="p-3 border-b border-border-subtle">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-sm text-text-secondary uppercase tracking-wide">Music</h4>
          <span className="text-xs text-text-tertiary">{tracks.length} tracks</span>
        </div>
        <p className="text-xs text-text-tertiary mt-1">All tracks are Public Domain/CC0-equivalent from FreePD.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {byGenre.map(([genre, list]) => (
          <div key={genre}>
            <div className="text-xs uppercase text-text-tertiary mb-1">{genre}</div>
            <div className="divide-y divide-border-subtle border border-border-subtle rounded-md overflow-hidden">
              {list.map((t) => (
                <div key={t.id} className="flex items-center justify-between bg-background-tertiary hover:bg-neutral-700/60 transition-colors px-3 py-2">
                  <div className="min-w-0 flex-1 mr-2">
                    <div className="text-sm text-text-primary truncate">{t.title}</div>
                    <div className="text-xs text-text-tertiary">{formatDuration(t.duration)}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onPlay(t)}
                      className="px-2 py-1 rounded text-xs bg-neutral-600 hover:bg-neutral-500 text-white"
                      title={playingId === t.id ? 'Pause' : 'Play'}
                    >
                      {playingId === t.id ? 'Pause' : 'Play'}
                    </button>
                    <button
                      onClick={() => addToTimeline(t)}
                      className="px-2 py-1 rounded text-xs bg-primary-600 hover:bg-primary-700 text-white shadow-glow"
                      title="Add to timeline"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Hidden shared audio element for previews */}
      <audio ref={audioRef} onEnded={onEnded} className="hidden" />
    </div>
  );
}
