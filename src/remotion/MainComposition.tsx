import React from 'react';
import { AbsoluteFill, useVideoConfig } from 'remotion';
import { VideoSequence } from './VideoSequence';
import { CodeSequence } from './CodeSequence';
import { TitleSequence } from './TitleSequence';
import { SideBySideSequence } from './SideBySideSequence';
import type { MainCompositionProps } from './types';

export const MainComposition: React.FC<MainCompositionProps> = ({
  timeline,
  mediaAssets,
  settings,
}) => {
  const { fps } = useVideoConfig();

  // Convert timeline items to Remotion sequences
  const sequences = timeline
    .map((item) => {
      const startFrame = Math.round(item.startTime * fps);
      const durationInFrames = Math.round(item.duration * fps);

      // Handle sequences that don't need assets
      if (item.type === 'code') {
        // If sideBySideAssetId is set, render SideBySideSequence wrapper (companion media) plus code
        if (item.properties.sideBySideAssetId) {
          const companion =
            mediaAssets.find(
              (a) => a.id === item.properties.sideBySideAssetId
            ) || null;
          return (
            <SideBySideSequence
              key={item.id}
              item={item}
              startFrame={startFrame}
              durationInFrames={durationInFrames}
              companion={companion}
            />
          );
        }
        return (
          <CodeSequence
            key={item.id}
            item={item}
            startFrame={startFrame}
            durationInFrames={durationInFrames}
          />
        );
      }

      if (item.type === 'title') {
        return (
          <TitleSequence
            key={item.id}
            item={item}
            startFrame={startFrame}
            durationInFrames={durationInFrames}
          />
        );
      }

      // For other types, find the associated asset
      const asset = mediaAssets.find((a) => a.id === item.assetId);
      if (!asset) return null;

      return (
        <VideoSequence
          key={item.id}
          item={item}
          asset={asset}
          startFrame={startFrame}
          durationInFrames={durationInFrames}
        />
      );
    })
    .filter(Boolean);

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
