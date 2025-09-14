import React from 'react';
import type { AnimationConfig } from '../../../lib/types';

type DiffSlideConfig = Extract<AnimationConfig, { preset: 'diffSlide' }>;
type DiffSlideDirection = DiffSlideConfig['direction'];

const SPEED_MIN = 0.1;
const SPEED_MAX = 3.0;

const clampFloat = (raw: string, min: number, max: number) => {
  const n = parseFloat(raw);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
};

const isDiffSlideDirection = (v: string): v is DiffSlideDirection =>
  v === 'left' || v === 'right' || v === 'up' || v === 'down';

export function DiffSlideControls({
  value,
  onChange,
}: {
  value: Extract<AnimationConfig, { preset: 'diffSlide' }>;
  onChange: (v: AnimationConfig) => void;
}) {
  return (
    <div>
      <h5 className="text-sm font-medium text-text-secondary mb-2">
        Diff Slide Animation
      </h5>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Direction
          </label>
          <select
            value={value.direction}
            onChange={(e) => {
              const raw = e.target.value;
              if (isDiffSlideDirection(raw)) {
                onChange({ ...value, direction: raw });
              }
            }}
            className="w-full bg-background-tertiary border border-border-subtle rounded px-3 py-2 text-sm text-text-primary"
          >
            <option value="left">Slide from Left</option>
            <option value="right">Slide from Right</option>
            <option value="up">Slide from Top</option>
            <option value="down">Slide from Bottom</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Animation Speed
          </label>
          <input
            type="number"
            min={SPEED_MIN}
            max={SPEED_MAX}
            step={0.1}
            value={value.speed}
            onChange={(e) => {
              const next = clampFloat(e.target.value, SPEED_MIN, SPEED_MAX);
              onChange({ ...value, speed: next });
            }}
            className="w-28 bg-background-tertiary border border-border-subtle rounded px-2 py-1 text-sm text-text-primary"
          />
          <span className="text-xs text-text-tertiary ml-2">×</span>
        </div>
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
              placeholder="#4ade80"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
