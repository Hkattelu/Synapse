import React from 'react';
import type { AnimationConfig } from '../../../lib/types';

export function SlideControls({
  value,
  onChange,
}: {
  value: Extract<AnimationConfig, { preset: 'slide' }>;
  onChange: (v: AnimationConfig) => void;
}) {
  return (
    <div>
      <h5 className="text-sm font-medium text-text-secondary mb-2">
        Slide In / Out
      </h5>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Direction
          </label>
          <select
            value={value.direction}
            onChange={(e) =>
              onChange({ ...value, direction: e.target.value as any })
            }
            className="w-full bg-background-tertiary border border-border-subtle rounded px-3 py-2 text-sm text-text-primary"
          >
            <option value="left">From Left</option>
            <option value="right">From Right</option>
            <option value="up">From Top</option>
            <option value="down">From Bottom</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Duration (frames)
          </label>
          <input
            type="number"
            min={1}
            max={300}
            step={1}
            value={value.duration}
            onChange={(e) =>
              onChange({
                ...value,
                duration: Math.max(1, Number(e.target.value)),
              })
            }
            className="w-28 bg-background-tertiary border border-border-subtle rounded px-2 py-1 text-sm text-text-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Easing
          </label>
          <select
            value={value.easing}
            onChange={(e) =>
              onChange({ ...value, easing: e.target.value as any })
            }
            className="w-full bg-background-tertiary border border-border-subtle rounded px-3 py-2 text-sm text-text-primary"
          >
            <option value="gentle">Gentle</option>
            <option value="bouncy">Bouncy</option>
            <option value="stiff">Stiff</option>
          </select>
        </div>
      </div>
    </div>
  );
}
