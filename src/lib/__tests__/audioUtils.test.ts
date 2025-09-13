import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  analyzeAudioData,
  calculateAudioLevels,
  calculateDuckingLevel,
  generateAutoSyncPoints,
  validateAudioForNarration,
  DEFAULT_NARRATION_PROPERTIES,
} from '../audioUtils';
import type { AudioDuckingConfig } from '../audioUtils';

// Mock AudioBuffer
class MockAudioBuffer implements AudioBuffer {
  length: number;
  duration: number;
  sampleRate: number;
  numberOfChannels: number;

  constructor(options: {
    length: number;
    sampleRate: number;
    numberOfChannels: number;
  }) {
    this.length = options.length;
    this.sampleRate = options.sampleRate;
    this.numberOfChannels = options.numberOfChannels;
    this.duration = this.length / this.sampleRate;
  }

  getChannelData(channel: number): Float32Array {
    // Generate mock audio data with some variation
    const data = new Float32Array(this.length);
    for (let i = 0; i < this.length; i++) {
      // Create a simple sine wave with some noise
      data[i] = Math.sin(i * 0.01) * 0.5 + (Math.random() - 0.5) * 0.1;
    }
    return data;
  }

  copyFromChannel(): void {}
  copyToChannel(): void {}
}

describe('audioUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('analyzeAudioData', () => {
    it('analyzes audio buffer and returns waveform data', async () => {
      const mockBuffer = new MockAudioBuffer({
        length: 44100, // 1 second at 44.1kHz
        sampleRate: 44100,
        numberOfChannels: 1,
      });

      const result = await analyzeAudioData(mockBuffer);

      expect(result).toHaveProperty('waveform');
      expect(result).toHaveProperty('peaks');
      expect(result).toHaveProperty('rms');
      expect(result).toHaveProperty('duration');
      expect(result).toHaveProperty('sampleRate');

      expect(result.waveform).toHaveLength(1000); // Default waveform samples
      expect(result.peaks).toHaveLength(1000);
      expect(result.rms).toHaveLength(1000);
      expect(result.duration).toBe(1);
      expect(result.sampleRate).toBe(44100);
    });

    it('handles empty audio buffer', async () => {
      const mockBuffer = new MockAudioBuffer({
        length: 0,
        sampleRate: 44100,
        numberOfChannels: 1,
      });

      const result = await analyzeAudioData(mockBuffer);

      expect(result.waveform).toHaveLength(1000);
      expect(result.duration).toBe(0);
    });
  });

  describe('calculateAudioLevels', () => {
    it('calculates current, peak, and average levels', () => {
      const audioData = new Float32Array([0.1, 0.5, 0.3, 0.8, 0.2]);

      const result = calculateAudioLevels(audioData);

      expect(result.currentLevel).toBeCloseTo(0.38, 2); // Average of absolute values
      expect(result.peakLevel).toBeCloseTo(0.8, 5); // Maximum value (allowing float tolerance)
      expect(result.averageLevel).toBeCloseTo(0.38, 2); // First calculation, same as current
    });

    it('updates levels with previous values', () => {
      const audioData = new Float32Array([0.2, 0.4, 0.6]);
      const previousLevels = {
        currentLevel: 0.3,
        peakLevel: 0.7,
        averageLevel: 0.35,
      };

      const result = calculateAudioLevels(audioData, previousLevels);

      expect(result.currentLevel).toBeCloseTo(0.4, 2);
      expect(result.peakLevel).toBe(0.7); // Previous peak was higher
      expect(result.averageLevel).toBeGreaterThan(0.35); // Should be updated with smoothing
    });

    it('handles empty audio data', () => {
      const audioData = new Float32Array([]);

      const result = calculateAudioLevels(audioData);

      expect(result.currentLevel).toBeNaN(); // Division by zero
      expect(result.peakLevel).toBe(0);
      expect(result.averageLevel).toBeNaN();
    });
  });

  describe('calculateDuckingLevel', () => {
    const mockDuckingConfig: AudioDuckingConfig = {
      enabled: true,
      threshold: 0.2,
      ratio: 0.6,
      attackTime: 100,
      releaseTime: 500,
      targetTracks: [1],
    };

    it('returns full volume when ducking is disabled', () => {
      const disabledConfig = { ...mockDuckingConfig, enabled: false };

      const result = calculateDuckingLevel(0.5, disabledConfig, 0);

      expect(result).toBe(1.0);
    });

    it('applies ducking when narration level exceeds threshold', () => {
      const result = calculateDuckingLevel(0.3, mockDuckingConfig, 0);

      expect(result).toBe(0.4); // 1.0 - 0.6 ratio
    });

    it('returns full volume when narration level is below threshold', () => {
      const result = calculateDuckingLevel(0.1, mockDuckingConfig, 0);

      expect(result).toBe(1.0);
    });

    it('handles edge case at threshold', () => {
      const result = calculateDuckingLevel(0.2, mockDuckingConfig, 0);

      expect(result).toBe(1.0); // Exactly at threshold, no ducking
    });
  });

  describe('generateAutoSyncPoints', () => {
    it('generates sync points based on silence detection', async () => {
      // Create a buffer with alternating loud and quiet sections
      const mockBuffer = new MockAudioBuffer({
        length: 44100 * 2, // 2 seconds
        sampleRate: 44100,
        numberOfChannels: 1,
      });

      // Override getChannelData to create predictable silence patterns
      vi.spyOn(mockBuffer, 'getChannelData').mockReturnValue(
        new Float32Array(44100 * 2).map((_, i) => {
          // Create silence from 0.5s to 1.0s and 1.5s to 2.0s
          const time = i / 44100;
          if ((time >= 0.5 && time <= 1.0) || (time >= 1.5 && time <= 2.0)) {
            return 0.001; // Very quiet
          }
          return 0.1; // Loud enough to not be silence
        })
      );

      const result = await generateAutoSyncPoints(mockBuffer, 0.5);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);

      // Check that sync points have required properties
      result.forEach((syncPoint) => {
        expect(syncPoint).toHaveProperty('id');
        expect(syncPoint).toHaveProperty('time');
        expect(syncPoint).toHaveProperty('label');
        expect(syncPoint).toHaveProperty('type');
        expect(syncPoint).toHaveProperty('confidence');
        expect(syncPoint.type).toBe('sentence');
      });
    });

    it('handles buffer with no silence', async () => {
      const mockBuffer = new MockAudioBuffer({
        length: 44100,
        sampleRate: 44100,
        numberOfChannels: 1,
      });

      // Override to return constant loud audio
      vi.spyOn(mockBuffer, 'getChannelData').mockReturnValue(
        new Float32Array(44100).fill(0.5)
      );

      const result = await generateAutoSyncPoints(mockBuffer, 0.5);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(0); // No silence detected
    });
  });

  describe('validateAudioForNarration', () => {
    it('validates supported audio file types', () => {
      const mp3File = new File([''], 'test.mp3', { type: 'audio/mp3' });

      const result = validateAudioForNarration(mp3File);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
      expect(result.recommendations).toHaveLength(0);
    });

    it('warns about unsupported file types', () => {
      const unknownFile = new File([''], 'test.xyz', { type: 'audio/xyz' });

      const result = validateAudioForNarration(unknownFile);

      expect(result.isValid).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('may not be fully supported');
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('warns about very small files', () => {
      const smallFile = new File(['x'.repeat(100)], 'test.mp3', {
        type: 'audio/mpeg',
      });

      const result = validateAudioForNarration(smallFile);

      expect(result.warnings.some((w) => w.includes('very small'))).toBe(true);
      expect(
        result.recommendations.some((r) => r.includes('higher quality'))
      ).toBe(true);
    });

    it('warns about very large files', () => {
      // Create a mock file that appears to be 200MB
      const largeFile = new File([''], 'test.mp3', { type: 'audio/mpeg' });
      Object.defineProperty(largeFile, 'size', { value: 200 * 1024 * 1024 });

      const result = validateAudioForNarration(largeFile);

      expect(result.warnings.some((w) => w.includes('very large'))).toBe(true);
      expect(
        result.recommendations.some((r) => r.includes('compressing'))
      ).toBe(true);
    });
  });

  describe('DEFAULT_NARRATION_PROPERTIES', () => {
    it('has all required properties', () => {
      expect(DEFAULT_NARRATION_PROPERTIES).toHaveProperty('volume');
      expect(DEFAULT_NARRATION_PROPERTIES).toHaveProperty('gain');
      expect(DEFAULT_NARRATION_PROPERTIES).toHaveProperty('highPassFilter');
      expect(DEFAULT_NARRATION_PROPERTIES).toHaveProperty('noiseReduction');
      expect(DEFAULT_NARRATION_PROPERTIES).toHaveProperty('normalize');
      expect(DEFAULT_NARRATION_PROPERTIES).toHaveProperty('ducking');
      expect(DEFAULT_NARRATION_PROPERTIES).toHaveProperty('syncPoints');
      expect(DEFAULT_NARRATION_PROPERTIES).toHaveProperty('autoSync');
      expect(DEFAULT_NARRATION_PROPERTIES).toHaveProperty('waveformColor');
      expect(DEFAULT_NARRATION_PROPERTIES).toHaveProperty('showLevels');
      expect(DEFAULT_NARRATION_PROPERTIES).toHaveProperty('levelMeterStyle');
    });

    it('has sensible default values', () => {
      expect(DEFAULT_NARRATION_PROPERTIES.volume).toBe(0.8);
      expect(DEFAULT_NARRATION_PROPERTIES.gain).toBe(0);
      expect(DEFAULT_NARRATION_PROPERTIES.highPassFilter).toBe(false);
      expect(DEFAULT_NARRATION_PROPERTIES.noiseReduction).toBe(false);
      expect(DEFAULT_NARRATION_PROPERTIES.normalize).toBe(false);
      expect(DEFAULT_NARRATION_PROPERTIES.ducking.enabled).toBe(true);
      expect(DEFAULT_NARRATION_PROPERTIES.syncPoints).toEqual([]);
      expect(DEFAULT_NARRATION_PROPERTIES.autoSync).toBe(true);
      expect(DEFAULT_NARRATION_PROPERTIES.waveformColor).toBe('#F59E0B');
      expect(DEFAULT_NARRATION_PROPERTIES.showLevels).toBe(true);
      expect(DEFAULT_NARRATION_PROPERTIES.levelMeterStyle).toBe('bars');
    });

    it('has valid ducking configuration', () => {
      const ducking = DEFAULT_NARRATION_PROPERTIES.ducking;

      expect(ducking.threshold).toBeGreaterThan(0);
      expect(ducking.threshold).toBeLessThan(1);
      expect(ducking.ratio).toBeGreaterThan(0);
      expect(ducking.ratio).toBeLessThan(1);
      expect(ducking.attackTime).toBeGreaterThan(0);
      expect(ducking.releaseTime).toBeGreaterThan(0);
      expect(Array.isArray(ducking.targetTracks)).toBe(true);
    });
  });
});
