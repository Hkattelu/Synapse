import React from 'react';
import { AbsoluteFill, useVideoConfig } from 'remotion';
import { VideoSequence } from './VideoSequence';
import type { MainCompositionProps } from './types';

export const MainComposition: React.FC<MainCompositionProps> = ({
  timeline,
  mediaAssets,
  settings,
}) => {
  const { fps } = useVideoConfig();

  // Convert timeline items to Remotion sequences
  const sequences = timeline.map((item) => {
    const asset = mediaAssets.find((a) => a.id === item.assetId);
    if (!asset) return null;

    const startFrame = Math.round(item.startTime * fps);
    const durationInFrames = Math.round(item.duration * fps);

    return (
      <VideoSequence
        key={item.id}
        item={item}
        asset={asset}
        startFrame={startFrame}
        durationInFrames={durationInFrames}
      />
    );
  }).filter(Boolean);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: settings.backgroundColor,
      }}
    >
      {sequences}
    </AbsoluteFill>
  );
};