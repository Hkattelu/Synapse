import React from 'react';
import type { AnimationConfig } from '../../../lib/types';

type SlideConfig = Extract<AnimationConfig, { preset: 'slide' }>;
type SlideDirection = SlideConfig['direction'];
type SlideEasing = SlideConfig['easing'];

const DURATION_MIN = 1;
const DURATION_MAX = 300;

const clampInt = (raw: string, min: number, max: number) => {
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
};

const isSlideDirection = (v: string): v is SlideDirection =>
  v === 'left' || v === 'right' || v === 'up' || v === 'down';

const isSlideEasing = (v: string): v is SlideEasing =>
  v === 'gentle' || v === 'bouncy' || v === 'stiff';

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
            onChange={(e) => {
              const raw = e.target.value;
              if (isSlideDirection(raw)) {
                onChange({ ...value, direction: raw });
              }
            }}
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
            Easing
          </label>
          <select
            value={value.easing}
            onChange={(e) => {
              const raw = e.target.value;
              if (isSlideEasing(raw)) {
                onChange({ ...value, easing: raw });
              }
            }}
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
