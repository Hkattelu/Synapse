import React from 'react';
import { AbsoluteFill, Sequence, Video, Img, staticFile } from 'remotion';
import type { VideoSequenceProps } from './types';

export const VideoSequence: React.FC<VideoSequenceProps> = ({
  item,
  asset,
  startFrame,
  durationInFrames,
}) => {
  // Calculate position and size based on item properties
  const x = item.properties.x || 0;
  const y = item.properties.y || 0;
  const scale = item.properties.scale || 1;
  const rotation = item.properties.rotation || 0;
  const opacity = item.properties.opacity || 1;

  // Calculate track-based positioning
  const trackHeight = 1080 / 4; // Assuming 4 tracks max for now
  const trackY = item.track * trackHeight;

  const style: React.CSSProperties = {
    transform: `translate(${x}px, ${y + trackY}px) scale(${scale}) rotate(${rotation}deg)`,
    opacity,
  };

  return (
    <Sequence from={startFrame} durationInFrames={durationInFrames}>
      <AbsoluteFill style={style}>
        {asset.type === 'video' && (
          <Video
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
          <Img
            src={asset.url}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        )}
        
        {asset.type === 'audio' && (
          <AbsoluteFill
            style={{
              backgroundColor: 'rgba(0, 255, 0, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              color: 'white',
            }}
          >
            🎵 {asset.name}
          </AbsoluteFill>
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
      </AbsoluteFill>
    </Sequence>
  );
};