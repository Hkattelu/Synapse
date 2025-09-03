import React, { useState, useCallback } from 'react';
import type { AudioDuckingConfig } from '../lib/audioUtils';
import { DEFAULT_NARRATION_PROPERTIES } from '../lib/audioUtils';
import Volume2 from 'lucide-react/dist/esm/icons/volume-2.js';
import VolumeX from 'lucide-react/dist/esm/icons/volume-x.js';
import Settings from 'lucide-react/dist/esm/icons/settings.js';

interface AudioDuckingControlsProps {
  duckingConfig: AudioDuckingConfig;
  onConfigChange: (config: AudioDuckingConfig) => void;
  availableTracks: Array<{ id: number; name: string; color: string }>;
  className?: string;
}

export function AudioDuckingControls({
  duckingConfig,
  onConfigChange,
  availableTracks,
  className = '',
}: AudioDuckingControlsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleToggleEnabled = useCallback(() => {
    onConfigChange({
      ...duckingConfig,
      enabled: !duckingConfig.enabled,
    });
  }, [duckingConfig, onConfigChange]);

  const handleThresholdChange = useCallback((threshold: number) => {
    onConfigChange({
      ...duckingConfig,
      threshold,
    });
  }, [duckingConfig, onConfigChange]);

  const handleRatioChange = useCallback((ratio: number) => {
    onConfigChange({
      ...duckingConfig,
      ratio,
    });
  }, [duckingConfig, onConfigChange]);

  const handleAttackTimeChange = useCallback((attackTime: number) => {
    onConfigChange({
      ...duckingConfig,
      attackTime,
    });
  }, [duckingConfig, onConfigChange]);

  const handleReleaseTimeChange = useCallback((releaseTime: number) => {
    onConfigChange({
      ...duckingConfig,
      releaseTime,
    });
  }, [duckingConfig, onConfigChange]);

  const handleTargetTracksChange = useCallback((trackId: number, enabled: boolean) => {
    const newTargetTracks = enabled
      ? [...duckingConfig.targetTracks, trackId]
      : duckingConfig.targetTracks.filter(id => id !== trackId);
    
    onConfigChange({
      ...duckingConfig,
      targetTracks: newTargetTracks,
    });
  }, [duckingConfig, onConfigChange]);

  const resetToDefaults = useCallback(() => {
    onConfigChange(DEFAULT_NARRATION_PROPERTIES.ducking);
  }, [onConfigChange]);

  return (
    <div className={`audio-ducking-controls bg-background-subtle rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {duckingConfig.enabled ? (
            <Volume2 className="w-4 h-4 text-accent-yellow" />
          ) : (
            <VolumeX className="w-4 h-4 text-text-secondary" />
          )}
          <h3 className="font-medium text-text-primary">Audio Ducking</h3>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="p-1 rounded hover:bg-background-hover transition-colors"
            title="Advanced Settings"
          >
            <Settings className="w-4 h-4 text-text-secondary" />
          </button>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={duckingConfig.enabled}
              onChange={handleToggleEnabled}
              className="rounded"
            />
            <span className="text-sm text-text-secondary">Enable</span>
          </label>
        </div>
      </div>

      {/* Basic Controls */}
      <div className="space-y-4">
        {/* Threshold */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Trigger Threshold
            <span className="text-text-secondary ml-1">
              ({Math.round(duckingConfig.threshold * 100)}%)
            </span>
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={duckingConfig.threshold}
            onChange={(e) => handleThresholdChange(parseFloat(e.target.value))}
            disabled={!duckingConfig.enabled}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-text-secondary mt-1">
            <span>Quiet</span>
            <span>Loud</span>
          </div>
        </div>

        {/* Ducking Ratio */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Ducking Amount
            <span className="text-text-secondary ml-1">
              ({Math.round(duckingConfig.ratio * 100)}%)
            </span>
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={duckingConfig.ratio}
            onChange={(e) => handleRatioChange(parseFloat(e.target.value))}
            disabled={!duckingConfig.enabled}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-text-secondary mt-1">
            <span>Subtle</span>
            <span>Strong</span>
          </div>
        </div>

        {/* Target Tracks */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Duck These Tracks
          </label>
          <div className="space-y-2">
            {availableTracks.map((track) => (
              <label key={track.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={duckingConfig.targetTracks.includes(track.id)}
                  onChange={(e) => handleTargetTracksChange(track.id, e.target.checked)}
                  disabled={!duckingConfig.enabled}
                  className="rounded"
                />
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: track.color }}
                />
                <span className="text-sm text-text-primary">{track.name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced Controls */}
      {showAdvanced && (
        <div className="mt-6 pt-4 border-t border-border-subtle space-y-4">
          <h4 className="font-medium text-text-primary">Advanced Settings</h4>
          
          {/* Attack Time */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Attack Time
              <span className="text-text-secondary ml-1">
                ({duckingConfig.attackTime}ms)
              </span>
            </label>
            <input
              type="range"
              min="10"
              max="1000"
              step="10"
              value={duckingConfig.attackTime}
              onChange={(e) => handleAttackTimeChange(parseInt(e.target.value))}
              disabled={!duckingConfig.enabled}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-text-secondary mt-1">
              <span>Fast (10ms)</span>
              <span>Slow (1s)</span>
            </div>
          </div>

          {/* Release Time */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Release Time
              <span className="text-text-secondary ml-1">
                ({duckingConfig.releaseTime}ms)
              </span>
            </label>
            <input
              type="range"
              min="50"
              max="2000"
              step="50"
              value={duckingConfig.releaseTime}
              onChange={(e) => handleReleaseTimeChange(parseInt(e.target.value))}
              disabled={!duckingConfig.enabled}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-text-secondary mt-1">
              <span>Fast (50ms)</span>
              <span>Slow (2s)</span>
            </div>
          </div>

          {/* Reset Button */}
          <div className="pt-2">
            <button
              onClick={resetToDefaults}
              className="text-sm text-accent-blue hover:text-accent-blue-hover transition-colors"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-4 p-3 bg-background-hover rounded text-sm text-text-secondary">
        <p>
          Audio ducking automatically reduces the volume of selected tracks when narration is detected.
          Adjust the threshold to control when ducking triggers, and the ratio to control how much the volume is reduced.
        </p>
      </div>
    </div>
  );
}

// Preset configurations for common scenarios
export const DUCKING_PRESETS = {
  subtle: {
    enabled: true,
    threshold: 0.15,
    ratio: 0.3,
    attackTime: 200,
    releaseTime: 800,
    targetTracks: [1], // Visual track
  },
  moderate: {
    enabled: true,
    threshold: 0.1,
    ratio: 0.6,
    attackTime: 100,
    releaseTime: 500,
    targetTracks: [1], // Visual track
  },
  aggressive: {
    enabled: true,
    threshold: 0.05,
    ratio: 0.8,
    attackTime: 50,
    releaseTime: 300,
    targetTracks: [1, 3], // Visual and You tracks
  },
  disabled: {
    enabled: false,
    threshold: 0.1,
    ratio: 0.6,
    attackTime: 100,
    releaseTime: 500,
    targetTracks: [],
  },
} as const;

// Preset selector component
interface DuckingPresetSelectorProps {
  currentConfig: AudioDuckingConfig;
  onPresetSelect: (preset: AudioDuckingConfig) => void;
  className?: string;
}

export function DuckingPresetSelector({
  currentConfig,
  onPresetSelect,
  className = '',
}: DuckingPresetSelectorProps) {
  const presets = [
    { key: 'disabled', label: 'Disabled', config: DUCKING_PRESETS.disabled },
    { key: 'subtle', label: 'Subtle', config: DUCKING_PRESETS.subtle },
    { key: 'moderate', label: 'Moderate', config: DUCKING_PRESETS.moderate },
    { key: 'aggressive', label: 'Aggressive', config: DUCKING_PRESETS.aggressive },
  ];

  const getCurrentPreset = () => {
    for (const preset of presets) {
      if (
        preset.config.enabled === currentConfig.enabled &&
        preset.config.threshold === currentConfig.threshold &&
        preset.config.ratio === currentConfig.ratio
      ) {
        return preset.key;
      }
    }
    return 'custom';
  };

  return (
    <div className={`ducking-preset-selector ${className}`}>
      <label className="block text-sm font-medium text-text-primary mb-2">
        Ducking Preset
      </label>
      <select
        value={getCurrentPreset()}
        onChange={(e) => {
          const preset = presets.find(p => p.key === e.target.value);
          if (preset) {
            onPresetSelect({
              ...preset.config,
              targetTracks: currentConfig.targetTracks, // Preserve current target tracks
            });
          }
        }}
        className="w-full px-3 py-2 bg-background-subtle border border-border-subtle rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue"
      >
        <option value="disabled">Disabled</option>
        <option value="subtle">Subtle</option>
        <option value="moderate">Moderate</option>
        <option value="aggressive">Aggressive</option>
        <option value="custom">Custom</option>
      </select>
    </div>
  );
}