import React, { useState } from 'react';
import { NarrationTrackFeatures } from './NarrationTrackFeatures';
import { WaveformVisualization } from './WaveformVisualization';
import { AudioLevelMeter } from './AudioLevelMeter';
import { AudioDuckingControls } from './AudioDuckingControls';
import { TimingSyncTools } from './TimingSyncTools';
import type { TimelineItem, MediaAsset } from '../lib/types';
import type { EducationalTrack } from '../lib/educationalTypes';
import type { TimingSyncPoint, AudioDuckingConfig } from '../lib/audioUtils';
import { EDUCATIONAL_TRACKS } from '../lib/educationalTypes';

export function NarrationTrackDemo() {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState<'waveform' | 'levels' | 'ducking' | 'sync' | 'full'>('full');

  // Mock data
  const mockAsset: MediaAsset = {
    id: 'audio-1',
    name: 'Narration Track.mp3',
    type: 'audio',
    url: '/mock-audio.mp3', // This would be a real audio file in production
    duration: 120, // 2 minutes
    metadata: {
      fileSize: 2048000,
      mimeType: 'audio/mpeg',
    },
    createdAt: new Date(),
  };

  const mockItem: TimelineItem = {
    id: 'item-1',
    assetId: 'audio-1',
    startTime: 0,
    duration: 120,
    track: 2, // Narration track
    type: 'audio',
    properties: {
      // default narration-like properties
      volume: 0.8,
      gain: 2,
      noiseReduction: true,
      ducking: {
        enabled: true,
        threshold: 0.1,
        ratio: 0.6,
        attackTime: 100,
        releaseTime: 500,
        targetTracks: [1], // Visual track
      },
      syncPoints: [
        {
          id: 'sync-1',
          time: 15,
          label: 'Introduction',
          type: 'paragraph',
        },
        {
          id: 'sync-2',
          time: 45,
          label: 'Main Topic',
          type: 'paragraph',
        },
        {
          id: 'sync-3',
          time: 90,
          label: 'Conclusion',
          type: 'paragraph',
        },
      ] as TimingSyncPoint[],
    },
    animations: [],
    keyframes: [],
  };

  const narrationTrack = EDUCATIONAL_TRACKS.find(t => t.id === 'narration')!;
  
  const availableTracks = [
    { id: 0, name: 'Code', color: '#8B5CF6' },
    { id: 1, name: 'Visual', color: '#10B981' },
    { id: 3, name: 'You', color: '#EF4444' },
  ];

  const handleItemUpdate = (updatedItem: TimelineItem) => {
    console.log('Item updated:', updatedItem);
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const demos = [
    { id: 'full', label: 'Full Features', description: 'Complete narration track interface' },
    { id: 'waveform', label: 'Waveform', description: 'Audio waveform visualization' },
    { id: 'levels', label: 'Level Meters', description: 'Real-time audio level monitoring' },
    { id: 'ducking', label: 'Audio Ducking', description: 'Automatic volume reduction controls' },
    { id: 'sync', label: 'Timing Sync', description: 'Narration timing synchronization tools' },
  ] as const;

  return (
    <div className="narration-track-demo p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          Narration Track Audio Features
        </h1>
        <p className="text-text-secondary">
          Advanced audio processing and synchronization tools for educational content narration.
        </p>
      </div>

      {/* Demo Selector */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {demos.map((demo) => (
            <button
              key={demo.id}
              onClick={() => setSelectedDemo(demo.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedDemo === demo.id
                  ? 'bg-accent-blue text-white'
                  : 'bg-background-subtle text-text-secondary hover:text-text-primary hover:bg-background-hover'
              }`}
            >
              {demo.label}
            </button>
          ))}
        </div>
        <p className="text-sm text-text-secondary mt-2">
          {demos.find(d => d.id === selectedDemo)?.description}
        </p>
      </div>

      {/* Demo Content */}
      <div className="space-y-6">
        {selectedDemo === 'full' && (
          <div className="bg-background-subtle rounded-lg p-1">
            <NarrationTrackFeatures
              item={mockItem}
              asset={mockAsset}
              track={narrationTrack}
              onItemUpdate={handleItemUpdate}
              currentTime={currentTime}
              isPlaying={isPlaying}
              onSeek={handleSeek}
              onPlayPause={handlePlayPause}
              availableTracks={availableTracks}
            />
          </div>
        )}

        {selectedDemo === 'waveform' && (
          <div className="bg-background-subtle rounded-lg p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Waveform Visualization
            </h3>
            <div className="bg-background-hover rounded-lg p-4">
              <WaveformVisualization
                width={800}
                height={150}
                currentTime={currentTime}
                duration={mockAsset.duration || 0}
                syncPoints={mockItem.properties.syncPoints as TimingSyncPoint[]}
                onTimeClick={handleSeek}
                onSyncPointClick={(syncPoint) => handleSeek(syncPoint.time)}
                className="w-full"
              />
            </div>
            <div className="mt-4 flex items-center gap-4">
              <button
                onClick={handlePlayPause}
                className="px-4 py-2 bg-accent-blue text-white rounded hover:bg-accent-blue-hover transition-colors"
              >
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              <div className="text-sm text-text-secondary">
                Time: {Math.round(currentTime)}s / {mockAsset.duration}s
              </div>
            </div>
          </div>
        )}

        {selectedDemo === 'levels' && (
          <div className="bg-background-subtle rounded-lg p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Audio Level Meters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <h4 className="font-medium text-text-primary mb-4">Bar Style</h4>
                <div className="flex justify-center">
                  <AudioLevelMeter
                    style="bars"
                    width={80}
                    height={150}
                    orientation="vertical"
                    showPeak={true}
                    showAverage={true}
                  />
                </div>
              </div>
              
              <div className="text-center">
                <h4 className="font-medium text-text-primary mb-4">Circular Style</h4>
                <div className="flex justify-center">
                  <AudioLevelMeter
                    style="circular"
                    width={120}
                    height={120}
                    showPeak={true}
                    showAverage={true}
                  />
                </div>
              </div>
              
              <div className="text-center">
                <h4 className="font-medium text-text-primary mb-4">Linear Style</h4>
                <div className="flex justify-center">
                  <AudioLevelMeter
                    style="linear"
                    width={30}
                    height={150}
                    orientation="vertical"
                    showPeak={true}
                    showAverage={true}
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 p-4 bg-background-hover rounded text-sm text-text-secondary">
              <p>
                Level meters show real-time audio levels with peak and average indicators.
                Different styles are available to match your workflow preferences.
              </p>
            </div>
          </div>
        )}

        {selectedDemo === 'ducking' && (
          <div className="bg-background-subtle rounded-lg p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Audio Ducking Controls
            </h3>
            <AudioDuckingControls
              duckingConfig={mockItem.properties.ducking as AudioDuckingConfig}
              onConfigChange={(config) => console.log('Ducking config:', config)}
              availableTracks={availableTracks}
            />
          </div>
        )}

        {selectedDemo === 'sync' && (
          <div className="bg-background-subtle rounded-lg p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Timing Synchronization Tools
            </h3>
            <TimingSyncTools
              syncPoints={mockItem.properties.syncPoints as TimingSyncPoint[]}
              onSyncPointsChange={(syncPoints) => console.log('Sync points:', syncPoints)}
              currentTime={currentTime}
              duration={mockAsset.duration || 0}
              isPlaying={isPlaying}
              onSeek={handleSeek}
              onPlayPause={handlePlayPause}
            />
          </div>
        )}
      </div>

      {/* Feature Overview */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-background-subtle rounded-lg p-4">
          <div className="text-2xl mb-2">🎵</div>
          <h4 className="font-semibold text-text-primary mb-2">Waveform Visualization</h4>
          <p className="text-sm text-text-secondary">
            Interactive waveform display with sync point markers and timeline scrubbing.
          </p>
        </div>
        
        <div className="bg-background-subtle rounded-lg p-4">
          <div className="text-2xl mb-2">📊</div>
          <h4 className="font-semibold text-text-primary mb-2">Audio Level Meters</h4>
          <p className="text-sm text-text-secondary">
            Real-time audio level monitoring with multiple visualization styles.
          </p>
        </div>
        
        <div className="bg-background-subtle rounded-lg p-4">
          <div className="text-2xl mb-2">🔊</div>
          <h4 className="font-semibold text-text-primary mb-2">Audio Ducking</h4>
          <p className="text-sm text-text-secondary">
            Automatic volume reduction of background tracks during narration.
          </p>
        </div>
        
        <div className="bg-background-subtle rounded-lg p-4">
          <div className="text-2xl mb-2">⏱️</div>
          <h4 className="font-semibold text-text-primary mb-2">Timing Sync</h4>
          <p className="text-sm text-text-secondary">
            Precise timing synchronization tools for aligning narration with visuals.
          </p>
        </div>
      </div>
    </div>
  );
}