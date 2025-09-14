// Educational Animation Presets Demo
// Demonstrates the educational animation system with interactive examples

import React, { useState } from 'react';
import { EducationalAnimationSelector } from './EducationalAnimationSelector';
import { EducationalAnimationPreview } from './EducationalAnimationPreview';
import {
  EDUCATIONAL_ANIMATION_PRESETS,
  getPresetsForTrack,
  getPresetsByDifficulty,
  type EducationalAnimationPreset,
} from '../lib/educationalAnimationPresets';
import type { EducationalTrackName } from '../lib/educationalTypes';
import type { TimelineItem } from '../lib/types';

export function EducationalAnimationPresetsDemo() {
  const [selectedTrack, setSelectedTrack] =
    useState<EducationalTrackName>('Code');
  const [selectedPreset, setSelectedPreset] =
    useState<EducationalAnimationPreset | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    'all' | 'beginner' | 'intermediate' | 'advanced'
  >('all');

  // Mock timeline item for demonstration
  const mockTimelineItem: TimelineItem = {
    id: 'demo-item',
    assetId: 'demo-asset',
    type: 'code',
    track: 0, // Code track
    startTime: 0,
    duration: 5,
    properties: {
      text: 'function fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n-1) + fibonacci(n-2);\n}',
      language: 'javascript',
      theme: 'vscode-dark-plus',
      fontSize: 16,
      showLineNumbers: true,
    },
    animations: [],
    keyframes: [],
  };

  const trackTypes: EducationalTrackName[] = [
    'Code',
    'Visual',
    'Narration',
    'You',
  ];

  const filteredPresets =
    selectedDifficulty === 'all'
      ? getPresetsForTrack(selectedTrack)
      : getPresetsByDifficulty(selectedTrack, selectedDifficulty);

  const handlePlayPreset = (preset: EducationalAnimationPreset) => {
    setSelectedPreset(preset);
    setIsPlaying(true);
  };

  const handlePlayComplete = () => {
    setIsPlaying(false);
  };

  const handleApplyPreset = (updatedItem: TimelineItem) => {
    console.log('Applied preset to item:', updatedItem);
    // In a real implementation, this would update the timeline
  };

  return (
    <div className="educational-animation-presets-demo p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Educational Animation Presets
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Explore track-specific animation presets designed for educational
          content creation. Each track has specialized animations that enhance
          learning and engagement.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Controls
            </h2>

            {/* Track Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Educational Track
              </label>
              <div className="grid grid-cols-2 gap-2">
                {trackTypes.map((track) => (
                  <button
                    key={track}
                    onClick={() => {
                      setSelectedTrack(track);
                      setSelectedPreset(null);
                    }}
                    className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                      selectedTrack === track
                        ? 'bg-purple-100 border-purple-300 text-purple-800'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {track}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Filter */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty Level
              </label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            {/* Track Statistics */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">
                Track Statistics
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Total Presets:</span>
                  <span className="font-medium">
                    {getPresetsForTrack(selectedTrack).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Beginner:</span>
                  <span className="font-medium text-green-600">
                    {getPresetsByDifficulty(selectedTrack, 'beginner').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Intermediate:</span>
                  <span className="font-medium text-blue-600">
                    {
                      getPresetsByDifficulty(selectedTrack, 'intermediate')
                        .length
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Advanced:</span>
                  <span className="font-medium text-purple-600">
                    {getPresetsByDifficulty(selectedTrack, 'advanced').length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Presets List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {selectedTrack} Track Presets ({filteredPresets.length})
            </h2>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredPresets.map((preset) => (
                <PresetCard
                  key={preset.id}
                  preset={preset}
                  isSelected={selectedPreset?.id === preset.id}
                  isPlaying={isPlaying && selectedPreset?.id === preset.id}
                  onSelect={() => setSelectedPreset(preset)}
                  onPlay={() => handlePlayPreset(preset)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Preview
            </h2>

            {selectedPreset ? (
              <div>
                <EducationalAnimationPreview
                  preset={selectedPreset}
                  item={mockTimelineItem}
                  isPlaying={isPlaying}
                  onPlayComplete={handlePlayComplete}
                  className="mb-4"
                />

                <div className="space-y-3">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">
                      {selectedPreset.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedPreset.educationalPurpose}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        selectedPreset.difficulty === 'beginner'
                          ? 'bg-green-100 text-green-800'
                          : selectedPreset.difficulty === 'intermediate'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {selectedPreset.difficulty}
                    </span>
                    <span className="text-xs text-gray-500">
                      {selectedPreset.duration}s • {selectedPreset.easing}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">
                      Recommended for:
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedPreset.recommendedFor.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-200">
                    <button
                      onClick={() => handlePlayPreset(selectedPreset)}
                      disabled={isPlaying}
                      className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isPlaying ? 'Playing...' : 'Play Preview'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-sm">Select a preset to see preview</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Educational Animation Selector Demo */}
      <div className="mt-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Inspector Integration Demo
        </h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 max-w-md">
          <EducationalAnimationSelector
            item={mockTimelineItem}
            onApplyPreset={handleApplyPreset}
          />
        </div>
      </div>

      {/* Usage Examples */}
      <div className="mt-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Usage Examples
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {trackTypes.map((track) => (
            <UsageExampleCard key={track} trackType={track} />
          ))}
        </div>
      </div>
    </div>
  );
}

interface PresetCardProps {
  preset: EducationalAnimationPreset;
  isSelected: boolean;
  isPlaying: boolean;
  onSelect: () => void;
  onPlay: () => void;
}

function PresetCard({
  preset,
  isSelected,
  isPlaying,
  onSelect,
  onPlay,
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
      className={`preset-card border rounded-lg p-3 cursor-pointer transition-all ${
        isSelected
          ? 'border-purple-300 bg-purple-50'
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 text-sm mb-1">
            {preset.name}
          </h4>
          <p className="text-xs text-gray-600 mb-2">
            {preset.previewDescription}
          </p>
        </div>
        <span
          className={`px-2 py-0.5 text-xs rounded-full ${getDifficultyColor(preset.difficulty)}`}
        >
          {preset.difficulty}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{preset.duration}s</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPlay();
          }}
          disabled={isPlaying}
          className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
      </div>
    </div>
  );
}

interface UsageExampleCardProps {
  trackType: EducationalTrackName;
}

function UsageExampleCard({ trackType }: UsageExampleCardProps) {
  const examples = {
    Code: {
      title: 'Code Track Examples',
      description: 'Perfect for programming tutorials and code demonstrations',
      scenarios: [
        'Live coding sessions with typewriter effect',
        'Step-by-step code explanations with line-by-line reveal',
        'Code refactoring with diff highlighting',
        'Syntax highlighting for language tutorials',
      ],
    },
    Visual: {
      title: 'Visual Track Examples',
      description: 'Ideal for screen recordings and visual demonstrations',
      scenarios: [
        'Software tutorials with focus zoom',
        'UI walkthroughs with highlight callouts',
        'Side-by-side comparisons',
        'Large content exploration with pan and scan',
      ],
    },
    Narration: {
      title: 'Narration Track Examples',
      description: 'Optimized for audio content and voice synchronization',
      scenarios: [
        'Professional voiceovers with smart ducking',
        'Audio visualization with waveform sync',
        'Chapter transitions in structured content',
        'Voice-activated content reveals',
      ],
    },
    You: {
      title: 'You Track Examples',
      description: 'Designed for personal video and presenter content',
      scenarios: [
        'Professional introductions with smooth entrance',
        'Picture-in-picture during screen sharing',
        'Background blur for focus enhancement',
        'Split-screen presentations',
      ],
    },
  };

  const example = examples[trackType];
  const presetCount = getPresetsForTrack(trackType).length;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {example.title}
      </h3>
      <p className="text-sm text-gray-600 mb-4">{example.description}</p>

      <div className="mb-4">
        <span className="text-sm font-medium text-gray-700">
          {presetCount} available presets
        </span>
      </div>

      <ul className="space-y-2">
        {example.scenarios.map((scenario, index) => (
          <li key={index} className="flex items-start text-sm text-gray-600">
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 mr-3 flex-shrink-0" />
            {scenario}
          </li>
        ))}
      </ul>
    </div>
  );
}
