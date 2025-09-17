import React, { useEffect, useRef, useState } from 'react';
import type { AudioLevelMeter } from '../lib/audioUtils';
import { calculateAudioLevels } from '../lib/audioUtils';

interface AudioLevelMeterProps {
  audioContext?: AudioContext;
  audioSource?: AudioNode;
  style: 'bars' | 'circular' | 'linear';
  width?: number;
  height?: number;
  color?: string;
  backgroundColor?: string;
  showPeak?: boolean;
  showAverage?: boolean;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export function AudioLevelMeter({
  audioContext,
  audioSource,
  style = 'bars',
  width = 100,
  height = 20,
  color = '#10B981',
  backgroundColor = '#374151',
  showPeak = true,
  showAverage = false,
  className = '',
  orientation = 'horizontal',
}: AudioLevelMeterProps) {
  const [levels, setLevels] = useState<AudioLevelMeter>({
    currentLevel: 0,
    peakLevel: 0,
    averageLevel: 0,
  });
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();

  // Set up audio analysis
  useEffect(() => {
    if (!audioContext || !audioSource) return;

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;

    audioSource.connect(analyser);
    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateLevels = () => {
      if (!analyserRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArray);

      // Convert to float array and calculate levels
      const floatArray = new Float32Array(dataArray.length);
      for (let i = 0; i < dataArray.length; i++) {
        floatArray[i] = dataArray[i] / 255;
      }

      const newLevels = calculateAudioLevels(floatArray, levels);
      setLevels(newLevels);

      animationFrameRef.current = requestAnimationFrame(updateLevels);
    };

    updateLevels();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      try {
        if (analyserRef.current) {
          // In some flows the source may already be disconnected elsewhere.
          // Guard to avoid: "Failed to execute 'disconnect' on 'AudioNode': the given destination is not connected."
          audioSource.disconnect(analyserRef.current);
        }
      } catch {}
      analyserRef.current = null;
    };
  }, [audioContext, audioSource]);

  // Reset peak level periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setLevels((prev) => ({
        ...prev,
        peakLevel: prev.peakLevel * 0.95, // Gradual decay
      }));
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const renderMeter = () => {
    switch (style) {
      case 'bars':
        return (
          <BarMeter
            {...{
              levels,
              width,
              height,
              color,
              backgroundColor,
              showPeak,
              showAverage,
              orientation,
            }}
          />
        );
      case 'circular':
        return (
          <CircularMeter
            {...{
              levels,
              width: Math.min(width, height),
              color,
              backgroundColor,
              showPeak,
              showAverage,
            }}
          />
        );
      case 'linear':
        return (
          <LinearMeter
            {...{
              levels,
              width,
              height,
              color,
              backgroundColor,
              showPeak,
              showAverage,
              orientation,
            }}
          />
        );
      default:
        return (
          <LinearMeter
            {...{
              levels,
              width,
              height,
              color,
              backgroundColor,
              showPeak,
              showAverage,
              orientation,
            }}
          />
        );
    }
  };

  return (
    <div className={`audio-level-meter ${className}`}>{renderMeter()}</div>
  );
}

// Bar-style level meter
function BarMeter({
  levels,
  width,
  height,
  color,
  backgroundColor,
  showPeak,
  showAverage,
  orientation,
}: {
  levels: AudioLevelMeter;
  width: number;
  height: number;
  color: string;
  backgroundColor: string;
  showPeak: boolean;
  showAverage: boolean;
  orientation: 'horizontal' | 'vertical';
}) {
  const numBars =
    orientation === 'horizontal'
      ? Math.floor(width / 4)
      : Math.floor(height / 4);
  const bars: JSX.Element[] = [];

  for (let i = 0; i < numBars; i++) {
    const threshold = i / numBars;
    const isActive = levels.currentLevel > threshold;
    const isPeak =
      showPeak &&
      levels.peakLevel > threshold &&
      levels.peakLevel <= (i + 1) / numBars;
    const isAverage =
      showAverage &&
      levels.averageLevel > threshold &&
      levels.averageLevel <= (i + 1) / numBars;

    let barColor = backgroundColor;
    if (isActive) {
      // Color gradient from green to yellow to red
      if (threshold < 0.6) {
        barColor = '#10B981'; // Green
      } else if (threshold < 0.8) {
        barColor = '#F59E0B'; // Yellow
      } else {
        barColor = '#EF4444'; // Red
      }
    } else if (isPeak) {
      barColor = '#F59E0B'; // Peak indicator
    } else if (isAverage) {
      barColor = `${color}80`; // Semi-transparent average
    }

    const barStyle: React.CSSProperties =
      orientation === 'horizontal'
        ? {
            width: `${100 / numBars}%`,
            height: '100%',
            backgroundColor: barColor,
            marginRight: '1px',
          }
        : {
            width: '100%',
            height: `${100 / numBars}%`,
            backgroundColor: barColor,
            marginBottom: '1px',
          };

    bars.push(<div key={i} style={barStyle} />);
  }

  return (
    <div
      className="flex"
      style={{
        width,
        height,
        flexDirection: orientation === 'horizontal' ? 'row' : 'column-reverse',
      }}
    >
      {bars}
    </div>
  );
}

// Circular level meter
function CircularMeter({
  levels,
  width,
  color,
  backgroundColor,
  showPeak,
  showAverage,
}: {
  levels: AudioLevelMeter;
  width: number;
  color: string;
  backgroundColor: string;
  showPeak: boolean;
  showAverage: boolean;
}) {
  const radius = width / 2 - 4;
  const centerX = width / 2;
  const centerY = width / 2;
  const startAngle = -Math.PI / 2; // Start at top
  const endAngle = startAngle + 2 * Math.PI * 0.75; // 3/4 circle

  const currentAngle =
    startAngle + (endAngle - startAngle) * levels.currentLevel;
  const peakAngle = startAngle + (endAngle - startAngle) * levels.peakLevel;
  const averageAngle =
    startAngle + (endAngle - startAngle) * levels.averageLevel;

  return (
    <svg width={width} height={width} className="transform -rotate-90">
      {/* Background arc */}
      <path
        d={`M ${centerX + radius * Math.cos(startAngle)} ${centerY + radius * Math.sin(startAngle)} A ${radius} ${radius} 0 0 1 ${centerX + radius * Math.cos(endAngle)} ${centerY + radius * Math.sin(endAngle)}`}
        fill="none"
        stroke={backgroundColor}
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* Current level arc */}
      {levels.currentLevel > 0 && (
        <path
          d={`M ${centerX + radius * Math.cos(startAngle)} ${centerY + radius * Math.sin(startAngle)} A ${radius} ${radius} 0 ${currentAngle - startAngle > Math.PI ? 1 : 0} 1 ${centerX + radius * Math.cos(currentAngle)} ${centerY + radius * Math.sin(currentAngle)}`}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
        />
      )}

      {/* Peak indicator */}
      {showPeak && levels.peakLevel > 0 && (
        <circle
          cx={centerX + radius * Math.cos(peakAngle)}
          cy={centerY + radius * Math.sin(peakAngle)}
          r="3"
          fill="#F59E0B"
        />
      )}

      {/* Average indicator */}
      {showAverage && levels.averageLevel > 0 && (
        <circle
          cx={centerX + radius * Math.cos(averageAngle)}
          cy={centerY + radius * Math.sin(averageAngle)}
          r="2"
          fill={`${color}80`}
        />
      )}
    </svg>
  );
}

// Linear level meter
function LinearMeter({
  levels,
  width,
  height,
  color,
  backgroundColor,
  showPeak,
  showAverage,
  orientation,
}: {
  levels: AudioLevelMeter;
  width: number;
  height: number;
  color: string;
  backgroundColor: string;
  showPeak: boolean;
  showAverage: boolean;
  orientation: 'horizontal' | 'vertical';
}) {
  const isHorizontal = orientation === 'horizontal';

  const currentSize = isHorizontal
    ? width * levels.currentLevel
    : height * levels.currentLevel;

  const peakPosition = isHorizontal
    ? width * levels.peakLevel
    : height * levels.peakLevel;

  const averagePosition = isHorizontal
    ? width * levels.averageLevel
    : height * levels.averageLevel;

  return (
    <div
      className="relative rounded-full overflow-hidden"
      style={{
        width,
        height,
        backgroundColor,
      }}
    >
      {/* Current level fill */}
      <div
        className="absolute transition-all duration-75 ease-out rounded-full"
        style={{
          backgroundColor: color,
          ...(isHorizontal
            ? {
                left: 0,
                top: 0,
                width: currentSize,
                height: '100%',
              }
            : {
                left: 0,
                bottom: 0,
                width: '100%',
                height: currentSize,
              }),
        }}
      />

      {/* Peak indicator */}
      {showPeak && levels.peakLevel > 0 && (
        <div
          className="absolute bg-yellow-400"
          style={{
            ...(isHorizontal
              ? {
                  left: peakPosition - 1,
                  top: 0,
                  width: 2,
                  height: '100%',
                }
              : {
                  left: 0,
                  bottom: peakPosition - 1,
                  width: '100%',
                  height: 2,
                }),
          }}
        />
      )}

      {/* Average indicator */}
      {showAverage && levels.averageLevel > 0 && (
        <div
          className="absolute opacity-60"
          style={{
            backgroundColor: color,
            ...(isHorizontal
              ? {
                  left: averagePosition - 1,
                  top: 0,
                  width: 2,
                  height: '100%',
                }
              : {
                  left: 0,
                  bottom: averagePosition - 1,
                  width: '100%',
                  height: 2,
                }),
          }}
        />
      )}
    </div>
  );
}

// Simple static level meter for timeline clips
interface StaticLevelMeterProps {
  level: number; // 0-1
  width: number;
  height: number;
  color?: string;
  backgroundColor?: string;
  className?: string;
}

export function StaticLevelMeter({
  level,
  width,
  height,
  color = '#10B981',
  backgroundColor = '#374151',
  className = '',
}: StaticLevelMeterProps) {
  return (
    <div
      className={`relative rounded-full overflow-hidden ${className}`}
      style={{
        width,
        height,
        backgroundColor,
      }}
    >
      <div
        className="absolute left-0 top-0 h-full rounded-full transition-all duration-200"
        style={{
          backgroundColor: color,
          width: `${level * 100}%`,
        }}
      />
    </div>
  );
}
