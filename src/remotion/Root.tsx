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
          } satisfies MainCompositionProps
        }
      />
    </>
  );
};
