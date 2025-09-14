// Educational Animation Selector Component
// Provides track-specific animation presets with educational context

import React, { useState, useMemo } from 'react';
import type { TimelineItem } from '../lib/types';
import type { EducationalTrackName } from '../lib/educationalTypes';
import {
  getPresetsForTrack,
  getPresetsByDifficulty,
  getRecommendedPresets,
  applyEducationalAnimationPreset,
  type EducationalAnimationPreset,
} from '../lib/educationalAnimationPresets';
import { getEducationalTrackByNumber } from '../lib/educationalTypes';

interface EducationalAnimationSelectorProps {
  item: TimelineItem;
  onApplyPreset: (updatedItem: TimelineItem) => void;
  className?: string;
}

export function EducationalAnimationSelector({
  item,
  onApplyPreset,
  className = '',
}: EducationalAnimationSelectorProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    'all' | 'beginner' | 'intermediate' | 'advanced'
  >('all');
  const [showPreview, setShowPreview] = useState<string | null>(null);
  const [customParameters, setCustomParameters] = useState<
    Record<string, unknown>
  >({});

  // Determine the educational track for this item
  const educationalTrack = getEducationalTrackByNumber(item.track);
  const trackType = educationalTrack?.name as EducationalTrackName;

  // Get available presets for this track
  const allPresets = useMemo(() => {
    if (!trackType) return [];
    return getPresetsForTrack(trackType);
  }, [trackType]);

  // Filter presets based on difficulty
  const filteredPresets = useMemo(() => {
    if (selectedDifficulty === 'all') return allPresets;
    return getPresetsByDifficulty(trackType, selectedDifficulty);
  }, [allPresets, trackType, selectedDifficulty]);

  // Get recommended presets based on content type
  const recommendedPresets = useMemo(() => {
    if (!trackType) return [];
    return getRecommendedPresets(trackType, item.type);
  }, [trackType, item.type]);

  if (!trackType || allPresets.length === 0) {
    return (
      <div className={`educational-animation-selector ${className}`}>
        <div className="p-4 text-center text-gray-600">
          <p className="text-sm">
            No educational animations available for this track type.
          </p>
        </div>
      </div>
    );
  }

  const handleApplyPreset = (preset: EducationalAnimationPreset) => {
    const updatedItem = applyEducationalAnimationPreset(
      item,
      preset,
      customParameters
    );
    onApplyPreset(updatedItem);
  };

  const handlePreviewPreset = (presetId: string) => {
    setShowPreview(showPreview === presetId ? null : presetId);
  };

  return (
    <div className={`educational-animation-selector ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-border-subtle">
        <h4 className="font-semibold text-gray-900 mb-2">
          Educational Animations - {trackType} Track
        </h4>
        <p className="text-xs text-gray-600">
          Choose animations designed specifically for educational content
        </p>
      </div>

      {/* Difficulty Filter */}
      <div className="p-4 border-b border-border-subtle">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Difficulty Level
        </label>
        <div className="flex gap-2">
          {(['all', 'beginner', 'intermediate', 'advanced'] as const).map(
            (difficulty) => (
              <button
                key={difficulty}
                onClick={() => setSelectedDifficulty(difficulty)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  selectedDifficulty === difficulty
                    ? 'bg-purple-100 text-purple-800 border border-purple-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {difficulty === 'all'
                  ? 'All'
                  : difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              </button>
            )
          )}
        </div>
      </div>

      {/* Recommended Presets */}
      {recommendedPresets.length > 0 && (
        <div className="p-4 border-b border-border-subtle">
          <h5 className="font-medium text-gray-800 mb-3 flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Recommended for {item.type} content
          </h5>
          <div className="space-y-2">
            {recommendedPresets.slice(0, 3).map((preset) => (
              <PresetCard
                key={preset.id}
                preset={preset}
                isRecommended={true}
                isPreviewOpen={showPreview === preset.id}
                onApply={() => handleApplyPreset(preset)}
                onPreview={() => handlePreviewPreset(preset.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Presets */}
      <div className="p-4">
        <h5 className="font-medium text-gray-800 mb-3">
          All {trackType} Animations ({filteredPresets.length})
        </h5>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredPresets.map((preset) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              isRecommended={recommendedPresets.some((r) => r.id === preset.id)}
              isPreviewOpen={showPreview === preset.id}
              onApply={() => handleApplyPreset(preset)}
              onPreview={() => handlePreviewPreset(preset.id)}
            />
          ))}
        </div>
      </div>

      {/* Custom Parameters */}
      {showPreview && (
        <div className="p-4 border-t border-border-subtle bg-gray-50">
          <h6 className="font-medium text-gray-800 mb-2">Custom Parameters</h6>
          <p className="text-xs text-gray-600 mb-3">
            Adjust parameters for the selected animation (optional)
          </p>
          <CustomParametersEditor
            preset={filteredPresets.find((p) => p.id === showPreview)!}
            parameters={customParameters}
            onChange={setCustomParameters}
          />
        </div>
      )}
    </div>
  );
}

interface PresetCardProps {
  preset: EducationalAnimationPreset;
  isRecommended: boolean;
  isPreviewOpen: boolean;
  onApply: () => void;
  onPreview: () => void;
}

function PresetCard({
  preset,
  isRecommended,
  isPreviewOpen,
  onApply,
  onPreview,
}: PresetCardProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'text-green-600 bg-green-100';
      case 'intermediate':
        return 'text-blue-600 bg-blue-100';
      case 'advanced':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div
      className={`preset-card border rounded-lg transition-all ${
        isPreviewOpen
          ? 'border-purple-300 bg-purple-50'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h6 className="font-medium text-gray-900 text-sm">
                {preset.name}
              </h6>
              {isRecommended && (
                <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                  Recommended
                </span>
              )}
              <span
                className={`px-2 py-0.5 text-xs rounded-full ${getDifficultyColor(preset.difficulty)}`}
              >
                {preset.difficulty}
              </span>
            </div>
            <p className="text-xs text-gray-600 mb-2">
              {preset.educationalPurpose}
            </p>
            <div className="flex flex-wrap gap-1 mb-2">
              {preset.recommendedFor.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onPreview}
            className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            {isPreviewOpen ? 'Hide Preview' : 'Preview'}
          </button>
          <button
            onClick={onApply}
            className="flex-1 px-3 py-1.5 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Preview Section */}
      {isPreviewOpen && (
        <div className="border-t border-purple-200 p-3 bg-white">
          <div className="mb-3">
            <h6 className="font-medium text-gray-800 text-sm mb-1 block">
              Preview
            </h6>
            <p className="text-xs text-gray-600">{preset.previewDescription}</p>
          </div>

          <AnimationPreview preset={preset} />

          <div className="mt-3 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Duration: {preset.duration}s</span>
              <span>Easing: {preset.easing}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface CustomParametersEditorProps {
  preset: EducationalAnimationPreset;
  parameters: Record<string, unknown>;
  onChange: (parameters: Record<string, unknown>) => void;
}

function CustomParametersEditor({
  preset,
  parameters,
  onChange,
}: CustomParametersEditorProps) {
  const handleParameterChange = (key: string, value: unknown) => {
    onChange({
      ...parameters,
      [key]: value,
    });
  };

  // Get customizable parameters based on preset type
  const getCustomizableParameters = () => {
    const customizable: Array<{
      key: string;
      label: string;
      type: string;
      min?: number;
      max?: number;
      step?: number;
    }> = [];

    // Common parameters for all presets
    if (preset.parameters.duration !== undefined) {
      customizable.push({
        key: 'duration',
        label: 'Duration (seconds)',
        type: 'number',
        min: 0.1,
        max: 10,
        step: 0.1,
      });
    }

    // Track-specific parameters
    switch (preset.trackType) {
      case 'Code':
        if (preset.parameters.lineDelay !== undefined) {
          customizable.push({
            key: 'lineDelay',
            label: 'Line Delay (ms)',
            type: 'number',
            min: 100,
            max: 2000,
            step: 50,
          });
        }
        if (preset.parameters.typingSpeed !== undefined) {
          customizable.push({
            key: 'typingSpeedCps',
            label: 'Typing Speed (chars/sec)',
            type: 'number',
            min: 5,
            max: 50,
            step: 1,
          });
        }
        break;

      case 'Visual':
        if (preset.parameters.focusPointX !== undefined) {
          customizable.push({
            key: 'focusPointX',
            label: 'Focus Point X',
            type: 'number',
            min: 0,
            max: 1,
            step: 0.1,
          });
        }
        if (preset.parameters.focusPointY !== undefined) {
          customizable.push({
            key: 'focusPointY',
            label: 'Focus Point Y',
            type: 'number',
            min: 0,
            max: 1,
            step: 0.1,
          });
        }
        if (preset.parameters.zoomLevel !== undefined) {
          customizable.push({
            key: 'zoomLevel',
            label: 'Zoom Level',
            type: 'number',
            min: 1,
            max: 3,
            step: 0.1,
          });
        }
        break;

      case 'Narration':
        if (preset.parameters.duckingAmount !== undefined) {
          customizable.push({
            key: 'duckingAmount',
            label: 'Ducking Amount',
            type: 'number',
            min: 0,
            max: 1,
            step: 0.1,
          });
        }
        break;

      case 'You':
        if (preset.parameters.blurIntensity !== undefined) {
          customizable.push({
            key: 'blurIntensity',
            label: 'Blur Intensity',
            type: 'number',
            min: 0,
            max: 20,
            step: 1,
          });
        }
        if (preset.parameters.splitRatio !== undefined) {
          customizable.push({
            key: 'splitRatio',
            label: 'Split Ratio',
            type: 'number',
            min: 0.2,
            max: 0.8,
            step: 0.1,
          });
        }
        break;
    }

    return customizable;
  };

  const customizableParams = getCustomizableParameters();

  if (customizableParams.length === 0) {
    return (
      <div className="text-xs text-gray-600 italic">
        No customizable parameters for this preset.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {customizableParams.map((param) => (
        <div key={param.key}>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            {param.label}
          </label>
          <input
            type={param.type}
            min={param.min}
            max={param.max}
            step={param.step}
            value={(parameters[param.key] as string) || ''}
            onChange={(e) =>
              handleParameterChange(
                param.key,
                param.type === 'number'
                  ? parseFloat(e.target.value)
                  : e.target.value
              )
            }
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:border-purple-500"
          />
        </div>
      ))}
    </div>
  );
}

interface AnimationPreviewProps {
  preset: EducationalAnimationPreset;
}

function AnimationPreview({ preset }: AnimationPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayPreview = () => {
    setIsPlaying(true);
    setTimeout(() => setIsPlaying(false), preset.duration * 1000);
  };

  const getPreviewContent = () => {
    switch (preset.trackType) {
      case 'Code':
        return (
          <div className="bg-gray-900 text-green-400 p-2 rounded text-xs font-mono">
            <div
              className={`transition-all duration-1000 ${isPlaying ? 'opacity-100' : 'opacity-50'}`}
            >
              function example() {'{'}
              <br />
              &nbsp;&nbsp;console.log("Hello World");
              <br />
              {'}'}
            </div>
          </div>
        );

      case 'Visual':
        return (
          <div className="bg-blue-100 border-2 border-blue-300 rounded p-4 relative overflow-hidden">
            <div
              className={`w-8 h-8 bg-blue-500 rounded transition-all duration-1000 ${
                isPlaying ? 'transform scale-110 shadow-lg' : ''
              }`}
            ></div>
            {preset.id.includes('highlight') && isPlaying && (
              <div className="absolute inset-0 border-2 border-yellow-400 rounded animate-pulse"></div>
            )}
          </div>
        );

      case 'Narration':
        return (
          <div className="bg-amber-100 p-3 rounded flex items-center justify-center">
            <div className="flex space-x-1">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className={`w-1 bg-amber-500 rounded transition-all duration-200 ${
                    isPlaying ? 'h-6 animate-pulse' : 'h-2'
                  }`}
                  style={{ animationDelay: `${i * 100}ms` }}
                ></div>
              ))}
            </div>
          </div>
        );

      case 'You':
        return (
          <div className="bg-red-100 border-2 border-red-300 rounded-full w-16 h-16 flex items-center justify-center relative">
            <div
              className={`w-8 h-8 bg-red-500 rounded-full transition-all duration-1000 ${
                isPlaying ? 'transform scale-110' : ''
              }`}
            ></div>
            {preset.id.includes('blur') && isPlaying && (
              <div className="absolute inset-0 bg-red-200 rounded-full opacity-50 blur-sm"></div>
            )}
          </div>
        );

      default:
        return <div className="w-16 h-16 bg-gray-200 rounded"></div>;
    }
  };

  return (
    <div className="animation-preview">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-700">
          Animation Preview
        </span>
        <button
          onClick={handlePlayPreview}
          disabled={isPlaying}
          className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          {isPlaying ? 'Playing...' : 'Play'}
        </button>
      </div>
      <div className="preview-container border border-gray-200 rounded p-3 bg-white min-h-[80px] flex items-center justify-center">
        {getPreviewContent()}
      </div>
    </div>
  );
}
