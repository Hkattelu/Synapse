// Audio utilities for Narration track features

export interface AudioAnalysisData {
  waveform: number[]; // Normalized amplitude values (0-1)
  peaks: number[]; // Peak detection for visualization
  rms: number[]; // RMS values for level metering
  duration: number;
  sampleRate: number;
}

export interface AudioLevelMeter {
  currentLevel: number; // Current audio level (0-1)
  peakLevel: number; // Peak level (0-1)
  averageLevel: number; // Average level over time (0-1)
}

export interface AudioDuckingConfig {
  enabled: boolean;
  threshold: number; // Audio level threshold to trigger ducking (0-1)
  ratio: number; // Ducking ratio (0-1, how much to reduce background audio)
  attackTime: number; // Time to duck in milliseconds
  releaseTime: number; // Time to restore in milliseconds
  targetTracks: number[]; // Track numbers to duck when narration is active
}

export interface TimingSyncPoint {
  id: string;
  time: number; // Time in seconds
  label: string;
  type: 'marker' | 'word' | 'sentence' | 'paragraph';
  confidence?: number; // Confidence score for auto-generated sync points
}

export interface NarrationTrackProperties {
  // Audio processing
  volume: number;
  gain: number; // Additional gain control (-20dB to +20dB)
  highPassFilter: boolean; // Remove low frequencies
  noiseReduction: boolean; // Apply noise reduction
  normalize: boolean; // Normalize audio levels
  
  // Ducking configuration
  ducking: AudioDuckingConfig;
  
  // Timing synchronization
  syncPoints: TimingSyncPoint[];
  autoSync: boolean; // Enable automatic timing synchronization
  
  // Visualization preferences
  waveformColor: string;
  showLevels: boolean;
  levelMeterStyle: 'bars' | 'circular' | 'linear';
}

/**
 * Analyzes audio data to generate waveform visualization data
 */
export async function analyzeAudioData(audioBuffer: AudioBuffer): Promise<AudioAnalysisData> {
  const channelData = audioBuffer.getChannelData(0); // Use first channel
  const sampleRate = audioBuffer.sampleRate;
  const duration = audioBuffer.duration;
  
  // Generate waveform data (downsample for visualization)
  const waveformSamples = 1000; // Number of samples for waveform visualization
  const samplesPerPoint = Math.floor(channelData.length / waveformSamples);
  const waveform: number[] = [];
  const peaks: number[] = [];
  const rms: number[] = [];
  
  for (let i = 0; i < waveformSamples; i++) {
    const start = i * samplesPerPoint;
    const end = Math.min(start + samplesPerPoint, channelData.length);
    
    let sum = 0;
    let sumSquares = 0;
    let peak = 0;
    
    for (let j = start; j < end; j++) {
      const sample = Math.abs(channelData[j]);
      sum += sample;
      sumSquares += sample * sample;
      peak = Math.max(peak, sample);
    }
    
    const average = sum / (end - start);
    const rmsValue = Math.sqrt(sumSquares / (end - start));
    
    waveform.push(average);
    peaks.push(peak);
    rms.push(rmsValue);
  }
  
  return {
    waveform,
    peaks,
    rms,
    duration,
    sampleRate,
  };
}

/**
 * Calculates real-time audio levels for level metering
 */
export function calculateAudioLevels(
  audioData: Float32Array,
  previousLevels?: AudioLevelMeter
): AudioLevelMeter {
  let sum = 0;
  let peak = 0;
  
  for (let i = 0; i < audioData.length; i++) {
    const sample = Math.abs(audioData[i]);
    sum += sample;
    peak = Math.max(peak, sample);
  }
  
  const currentLevel = sum / audioData.length;
  const peakLevel = Math.max(peak, previousLevels?.peakLevel || 0);
  
  // Calculate running average (simple exponential smoothing)
  const alpha = 0.1; // Smoothing factor
  const averageLevel = previousLevels
    ? previousLevels.averageLevel * (1 - alpha) + currentLevel * alpha
    : currentLevel;
  
  return {
    currentLevel,
    peakLevel,
    averageLevel,
  };
}

/**
 * Applies audio ducking to background tracks when narration is active
 */
export function calculateDuckingLevel(
  narrationLevel: number,
  duckingConfig: AudioDuckingConfig,
  currentTime: number
): number {
  if (!duckingConfig.enabled) {
    return 1.0; // No ducking
  }
  
  const shouldDuck = narrationLevel > duckingConfig.threshold;
  
  if (shouldDuck) {
    // Apply ducking ratio
    return 1.0 - duckingConfig.ratio;
  }
  
  return 1.0; // Full volume
}

/**
 * Generates automatic sync points based on audio analysis
 */
export async function generateAutoSyncPoints(
  audioBuffer: AudioBuffer,
  sensitivity: number = 0.5
): Promise<TimingSyncPoint[]> {
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const syncPoints: TimingSyncPoint[] = [];
  
  // Simple silence detection for automatic sync point generation
  const windowSize = Math.floor(sampleRate * 0.1); // 100ms windows
  const silenceThreshold = 0.01 * sensitivity; // Adjustable silence threshold
  
  let isInSilence = false;
  let silenceStart = 0;
  
  for (let i = 0; i < channelData.length; i += windowSize) {
    const end = Math.min(i + windowSize, channelData.length);
    let sum = 0;
    
    for (let j = i; j < end; j++) {
      sum += Math.abs(channelData[j]);
    }
    
    const average = sum / (end - i);
    const time = i / sampleRate;
    
    if (average < silenceThreshold) {
      if (!isInSilence) {
        isInSilence = true;
        silenceStart = time;
      }
    } else {
      if (isInSilence) {
        // End of silence - potential sync point
        const silenceDuration = time - silenceStart;
        if (silenceDuration > 0.2) { // Only consider pauses longer than 200ms
          syncPoints.push({
            id: `auto-sync-${syncPoints.length}`,
            time: silenceStart + silenceDuration / 2, // Middle of silence
            label: `Pause ${syncPoints.length + 1}`,
            type: 'sentence',
            confidence: Math.min(silenceDuration / 2, 1), // Longer pauses = higher confidence
          });
        }
        isInSilence = false;
      }
    }
  }
  
  return syncPoints;
}

/**
 * Validates audio file for narration track compatibility
 */
export function validateAudioForNarration(file: File): {
  isValid: boolean;
  warnings: string[];
  recommendations: string[];
} {
  const warnings: string[] = [];
  const recommendations: string[] = [];
  
  // Check file type
  const supportedTypes = ['audio/wav', 'audio/mp3', 'audio/aac', 'audio/ogg', 'audio/flac'];
  if (!supportedTypes.includes(file.type)) {
    warnings.push(`File type ${file.type} may not be fully supported`);
    recommendations.push('Use WAV, MP3, AAC, OGG, or FLAC for best compatibility');
  }
  
  // Check file size (rough estimate for quality)
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB < 1) {
    warnings.push('Audio file is very small, quality may be poor');
    recommendations.push('Use higher quality audio files for better results');
  }
  
  if (fileSizeMB > 100) {
    warnings.push('Audio file is very large, may impact performance');
    recommendations.push('Consider compressing audio or using shorter clips');
  }
  
  return {
    isValid: warnings.length === 0,
    warnings,
    recommendations,
  };
}

/**
 * Default narration track properties
 */
export const DEFAULT_NARRATION_PROPERTIES: NarrationTrackProperties = {
  volume: 0.8,
  gain: 0,
  highPassFilter: false,
  noiseReduction: false,
  normalize: false,
  ducking: {
    enabled: true,
    threshold: 0.1,
    ratio: 0.6,
    attackTime: 100,
    releaseTime: 500,
    targetTracks: [1], // Duck Visual track by default
  },
  syncPoints: [],
  autoSync: true,
  waveformColor: '#F59E0B',
  showLevels: true,
  levelMeterStyle: 'bars',
};