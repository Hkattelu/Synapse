import type {
  AnimationConfig,
  MediaAsset,
  TimelineItemType,
} from '../../lib/types';

export type PresetId = AnimationConfig['preset'];

export type Applicable = {
  id: PresetId;
  title: string;
  // Which timeline item types / asset types this preset supports
  supports: {
    timelineTypes: TimelineItemType[];
    assetTypes: MediaAsset['type'][];
  };
  // Build default config for a newly applied preset
  makeDefault: () => AnimationConfig;
};

export const PRESET_REGISTRY: Applicable[] = [
  {
    id: 'typewriter',
    title: 'Typewriter',
    supports: {
      timelineTypes: ['code', 'title'],
      assetTypes: ['code', 'video', 'image', 'audio'], // N/A for title/code items
    },
    makeDefault: () => ({ preset: 'typewriter', speedCps: 30 }),
  },
  {
    id: 'lineFocus',
    title: 'Line Focus',
    supports: { timelineTypes: ['code'], assetTypes: ['code'] },
    makeDefault: () => ({
      preset: 'lineFocus',
      activeLines: '1',
      focusOpacity: 0.3,
    }),
  },
  {
    id: 'kenBurns',
    title: 'Gentle Pan & Zoom',
    supports: { timelineTypes: ['video'], assetTypes: ['image', 'video'] },
    makeDefault: () => ({
      preset: 'kenBurns',
      direction: 'zoomIn',
      intensity: 0.4,
    }),
  },
  {
    id: 'slide',
    title: 'Slide In / Out',
    supports: {
      timelineTypes: ['code', 'title', 'video'],
      assetTypes: ['code', 'image', 'video'],
    },
    makeDefault: () => ({
      preset: 'slide',
      direction: 'left',
      duration: 30,
      easing: 'gentle',
    }),
  },
];

export function getApplicablePresets(
  timelineType: TimelineItemType,
  assetType: MediaAsset['type'] | undefined
) {
  return PRESET_REGISTRY.filter(
    (p) =>
      p.supports.timelineTypes.includes(timelineType) &&
      (assetType
        ? p.supports.assetTypes.includes(assetType) ||
          timelineType === 'title' ||
          timelineType === 'code'
        : true)
  );
}
