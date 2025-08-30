import type {
  TimelineItem,
  MediaAsset,
  ProjectSettings,
  AnimationConfig,
  ExportSettings,
} from '../lib/types';

export interface MainCompositionProps extends Record<string, unknown> {
  timeline: TimelineItem[];
  mediaAssets: MediaAsset[];
  settings: ProjectSettings;
  exportSettings?: ExportSettings;
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
  exportSettings?: ExportSettings;
}

export interface TitleSequenceProps {
  item: TimelineItem;
  startFrame: number;
  durationInFrames: number;
  animation?: AnimationConfig;
}
