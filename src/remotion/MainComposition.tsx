import React from 'react';
import { AbsoluteFill, useVideoConfig } from 'remotion';
import { VideoSequence } from './VideoSequence';
import { CodeSequence } from './CodeSequence';
import { TitleSequence } from './TitleSequence';
import { SideBySideSequence } from './SideBySideSequence';
import { VisualAssetSequence } from './VisualAssetSequence';
import type { MainCompositionProps } from './types';

export const MainComposition: React.FC<MainCompositionProps> = ({
  timeline,
  mediaAssets,
  settings,
  exportSettings,
}) => {
  const { fps } = useVideoConfig();

  // Guard against missing or zero durations by deriving from project settings when needed
  const fallbackDurationSec = Math.max(1, Number(settings?.duration ?? 60));

  const sequences = timeline
    .map((item) => {
      const startSec = Number.isFinite(item.startTime) ? item.startTime : 0;
      const itemDurSec = Number.isFinite(item.duration) && item.duration! > 0 ? item.duration : fallbackDurationSec;
      const startFrame = Math.round(startSec * fps);
      const durationInFrames = Math.round(itemDurSec * fps);

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
            animation={item.animation}
            exportSettings={exportSettings}
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
            animation={item.animation}
          />
        );
      }

      if (item.type === 'visual-asset') {
        return (
          <VisualAssetSequence
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
          animation={item.animation}
        />
      );
    })
    .filter(Boolean);

  // Determine if background should be transparent
  const shouldUseTransparentBackground = exportSettings?.transparentBackground ?? false;
  
  return (
    <AbsoluteFill
      style={{
        backgroundColor: shouldUseTransparentBackground ? 'transparent' : settings.backgroundColor,
      }}
    >
      {sequences.length > 0 ? (
        sequences
      ) : (
        <AbsoluteFill
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '24px',
            backgroundColor: shouldUseTransparentBackground ? 'transparent' : undefined,
          }}
        >
          No content to display
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
