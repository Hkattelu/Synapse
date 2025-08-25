import React from 'react';
import type { AnimationConfig } from '../../../lib/types';

export function LineFocusControls({
  value,
  onChange,
}: {
  value: Extract<AnimationConfig, { preset: 'lineFocus' }>;
  onChange: (v: AnimationConfig) => void;
}) {
  return (
    <div>
      <h5 className="text-sm font-medium text-text-secondary mb-2">
        Line Focus
      </h5>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Active Lines
          </label>
          <input
            type="text"
            value={value.activeLines}
            onChange={(e) =>
              onChange({ ...value, activeLines: e.target.value })
            }
            placeholder="e.g. 5 or 5-8"
            className="w-full bg-background-tertiary border border-border-subtle rounded px-3 py-2 text-sm text-text-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Focus Opacity
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={value.focusOpacity}
              onChange={(e) =>
                onChange({ ...value, focusOpacity: Number(e.target.value) })
              }
              className="w-40"
            />
            <input
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={value.focusOpacity}
              onChange={(e) =>
                onChange({ ...value, focusOpacity: Number(e.target.value) })
              }
              className="w-20 bg-background-tertiary border border-border-subtle rounded px-2 py-1 text-sm text-text-primary"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
