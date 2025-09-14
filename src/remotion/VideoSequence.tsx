import React from 'react';
import { AbsoluteFill, Sequence, Video, Img, useVideoConfig } from 'remotion';
// Keep a namespace import as well so we can defensively check for optional exports
// like `Audio` in test environments where `remotion` is partially mocked.
import * as RemotionNS from 'remotion';
import type { VideoSequenceProps } from './types';
import { useAnimationStyles } from './animations/useAnimationStyles';

export const VideoSequence: React.FC<VideoSequenceProps> = ({
  item,
  asset,
  startFrame,
  durationInFrames,
  animation,
}) => {
  // If talking head overlay is enabled on this item, render as a small corner bubble
  const talkingHead = item.properties.talkingHeadEnabled === true;
  const bubbleCorner = item.properties.talkingHeadCorner ?? 'bottom-right';
  const bubbleSize = item.properties.talkingHeadSize ?? 'sm';
  const bubbleShape = item.properties.talkingHeadShape ?? 'circle';
  const bubbleHidden = item.properties.talkingHeadHidden === true;

  // Calculate position and size based on item properties
  const x = item.properties.x || 0;
  const y = item.properties.y || 0;
  const scale = item.properties.scale || 1;
  const rotation = item.properties.rotation || 0;
  const opacity = item.properties.opacity || 1;

  // Calculate track-based positioning based on composition height
  const { height } = useVideoConfig();
  const trackHeight = height / 4; // Assuming 4 tracks max for now
  const trackY = item.track * trackHeight;

  const anim = animation ?? item.animation;
  const animStyles = useAnimationStyles(anim, { startFrame, durationInFrames });

  const style: React.CSSProperties = talkingHead
    ? {
        // Corner-anchored bubble
        position: 'absolute',
        width: bubbleSize === 'md' ? 256 : 176,
        height: bubbleSize === 'md' ? 256 : 176,
        // Add a small margin to avoid covering edges
        ...(bubbleCorner.includes('top') ? { top: 24 } : { bottom: 24 }),
        ...(bubbleCorner.includes('left') ? { left: 24 } : { right: 24 }),
        transform: 'none',
        opacity: (animStyles.opacity ?? 1) * opacity,
        overflow: 'hidden',
        borderRadius: bubbleShape === 'circle' ? 9999 : 16,
        boxShadow: '0 6px 24px rgba(0,0,0,0.35)',
        border: '2px solid rgba(255,255,255,0.7)',
        display: bubbleHidden ? 'none' : 'block',
      }
    : {
        transform:
          `${animStyles.transform ?? ''} translate(${x}px, ${y + trackY}px) scale(${scale}) rotate(${rotation}deg)`.trim(),
        opacity: (animStyles.opacity ?? 1) * opacity,
        overflow: animStyles.needsOverflowHidden ? 'hidden' : undefined,
      };

  return (
    <Sequence from={startFrame} durationInFrames={durationInFrames}>
      <AbsoluteFill>
        {talkingHead ? (
          <div style={style}>
            {asset.type === 'video' &&
              (asset.url ? (
                <Video
                  src={asset.url}
                  volume={item.properties.volume ?? 1}
                  playbackRate={item.properties.playbackRate ?? 1}
                  muted={item.muted}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <AbsoluteFill
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    color: 'white',
                  }}
                >
                  ▶ {asset.name}
                </AbsoluteFill>
              ))}
          </div>
        ) : (
          <div style={style}>
            {asset.type === 'video' &&
              (asset.url ? (
                <Video
                  src={asset.url}
                  volume={item.properties.volume ?? 1}
                  playbackRate={item.properties.playbackRate ?? 1}
                  muted={item.muted}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                  }}
                />
              ) : (
                <AbsoluteFill
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    color: 'white',
                  }}
                >
                  ▶ {asset.name}
                </AbsoluteFill>
              ))}

            {asset.type === 'image' &&
              (asset.url ? (
                <Img
                  src={asset.url}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                  }}
                />
              ) : (
                <AbsoluteFill
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    color: 'white',
                  }}
                >
                  🖼 {asset.name}
                </AbsoluteFill>
              ))}

            {asset.type === 'audio' && (
              <>
                {/* Audio playback only; no visual overlay for narration */}
                {(() => {
                  type AudioProps = {
                    src: string;
                    volume?: number;
                    playbackRate?: number;
                    muted?: boolean;
                  };
                  const hasAudio =
                    'Audio' in
                    (RemotionNS as unknown as Record<string, unknown>);
                  if (!hasAudio) return null;
                  const AudioComp = (
                    RemotionNS as unknown as {
                      Audio: React.ComponentType<AudioProps>;
                    }
                  ).Audio;
                  if (!asset.url) return null;
                  return (
                    <AudioComp
                      src={asset.url}
                      volume={item.properties.volume ?? 1}
                      playbackRate={item.properties.playbackRate ?? 1}
                      muted={item.muted}
                    />
                  );
                })()}
              </>
            )}

            {asset.type === 'code' && (
              <AbsoluteFill
                style={{
                  backgroundColor: '#1e1e1e',
                  padding: '20px',
                  fontFamily: 'monospace',
                  fontSize: '16px',
                  color: '#d4d4d4',
                  overflow: 'hidden',
                }}
              >
                <pre>
                  {/* Code content would be rendered here */}
                  {item.properties.text || '// Code content'}
                </pre>
              </AbsoluteFill>
            )}
          </div>
        )}
      </AbsoluteFill>
    </Sequence>
  );
};
