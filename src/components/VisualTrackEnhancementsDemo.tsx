// Demo component showcasing Visual track enhancements
import React, { useState } from 'react';
import {
  VisualTrackClip,
  SideBySideLayoutControls,
  OptimizationSuggestions,
  EnhancedThumbnail,
} from './VisualTrackEnhancements';
import {
  analyzeScreenRecording,
  VISUAL_ANIMATION_PRESETS,
  type SideBySideLayout,
} from '../lib/visualTrackEnhancements';
import { EDUCATIONAL_TRACKS } from '../lib/educationalTypes';
import type { TimelineItem, MediaAsset } from '../lib/types';

// Mock data for demo
const mockScreenRecordingAsset: MediaAsset = {
  id: 'screen-recording-1',
  name: 'vscode-coding-tutorial.mp4',
  type: 'video',
  url: 'https://example.com/screen-recording.mp4',
  duration: 180,
  metadata: {
    width: 2560,
    height: 1440,
    fps: 60,
    fileSize: 120000000,
    mimeType: 'video/mp4',
  },
  thumbnail: 'https://via.placeholder.com/320x180/10B981/ffffff?text=Screen+Recording',
  createdAt: new Date(),
};

const mockRegularVideoAsset: MediaAsset = {
  id: 'regular-video-1',
  name: 'product-demo.mp4',
  type: 'video',
  url: 'https://example.com/product-demo.mp4',
  duration: 90,
  metadata: {
    width: 1920,
    height: 1080,
    fps: 30,
    fileSize: 80000000,
    mimeType: 'video/mp4',
  },
  thumbnail: 'https://via.placeholder.com/320x180/3B82F6/ffffff?text=Product+Demo',
  createdAt: new Date(),
};

const mockUltrawideAsset: MediaAsset = {
  id: 'ultrawide-1',
  name: 'multi-monitor-setup.mp4',
  type: 'video',
  url: 'https://example.com/ultrawide.mp4',
  duration: 240,
  metadata: {
    width: 3440,
    height: 1440,
    fps: 30,
    fileSize: 150000000,
    mimeType: 'video/mp4',
  },
  thumbnail: 'https://via.placeholder.com/320x135/8B5CF6/ffffff?text=Ultrawide',
  createdAt: new Date(),
};

const mockTimelineItems: TimelineItem[] = [
  {
    id: 'visual-item-1',
    assetId: 'screen-recording-1',
    startTime: 0,
    duration: 15,
    track: 1,
    type: 'video',
    properties: {},
    animations: [],
    keyframes: [],
  },
  {
    id: 'code-item-1',
    assetId: 'code-1',
    startTime: 0,
    duration: 15,
    track: 0,
    type: 'code',
    properties: {
      codeText: 'function hello() {\n  console.log("Hello, world!");\n}',
      language: 'javascript',
    },
    animations: [],
    keyframes: [],
  },
];

const visualTrack = EDUCATIONAL_TRACKS.find(t => t.id === 'visual')!;

export function VisualTrackEnhancementsDemo() {
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset>(mockScreenRecordingAsset);
  const [currentLayout, setCurrentLayout] = useState<SideBySideLayout | undefined>();
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>(mockTimelineItems);

  const handleItemUpdate = (updatedItem: TimelineItem) => {
    setTimelineItems(items => 
      items.map(item => item.id === updatedItem.id ? updatedItem : item)
    );
  };

  const handleLayoutChange = (layout: SideBySideLayout) => {
    setCurrentLayout(layout);
    console.log('Layout changed:', layout);
  };

  const handleApplyOptimization = (optimization: any) => {
    console.log('Applying optimization:', optimization);
  };

  const screenRecordingAnalysis = analyzeScreenRecording(selectedAsset);
  const codeItems = timelineItems.filter(item => item.type === 'code');
  const visualItems = timelineItems.filter(item => item.type === 'video');

  return (
    <div className="p-8 bg-bg-primary min-h-screen">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-text-primary mb-4">
            Visual Track Enhancements Demo
          </h1>
          <p className="text-text-secondary max-w-2xl mx-auto">
            Explore the enhanced Visual track features including screen recording detection, 
            animation presets, side-by-side layouts, and optimization suggestions.
          </p>
        </div>

        {/* Asset Selection */}
        <div className="bg-bg-secondary rounded-lg p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Asset Selection</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[mockScreenRecordingAsset, mockRegularVideoAsset, mockUltrawideAsset].map((asset) => (
              <button
                key={asset.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedAsset.id === asset.id
                    ? 'border-accent-yellow bg-accent-yellow bg-opacity-10'
                    : 'border-border-subtle hover:border-border-primary'
                }`}
                onClick={() => setSelectedAsset(asset)}
              >
                <EnhancedThumbnail 
                  asset={asset} 
                  className="w-full h-24 mb-3"
                  showIndicators={true}
                />
                <div className="text-sm font-medium text-text-primary truncate">
                  {asset.name}
                </div>
                <div className="text-xs text-text-secondary mt-1">
                  {asset.metadata.width}×{asset.metadata.height} • {asset.duration}s
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Visual Track Clip Demo */}
        <div className="bg-bg-secondary rounded-lg p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Enhanced Visual Track Clip</h2>
          <div className="relative bg-bg-primary rounded border border-border-subtle p-4" style={{ height: '120px' }}>
            <VisualTrackClip
              item={{
                ...timelineItems[0],
                assetId: selectedAsset.id,
              }}
              asset={selectedAsset}
              track={visualTrack}
              isSelected={true}
              style={{
                left: '20px',
                width: '200px',
                height: '80px',
                top: '20px',
              }}
              onItemUpdate={handleItemUpdate}
            />
          </div>
          <div className="mt-4 text-sm text-text-secondary">
            Click the lightning bolt icon on the clip to see animation presets based on content analysis.
          </div>
        </div>

        {/* Screen Recording Analysis */}
        <div className="bg-bg-secondary rounded-lg p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Screen Recording Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-text-primary mb-3">Detection Results</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Is Screen Recording:</span>
                  <span className={`font-medium ${screenRecordingAnalysis.isScreenRecording ? 'text-green-500' : 'text-red-500'}`}>
                    {screenRecordingAnalysis.isScreenRecording ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Confidence:</span>
                  <span className="font-medium text-text-primary">
                    {Math.round(screenRecordingAnalysis.confidence * 100)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Aspect Ratio:</span>
                  <span className="font-medium text-text-primary">
                    {screenRecordingAnalysis.characteristics.aspectRatio.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Has Code Content:</span>
                  <span className={`font-medium ${screenRecordingAnalysis.characteristics.hasCodeContent ? 'text-green-500' : 'text-gray-500'}`}>
                    {screenRecordingAnalysis.characteristics.hasCodeContent ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Has UI Elements:</span>
                  <span className={`font-medium ${screenRecordingAnalysis.characteristics.hasUIElements ? 'text-green-500' : 'text-gray-500'}`}>
                    {screenRecordingAnalysis.characteristics.hasUIElements ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-text-primary mb-3">Optimization Suggestions</h3>
              <OptimizationSuggestions
                analysis={screenRecordingAnalysis}
                onApplyOptimization={handleApplyOptimization}
              />
            </div>
          </div>
        </div>

        {/* Side-by-Side Layout Controls */}
        <div className="bg-bg-secondary rounded-lg p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Side-by-Side Layout Controls</h2>
          <div className="flex flex-col space-y-4">
            <SideBySideLayoutControls
              currentLayout={currentLayout}
              onLayoutChange={handleLayoutChange}
              codeItems={codeItems}
              visualItems={visualItems}
            />
            {currentLayout && (
              <div className="bg-bg-primary rounded p-4 border border-border-subtle">
                <h3 className="font-medium text-text-primary mb-2">Current Layout</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-text-secondary">Type:</span>
                    <span className="ml-2 font-medium text-text-primary">{currentLayout.type}</span>
                  </div>
                  <div>
                    <span className="text-text-secondary">Primary Content:</span>
                    <span className="ml-2 font-medium text-text-primary">{currentLayout.primaryContent}</span>
                  </div>
                  <div>
                    <span className="text-text-secondary">Split Ratio:</span>
                    <span className="ml-2 font-medium text-text-primary">{currentLayout.splitRatio}</span>
                  </div>
                  <div>
                    <span className="text-text-secondary">Gap:</span>
                    <span className="ml-2 font-medium text-text-primary">{currentLayout.gap}px</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Animation Presets */}
        <div className="bg-bg-secondary rounded-lg p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Available Animation Presets</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {VISUAL_ANIMATION_PRESETS.map((preset) => (
              <div
                key={preset.id}
                className="bg-bg-primary rounded-lg p-4 border border-border-subtle"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-text-primary">{preset.name}</h3>
                  <span className="text-xs bg-accent-yellow text-bg-primary px-2 py-1 rounded">
                    {preset.type}
                  </span>
                </div>
                <p className="text-sm text-text-secondary mb-3">{preset.description}</p>
                <div className="flex justify-between text-xs text-text-secondary">
                  <span>Duration: {preset.duration}s</span>
                  <span>Easing: {preset.easing}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced Thumbnails */}
        <div className="bg-bg-secondary rounded-lg p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Enhanced Thumbnails</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[mockScreenRecordingAsset, mockRegularVideoAsset, mockUltrawideAsset].map((asset) => (
              <div key={asset.id} className="space-y-3">
                <EnhancedThumbnail 
                  asset={asset} 
                  className="w-full h-32"
                  showIndicators={true}
                />
                <div className="text-sm">
                  <div className="font-medium text-text-primary truncate">{asset.name}</div>
                  <div className="text-text-secondary">
                    {asset.metadata.width}×{asset.metadata.height} • {asset.duration}s
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-sm text-text-secondary">
            Thumbnails automatically detect screen recordings and show relevant indicators.
          </div>
        </div>

        {/* Feature Summary */}
        <div className="bg-bg-secondary rounded-lg p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Visual Track Enhancement Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-text-primary mb-3">🎯 Screen Recording Detection</h3>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li>• Automatic detection based on filename and dimensions</li>
                <li>• Confidence scoring for detection accuracy</li>
                <li>• Content analysis (code, UI elements, ultrawide)</li>
                <li>• Visual indicators in timeline clips</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-text-primary mb-3">⚡ Animation Presets</h3>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li>• Content-aware preset recommendations</li>
                <li>• Highlight, zoom-focus, callout, pan, and reveal effects</li>
                <li>• Customizable parameters for each preset</li>
                <li>• Easy application through timeline interface</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-text-primary mb-3">📐 Side-by-Side Layouts</h3>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li>• Multiple layout options (left-right, top-bottom)</li>
                <li>• Automatic positioning and scaling</li>
                <li>• Configurable split ratios and gaps</li>
                <li>• Perfect for code + visual demonstrations</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-text-primary mb-3">🔧 Optimization Suggestions</h3>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li>• Smart cropping for ultrawide content</li>
                <li>• Focus recommendations for code content</li>
                <li>• Highlight suggestions for UI elements</li>
                <li>• One-click optimization application</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}