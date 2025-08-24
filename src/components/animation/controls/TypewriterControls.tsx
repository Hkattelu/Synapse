import React from 'react';
import type { AnimationConfig } from '../../../lib/types';

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
              min={1}
              max={120}
              step={1}
              value={value.speedCps}
              onChange={(e) =>
                onChange({ ...value, speedCps: Number(e.target.value) })
              }
              className="w-40"
            />
            <input
              type="number"
              min={1}
              max={240}
              step={1}
              value={value.speedCps}
              onChange={(e) =>
                onChange({ ...value, speedCps: Number(e.target.value) })
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
