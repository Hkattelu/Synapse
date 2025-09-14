import React from 'react';
import type { AnimationConfig } from '../../../lib/types';

type DiffHighlightConfig = Extract<
  AnimationConfig,
  { preset: 'diffHighlight' }
>;

const DURATION_MIN = 10;
const DURATION_MAX = 300;

const clampInt = (raw: string, min: number, max: number) => {
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
};

export function DiffHighlightControls({
  value,
  onChange,
}: {
  value: Extract<AnimationConfig, { preset: 'diffHighlight' }>;
  onChange: (v: AnimationConfig) => void;
}) {
  return (
    <div>
      <h5 className="text-sm font-medium text-text-secondary mb-2">
        Diff Highlight Animation
      </h5>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Highlight Color
          </label>
          <div className="flex space-x-2">
            <input
              type="color"
              value={value.highlightColor}
              onChange={(e) => {
                onChange({ ...value, highlightColor: e.target.value });
              }}
              className="w-12 h-8 bg-background-tertiary border border-border-subtle rounded cursor-pointer"
            />
            <input
              type="text"
              value={value.highlightColor}
              onChange={(e) => {
                onChange({ ...value, highlightColor: e.target.value });
              }}
              className="flex-1 bg-background-tertiary border border-border-subtle rounded px-2 py-1 text-sm text-text-primary"
              placeholder="#fbbf24"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Duration (frames)
          </label>
          <input
            type="number"
            min={DURATION_MIN}
            max={DURATION_MAX}
            step={1}
            value={value.duration}
            onChange={(e) => {
              const next = clampInt(e.target.value, DURATION_MIN, DURATION_MAX);
              onChange({ ...value, duration: next });
            }}
            className="w-28 bg-background-tertiary border border-border-subtle rounded px-2 py-1 text-sm text-text-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Pulse Effect
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={value.pulseEffect}
              onChange={(e) => {
                onChange({ ...value, pulseEffect: e.target.checked });
              }}
              className="w-4 h-4 text-primary-600 bg-background-tertiary border-border-subtle rounded focus:ring-primary-500"
            />
            <span className="text-sm text-text-secondary">
              Enable pulsing highlight effect
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
