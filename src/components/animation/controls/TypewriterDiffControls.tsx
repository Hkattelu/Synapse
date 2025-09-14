import React from 'react';
import type { AnimationConfig } from '../../../lib/types';

type TypewriterDiffConfig = Extract<
  AnimationConfig,
  { preset: 'typewriterDiff' }
>;

const SPEED_MIN = 1;
const SPEED_MAX = 100;

const clampInt = (raw: string, min: number, max: number) => {
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
};

export function TypewriterDiffControls({
  value,
  onChange,
}: {
  value: Extract<AnimationConfig, { preset: 'typewriterDiff' }>;
  onChange: (v: AnimationConfig) => void;
}) {
  return (
    <div>
      <h5 className="text-sm font-medium text-text-secondary mb-2">
        Typewriter Diff Animation
      </h5>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Typing Speed (characters per second)
          </label>
          <input
            type="number"
            min={SPEED_MIN}
            max={SPEED_MAX}
            step={1}
            value={value.speedCps}
            onChange={(e) => {
              const next = clampInt(e.target.value, SPEED_MIN, SPEED_MAX);
              onChange({ ...value, speedCps: next });
            }}
            className="w-28 bg-background-tertiary border border-border-subtle rounded px-2 py-1 text-sm text-text-primary"
          />
          <span className="text-xs text-text-tertiary ml-2">cps</span>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Show Cursor
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={value.showCursor}
              onChange={(e) => {
                onChange({ ...value, showCursor: e.target.checked });
              }}
              className="w-4 h-4 text-primary-600 bg-background-tertiary border-border-subtle rounded focus:ring-primary-500"
            />
            <span className="text-sm text-text-secondary">
              Show blinking cursor while typing
            </span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Highlight Changes
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={value.highlightChanges}
              onChange={(e) => {
                onChange({ ...value, highlightChanges: e.target.checked });
              }}
              className="w-4 h-4 text-primary-600 bg-background-tertiary border-border-subtle rounded focus:ring-primary-500"
            />
            <span className="text-sm text-text-secondary">
              Highlight added and removed lines
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
