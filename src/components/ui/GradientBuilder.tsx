import React, { useState, useMemo, useCallback } from 'react';
import { 
  GradientBuilder as GradientBuilderClass, 
  gradientPresets, 
  generateGradientCSS,
  type GradientPreset,
  type GradientColorStop 
} from '../../lib/backgrounds';
import type { GradientConfig } from '../../lib/types';

interface GradientBuilderProps {
  value?: GradientConfig;
  onChange: (gradient: GradientConfig | null) => void;
  className?: string;
}

export function GradientBuilder({ value, onChange, className = '' }: GradientBuilderProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Initialize gradient builder
  const gradientBuilder = useMemo(() => {
    return new GradientBuilderClass(value);
  }, [value]);

  // Get current gradient config
  const currentGradient = gradientBuilder.build();

  // Filter presets by category
  const filteredPresets = useMemo(() => {
    if (selectedCategory === 'all') {
      return gradientPresets;
    }
    return gradientPresets.filter(preset => preset.category === selectedCategory);
  }, [selectedCategory]);

  // Generate CSS for preview
  const previewCSS = useMemo(() => {
    if (!currentGradient || currentGradient.colors.length < 2) {
      return 'linear-gradient(45deg, #ffffff, #000000)';
    }
    return generateGradientCSS(currentGradient);
  }, [currentGradient]);

  const handlePresetSelect = useCallback((preset: GradientPreset) => {
    setSelectedPreset(preset.id);
    onChange(preset.gradient);
    setIsExpanded(false);
  }, [onChange]);

  const handleTypeChange = useCallback((type: 'linear' | 'radial') => {
    const newBuilder = gradientBuilder.clone().setType(type);
    onChange(newBuilder.build());
  }, [gradientBuilder, onChange]);

  const handleAngleChange = useCallback((angle: number) => {
    const newBuilder = gradientBuilder.clone().setAngle(angle);
    onChange(newBuilder.build());
  }, [gradientBuilder, onChange]);

  const handleCenterChange = useCallback((x: number, y: number) => {
    const newBuilder = gradientBuilder.clone().setCenter(x, y);
    onChange(newBuilder.build());
  }, [gradientBuilder, onChange]);

  const handleColorStopChange = useCallback((index: number, updates: Partial<GradientColorStop>) => {
    const newBuilder = gradientBuilder.clone().updateColorStop(index, updates);
    onChange(newBuilder.build());
  }, [gradientBuilder, onChange]);

  const handleAddColorStop = useCallback(() => {
    const newBuilder = gradientBuilder.clone().addColorStop('#ffffff', 0.5);
    onChange(newBuilder.build());
  }, [gradientBuilder, onChange]);

  const handleRemoveColorStop = useCallback((index: number) => {
    if (currentGradient.colors.length <= 2) return; // Minimum 2 colors required
    const newBuilder = gradientBuilder.clone().removeColorStop(index);
    onChange(newBuilder.build());
  }, [gradientBuilder, onChange, currentGradient.colors.length]);

  const handleClear = useCallback(() => {
    onChange(null);
    setIsExpanded(false);
  }, [onChange]);

  if (!isExpanded) {
    return (
      <div className={`gradient-builder-compact ${className}`}>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          Gradient
        </label>
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full bg-background-tertiary border border-border-subtle rounded px-3 py-2 text-left text-text-primary text-sm hover:border-primary-500 focus:outline-none focus:border-primary-500 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div 
                className="w-4 h-4 rounded border border-border-subtle"
                style={{ background: previewCSS }}
              />
              <span>
                {value ? `${currentGradient.type} gradient` : 'No gradient'}
              </span>
              {value && (
                <span className="text-xs text-text-tertiary">
                  ({currentGradient.colors.length} colors)
                </span>
              )}
            </div>
            <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className={`gradient-builder-expanded ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-text-secondary">
          Gradient Builder
        </label>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-text-secondary hover:text-text-primary p-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Preview */}
      <div className="mb-3">
        <div 
          className="w-full h-16 rounded border border-border-subtle"
          style={{ background: previewCSS }}
        />
      </div>

      {/* Quick Actions */}
      <div className="flex space-x-2 mb-3">
        <button
          onClick={handleClear}
          className="px-2 py-1 text-xs bg-background-tertiary text-text-secondary hover:text-text-primary border border-border-subtle rounded transition-colors"
        >
          Clear
        </button>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="flex-1 bg-background-tertiary border border-border-subtle rounded px-2 py-1 text-text-primary text-xs focus:outline-none focus:border-primary-500"
        >
          <option value="all">All Presets</option>
          <option value="warm">Warm</option>
          <option value="cool">Cool</option>
          <option value="neutral">Neutral</option>
          <option value="vibrant">Vibrant</option>
          <option value="monochrome">Monochrome</option>
        </select>
      </div>

      {/* Preset Grid */}
      <div className="max-h-32 overflow-y-auto mb-3">
        <div className="grid grid-cols-3 gap-1">
          {filteredPresets.map(preset => (
            <button
              key={preset.id}
              onClick={() => handlePresetSelect(preset)}
              className={`aspect-square rounded border transition-all hover:border-primary-500 ${
                selectedPreset === preset.id 
                  ? 'border-primary-500 ring-1 ring-primary-500' 
                  : 'border-border-subtle'
              }`}
              style={{ background: generateGradientCSS(preset.gradient) }}
              title={preset.name}
            />
          ))}
        </div>
      </div>

      {/* Custom Gradient Controls */}
      {value && (
        <div className="space-y-3">
          {/* Type Selection */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Type
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() => handleTypeChange('linear')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  currentGradient.type === 'linear'
                    ? 'bg-primary-500 text-white'
                    : 'bg-background-tertiary text-text-secondary hover:text-text-primary border border-border-subtle'
                }`}
              >
                Linear
              </button>
              <button
                onClick={() => handleTypeChange('radial')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  currentGradient.type === 'radial'
                    ? 'bg-primary-500 text-white'
                    : 'bg-background-tertiary text-text-secondary hover:text-text-primary border border-border-subtle'
                }`}
              >
                Radial
              </button>
            </div>
          </div>

          {/* Direction/Position Controls */}
          {currentGradient.type === 'linear' ? (
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Angle: {currentGradient.angle || 0}°
              </label>
              <input
                type="range"
                min="0"
                max="359"
                value={currentGradient.angle || 0}
                onChange={(e) => handleAngleChange(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Center X: {((currentGradient.centerX || 0.5) * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={currentGradient.centerX || 0.5}
                  onChange={(e) => handleCenterChange(parseFloat(e.target.value), currentGradient.centerY || 0.5)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Center Y: {((currentGradient.centerY || 0.5) * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={currentGradient.centerY || 0.5}
                  onChange={(e) => handleCenterChange(currentGradient.centerX || 0.5, parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* Color Stops */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-text-secondary">
                Colors
              </label>
              <button
                onClick={handleAddColorStop}
                className="text-xs text-primary-500 hover:text-primary-600"
              >
                + Add Color
              </button>
            </div>
            
            <div className="space-y-2 max-h-24 overflow-y-auto">
              {currentGradient.colors.map((colorStop, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={colorStop.color}
                    onChange={(e) => handleColorStopChange(index, { color: e.target.value })}
                    className="w-6 h-6 rounded border border-border-subtle"
                  />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={colorStop.position}
                    onChange={(e) => handleColorStopChange(index, { position: parseFloat(e.target.value) })}
                    className="flex-1"
                  />
                  <span className="text-xs text-text-tertiary w-8">
                    {(colorStop.position * 100).toFixed(0)}%
                  </span>
                  {currentGradient.colors.length > 2 && (
                    <button
                      onClick={() => handleRemoveColorStop(index)}
                      className="text-xs text-red-500 hover:text-red-600 w-4 h-4 flex items-center justify-center"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}