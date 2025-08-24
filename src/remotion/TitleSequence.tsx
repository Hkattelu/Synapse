import React, { useMemo } from 'react';
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import type { TitleSequenceProps } from './types';

// Text animation types
const TEXT_ANIMATIONS = {
  fadeIn: (progress: number) => ({
    opacity: progress,
    transform: 'translateY(0px)',
  }),
  slideUp: (progress: number) => ({
    opacity: progress,
    transform: `translateY(${(1 - progress) * 50}px)`,
  }),
  slideDown: (progress: number) => ({
    opacity: progress,
    transform: `translateY(${(progress - 1) * 50}px)`,
  }),
  slideLeft: (progress: number) => ({
    opacity: progress,
    transform: `translateX(${(1 - progress) * 50}px)`,
  }),
  slideRight: (progress: number) => ({
    opacity: progress,
    transform: `translateX(${(progress - 1) * 50}px)`,
  }),
  scale: (progress: number) => ({
    opacity: progress,
    transform: `scale(${0.5 + progress * 0.5})`,
  }),
  typewriter: (progress: number, text: string) => ({
    opacity: 1,
    transform: 'translateY(0px)',
  }),
};

export const TitleSequence: React.FC<TitleSequenceProps> = ({
  item,
  startFrame,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  console.log('TitleSequence rendering:', {
    text: item.properties.text,
    startFrame,
    durationInFrames,
    currentFrame: frame,
    relativeFrame: frame - startFrame,
    x: item.properties.x,
    y: item.properties.y
  });

  // Get title properties
  const text = item.properties.text || 'Title Text';
  const fontFamily = item.properties.fontFamily || 'Inter, sans-serif';
  const color = item.properties.color || '#ffffff';
  const backgroundColor = item.properties.backgroundColor || 'transparent';
  const fontSize = item.properties.fontSize || 48;

  // Get transform properties
  const x = item.properties.x || 0;
  const y = item.properties.y || 0;
  const scale = item.properties.scale || 1;
  const rotation = item.properties.rotation || 0;
  const opacity = item.properties.opacity || 1;

  // Animation handling
  const animations = item.animations || [];
  const hasEntranceAnimation = animations.some((a) => a.type === 'entrance');
  const hasExitAnimation = animations.some((a) => a.type === 'exit');

  // Calculate animation progress
  const relativeFrame = frame - startFrame;

  // Entrance animation
  let entranceProgress = 1;
  if (hasEntranceAnimation) {
    const entranceAnimation = animations.find((a) => a.type === 'entrance');
    if (entranceAnimation) {
      const entranceDuration = entranceAnimation.duration * fps;
      entranceProgress = interpolate(
        relativeFrame,
        [0, entranceDuration],
        [0, 1],
        {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }
      );
    }
  }

  // Exit animation
  let exitProgress = 1;
  if (hasExitAnimation) {
    const exitAnimation = animations.find((a) => a.type === 'exit');
    if (exitAnimation) {
      const exitDuration = exitAnimation.duration * fps;
      const exitStart = durationInFrames - exitDuration;
      exitProgress = interpolate(
        relativeFrame,
        [exitStart, durationInFrames],
        [1, 0],
        {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }
      );
    }
  }

  // Combine animation effects
  const combinedProgress = Math.min(entranceProgress, exitProgress);

  // Apply animations based on type
  const animationStyle = useMemo(() => {
    if (!hasEntranceAnimation && !hasExitAnimation) {
      return {};
    }

    const entranceAnimation = animations.find((a) => a.type === 'entrance');
    let animationType = 'fadeIn';

    if (entranceAnimation) {
      // Map animation preset IDs to animation types
      switch (entranceAnimation.id) {
        case 'slide-in-left':
          animationType = 'slideLeft';
          break;
        case 'slide-in-right':
          animationType = 'slideRight';
          break;
        case 'slide-in-up':
          animationType = 'slideUp';
          break;
        case 'slide-in-down':
          animationType = 'slideDown';
          break;
        case 'scale-in':
          animationType = 'scale';
          break;
        case 'typewriter':
          animationType = 'typewriter';
          break;
        default:
          animationType = 'fadeIn';
      }
    }

    const animationFn =
      TEXT_ANIMATIONS[animationType as keyof typeof TEXT_ANIMATIONS];
    if (typeof animationFn === 'function') {
      return animationFn(combinedProgress, text);
    }

    return TEXT_ANIMATIONS.fadeIn(combinedProgress);
  }, [
    combinedProgress,
    animations,
    hasEntranceAnimation,
    hasExitAnimation,
    text,
  ]);

  // Typewriter effect for specific animations
  const displayText = useMemo(() => {
    const typewriterAnimation = animations.find((a) => a.id === 'typewriter');
    if (typewriterAnimation && hasEntranceAnimation) {
      const charactersToShow = Math.floor(text.length * entranceProgress);
      return text.substring(0, charactersToShow);
    }
    return text;
  }, [text, entranceProgress, animations, hasEntranceAnimation]);

  // Container style - use flexbox for centering, then adjust with transform
  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    backgroundColor:
      backgroundColor === 'transparent' ? 'transparent' : backgroundColor,
    // Apply positioning as offset from center
    transform: `translate(${x - 960}px, ${y - 540}px) scale(${scale}) rotate(${rotation}deg)`,
    opacity: opacity * combinedProgress,
  };

  // Text style
  const textStyle: React.CSSProperties = {
    color,
    fontFamily,
    fontSize: `${fontSize}px`,
    fontWeight: 'bold',
    lineHeight: 1.2,
    wordWrap: 'break-word',
    maxWidth: '100%',
    // Temporary: add background to make text visible
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
    padding: '10px',
    border: '2px solid yellow',
    ...animationStyle,
  };

  return (
    <Sequence from={startFrame} durationInFrames={durationInFrames}>
      <AbsoluteFill style={containerStyle}>
        <div style={textStyle}>
          {displayText}
          {/* Typewriter cursor */}
          {animations.some((a) => a.id === 'typewriter') &&
            entranceProgress < 1 && (
              <span
                style={{
                  color,
                  animation: 'blink 1s infinite',
                  marginLeft: '2px',
                }}
              >
                |
              </span>
            )}
        </div>

        {/* Blinking cursor animation for typewriter */}
        <style>
          {`
            @keyframes blink {
              0%, 50% { opacity: 1; }
              51%, 100% { opacity: 0; }
            }
          `}
        </style>
      </AbsoluteFill>
    </Sequence>
  );
};
