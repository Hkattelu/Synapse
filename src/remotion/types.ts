import type {
  TimelineItem,
  MediaAsset,
  ProjectSettings,
  AnimationConfig,
} from '../lib/types';

export interface MainCompositionProps extends Record<string, unknown> {
  timeline: TimelineItem[];
  mediaAssets: MediaAsset[];
  settings: ProjectSettings;
}

export interface VideoSequenceProps {
  item: TimelineItem;
  asset: MediaAsset;
  startFrame: number;
  durationInFrames: number;
  animation?: AnimationConfig;
}

export interface CodeSequenceProps {
  item: TimelineItem;
  startFrame: number;
  durationInFrames: number;
  animation?: AnimationConfig;
}

export interface TitleSequenceProps {
  item: TimelineItem;
  startFrame: number;
  durationInFrames: number;
  animation?: AnimationConfig;
}
