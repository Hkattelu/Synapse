import React from 'react';
import type { AnimationConfig } from '../../../lib/types';

const MIN_CPS = 1;
const MAX_CPS = 120;

const clampInt = (raw: string, min: number, max: number) => {
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
};

export function TypewriterControls({
  value,
  onChange,
}: {
  value: Extract<AnimationConfig, { preset: 'typewriter' }>;
  onChange: (v: AnimationConfig) => void;
}) {
  return (
    <div>
      <h5 className="text-sm font-medium text-text-secondary mb-2">
        Typewriter
      </h5>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Speed
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={MIN_CPS}
              max={MAX_CPS}
              step={1}
              value={value.speedCps}
              onChange={(e) =>
                onChange({
                  ...value,
                  speedCps: clampInt(e.target.value, MIN_CPS, MAX_CPS),
                })
              }
              className="w-40"
            />
            <input
              type="number"
              min={MIN_CPS}
              max={MAX_CPS}
              step={1}
              value={value.speedCps}
              onChange={(e) =>
                onChange({
                  ...value,
                  speedCps: clampInt(e.target.value, MIN_CPS, MAX_CPS),
                })
              }
              className="w-20 bg-background-tertiary border border-border-subtle rounded px-2 py-1 text-sm text-text-primary"
            />
            <span className="text-xs text-text-tertiary">cps</span>
          </div>
        </div>
      </div>
    </div>
  );
}
