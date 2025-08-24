import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Player, type PlayerRef } from '@remotion/player';
import { useProject, usePlayback } from '../state/hooks';
import * as Hooks from '../state/hooks';
import { MainComposition } from '../remotion/MainComposition';
import type { MainCompositionProps } from '../remotion/types';
import type { TimelineItem } from '../lib/types';

interface PreviewProps {
  className?: string;
}

export const Preview: React.FC<PreviewProps> = ({ className = '' }) => {
  const { project } = useProject();
  const { playback, play, pause, seek, setVolume, toggleMute } = usePlayback();
  // Some tests partially mock the hooks module without providing useTimeline.
  // Provide a strictly typed, no-op fallback to avoid leaking `any`.
  type TimelineApi = {
    timeline: TimelineItem[];
    updateTimelineItem: (id: string, updates: Partial<TimelineItem>) => void;
  };
  const hooksModule = Hooks as unknown as Record<string, unknown>;
  const maybeUseTimeline = hooksModule['useTimeline'];
  const hasUseTimeline = typeof maybeUseTimeline === 'function';
  const timelineApi: TimelineApi = hasUseTimeline
    ? (maybeUseTimeline as () => TimelineApi)()
    : {
        timeline: [],
        updateTimelineItem: (() => {}) as unknown as (
          id: string,
          updates: Partial<TimelineItem>
        ) => void,
      };
  const { timeline, updateTimelineItem } = timelineApi;
  const playerRef = React.useRef<PlayerRef>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartTime, setDragStartTime] = useState(0);

  // Find any talking head items to enable viewer controls
  const talkingHeads = useMemo(
    () => timeline.filter((i) => i.type === 'video' && i.properties.talkingHeadEnabled),
    [timeline]
  );
  const bubbleHidden = useMemo(
    () => talkingHeads.length > 0 && talkingHeads.every((i) => i.properties.talkingHeadHidden === true),
    [talkingHeads]
  );
  const bubbleMuted = useMemo(
    () => talkingHeads.length > 0 && talkingHeads.every((i) => i.muted === true),
    [talkingHeads]
  );

  // Prepare composition props from project state
  const compositionProps: MainCompositionProps = useMemo(() => {
    if (!project) {
      return {
        timeline: [],
        mediaAssets: [],
        settings: {
          width: 1920,
          height: 1080,
          fps: 30,
          duration: 60,
          backgroundColor: '#000000',
        },
      };
    }

    return {
      timeline: project.timeline,
      mediaAssets: project.mediaAssets,
      settings: project.settings,
    };
  }, [project]);

  // Calculate total duration in frames
  const durationInFrames = useMemo(() => {
    return Math.round(
      compositionProps.settings.duration * compositionProps.settings.fps
    );
  }, [compositionProps.settings.duration, compositionProps.settings.fps]);

  // Sync playback state with player
  useEffect(() => {
    if (!playerRef.current) return;

    if (playback.isPlaying) {
      playerRef.current.play();
    } else {
      playerRef.current.pause();
    }
  }, [playback.isPlaying]);

  // Sync current time with player
  useEffect(() => {
    if (!playerRef.current) return;

    const currentFrame = Math.round(
      playback.currentTime * compositionProps.settings.fps
    );
    playerRef.current.seekTo(currentFrame);
  }, [playback.currentTime, compositionProps.settings.fps]);

  // Handle player time updates
  const handleTimeUpdate = useCallback(
    (frame: number) => {
      if (!isDragging) {
        const timeInSeconds = frame / compositionProps.settings.fps;
        seek(timeInSeconds);
      }
    },
    [seek, compositionProps.settings.fps, isDragging]
  );

  // Handle player play/pause
  const handlePlayPause = useCallback(() => {
    if (playback.isPlaying) {
      pause();
    } else {
      play();
    }
  }, [playback.isPlaying, play, pause]);

  // Handle seeking to specific time
  const handleSeek = useCallback(
    (time: number) => {
      const clampedTime = Math.max(
        0,
        Math.min(time, compositionProps.settings.duration)
      );
      seek(clampedTime);

      if (playerRef.current) {
        const frame = Math.round(clampedTime * compositionProps.settings.fps);
        playerRef.current.seekTo(frame);
      }
    },
    [seek, compositionProps.settings.duration, compositionProps.settings.fps]
  );

  // Handle timeline scrubbing
  const handleTimelineScrub = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const percentage = x / rect.width;
      const time = percentage * compositionProps.settings.duration;
      handleSeek(time);
    },
    [handleSeek, compositionProps.settings.duration]
  );

  // Handle timeline drag start
  const handleTimelineDragStart = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      setIsDragging(true);
      setDragStartTime(playback.currentTime);
      handleTimelineScrub(event);

      const handleMouseMove = (e: MouseEvent) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        const time = percentage * compositionProps.settings.duration;
        handleSeek(time);
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [
      handleSeek,
      handleTimelineScrub,
      playback.currentTime,
      compositionProps.settings.duration,
    ]
  );

  // Handle volume change
  const handleVolumeChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const volume = parseFloat(event.target.value);
      setVolume(volume);
    },
    [setVolume]
  );

  // Handle skip forward/backward
  const handleSkipBackward = useCallback(() => {
    const newTime = Math.max(0, playback.currentTime - 10);
    handleSeek(newTime);
  }, [playback.currentTime, handleSeek]);

  const handleSkipForward = useCallback(() => {
    const newTime = Math.min(
      compositionProps.settings.duration,
      playback.currentTime + 10
    );
    handleSeek(newTime);
  }, [playback.currentTime, compositionProps.settings.duration, handleSeek]);

  // Handle frame-by-frame navigation
  const handleFrameBackward = useCallback(() => {
    const frameTime = 1 / compositionProps.settings.fps;
    const newTime = Math.max(0, playback.currentTime - frameTime);
    handleSeek(newTime);
  }, [playback.currentTime, compositionProps.settings.fps, handleSeek]);

  const handleFrameForward = useCallback(() => {
    const frameTime = 1 / compositionProps.settings.fps;
    const newTime = Math.min(
      compositionProps.settings.duration,
      playback.currentTime + frameTime
    );
    handleSeek(newTime);
  }, [
    playback.currentTime,
    compositionProps.settings.fps,
    compositionProps.settings.duration,
    handleSeek,
  ]);

  if (!project) {
    // Graceful empty state for preview
    return (
      <div
        className={`bg-background-primary flex items-center justify-center ${className}`}
      >
        <div className="text-center text-text-secondary">
          <div className="w-16 h-16 bg-background-secondary rounded-lg mx-auto mb-4 flex items-center justify-center">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-lg font-medium text-text-primary">
            No Project Loaded
          </p>
          <p className="text-sm">Create or load a project to see the preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-background-primary flex flex-col ${className}`}>
      {/* Preview Area */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative w-full h-full max-w-4xl max-h-full">
          <Player
            acknowledgeRemotionLicense
            ref={playerRef}
            component={MainComposition}
            inputProps={compositionProps}
            durationInFrames={durationInFrames}
            fps={compositionProps.settings.fps}
            compositionWidth={compositionProps.settings.width}
            compositionHeight={compositionProps.settings.height}
            style={{
              width: '100%',
              height: '100%',
            }}
            controls={false}
            loop={false}
            showVolumeControls={false}
            clickToPlay={false}
            onTimeUpdate={handleTimeUpdate}
          />
          {talkingHeads.length > 0 && (
            <div className="absolute top-3 right-3 flex items-center space-x-2 bg-neutral-900/70 backdrop-blur px-2 py-1 rounded text-white text-xs">
              <button
                onClick={() => {
                  // Toggle hidden for all talking head items
                  for (const item of talkingHeads) {
                    updateTimelineItem(item.id, {
                      properties: {
                        ...item.properties,
                        talkingHeadHidden: !bubbleHidden,
                      },
                    });
                  }
                }}
                className="px-2 py-1 rounded hover:bg-neutral-800"
                title={bubbleHidden ? 'Show bubble' : 'Hide bubble'}
              >
                {bubbleHidden ? 'Show bubble' : 'Hide bubble'}
              </button>
              <button
                onClick={() => {
                  // Toggle mute for all talking head items
                  for (const item of talkingHeads) {
                    updateTimelineItem(item.id, { muted: !bubbleMuted });
                  }
                }}
                className="px-2 py-1 rounded hover:bg-neutral-800"
                title={bubbleMuted ? 'Unmute bubble' : 'Mute bubble'}
              >
                {bubbleMuted ? 'Unmute' : 'Mute'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Timeline Scrubber */}
      <div className="bg-background-secondary border-t border-border-subtle px-4 py-2">
        <div className="relative">
          <div
            className="h-2 bg-neutral-600 rounded-full cursor-pointer"
            onMouseDown={handleTimelineDragStart}
            onClick={handleTimelineScrub}
          >
            <div
              className="h-full bg-primary-600 rounded-full relative"
              style={{
                width: `${(playback.currentTime / compositionProps.settings.duration) * 100}%`,
              }}
            >
              <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-primary-600 rounded-full border-2 border-background-primary shadow-lg" />
            </div>
          </div>

          {/* Timeline markers */}
          <div className="flex justify-between text-xs text-text-secondary mt-1">
            <span>0:00</span>
            <span>{formatTime(compositionProps.settings.duration)}</span>
          </div>
        </div>
      </div>

      {/* Preview Controls */}
      <div className="bg-background-secondary border-t border-border-subtle p-4">
        <div className="flex items-center justify-between">
          {/* Left controls */}
          <div className="flex items-center space-x-2">
            {/* Frame backward */}
            <button
              onClick={handleFrameBackward}
              className="text-text-secondary hover:text-text-primary p-2 rounded transition-colors hover:bg-neutral-700"
              title="Previous Frame"
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
                  d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z"
                />
              </svg>
            </button>

            {/* Skip backward */}
            <button
              onClick={handleSkipBackward}
              className="text-text-secondary hover:text-text-primary p-2 rounded transition-colors hover:bg-neutral-700"
              title="Skip Backward 10s"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z"
                />
              </svg>
            </button>
          </div>

          {/* Center controls */}
          <div className="flex items-center space-x-4">
            <button
              onClick={handlePlayPause}
              className="bg-primary-600 hover:bg-primary-700 text-white rounded-full w-12 h-12 flex items-center justify-center transition-colors shadow-glow"
              title={playback.isPlaying ? 'Pause' : 'Play'}
            >
              {playback.isPlaying ? (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 9v6m4-6v6"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6 ml-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                </svg>
              )}
            </button>

            <div className="flex items-center space-x-2 text-sm text-text-secondary">
              <span>
                {formatTime(
                  playback.currentTime,
                  compositionProps.settings.fps
                )}
              </span>
              <span>/</span>
              <span>
                {formatTime(
                  compositionProps.settings.duration,
                  compositionProps.settings.fps
                )}
              </span>
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center space-x-2">
            {/* Export button */}
            <button
              onClick={() =>
                window.dispatchEvent(new CustomEvent('openExportDialog'))
              }
              className="text-text-secondary hover:text-text-primary p-2 rounded transition-colors hover:bg-neutral-700"
              title="Export Video"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </button>
            {/* Skip forward */}
            <button
              onClick={handleSkipForward}
              className="text-text-secondary hover:text-text-primary p-2 rounded transition-colors hover:bg-neutral-700"
              title="Skip Forward 10s"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 4v16l6-8-6-8zM11 4v16l6-8-6-8z"
                />
              </svg>
            </button>

            {/* Frame forward */}
            <button
              onClick={handleFrameForward}
              className="text-text-secondary hover:text-text-primary p-2 rounded transition-colors hover:bg-neutral-700"
              title="Next Frame"
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
                  d="M5 4v16l6-8-6-8zM11 4v16l6-8-6-8z"
                />
              </svg>
            </button>

            {/* Volume controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMute}
                className="text-text-secondary hover:text-text-primary p-2 rounded transition-colors hover:bg-neutral-700"
                title={playback.muted ? 'Unmute' : 'Mute'}
              >
                {playback.muted || playback.volume === 0 ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                    />
                  </svg>
                )}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={playback.muted ? 0 : playback.volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                style={
                  {
                    '--value': `${(playback.muted ? 0 : playback.volume) * 100}%`,
                  } as React.CSSProperties
                }
                title="Volume"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to format time with frame accuracy
function formatTime(seconds: number, fps: number = 30): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const frames = Math.floor((seconds % 1) * fps);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${frames.toString().padStart(2, '0')}`;
}
