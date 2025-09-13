import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import type { TimelineItem } from '../lib/types';

interface VisualAssetSequenceProps {
  item: TimelineItem;
  startFrame: number;
  durationInFrames: number;
}

export const VisualAssetSequence: React.FC<VisualAssetSequenceProps> = ({
  item,
  startFrame,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const relativeFrame = frame - startFrame;

  // Don't render if outside the item's time range
  if (relativeFrame < 0 || relativeFrame >= durationInFrames) {
    return null;
  }

  const {
    x = 0,
    y = 0,
    scale = 1,
    rotation = 0,
    opacity = 1,
    visualAssetType,
    strokeColor = '#ff0000',
    fillColor = 'transparent',
    strokeWidth = 3,
    animateIn = 'fade',
    animateOut = 'fade',
  } = item.properties;

  // Animation calculations
  const animateInDuration = Math.min(30, durationInFrames * 0.2); // 30 frames or 20% of duration
  const animateOutDuration = Math.min(30, durationInFrames * 0.2);
  const animateOutStart = durationInFrames - animateOutDuration;

  let animationOpacity = 1;
  let animationScale = 1;

  // Animate in
  if (relativeFrame < animateInDuration) {
    const progress = relativeFrame / animateInDuration;
    if (animateIn === 'fade') {
      animationOpacity = interpolate(progress, [0, 1], [0, 1]);
    } else if (animateIn === 'scale') {
      animationScale = spring({
        frame: relativeFrame,
        fps,
        config: { damping: 10, stiffness: 100 },
      });
      animationOpacity = interpolate(progress, [0, 1], [0, 1]);
    }
  }

  // Animate out
  if (relativeFrame >= animateOutStart) {
    const progress = (relativeFrame - animateOutStart) / animateOutDuration;
    if (animateOut === 'fade') {
      animationOpacity = interpolate(progress, [0, 1], [1, 0]);
    } else if (animateOut === 'scale') {
      animationScale = interpolate(progress, [0, 1], [1, 0]);
      animationOpacity = interpolate(progress, [0, 1], [1, 0]);
    }
  }

  const finalOpacity = opacity * animationOpacity;
  const finalScale = scale * animationScale;

  const transform = `translate(${x}px, ${y}px) scale(${finalScale}) rotate(${rotation}deg)`;

  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          transform,
          transformOrigin: 'center',
          opacity: finalOpacity,
          pointerEvents: 'none',
        }}
      >
        {visualAssetType === 'arrow' && <ArrowAsset item={item} />}
        {visualAssetType === 'box' && <BoxAsset item={item} />}
        {visualAssetType === 'finger-pointer' && (
          <FingerPointerAsset item={item} />
        )}
        {visualAssetType === 'circle' && <CircleAsset item={item} />}
        {visualAssetType === 'line' && <LineAsset item={item} />}
      </div>
    </AbsoluteFill>
  );
};

const ArrowAsset: React.FC<{ item: TimelineItem }> = ({ item }) => {
  const {
    arrowDirection = 'right',
    arrowStyle = 'solid',
    strokeColor = '#ff0000',
    strokeWidth = 3,
    arrowThickness = 3,
  } = item.properties;

  const getArrowPath = () => {
    const size = 60;
    const headSize = 15;

    switch (arrowDirection) {
      case 'right':
        return `M 0 ${size / 2} L ${size - headSize} ${size / 2} M ${size - headSize} ${headSize} L ${size} ${size / 2} L ${size - headSize} ${size - headSize}`;
      case 'left':
        return `M ${size} ${size / 2} L ${headSize} ${size / 2} M ${headSize} ${headSize} L 0 ${size / 2} L ${headSize} ${size - headSize}`;
      case 'up':
        return `M ${size / 2} ${size} L ${size / 2} ${headSize} M ${headSize} ${headSize} L ${size / 2} 0 L ${size - headSize} ${headSize}`;
      case 'down':
        return `M ${size / 2} 0 L ${size / 2} ${size - headSize} M ${headSize} ${size - headSize} L ${size / 2} ${size} L ${size - headSize} ${size - headSize}`;
      default:
        return `M 0 ${size / 2} L ${size - headSize} ${size / 2} M ${size - headSize} ${headSize} L ${size} ${size / 2} L ${size - headSize} ${size - headSize}`;
    }
  };

  return (
    <svg width="60" height="60" viewBox="0 0 60 60">
      <path
        d={getArrowPath()}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={arrowStyle === 'dashed' ? '5,5' : 'none'}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const BoxAsset: React.FC<{ item: TimelineItem }> = ({ item }) => {
  const {
    strokeColor = '#ff0000',
    fillColor = 'transparent',
    strokeWidth = 3,
    boxStyle = 'solid',
    borderRadius = 0,
  } = item.properties;

  const width = 120;
  const height = 80;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <rect
        x={strokeWidth / 2}
        y={strokeWidth / 2}
        width={width - strokeWidth}
        height={height - strokeWidth}
        rx={borderRadius}
        ry={borderRadius}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={
          boxStyle === 'dashed' ? '8,4' : boxStyle === 'dotted' ? '2,2' : 'none'
        }
        fill={fillColor}
      />
    </svg>
  );
};

const FingerPointerAsset: React.FC<{ item: TimelineItem }> = ({ item }) => {
  const {
    fingerDirection = 'down',
    strokeColor = '#ff0000',
    fillColor = '#ff0000',
    strokeWidth = 2,
  } = item.properties;

  const getFingerPath = () => {
    switch (fingerDirection) {
      case 'down':
        return 'M20 5 C18 5 16 7 16 9 L16 15 C16 17 18 19 20 19 L22 19 C24 19 26 17 26 15 L26 9 C26 7 24 5 22 5 L20 5 Z M21 19 L21 35 M18 32 L21 35 L24 32';
      case 'up':
        return 'M20 35 C18 35 16 33 16 31 L16 25 C16 23 18 21 20 21 L22 21 C24 21 26 23 26 25 L26 31 C26 33 24 35 22 35 L20 35 Z M21 21 L21 5 M18 8 L21 5 L24 8';
      case 'left':
        return 'M35 20 C35 18 33 16 31 16 L25 16 C23 16 21 18 21 20 L21 22 C21 24 23 26 25 26 L31 26 C33 26 35 24 35 22 L35 20 Z M21 21 L5 21 M8 18 L5 21 L8 24';
      case 'right':
        return 'M5 20 C5 18 7 16 9 16 L15 16 C17 16 19 18 19 20 L19 22 C19 24 17 26 15 26 L9 26 C7 26 5 24 5 22 L5 20 Z M19 21 L35 21 M32 18 L35 21 L32 24';
      default:
        return 'M20 5 C18 5 16 7 16 9 L16 15 C16 17 18 19 20 19 L22 19 C24 19 26 17 26 15 L26 9 C26 7 24 5 22 5 L20 5 Z M21 19 L21 35 M18 32 L21 35 L24 32';
    }
  };

  return (
    <svg width="40" height="40" viewBox="0 0 40 40">
      <path
        d={getFingerPath()}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        fill={fillColor}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const CircleAsset: React.FC<{ item: TimelineItem }> = ({ item }) => {
  const {
    strokeColor = '#ff0000',
    fillColor = 'transparent',
    strokeWidth = 3,
    circleStyle = 'solid',
  } = item.properties;

  const radius = 40;
  const size = radius * 2 + strokeWidth;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={
          circleStyle === 'dashed'
            ? '8,4'
            : circleStyle === 'dotted'
              ? '2,2'
              : 'none'
        }
        fill={fillColor}
      />
    </svg>
  );
};

const LineAsset: React.FC<{ item: TimelineItem }> = ({ item }) => {
  const {
    strokeColor = '#ff0000',
    strokeWidth = 3,
    lineStyle = 'solid',
    lineStartX = 0,
    lineStartY = 0,
    lineEndX = 100,
    lineEndY = 0,
  } = item.properties;

  const minX = Math.min(lineStartX, lineEndX);
  const minY = Math.min(lineStartY, lineEndY);
  const maxX = Math.max(lineStartX, lineEndX);
  const maxY = Math.max(lineStartY, lineEndY);

  const width = maxX - minX + strokeWidth;
  const height = maxY - minY + strokeWidth;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <line
        x1={lineStartX - minX + strokeWidth / 2}
        y1={lineStartY - minY + strokeWidth / 2}
        x2={lineEndX - minX + strokeWidth / 2}
        y2={lineEndY - minY + strokeWidth / 2}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={
          lineStyle === 'dashed'
            ? '8,4'
            : lineStyle === 'dotted'
              ? '2,2'
              : 'none'
        }
        strokeLinecap="round"
      />
    </svg>
  );
};
