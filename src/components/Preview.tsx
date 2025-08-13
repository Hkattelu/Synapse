import React, { useCallback, useEffect, useMemo } from 'react';
import { Player, PlayerRef } from '@remotion/player';
import { useProject, usePlayback } from '../state/hooks';
import { MainComposition } from '../remotion/MainComposition';
import type { MainCompositionProps } from '../remotion/types';

interface PreviewProps {
  className?: string;
}

export const Preview: React.FC<PreviewProps> = ({ className = '' }) => {
  const { project } = useProject();
  const { playback, play, pause, seek } = usePlayback();
  const playerRef = React.useRef<PlayerRef>(null);

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
    return Math.round(compositionProps.settings.duration * compositionProps.settings.fps);
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
    
    const currentFrame = Math.round(playback.currentTime * compositionProps.settings.fps);
    playerRef.current.seekTo(currentFrame);
  }, [playback.currentTime, compositionProps.settings.fps]);

  // Handle player time updates
  const handleTimeUpdate = useCallback((frame: number) => {
    const timeInSeconds = frame / compositionProps.settings.fps;
    seek(timeInSeconds);
  }, [seek, compositionProps.settings.fps]);

  // Handle player play/pause
  const handlePlayPause = useCallback(() => {
    if (playback.isPlaying) {
      pause();
    } else {
      play();
    }
  }, [playback.isPlaying, play, pause]);

  if (!project) {
    return (
      <div className={`bg-black flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-400">
          <div className="w-16 h-16 bg-gray-800 rounded-lg mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </div>
          <p className="text-lg font-medium">No Project Loaded</p>
          <p className="text-sm">Create or load a project to see the preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-black flex flex-col ${className}`}>
      {/* Preview Area */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full h-full max-w-4xl max-h-full">
          <Player
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
        </div>
      </div>

      {/* Preview Controls */}
      <div className="bg-gray-800 border-t border-gray-700 p-4">
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={handlePlayPause}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-12 h-12 flex items-center justify-center transition-colors"
            title={playback.isPlaying ? 'Pause' : 'Play'}
          >
            {playback.isPlaying ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
              </svg>
            ) : (
              <svg className="w-6 h-6 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              </svg>
            )}
          </button>

          <div className="flex items-center space-x-2 text-sm text-gray-300">
            <span>{formatTime(playback.currentTime)}</span>
            <span>/</span>
            <span>{formatTime(compositionProps.settings.duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to format time
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const frames = Math.floor((seconds % 1) * 30); // Assuming 30fps
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${frames.toString().padStart(2, '0')}`;
}