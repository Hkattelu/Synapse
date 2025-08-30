import React from 'react';
import type { AnimationConfig } from '../../../lib/types';

type DiffFadeConfig = Extract<AnimationConfig, { preset: 'diffFade' }>;

const DURATION_MIN = 1;
const DURATION_MAX = 120;
const INTENSITY_MIN = 0;
const INTENSITY_MAX = 1;

const clampInt = (raw: string, min: number, max: number) => {
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
};

const clampFloat = (raw: string, min: number, max: number) => {
  const n = parseFloat(raw);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
};

export function DiffFadeControls({
  value,
  onChange,
}: {
  value: Extract<AnimationConfig, { preset: 'diffFade' }>;
  onChange: (v: AnimationConfig) => void;
}) {
  return (
    <div>
      <h5 className="text-sm font-medium text-text-secondary mb-2">
        Diff Fade Animation
      </h5>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Fade In Duration (frames)
          </label>
          <input
            type="number"
            min={DURATION_MIN}
            max={DURATION_MAX}
            step={1}
            value={value.fadeInDuration}
            onChange={(e) => {
              const next = clampInt(e.target.value, DURATION_MIN, DURATION_MAX);
              onChange({ ...value, fadeInDuration: next });
            }}
            className="w-28 bg-background-tertiary border border-border-subtle rounded px-2 py-1 text-sm text-text-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Fade Out Duration (frames)
          </label>
          <input
            type="number"
            min={DURATION_MIN}
            max={DURATION_MAX}
            step={1}
            value={value.fadeOutDuration}
            onChange={(e) => {
              const next = clampInt(e.target.value, DURATION_MIN, DURATION_MAX);
              onChange({ ...value, fadeOutDuration: next });
            }}
            className="w-28 bg-background-tertiary border border-border-subtle rounded px-2 py-1 text-sm text-text-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Highlight Intensity
          </label>
          <input
            type="range"
            min={INTENSITY_MIN}
            max={INTENSITY_MAX}
            step={0.01}
            value={value.highlightIntensity}
            onChange={(e) => {
              const next = clampFloat(e.target.value, INTENSITY_MIN, INTENSITY_MAX);
              onChange({ ...value, highlightIntensity: next });
            }}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-text-tertiary mt-1">
            <span>Subtle</span>
            <span>{Math.round(value.highlightIntensity * 100)}%</span>
            <span>Intense</span>
          </div>
        </div>
      </div>
    </div>
  );
}