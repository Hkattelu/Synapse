import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { AudioAnalysisData, TimingSyncPoint } from '../lib/audioUtils';
import { analyzeAudioData } from '../lib/audioUtils';

interface WaveformVisualizationProps {
  audioUrl?: string;
  audioBuffer?: AudioBuffer;
  width: number;
  height: number;
  color?: string;
  currentTime?: number;
  duration?: number;
  syncPoints?: TimingSyncPoint[];
  onSyncPointClick?: (syncPoint: TimingSyncPoint) => void;
  onTimeClick?: (time: number) => void;
  className?: string;
  showSyncPoints?: boolean;
  interactive?: boolean;
}

export function WaveformVisualization({
  audioUrl,
  audioBuffer,
  width,
  height,
  color = '#F59E0B',
  currentTime = 0,
  duration = 0,
  syncPoints = [],
  onSyncPointClick,
  onTimeClick,
  className = '',
  showSyncPoints = true,
  interactive = true,
}: WaveformVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [analysisData, setAnalysisData] = useState<AudioAnalysisData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  // Load and analyze audio data
  useEffect(() => {
    if (audioBuffer) {
      setIsLoading(true);
      analyzeAudioData(audioBuffer)
        .then(setAnalysisData)
        .finally(() => setIsLoading(false));
    } else if (audioUrl) {
      setIsLoading(true);
      loadAudioFromUrl(audioUrl)
        .then((buffer) => analyzeAudioData(buffer))
        .then(setAnalysisData)
        .finally(() => setIsLoading(false));
    }
  }, [audioUrl, audioBuffer]);

  // Draw waveform
  useEffect(() => {
    if (!analysisData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    drawWaveform(
      ctx,
      analysisData,
      width,
      height,
      color,
      currentTime,
      duration
    );

    if (showSyncPoints) {
      drawSyncPoints(ctx, syncPoints, width, height, duration);
    }

    drawPlayhead(ctx, currentTime, duration, width, height);
  }, [
    analysisData,
    width,
    height,
    color,
    currentTime,
    duration,
    syncPoints,
    showSyncPoints,
  ]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!interactive || !onTimeClick || !duration) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const clickTime = (x / width) * duration;

      onTimeClick(clickTime);
    },
    [interactive, onTimeClick, duration, width]
  );

  const handleSyncPointClick = useCallback(
    (syncPoint: TimingSyncPoint) => {
      if (onSyncPointClick) {
        onSyncPointClick(syncPoint);
      }
    },
    [onSyncPointClick]
  );

  if (isLoading) {
    return (
      <div
        className={`flex items-center justify-center bg-background-subtle rounded ${className}`}
        style={{ width, height }}
      >
        <div className="text-text-secondary text-sm">Loading waveform...</div>
      </div>
    );
  }

  if (!analysisData) {
    return (
      <div
        className={`flex items-center justify-center bg-background-subtle rounded ${className}`}
        style={{ width, height }}
      >
        <div className="text-text-secondary text-sm">No audio data</div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 ${interactive ? 'cursor-pointer' : ''}`}
        onClick={handleCanvasClick}
      />

      {/* Sync point markers (interactive overlay) */}
      {showSyncPoints &&
        interactive &&
        syncPoints.map((syncPoint) => {
          const x = (syncPoint.time / duration) * width;
          return (
            <button
              key={syncPoint.id}
              className="absolute top-0 bottom-0 w-2 bg-accent-blue bg-opacity-50 hover:bg-opacity-75 transition-opacity"
              style={{ left: x - 4 }}
              onClick={() => handleSyncPointClick(syncPoint)}
              title={syncPoint.label}
            />
          );
        })}
    </div>
  );
}

// Helper function to load audio from URL
async function loadAudioFromUrl(url: string): Promise<AudioBuffer> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const audioContext = new (window.AudioContext ||
    (window as any).webkitAudioContext)();
  return audioContext.decodeAudioData(arrayBuffer);
}

// Draw waveform visualization
function drawWaveform(
  ctx: CanvasRenderingContext2D,
  data: AudioAnalysisData,
  width: number,
  height: number,
  color: string,
  currentTime: number,
  duration: number
) {
  const { waveform } = data;
  const centerY = height / 2;
  const maxAmplitude = height * 0.4; // Use 80% of height for waveform

  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.8;

  // Draw waveform
  ctx.beginPath();
  for (let i = 0; i < waveform.length; i++) {
    const x = (i / waveform.length) * width;
    const amplitude = waveform[i] * maxAmplitude;

    if (i === 0) {
      ctx.moveTo(x, centerY - amplitude);
    } else {
      ctx.lineTo(x, centerY - amplitude);
    }
  }
  ctx.stroke();

  // Draw mirrored waveform (bottom half)
  ctx.beginPath();
  for (let i = 0; i < waveform.length; i++) {
    const x = (i / waveform.length) * width;
    const amplitude = waveform[i] * maxAmplitude;

    if (i === 0) {
      ctx.moveTo(x, centerY + amplitude);
    } else {
      ctx.lineTo(x, centerY + amplitude);
    }
  }
  ctx.stroke();

  // Fill area for played portion
  if (duration > 0) {
    const playedWidth = (currentTime / duration) * width;

    ctx.globalAlpha = 0.3;
    ctx.fillStyle = color;

    ctx.beginPath();
    for (let i = 0; i < waveform.length; i++) {
      const x = (i / waveform.length) * width;
      if (x > playedWidth) break;

      const amplitude = waveform[i] * maxAmplitude;

      if (i === 0) {
        ctx.moveTo(x, centerY - amplitude);
      } else {
        ctx.lineTo(x, centerY - amplitude);
      }
    }

    // Complete the fill area
    for (
      let i = Math.floor((playedWidth / width) * waveform.length);
      i >= 0;
      i--
    ) {
      const x = (i / waveform.length) * width;
      const amplitude = waveform[i] * maxAmplitude;
      ctx.lineTo(x, centerY + amplitude);
    }

    ctx.closePath();
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}

// Draw sync point markers
function drawSyncPoints(
  ctx: CanvasRenderingContext2D,
  syncPoints: TimingSyncPoint[],
  width: number,
  height: number,
  duration: number
) {
  if (duration <= 0) return;

  ctx.strokeStyle = '#3B82F6'; // Blue color for sync points
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.7;

  syncPoints.forEach((syncPoint) => {
    const x = (syncPoint.time / duration) * width;

    // Draw vertical line
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();

    // Draw marker dot
    ctx.fillStyle = '#3B82F6';
    ctx.beginPath();
    ctx.arc(x, height / 2, 3, 0, 2 * Math.PI);
    ctx.fill();
  });

  ctx.globalAlpha = 1;
}

// Draw playhead indicator
function drawPlayhead(
  ctx: CanvasRenderingContext2D,
  currentTime: number,
  duration: number,
  width: number,
  height: number
) {
  if (duration <= 0) return;

  const x = (currentTime / duration) * width;

  ctx.strokeStyle = '#EF4444'; // Red playhead
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.9;

  // Draw playhead line
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, height);
  ctx.stroke();

  // Draw playhead triangle
  ctx.fillStyle = '#EF4444';
  ctx.beginPath();
  ctx.moveTo(x - 4, 0);
  ctx.lineTo(x + 4, 0);
  ctx.lineTo(x, 8);
  ctx.closePath();
  ctx.fill();

  ctx.globalAlpha = 1;
}

// Compact waveform component for timeline clips
interface CompactWaveformProps {
  audioUrl?: string;
  audioBuffer?: AudioBuffer;
  width: number;
  height: number;
  color?: string;
  className?: string;
}

export function CompactWaveform({
  audioUrl,
  audioBuffer,
  width,
  height,
  color = '#F59E0B',
  className = '',
}: CompactWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [analysisData, setAnalysisData] = useState<AudioAnalysisData | null>(
    null
  );

  useEffect(() => {
    if (audioBuffer) {
      analyzeAudioData(audioBuffer).then(setAnalysisData);
    } else if (audioUrl) {
      loadAudioFromUrl(audioUrl)
        .then((buffer) => analyzeAudioData(buffer))
        .then(setAnalysisData);
    }
  }, [audioUrl, audioBuffer]);

  useEffect(() => {
    if (!analysisData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);

    const { waveform } = analysisData;
    const centerY = height / 2;
    const maxAmplitude = height * 0.3;

    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.6;

    // Simple bar visualization for compact view
    const barWidth = Math.max(1, width / waveform.length);

    for (let i = 0; i < waveform.length; i++) {
      const x = (i / waveform.length) * width;
      const amplitude = waveform[i] * maxAmplitude;

      ctx.fillStyle = color;
      ctx.fillRect(x, centerY - amplitude, barWidth, amplitude * 2);
    }

    ctx.globalAlpha = 1;
  }, [analysisData, width, height, color]);

  if (!analysisData) {
    return (
      <div
        className={`bg-background-subtle rounded ${className}`}
        style={{ width, height }}
      />
    );
  }

  return (
    <canvas ref={canvasRef} className={className} style={{ width, height }} />
  );
}
