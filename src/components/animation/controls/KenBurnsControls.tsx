import React from 'react';
import type { AnimationConfig } from '../../../lib/types';

export function KenBurnsControls({
  value,
  onChange,
}: {
  value: Extract<AnimationConfig, { preset: 'kenBurns' }>;
  onChange: (v: AnimationConfig) => void;
}) {
  return (
    <div>
      <h5 className="text-sm font-medium text-text-secondary mb-2">
        Gentle Pan & Zoom
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
            <option value="zoomIn">Zoom In</option>
            <option value="zoomOut">Zoom Out</option>
            <option value="panLeft">Pan Left</option>
            <option value="panRight">Pan Right</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Intensity
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={value.intensity}
              onChange={(e) =>
                onChange({ ...value, intensity: Number(e.target.value) })
              }
              className="w-40"
            />
            <input
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={value.intensity}
              onChange={(e) =>
                onChange({ ...value, intensity: Number(e.target.value) })
              }
              className="w-20 bg-background-tertiary border border-border-subtle rounded px-2 py-1 text-sm text-text-primary"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
