import type { TimelineItem, MediaAsset, ProjectSettings } from '../lib/types';

export interface MainCompositionProps {
  timeline: TimelineItem[];
  mediaAssets: MediaAsset[];
  settings: ProjectSettings;
}

export interface VideoSequenceProps {
  item: TimelineItem;
  asset: MediaAsset;
  startFrame: number;
  durationInFrames: number;
}