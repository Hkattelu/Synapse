import { Composition } from 'remotion';
import { MainComposition } from './MainComposition';
import type { MainCompositionProps } from './types';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MainComposition"
        component={MainComposition}
        durationInFrames={1800} // 60 seconds at 30fps
        fps={30}
        width={1920}
        height={1080}
        calculateMetadata={({ props }: { props: MainCompositionProps }) => {
          // Dynamically compute duration from incoming props if provided
          const fps = 30;
          const durationSec = Math.max(
            1,
            Math.floor(props.settings?.duration ?? 60)
          );
          return {
            durationInFrames: durationSec * fps,
            fps,
            width: props.settings?.width ?? 1920,
            height: props.settings?.height ?? 1080,
          };
        }}
        defaultProps={
          {
            timeline: [],
            mediaAssets: [],
            settings: {
              width: 1920,
              height: 1080,
              fps: 30,
              duration: 60,
              backgroundColor: '#000000',
            },
            exportSettings: {
              format: 'mp4',
              codec: 'h264',
              quality: 'high',
              audioCodec: 'aac',
              transparentBackground: false,
              includeWallpaper: true,
              includeGradient: true,
            },
          } satisfies MainCompositionProps
        }
      />
    </>
  );
};
