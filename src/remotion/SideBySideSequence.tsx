import React, { useMemo } from 'react';
import { AbsoluteFill, Sequence, useVideoConfig } from 'remotion';
import type { TimelineItem, MediaAsset } from '../lib/types';

interface MediaFrameProps {
  asset: MediaAsset;
  startFrame: number;
  durationInFrames: number;
  autoFocus?: boolean;
  focusPointX?: number;
  focusPointY?: number;
  focusScale?: number;
}

export const MediaFrame: React.FC<MediaFrameProps> = ({
  asset,
  startFrame,
  durationInFrames,
  autoFocus = true,
  focusPointX = 0.5,
  focusPointY = 0.5,
  focusScale = 1.2,
}) => {
  const { width, height, fps } = useVideoConfig();
  const total = durationInFrames;

  // Simple Ken Burns: start at scale 1.0, pan towards focus and zoom to focusScale
  const style = useMemo(() => {
    const progress = (frame: number) => Math.max(0, Math.min(1, frame / total));
    // We'll compute transform per render via CSS variable by using currentTime in Remotion context
    return {} as React.CSSProperties;
  }, [total]);

  // We will just implement linear interpolation via inline style using CSS keyframes
  const keyframes = `
    @keyframes kbZoomPan {
      0%   { transform: translate(0px,0px) scale(1); }
      100% { transform: translate(${(0.5 - focusPointX) * 80}%, ${(0.5 - focusPointY) * 80}%) scale(${focusScale}); }
    }
  `;

  const renderContent = () => {
    if (asset.type === 'image') {
      return (
        <img
          src={asset.url}
          alt={asset.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', animation: autoFocus ? `kbZoomPan ${durationInFrames / fps}s ease-in-out forwards` : undefined }}
        />
      );
    }
    if (asset.type === 'video') {
      return (
        <video
          src={asset.url}
          muted
          style={{ width: '100%', height: '100%', objectFit: 'cover', animation: autoFocus ? `kbZoomPan ${durationInFrames / fps}s ease-in-out forwards` : undefined }}
        />
      );
    }
    return null;
  };

  return (
    <Sequence from={startFrame} durationInFrames={durationInFrames}>
      <AbsoluteFill>
        <style>{keyframes}</style>
        {renderContent()}
      </AbsoluteFill>
    </Sequence>
  );
};

interface SideBySideSequenceProps {
  item: TimelineItem;
  startFrame: number;
  durationInFrames: number;
  companion: MediaAsset | null;
}

export const SideBySideSequence: React.FC<SideBySideSequenceProps> = ({
  item,
  startFrame,
  durationInFrames,
  companion,
}) => {
  // Layout
  const layout = item.properties.sideBySideLayout || 'left-right';
  const gap = item.properties.sideBySideGap ?? 16;
  const isVertical = layout === 'top-bottom' || layout === 'bottom-top';
  const reverse = layout === 'right-left' || layout === 'bottom-top';

  return (
    <Sequence from={startFrame} durationInFrames={durationInFrames}>
      <AbsoluteFill style={{ display: 'flex', flexDirection: isVertical ? 'column' : 'row', gap }}>
        {!reverse ? (
          <>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              {/* Code side will be rendered by CodeSequence separately; this component is for companion media */}
            </div>
            <div style={{ flex: 1, overflow: 'hidden', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
              {companion && (
                <MediaFrame
                  asset={companion}
                  startFrame={startFrame}
                  durationInFrames={durationInFrames}
                  autoFocus={item.properties.autoFocus}
                  focusPointX={item.properties.focusPointX}
                  focusPointY={item.properties.focusPointY}
                  focusScale={item.properties.focusScale}
                />
              )}
            </div>
          </>
        ) : (
          <>
            <div style={{ flex: 1, overflow: 'hidden', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
              {companion && (
                <MediaFrame
                  asset={companion}
                  startFrame={startFrame}
                  durationInFrames={durationInFrames}
                  autoFocus={item.properties.autoFocus}
                  focusPointX={item.properties.focusPointX}
                  focusPointY={item.properties.focusPointY}
                  focusScale={item.properties.focusScale}
                />
              )}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              {/* Code slot */}
            </div>
          </>
        )}
      </AbsoluteFill>
    </Sequence>
  );
};

