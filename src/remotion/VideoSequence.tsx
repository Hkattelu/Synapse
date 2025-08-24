import React from 'react';
import * as Remotion from 'remotion';
import type { VideoSequenceProps } from './types';

export const VideoSequence: React.FC<VideoSequenceProps> = ({
  item,
  asset,
  startFrame,
  durationInFrames,
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
  const { height } = Remotion.useVideoConfig();
  const trackHeight = height / 4; // Assuming 4 tracks max for now
  const trackY = item.track * trackHeight;

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
        opacity,
        overflow: 'hidden',
        borderRadius: bubbleShape === 'circle' ? 9999 : 16,
        boxShadow: '0 6px 24px rgba(0,0,0,0.35)',
        border: '2px solid rgba(255,255,255,0.7)',
        display: bubbleHidden ? 'none' : 'block',
      }
    : {
        transform: `translate(${x}px, ${y + trackY}px) scale(${scale}) rotate(${rotation}deg)`,
        opacity,
      };

  return (
    <Remotion.Sequence from={startFrame} durationInFrames={durationInFrames}>
      <Remotion.AbsoluteFill>
        {talkingHead ? (
          <div style={style}>
            {asset.type === 'video' && (
              <Remotion.Video
                src={asset.url}
                volume={item.properties.volume || 1}
                playbackRate={item.properties.playbackRate || 1}
                muted={item.muted}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            )}
          </div>
        ) : (
          <div style={style}>
            {asset.type === 'video' && (
              <Remotion.Video
                src={asset.url}
                volume={item.properties.volume || 1}
                playbackRate={item.properties.playbackRate || 1}
                muted={item.muted}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
            )}

            {asset.type === 'image' && (
              <Remotion.Img
                src={asset.url}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
            )}

            {asset.type === 'audio' && (
              <>
                {/* Visual placeholder */}
                <Remotion.AbsoluteFill
                  style={{
                    backgroundColor: 'rgba(0, 255, 0, 0.18)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    color: 'white',
                  }}
                >
                  🎵 {asset.name}
                </Remotion.AbsoluteFill>
                {/* Actual audio playback */}
                {
                  'Audio' in (Remotion as any) && typeof (Remotion as any).Audio === 'function' ? (
                    <Remotion.Audio
                      src={asset.url}
                      volume={item.properties.volume ?? 1}
                      muted={item.muted}
                    />
                  ) : null
                }
              </>
            )}

            {asset.type === 'code' && (
              <Remotion.AbsoluteFill
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
              </Remotion.AbsoluteFill>
            )}
          </div>
        )}
      </Remotion.AbsoluteFill>
    </Remotion.Sequence>
  );
};
