import React, { useState, useMemo, useCallback } from 'react';
import type { BackgroundConfig, GradientConfig } from '../../lib/types';
import { WallpaperPicker } from './WallpaperPicker';
import { GradientBuilder } from './GradientBuilder';

interface BackgroundPickerProps {
  value?: BackgroundConfig;
  onChange: (config: BackgroundConfig | null) => void;
  opacity?: number;
  onOpacityChange?: (opacity: number) => void;
  blendMode?: 'normal' | 'multiply' | 'overlay' | 'soft-light';
  onBlendModeChange?: (blendMode: 'normal' | 'multiply' | 'overlay' | 'soft-light') => void;
  className?: string;
}

export function BackgroundPicker({ 
  value, 
  onChange, 
  opacity = 1,
  onOpacityChange,
  blendMode = 'normal',
  onBlendModeChange,
  className = '' 
}: BackgroundPickerProps) {
  const [activeTab, setActiveTab] = useState<'none' | 'color' | 'gradient' | 'wallpaper'>(
    value?.type || 'none'
  );

  // Handle tab change
  const handleTabChange = useCallback((tab: typeof activeTab) => {
    setActiveTab(tab);
    
    if (tab === 'none') {
      onChange(null);
    } else if (tab === 'color') {
      onChange({
        type: 'color',
        color: '#1e1e1e'
      });
    } else if (tab === 'gradient') {
      onChange({
        type: 'gradient',
        gradient: {
          type: 'linear',
          angle: 45,
          colors: [
            { color: '#667eea', position: 0 },
            { color: '#764ba2', position: 1 }
          ]
        }
      });
    } else if (tab === 'wallpaper') {
      onChange({
        type: 'wallpaper',
        wallpaper: {
          assetId: '',
          opacity: 1,
          blendMode: 'normal'
        }
      });
    }
  }, [onChange]);

  // Handle color change
  const handleColorChange = useCallback((color: string) => {
    onChange({
      type: 'color',
      color
    });
  }, [onChange]);

  // Handle gradient change
  const handleGradientChange = useCallback((gradient: GradientConfig | null) => {
    if (gradient) {
      onChange({
        type: 'gradient',
        gradient
      });
    } else {
      onChange(null);
    }
  }, [onChange]);

  // Handle wallpaper change
  const handleWallpaperChange = useCallback((wallpaperId: string | null) => {
    if (wallpaperId) {
      onChange({
        type: 'wallpaper',
        wallpaper: {
          assetId: wallpaperId,
          opacity: opacity,
          blendMode: blendMode
        }
      });
    } else {
      onChange(null);
    }
  }, [onChange, opacity, blendMode]);

  // Get current values for each type
  const currentColor = value?.type === 'color' ? value.color : '#1e1e1e';
  const currentGradient = value?.type === 'gradient' ? value.gradient : undefined;
  const currentWallpaper = value?.type === 'wallpaper' ? value.wallpaper?.assetId : undefined;

  return (
    <div className={`background-picker ${className}`}>
      <label className="block text-sm font-medium text-text-secondary mb-2">
        Background
      </label>

      {/* Tab Navigation */}
      <div className="flex border-b border-border-subtle mb-3">
        {[
          { id: 'none', label: 'None', icon: '○' },
          { id: 'color', label: 'Color', icon: '●' },
          { id: 'gradient', label: 'Gradient', icon: '◐' },
          { id: 'wallpaper', label: 'Image', icon: '🖼' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id as typeof activeTab)}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary-500 text-primary-500'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-subtle'
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[100px]">
        {activeTab === 'none' && (
          <div className="text-center py-8 text-text-secondary">
            <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <p className="text-sm">No background selected</p>
          </div>
        )}

        {activeTab === 'color' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Color
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={currentColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-8 h-8 rounded border border-border-subtle"
                />
                <input
                  type="text"
                  value={currentColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="flex-1 bg-background-tertiary border border-border-subtle rounded px-2 py-1 text-text-primary text-sm focus:outline-none focus:border-primary-500"
                  placeholder="#000000"
                />
              </div>
            </div>
            
            {/* Color preview */}
            <div 
              className="w-full h-16 rounded border border-border-subtle"
              style={{ backgroundColor: currentColor }}
            />
          </div>
        )}

        {activeTab === 'gradient' && (
          <GradientBuilder
            value={currentGradient}
            onChange={handleGradientChange}
          />
        )}

        {activeTab === 'wallpaper' && (
          <WallpaperPicker
            value={currentWallpaper}
            onChange={handleWallpaperChange}
          />
        )}
      </div>

      {/* Advanced Options */}
      {(activeTab === 'wallpaper' || activeTab === 'gradient' || activeTab === 'color') && (
        <div className="mt-4 pt-3 border-t border-border-subtle space-y-3">
          {/* Opacity Control */}
          {onOpacityChange && (
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Opacity: {(opacity * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={opacity}
                onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          )}

          {/* Blend Mode Control (for wallpapers) */}
          {activeTab === 'wallpaper' && onBlendModeChange && (
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Blend Mode
              </label>
              <select
                value={blendMode}
                onChange={(e) => onBlendModeChange(e.target.value as typeof blendMode)}
                className="w-full bg-background-tertiary border border-border-subtle rounded px-2 py-1 text-text-primary text-sm focus:outline-none focus:border-primary-500"
              >
                <option value="normal">Normal</option>
                <option value="multiply">Multiply</option>
                <option value="overlay">Overlay</option>
                <option value="soft-light">Soft Light</option>
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}