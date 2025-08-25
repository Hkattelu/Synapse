import React from 'react';
import type {
  MediaAsset,
  TimelineItem,
  AnimationConfig,
} from '../../lib/types';
import {
  getApplicablePresets,
  PRESET_REGISTRY,
} from '../../remotion/animations/presets';
import { KenBurnsControls } from './controls/KenBurnsControls';
import { SlideControls } from './controls/SlideControls';
import { TypewriterControls } from './controls/TypewriterControls';
import { LineFocusControls } from './controls/LineFocusControls';

export function PresetSelector({
  item,
  asset,
  onChange,
}: {
  item: TimelineItem;
  asset?: MediaAsset;
  onChange: (animation: AnimationConfig | undefined) => void;
}) {
  const applicable = getApplicablePresets(item.type, asset?.type);
  const active = item.animation;

  return (
    <div className="border-b border-border-subtle">
      <div className="p-4">
        <h4 className="font-medium text-text-primary mb-3">
          Animation Presets
        </h4>
        <div className="flex flex-wrap gap-2 mb-3">
          {applicable.map((p) => (
            <button
              key={p.id}
              onClick={() => onChange(p.makeDefault())}
              className={`px-3 py-1.5 rounded text-sm border transition-colors ${
                active?.preset === p.id
                  ? 'bg-primary-600 text-white border-primary-500 shadow-glow'
                  : 'bg-background-tertiary text-text-secondary border-border-subtle hover:text-text-primary'
              }`}
            >
              {p.title}
            </button>
          ))}
          {active && (
            <button
              onClick={() => onChange(undefined)}
              className="ml-2 px-3 py-1.5 rounded text-sm border bg-neutral-700 text-white hover:bg-neutral-600"
              title="Clear preset"
            >
              Clear
            </button>
          )}
        </div>

        {active && (
          <div className="mt-2">
            {active.preset === 'slide' && (
              <SlideControls value={active} onChange={onChange} />
            )}
            {active.preset === 'kenBurns' && (
              <KenBurnsControls value={active} onChange={onChange} />
            )}
            {active.preset === 'typewriter' && (
              <TypewriterControls value={active} onChange={onChange} />
            )}
            {active.preset === 'lineFocus' && (
              <LineFocusControls value={active} onChange={onChange} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
