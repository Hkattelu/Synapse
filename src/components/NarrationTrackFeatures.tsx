import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { TimelineItem, MediaAsset } from '../lib/types';
import type { EducationalTrack } from '../lib/educationalTypes';
import type { AudioDuckingConfig, TimingSyncPoint, NarrationTrackProperties } from '../lib/audioUtils';
import { DEFAULT_NARRATION_PROPERTIES, validateAudioForNarration } from '../lib/audioUtils';
import { WaveformVisualization } from './WaveformVisualization';
import { AudioLevelMeter } from './AudioLevelMeter';
import { AudioDuckingControls, DuckingPresetSelector } from './AudioDuckingControls';
import { TimingSyncTools } from './TimingSyncTools';
import { Mic, Volume2, Settings, Activity as Waveform, Clock } from 'lucide-react';

interface NarrationTrackFeaturesProps {
  item: TimelineItem;
  asset: MediaAsset | undefined;
  track: EducationalTrack;
  onItemUpdate: (item: TimelineItem) => void;
  currentTime: number;
  isPlaying: boolean;
  onSeek: (time: number) => void;
  onPlayPause: () => void;
  availableTracks: Array<{ id: number; name: string; color: string }>;
  className?: string;
}

export function NarrationTrackFeatures({
  item,
  asset,
  track,
  onItemUpdate,
  currentTime,
  isPlaying,
  onSeek,
  onPlayPause,
  availableTracks,
  className = '',
}: NarrationTrackFeaturesProps) {
  const [activeTab, setActiveTab] = useState<'waveform' | 'levels' | 'ducking' | 'sync' | 'processing'>('waveform');
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioSource, setAudioSource] = useState<AudioNode | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Initialize narration properties if not present
  const narrationProps: NarrationTrackProperties = {
    ...DEFAULT_NARRATION_PROPERTIES,
    ...item.properties,
  };

  // Load audio buffer for analysis
  useEffect(() => {
    if (asset?.url) {
      loadAudioBuffer(asset.url).then(setAudioBuffer);
    }
  }, [asset?.url]);

  // Set up audio context for real-time analysis
  useEffect(() => {
    if (asset?.url && audioRef.current) {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = context.createMediaElementSource(audioRef.current);
      
      setAudioContext(context);
      setAudioSource(source);
      
      return () => {
        context.close();
      };
    }
  }, [asset?.url]);

  const handlePropertyUpdate = useCallback((updates: Partial<NarrationTrackProperties>) => {
    onItemUpdate({
      ...item,
      properties: {
        ...item.properties,
        ...updates,
      },
    });
  }, [item, onItemUpdate]);

  const handleDuckingConfigChange = useCallback((ducking: AudioDuckingConfig) => {
    handlePropertyUpdate({ ducking });
  }, [handlePropertyUpdate]);

  const handleSyncPointsChange = useCallback((syncPoints: TimingSyncPoint[]) => {
    handlePropertyUpdate({ syncPoints });
  }, [handlePropertyUpdate]);

  const handleVolumeChange = useCallback((volume: number) => {
    handlePropertyUpdate({ volume });
  }, [handlePropertyUpdate]);

  const handleGainChange = useCallback((gain: number) => {
    handlePropertyUpdate({ gain });
  }, [handlePropertyUpdate]);

  const handleProcessingToggle = useCallback((property: keyof NarrationTrackProperties, value: boolean) => {
    handlePropertyUpdate({ [property]: value });
  }, [handlePropertyUpdate]);

  const tabs = [
    { id: 'waveform', label: 'Waveform', icon: Waveform },
    { id: 'levels', label: 'Levels', icon: Volume2 },
    { id: 'ducking', label: 'Ducking', icon: Volume2 },
    { id: 'sync', label: 'Sync', icon: Clock },
    { id: 'processing', label: 'Processing', icon: Settings },
  ] as const;

  if (!asset || asset.type !== 'audio') {
    return (
      <div className={`narration-track-features bg-background-subtle rounded-lg p-4 ${className}`}>
        <div className="text-center text-text-secondary">
          <Mic className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No audio asset selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`narration-track-features bg-background-subtle rounded-lg ${className}`}>
      {/* Hidden audio element for real-time analysis */}
      <audio
        ref={audioRef}
        src={asset.url}
        currentTime={currentTime}
        style={{ display: 'none' }}
      />

      {/* Tab Navigation */}
      <div className="flex border-b border-border-subtle">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-accent-blue border-b-2 border-accent-blue bg-background-hover'
                  : 'text-text-secondary hover:text-text-primary hover:bg-background-hover'
              }`}
            >
              <IconComponent className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'waveform' && (
          <WaveformTab
            asset={asset}
            audioBuffer={audioBuffer}
            currentTime={currentTime}
            syncPoints={narrationProps.syncPoints}
            onSeek={onSeek}
            onSyncPointClick={(syncPoint) => onSeek(syncPoint.time)}
          />
        )}

        {activeTab === 'levels' && (
          <LevelsTab
            audioContext={audioContext}
            audioSource={audioSource}
            volume={narrationProps.volume}
            gain={narrationProps.gain}
            onVolumeChange={handleVolumeChange}
            onGainChange={handleGainChange}
          />
        )}

        {activeTab === 'ducking' && (
          <DuckingTab
            duckingConfig={narrationProps.ducking}
            onConfigChange={handleDuckingConfigChange}
            availableTracks={availableTracks}
          />
        )}

        {activeTab === 'sync' && (
          <SyncTab
            syncPoints={narrationProps.syncPoints}
            onSyncPointsChange={handleSyncPointsChange}
            currentTime={currentTime}
            duration={asset.duration || 0}
            isPlaying={isPlaying}
            onSeek={onSeek}
            onPlayPause={onPlayPause}
            audioBuffer={audioBuffer}
          />
        )}

        {activeTab === 'processing' && (
          <ProcessingTab
            properties={narrationProps}
            onPropertyUpdate={handlePropertyUpdate}
            asset={asset}
          />
        )}
      </div>
    </div>
  );
}

// Individual tab components
function WaveformTab({
  asset,
  audioBuffer,
  currentTime,
  syncPoints,
  onSeek,
  onSyncPointClick,
}: {
  asset: MediaAsset;
  audioBuffer: AudioBuffer | null;
  currentTime: number;
  syncPoints: TimingSyncPoint[];
  onSeek: (time: number) => void;
  onSyncPointClick: (syncPoint: TimingSyncPoint) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="bg-background-hover rounded-lg p-4">
        <WaveformVisualization
          audioUrl={asset.url}
          audioBuffer={audioBuffer || undefined}
          width={600}
          height={120}
          currentTime={currentTime}
          duration={asset.duration || 0}
          syncPoints={syncPoints}
          onTimeClick={onSeek}
          onSyncPointClick={onSyncPointClick}
          className="w-full"
        />
      </div>
      
      <div className="text-sm text-text-secondary">
        <p>Click on the waveform to seek to that position. Sync points are shown as blue markers.</p>
      </div>
    </div>
  );
}

function LevelsTab({
  audioContext,
  audioSource,
  volume,
  gain,
  onVolumeChange,
  onGainChange,
}: {
  audioContext: AudioContext | null;
  audioSource: AudioNode | null;
  volume: number;
  gain: number;
  onVolumeChange: (volume: number) => void;
  onGainChange: (gain: number) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Real-time level meters */}
      <div className="bg-background-hover rounded-lg p-4">
        <h4 className="font-medium text-text-primary mb-4">Audio Levels</h4>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="mb-2">
              <AudioLevelMeter
                audioContext={audioContext || undefined}
                audioSource={audioSource || undefined}
                style="bars"
                width={60}
                height={120}
                orientation="vertical"
              />
            </div>
            <span className="text-xs text-text-secondary">Bars</span>
          </div>
          
          <div className="text-center">
            <div className="mb-2">
              <AudioLevelMeter
                audioContext={audioContext || undefined}
                audioSource={audioSource || undefined}
                style="circular"
                width={80}
                height={80}
              />
            </div>
            <span className="text-xs text-text-secondary">Circular</span>
          </div>
          
          <div className="text-center">
            <div className="mb-2">
              <AudioLevelMeter
                audioContext={audioContext || undefined}
                audioSource={audioSource || undefined}
                style="linear"
                width={20}
                height={120}
                orientation="vertical"
              />
            </div>
            <span className="text-xs text-text-secondary">Linear</span>
          </div>
        </div>
      </div>

      {/* Volume and Gain Controls */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Volume ({Math.round(volume * 100)}%)
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Gain ({gain > 0 ? '+' : ''}{gain}dB)
          </label>
          <input
            type="range"
            min="-20"
            max="20"
            step="0.5"
            value={gain}
            onChange={(e) => onGainChange(parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-text-secondary mt-1">
            <span>-20dB</span>
            <span>0dB</span>
            <span>+20dB</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DuckingTab({
  duckingConfig,
  onConfigChange,
  availableTracks,
}: {
  duckingConfig: AudioDuckingConfig;
  onConfigChange: (config: AudioDuckingConfig) => void;
  availableTracks: Array<{ id: number; name: string; color: string }>;
}) {
  return (
    <div className="space-y-4">
      <DuckingPresetSelector
        currentConfig={duckingConfig}
        onPresetSelect={onConfigChange}
      />
      
      <AudioDuckingControls
        duckingConfig={duckingConfig}
        onConfigChange={onConfigChange}
        availableTracks={availableTracks}
      />
    </div>
  );
}

function SyncTab({
  syncPoints,
  onSyncPointsChange,
  currentTime,
  duration,
  isPlaying,
  onSeek,
  onPlayPause,
  audioBuffer,
}: {
  syncPoints: TimingSyncPoint[];
  onSyncPointsChange: (syncPoints: TimingSyncPoint[]) => void;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onSeek: (time: number) => void;
  onPlayPause: () => void;
  audioBuffer: AudioBuffer | null;
}) {
  return (
    <TimingSyncTools
      syncPoints={syncPoints}
      onSyncPointsChange={onSyncPointsChange}
      currentTime={currentTime}
      duration={duration}
      isPlaying={isPlaying}
      onSeek={onSeek}
      onPlayPause={onPlayPause}
      audioBuffer={audioBuffer || undefined}
    />
  );
}

function ProcessingTab({
  properties,
  onPropertyUpdate,
  asset,
}: {
  properties: NarrationTrackProperties;
  onPropertyUpdate: (updates: Partial<NarrationTrackProperties>) => void;
  asset: MediaAsset;
}) {
  const validation = validateAudioForNarration(new File([], asset.name, { type: asset.metadata.mimeType }));

  return (
    <div className="space-y-6">
      {/* Audio Processing Options */}
      <div className="space-y-4">
        <h4 className="font-medium text-text-primary">Audio Processing</h4>
        
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={properties.highPassFilter}
            onChange={(e) => onPropertyUpdate({ highPassFilter: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm text-text-primary">High-pass filter</span>
          <span className="text-xs text-text-secondary">(Remove low frequencies)</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={properties.noiseReduction}
            onChange={(e) => onPropertyUpdate({ noiseReduction: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm text-text-primary">Noise reduction</span>
          <span className="text-xs text-text-secondary">(Reduce background noise)</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={properties.normalize}
            onChange={(e) => onPropertyUpdate({ normalize: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm text-text-primary">Normalize audio</span>
          <span className="text-xs text-text-secondary">(Optimize volume levels)</span>
        </label>
      </div>

      {/* Visualization Settings */}
      <div className="space-y-4">
        <h4 className="font-medium text-text-primary">Visualization</h4>
        
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Waveform Color
          </label>
          <input
            type="color"
            value={properties.waveformColor}
            onChange={(e) => onPropertyUpdate({ waveformColor: e.target.value })}
            className="w-full h-8 rounded border border-border-subtle"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={properties.showLevels}
            onChange={(e) => onPropertyUpdate({ showLevels: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm text-text-primary">Show level meters</span>
        </label>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Level Meter Style
          </label>
          <select
            value={properties.levelMeterStyle}
            onChange={(e) => onPropertyUpdate({ levelMeterStyle: e.target.value as 'bars' | 'circular' | 'linear' })}
            className="w-full px-3 py-2 bg-background-subtle border border-border-subtle rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue"
          >
            <option value="bars">Bars</option>
            <option value="circular">Circular</option>
            <option value="linear">Linear</option>
          </select>
        </div>
      </div>

      {/* Audio File Validation */}
      {(!validation.isValid || validation.warnings.length > 0) && (
        <div className="p-3 bg-background-hover rounded border border-border-subtle">
          <h4 className="font-medium text-text-primary mb-2">Audio Quality</h4>
          
          {validation.warnings.map((warning, index) => (
            <div key={index} className="text-sm text-yellow-400 mb-1">
              ⚠️ {warning}
            </div>
          ))}
          
          {validation.recommendations.map((recommendation, index) => (
            <div key={index} className="text-sm text-text-secondary mb-1">
              💡 {recommendation}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper function to load audio buffer
async function loadAudioBuffer(url: string): Promise<AudioBuffer> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  return audioContext.decodeAudioData(arrayBuffer);
}