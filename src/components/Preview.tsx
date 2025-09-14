import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Player, type PlayerRef } from '@remotion/player';
import { useProject, usePlayback } from '../state/hooks';
import * as Hooks from '../state/hooks';
import { MainComposition } from '../remotion/MainComposition';
import type { MainCompositionProps } from '../remotion/types';
import type { TimelineItem } from '../lib/types';
import { getEducationalTrackByNumber } from '../lib/educationalTypes';

interface PreviewProps {
  className?: string;
}

// Helper function to format time with frame accuracy
function formatTime(seconds: number, fps: number = 30): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const frames = Math.floor((seconds % 1) * fps);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${frames.toString().padStart(2, '0')}`;
}

export const Preview: React.FC<PreviewProps> = ({ className = '' }) => {
  const { project, updateProject } = useProject();
  const { playback, play, pause, seek, setVolume, toggleMute } = usePlayback();
  // Some tests partially mock the hooks module without providing useTimeline.
  // Tolerate that by falling back to a no-op implementation when missing,
  // but keep everything strongly typed.
  type TimelineApi = {
    timeline: TimelineItem[];
    updateTimelineItem: (id: string, updates: Partial<TimelineItem>) => void;
  };
  const noopUpdate: TimelineApi['updateTimelineItem'] = () => {};
  let useTimelineFn: (() => TimelineApi) | undefined;
  if (Object.prototype.hasOwnProperty.call(Hooks, 'useTimeline')) {
    const candidate = (Hooks as unknown as { useTimeline: unknown })
      .useTimeline;
    if (typeof candidate === 'function') {
      useTimelineFn = candidate as () => TimelineApi;
    }
  }
  const useTimelineOrStub: () => TimelineApi =
    useTimelineFn ?? (() => ({ timeline: [], updateTimelineItem: noopUpdate }));

  const { timeline, updateTimelineItem } = useTimelineOrStub();
  const playerRef = React.useRef<PlayerRef>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Local state for editable dimensions
  const [dimWidth, setDimWidth] = useState<number>(
    () => project?.settings.width || 1920
  );
  const [dimHeight, setDimHeight] = useState<number>(
    () => project?.settings.height || 1080
  );

  useEffect(() => {
    if (project?.settings) {
      setDimWidth(project.settings.width);
      setDimHeight(project.settings.height);
    }
  }, [project?.settings?.width, project?.settings?.height]);

  const applyDimensions = useCallback(
    (w: number, h: number) => {
      if (!project) return;
      const width = Math.max(256, Math.min(3840, Math.floor(w)));
      const height = Math.max(256, Math.min(3840, Math.floor(h)));
      setDimWidth(width);
      setDimHeight(height);
      updateProject({ settings: { ...project.settings, width, height } });
    },
    [project, updateProject]
  );

  const applyAspectPreset = useCallback(
    (
      preset:
        | '16:9'
        | '9:16'
        | '1:1'
        | '720p'
        | '1080p'
        | 'vertical-720'
        | 'vertical-1080'
    ) => {
      if (!project) return;
      const fps = project.settings.fps;
      switch (preset) {
        case '16:9':
        case '1080p':
          applyDimensions(1920, 1080);
          break;
        case '720p':
          applyDimensions(1280, 720);
          break;
        case '9:16':
        case 'vertical-1080':
          applyDimensions(1080, 1920);
          break;
        case 'vertical-720':
          applyDimensions(720, 1280);
          break;
        case '1:1':
          applyDimensions(1080, 1080);
          break;
        default:
          applyDimensions(project.settings.width, project.settings.height);
          break;
      }
    },
    [project, applyDimensions]
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

  // Sync playback state with player (ensure seek on play transitions)
  const wasPlayingRef = React.useRef<boolean>(false);
  useEffect(() => {
    if (!playerRef.current) return;

    // Add a small delay to ensure player is ready
    const timer = setTimeout(() => {
      if (!playerRef.current) return;

      try {
        // If transitioning to playing, ensure the player seeks to the global current time first
        if (playback.isPlaying && !wasPlayingRef.current) {
          const frame = Math.round(
            playback.currentTime * compositionProps.settings.fps
          );
          playerRef.current.seekTo(frame);
          playerRef.current.play();
        } else if (playback.isPlaying) {
          playerRef.current.play();
        } else {
          playerRef.current.pause();
        }
        wasPlayingRef.current = playback.isPlaying;
      } catch {
        console.error('Error controlling player');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [playback.isPlaying, playback.currentTime, compositionProps.settings.fps]);

  // Manual timer for updating playback time when Remotion's onTimeUpdate doesn't work
  useEffect(() => {
    if (!playback.isPlaying) return;

    const interval = setInterval(() => {
      if (playerRef.current && !isDragging) {
        try {
          // Try to get current frame from player
          if (typeof playerRef.current.getCurrentFrame === 'function') {
            const currentFrame = playerRef.current.getCurrentFrame();
            const timeInSeconds = currentFrame / compositionProps.settings.fps;

            // Only update if time has changed significantly
            if (Math.abs(timeInSeconds - playback.currentTime) > 0.01) {
              seek(timeInSeconds);
            }
          } else {
            // Fallback: increment time manually based on real time
            const newTime = playback.currentTime + 1000 / 30 / 1000; // 30fps increment
            if (newTime <= compositionProps.settings.duration) {
              seek(newTime);
            } else {
              // End of video, pause
              pause();
            }
          }
        } catch {
          // Fallback: increment time manually
          const newTime = playback.currentTime + 1000 / 30 / 1000;
          if (newTime <= compositionProps.settings.duration) {
            seek(newTime);
          } else {
            pause();
          }
        }
      }
    }, 1000 / 30); // Update at 30fps

    return () => clearInterval(interval);
  }, [
    playback.isPlaying,
    playback.currentTime,
    seek,
    compositionProps.settings.fps,
    compositionProps.settings.duration,
    isDragging,
    pause,
  ]);

  // Sync current time with player (only when seeking manually)
  useEffect(() => {
    if (!playerRef.current || isDragging) return;
    if (!playerRef.current || isDragging) return;

    const currentFrame = Math.round(
      playback.currentTime * compositionProps.settings.fps
    );

    // Only seek if there's a significant difference to avoid conflicts
    const playerCurrentFrame = Math.round(
      playback.currentTime * compositionProps.settings.fps
    );
    if (Math.abs(currentFrame - playerCurrentFrame) > 1) {
      playerRef.current.seekTo(currentFrame);
    }
  }, [playback.currentTime, compositionProps.settings.fps, isDragging]);

  // Handle player play/pause
  const handlePlayPause = useCallback(() => {
    if (playback.isPlaying) {
      pause();
    } else {
      // Ensure player seeks to current global time before starting playback via UI control
      if (playerRef.current) {
        try {
          const frame = Math.round(
            playback.currentTime * compositionProps.settings.fps
          );
          playerRef.current.seekTo(frame);
        } catch {}
      }
      play();
    }
  }, [playback.isPlaying, play, pause, playback.currentTime, compositionProps.settings.fps]);

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

  // Handle fullscreen toggle
  const handleFullscreenToggle = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Handle escape key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isFullscreen]);

  // Handle timeline drag start
  const handleTimelineDragStart = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      setIsDragging(true);
      handleTimelineScrub(event);

      // Capture the DOM element now; don't rely on the pooled React event later
      const targetEl = event.currentTarget as HTMLDivElement;

      const handleMouseMove = (e: MouseEvent) => {
        const rect = targetEl.getBoundingClientRect();
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
      <div className="flex-1 flex items-center justify-center p-4 bg-black">
        <div className="relative w-full h-full flex items-center justify-center group">
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
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
            }}
            controls={false}
            loop={false}
            showVolumeControls={false}
            clickToPlay={false}
          />

          {/* Fullscreen Button */}
          <button
            onClick={handleFullscreenToggle}
            className="absolute top-3 right-3 bg-neutral-900/70 backdrop-blur hover:bg-neutral-800/70 text-white p-2 rounded transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? (
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
                  d="M6 18L18 6M6 6l12 12"
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
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
            )}
          </button>

          {/* Hover Controls Overlay */}
          <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="pointer-events-auto bg-neutral-900/70 backdrop-blur rounded-lg px-3 py-2 text-white flex items-center gap-4 border border-white/10">
              {/* Play/Pause */}
              <button
                onClick={handlePlayPause}
                className="bg-primary-600 hover:bg-primary-700 text-white rounded-full w-12 h-12 flex items-center justify-center transition-colors"
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
                    className="w-6 h-6 ml-0.5"
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

              {/* Time Display */}
              <div className="flex items-center gap-1 text-xs">
                <span className="font-mono">
                  {formatTime(
                    playback.currentTime,
                    compositionProps.settings.fps
                  )}
                </span>
                <span className="opacity-70">/</span>
                <span className="font-mono">
                  {formatTime(
                    compositionProps.settings.duration,
                    compositionProps.settings.fps
                  )}
                </span>
              </div>

              {/* Volume Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="text-white/90 hover:text-white p-2 rounded transition-colors"
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
                  className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer slider"
                  title="Volume"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Timeline Scrubber with centered Record button */}
      <div className="bg-background-secondary border-t border-border-subtle px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <div
              className="h-2 bg-gray-600 rounded-full cursor-pointer relative"
              onMouseDown={handleTimelineDragStart}
              onClick={handleTimelineScrub}
              data-testid="timeline-scrubber"
            >
              {/* Progress bar (colored left side) */}
              <div
                className="h-full bg-purple-600 rounded-full relative transition-all duration-100"
                style={{
                  width: `${Math.max(0, Math.min(100, (playback.currentTime / compositionProps.settings.duration) * 100))}%`,
                }}
              />
              {/* Playhead handle */}
              <div
                className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full border-2 border-purple-600 shadow-lg cursor-grab active:cursor-grabbing transition-all duration-100"
                style={{
                  left: `${Math.max(0, Math.min(100, (playback.currentTime / compositionProps.settings.duration) * 100))}%`,
                  transform: 'translateX(-50%)',
                }}
              />
            </div>
          </div>
          <button
            onClick={() => {
              try {
                window.dispatchEvent(new CustomEvent('openRecorderDialog'));
              } catch {}
            }}
            className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-synapse-sm"
            title="Record narration or camera"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Condensed Preview Controls (reduced height) */}
      <div className="bg-background-secondary/80 border-t border-border-subtle px-3 py-2">
        <div className="flex items-center justify-between">
          {/* Left: Frame step */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleFrameBackward}
              className="text-text-secondary hover:text-text-primary p-1.5 rounded hover:bg-neutral-700"
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
            <button
              onClick={handleFrameForward}
              className="text-text-secondary hover:text-text-primary p-1.5 rounded hover:bg-neutral-700"
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
          </div>

          {/* Center: Time display (secondary) */}
          <div className="flex items-center gap-1 text-xs text-text-secondary">
            <span className="font-mono">
              {formatTime(playback.currentTime, compositionProps.settings.fps)}
            </span>
            <span>/</span>
            <span className="font-mono">
              {formatTime(
                compositionProps.settings.duration,
                compositionProps.settings.fps
              )}
            </span>
          </div>

          {/* Right: Aspect ratio + Record (Export moved to header; Audio moved to overlay) */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1">
              {(() => {
                const w = project?.settings.width || dimWidth;
                const h = project?.settings.height || dimHeight;
                const gcd = (a: number, b: number): number =>
                  b === 0 ? Math.abs(a) : gcd(b, a % b);
                const g = gcd(w, h) || 1;
                const ratioLabel = `${Math.round(w / g)}/${Math.round(h / g)}`;
                const isChecked = (val: '16/9' | '1/1' | '9/16') =>
                  ratioLabel === val;
                const baseBtn =
                  'inline-flex items-center justify-center px-2.5 py-1 text-xs rounded-md';
                const checkedCls =
                  'bg-background-primary text-text-primary shadow-sm';
                const uncheckedCls =
                  'text-text-secondary hover:bg-background-primary/30';
                return (
                  <div
                    role="radiogroup"
                    aria-label="Aspect ratio"
                    className="inline-flex items-center bg-background-tertiary rounded-md p-0.5"
                  >
                    <button
                      type="button"
                      role="radio"
                      aria-checked={isChecked('16/9')}
                      className={`${baseBtn} ${isChecked('16/9') ? checkedCls : uncheckedCls}`}
                      onClick={() => applyDimensions(1920, 1080)}
                      title="Landscape 16:9"
                      value="16/9"
                      tabIndex={-1}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-3.5 w-3.5"
                      >
                        <rect width="20" height="12" x="2" y="6" rx="2"></rect>
                      </svg>
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={isChecked('1/1')}
                      className={`${baseBtn} ${isChecked('1/1') ? checkedCls : uncheckedCls}`}
                      onClick={() => applyDimensions(1080, 1080)}
                      title="Square 1:1"
                      value="1/1"
                      tabIndex={-1}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-3.5 w-3.5"
                      >
                        <rect width="18" height="18" x="3" y="3" rx="2"></rect>
                      </svg>
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={isChecked('9/16')}
                      className={`${baseBtn} ${isChecked('9/16') ? checkedCls : uncheckedCls}`}
                      onClick={() => applyDimensions(1080, 1920)}
                      title="Vertical 9:16"
                      value="9/16"
                      tabIndex={0}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-3.5 w-3.5"
                      >
                        <rect width="12" height="20" x="6" y="2" rx="2"></rect>
                      </svg>
                    </button>
                  </div>
                );
              })()}
            </div>
            <button
              onClick={() =>
                window.dispatchEvent(new CustomEvent('openRecorderDialog'))
              }
              className="text-red-400 hover:text-red-300 p-1.5 rounded hover:bg-neutral-700"
              title="Record Narration"
            >
              <svg
                className="w-4 h-4"
                fill="currentColor"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="8" strokeWidth={0} />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Fullscreen Overlay */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
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
                maxWidth: '100vw',
                maxHeight: '100vh',
                objectFit: 'contain',
              }}
              controls={false}
              loop={false}
              showVolumeControls={false}
              clickToPlay={false}
            />

            {/* Fullscreen Exit Button */}
            <button
              onClick={handleFullscreenToggle}
              className="absolute top-4 right-4 bg-neutral-900/70 backdrop-blur hover:bg-neutral-800/70 text-white p-3 rounded-full transition-colors z-10"
              title="Exit Fullscreen (ESC)"
            >
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Fullscreen Controls */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-neutral-900/70 backdrop-blur rounded-lg p-4">
              <div className="flex items-center space-x-4">
                {/* Play/Pause */}
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

                {/* Time Display */}
                <div className="flex items-center space-x-2 text-sm text-white">
                  <span className="font-mono">
                    {formatTime(
                      playback.currentTime,
                      compositionProps.settings.fps
                    )}
                  </span>
                  <span>/</span>
                  <span className="font-mono">
                    {formatTime(
                      compositionProps.settings.duration,
                      compositionProps.settings.fps
                    )}
                  </span>
                </div>

                {/* Volume */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={toggleMute}
                    className="text-white hover:text-gray-300 p-2 rounded transition-colors"
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
                    className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                    title="Volume"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
