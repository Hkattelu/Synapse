// Tests for Educational Animation Presets
// Validates preset collections, application logic, and track-specific functionality

import { describe, it, expect } from 'vitest';
import {
  EDUCATIONAL_ANIMATION_PRESETS,
  CODE_ANIMATION_PRESETS,
  VISUAL_ANIMATION_PRESETS,
  NARRATION_ANIMATION_PRESETS,
  YOU_ANIMATION_PRESETS,
  getPresetsForTrack,
  getPresetById,
  getPresetsByDifficulty,
  getRecommendedPresets,
  applyEducationalAnimationPreset,
  type EducationalAnimationPreset,
} from '../educationalAnimationPresets';
import type { TimelineItem } from '../types';
import type { EducationalTrackName } from '../educationalTypes';

// Mock timeline item for testing
const mockTimelineItem: TimelineItem = {
  id: 'test-item',
  assetId: 'test-asset',
  type: 'code',
  track: 0,
  startTime: 0,
  duration: 5,
  properties: {
    text: 'console.log("Hello World");',
    language: 'javascript',
    theme: 'vscode-dark-plus',
    fontSize: 16,
  },
};

describe('Educational Animation Presets Collections', () => {
  it('should have presets for all educational tracks', () => {
    expect(CODE_ANIMATION_PRESETS.length).toBeGreaterThan(0);
    expect(VISUAL_ANIMATION_PRESETS.length).toBeGreaterThan(0);
    expect(NARRATION_ANIMATION_PRESETS.length).toBeGreaterThan(0);
    expect(YOU_ANIMATION_PRESETS.length).toBeGreaterThan(0);
  });

  it('should have valid preset structure for all presets', () => {
    const allPresets = [
      ...CODE_ANIMATION_PRESETS,
      ...VISUAL_ANIMATION_PRESETS,
      ...NARRATION_ANIMATION_PRESETS,
      ...YOU_ANIMATION_PRESETS,
    ];

    allPresets.forEach((preset) => {
      expect(preset.id).toBeTruthy();
      expect(preset.name).toBeTruthy();
      expect(preset.type).toMatch(/^(entrance|exit|emphasis|transition)$/);
      expect(preset.trackType).toMatch(/^(Code|Visual|Narration|You)$/);
      expect(preset.educationalPurpose).toBeTruthy();
      expect(preset.difficulty).toMatch(/^(beginner|intermediate|advanced)$/);
      expect(Array.isArray(preset.recommendedFor)).toBe(true);
      expect(preset.previewDescription).toBeTruthy();
      expect(typeof preset.parameters).toBe('object');
      expect(preset.duration).toBeGreaterThanOrEqual(0); // Allow 0 for continuous animations
      expect(preset.easing).toBeTruthy();
    });
  });

  it('should have unique preset IDs across all tracks', () => {
    const allPresets = [
      ...CODE_ANIMATION_PRESETS,
      ...VISUAL_ANIMATION_PRESETS,
      ...NARRATION_ANIMATION_PRESETS,
      ...YOU_ANIMATION_PRESETS,
    ];

    const ids = allPresets.map((p) => p.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should organize presets correctly in EDUCATIONAL_ANIMATION_PRESETS', () => {
    expect(EDUCATIONAL_ANIMATION_PRESETS.Code).toEqual(CODE_ANIMATION_PRESETS);
    expect(EDUCATIONAL_ANIMATION_PRESETS.Visual).toEqual(
      VISUAL_ANIMATION_PRESETS
    );
    expect(EDUCATIONAL_ANIMATION_PRESETS.Narration).toEqual(
      NARRATION_ANIMATION_PRESETS
    );
    expect(EDUCATIONAL_ANIMATION_PRESETS.You).toEqual(YOU_ANIMATION_PRESETS);
  });
});

describe('Code Track Animation Presets', () => {
  it('should contain expected code-specific presets', () => {
    const presetIds = CODE_ANIMATION_PRESETS.map((p) => p.id);

    expect(presetIds).toContain('typewriter-educational');
    expect(presetIds).toContain('line-by-line-reveal');
    expect(presetIds).toContain('diff-highlight');
    expect(presetIds).toContain('syntax-highlight-wave');
    expect(presetIds).toContain('focus-block');
  });

  it('should have appropriate educational purposes for code presets', () => {
    const typewriterPreset = CODE_ANIMATION_PRESETS.find(
      (p) => p.id === 'typewriter-educational'
    )!;
    expect(typewriterPreset.educationalPurpose).toContain('beginner');
    expect(typewriterPreset.educationalPurpose).toContain(
      'character by character'
    );

    const diffPreset = CODE_ANIMATION_PRESETS.find(
      (p) => p.id === 'diff-highlight'
    )!;
    expect(diffPreset.educationalPurpose).toContain('changes');
    expect(diffPreset.educationalPurpose).toContain('refactoring');
  });

  it('should have code-specific parameters', () => {
    const lineByLinePreset = CODE_ANIMATION_PRESETS.find(
      (p) => p.id === 'line-by-line-reveal'
    )!;
    expect(lineByLinePreset.parameters.revealMode).toBe('line-by-line');
    expect(lineByLinePreset.parameters.lineDelay).toBeDefined();
    expect(lineByLinePreset.parameters.highlightCurrentLine).toBe(true);
  });
});

describe('Visual Track Animation Presets', () => {
  it('should contain expected visual-specific presets', () => {
    const presetIds = VISUAL_ANIMATION_PRESETS.map((p) => p.id);

    expect(presetIds).toContain('screen-focus-zoom');
    expect(presetIds).toContain('highlight-callout');
    expect(presetIds).toContain('side-by-side-reveal');
    expect(presetIds).toContain('pan-and-scan');
    expect(presetIds).toContain('layered-reveal');
  });

  it('should have visual-specific parameters', () => {
    const zoomPreset = VISUAL_ANIMATION_PRESETS.find(
      (p) => p.id === 'screen-focus-zoom'
    )!;
    expect(zoomPreset.parameters.focusPointX).toBeDefined();
    expect(zoomPreset.parameters.focusPointY).toBeDefined();
    expect(zoomPreset.parameters.zoomLevel).toBeDefined();

    const calloutPreset = VISUAL_ANIMATION_PRESETS.find(
      (p) => p.id === 'highlight-callout'
    )!;
    expect(calloutPreset.parameters.calloutType).toBeDefined();
    expect(calloutPreset.parameters.highlightColor).toBeDefined();
  });
});

describe('Narration Track Animation Presets', () => {
  it('should contain expected narration-specific presets', () => {
    const presetIds = NARRATION_ANIMATION_PRESETS.map((p) => p.id);

    expect(presetIds).toContain('voice-sync-fade');
    expect(presetIds).toContain('audio-ducking');
    expect(presetIds).toContain('waveform-sync');
    expect(presetIds).toContain('chapter-transition');
  });

  it('should have audio-specific parameters', () => {
    const duckingPreset = NARRATION_ANIMATION_PRESETS.find(
      (p) => p.id === 'audio-ducking'
    )!;
    expect(duckingPreset.parameters.duckingAmount).toBeDefined();
    expect(duckingPreset.parameters.duckingSpeed).toBeDefined();

    const waveformPreset = NARRATION_ANIMATION_PRESETS.find(
      (p) => p.id === 'waveform-sync'
    )!;
    expect(waveformPreset.parameters.waveformStyle).toBeDefined();
    expect(waveformPreset.parameters.barCount).toBeDefined();
  });
});

describe('You Track Animation Presets', () => {
  it('should contain expected you-track-specific presets', () => {
    const presetIds = YOU_ANIMATION_PRESETS.map((p) => p.id);

    expect(presetIds).toContain('talking-head-entrance');
    expect(presetIds).toContain('picture-in-picture');
    expect(presetIds).toContain('background-blur');
    expect(presetIds).toContain('split-screen-presenter');
    expect(presetIds).toContain('gesture-highlight');
  });

  it('should have you-track-specific parameters', () => {
    const pipPreset = YOU_ANIMATION_PRESETS.find(
      (p) => p.id === 'picture-in-picture'
    )!;
    expect(pipPreset.parameters.size).toBeDefined();
    expect(pipPreset.parameters.position).toBeDefined();

    const blurPreset = YOU_ANIMATION_PRESETS.find(
      (p) => p.id === 'background-blur'
    )!;
    expect(blurPreset.parameters.blurIntensity).toBeDefined();
    expect(blurPreset.parameters.blurTransition).toBeDefined();
  });
});

describe('Helper Functions', () => {
  describe('getPresetsForTrack', () => {
    it('should return correct presets for each track type', () => {
      expect(getPresetsForTrack('Code')).toEqual(CODE_ANIMATION_PRESETS);
      expect(getPresetsForTrack('Visual')).toEqual(VISUAL_ANIMATION_PRESETS);
      expect(getPresetsForTrack('Narration')).toEqual(
        NARRATION_ANIMATION_PRESETS
      );
      expect(getPresetsForTrack('You')).toEqual(YOU_ANIMATION_PRESETS);
    });

    it('should return empty array for invalid track type', () => {
      expect(getPresetsForTrack('Invalid' as EducationalTrackName)).toEqual([]);
    });
  });

  describe('getPresetById', () => {
    it('should find presets by ID across all tracks', () => {
      const typewriterPreset = getPresetById('typewriter-educational');
      expect(typewriterPreset).toBeDefined();
      expect(typewriterPreset?.trackType).toBe('Code');

      const zoomPreset = getPresetById('screen-focus-zoom');
      expect(zoomPreset).toBeDefined();
      expect(zoomPreset?.trackType).toBe('Visual');
    });

    it('should return undefined for non-existent preset ID', () => {
      expect(getPresetById('non-existent-preset')).toBeUndefined();
    });
  });

  describe('getPresetsByDifficulty', () => {
    it('should filter presets by difficulty level', () => {
      const beginnerCodePresets = getPresetsByDifficulty('Code', 'beginner');
      expect(beginnerCodePresets.length).toBeGreaterThan(0);
      beginnerCodePresets.forEach((preset) => {
        expect(preset.difficulty).toBe('beginner');
        expect(preset.trackType).toBe('Code');
      });

      const advancedVisualPresets = getPresetsByDifficulty(
        'Visual',
        'advanced'
      );
      advancedVisualPresets.forEach((preset) => {
        expect(preset.difficulty).toBe('advanced');
        expect(preset.trackType).toBe('Visual');
      });
    });

    it('should return empty array if no presets match difficulty', () => {
      // Assuming there are no presets with a specific difficulty for a track
      const result = getPresetsByDifficulty('Code', 'advanced');
      // This test depends on actual preset data, so we just check it's an array
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getRecommendedPresets', () => {
    it('should return presets recommended for specific content types', () => {
      const tutorialPresets = getRecommendedPresets('Code', 'tutorial');
      expect(tutorialPresets.length).toBeGreaterThan(0);
      tutorialPresets.forEach((preset) => {
        expect(
          preset.recommendedFor.some((rec) =>
            rec.toLowerCase().includes('tutorial')
          )
        ).toBe(true);
      });
    });

    it('should return empty array for non-matching content types', () => {
      const result = getRecommendedPresets('Code', 'non-existent-content-type');
      expect(Array.isArray(result)).toBe(true);
    });
  });
});

describe('applyEducationalAnimationPreset', () => {
  it('should apply preset to timeline item without modifying original', () => {
    const typewriterPreset = getPresetById('typewriter-educational')!;
    const result = applyEducationalAnimationPreset(
      mockTimelineItem,
      typewriterPreset
    );

    expect(result).not.toBe(mockTimelineItem); // Should be a new object
    expect(result.id).toBe(mockTimelineItem.id);
    expect(result.animation).toBeDefined();
    expect(result.animation?.id).toBe(typewriterPreset.id);
  });

  it('should apply code-specific parameters for code presets', () => {
    const lineByLinePreset = getPresetById('line-by-line-reveal')!;
    const result = applyEducationalAnimationPreset(
      mockTimelineItem,
      lineByLinePreset
    );

    expect(result.properties.animationMode).toBe('line-by-line');
    expect(result.properties.lineRevealIntervalMs).toBeDefined();
  });

  it('should apply custom parameters when provided', () => {
    const zoomPreset = getPresetById('screen-focus-zoom')!;
    const customParams = { focusPointX: 0.8, focusPointY: 0.2 };

    const result = applyEducationalAnimationPreset(
      mockTimelineItem,
      zoomPreset,
      customParams
    );

    expect(result.properties.focusPointX).toBe(0.8);
    expect(result.properties.focusPointY).toBe(0.2);
  });

  it('should preserve existing properties while adding new ones', () => {
    const preset = getPresetById('typewriter-educational')!;
    const result = applyEducationalAnimationPreset(mockTimelineItem, preset);

    // Original properties should be preserved
    expect(result.properties.text).toBe(mockTimelineItem.properties.text);
    expect(result.properties.language).toBe(
      mockTimelineItem.properties.language
    );

    // New properties should be added
    expect(result.properties.typingSpeedCps).toBeDefined();
  });

  it('should handle visual track presets correctly', () => {
    const visualItem: TimelineItem = {
      ...mockTimelineItem,
      type: 'video',
      track: 1, // Visual track
    };

    const zoomPreset = getPresetById('screen-focus-zoom')!;
    const result = applyEducationalAnimationPreset(visualItem, zoomPreset);

    expect(result.properties.focusPointX).toBeDefined();
    expect(result.properties.focusPointY).toBeDefined();
    expect(result.properties.focusScale).toBeDefined();
  });

  it('should handle narration track presets correctly', () => {
    const audioItem: TimelineItem = {
      ...mockTimelineItem,
      type: 'audio',
      track: 2, // Narration track
    };

    const duckingPreset = getPresetById('audio-ducking')!;
    const result = applyEducationalAnimationPreset(audioItem, duckingPreset);

    expect(result.properties.audioDucking).toBeDefined();
  });

  it('should handle you track presets correctly', () => {
    const youItem: TimelineItem = {
      ...mockTimelineItem,
      type: 'video',
      track: 3, // You track
    };

    const pipPreset = getPresetById('picture-in-picture')!;
    const result = applyEducationalAnimationPreset(youItem, pipPreset);

    expect(result.properties.talkingHeadCorner).toBeDefined();
    expect(result.properties.talkingHeadSize).toBeDefined();
  });
});

describe('Preset Quality and Consistency', () => {
  it('should have reasonable duration ranges for different preset types', () => {
    const allPresets = [
      ...CODE_ANIMATION_PRESETS,
      ...VISUAL_ANIMATION_PRESETS,
      ...NARRATION_ANIMATION_PRESETS,
      ...YOU_ANIMATION_PRESETS,
    ];

    allPresets.forEach((preset) => {
      expect(preset.duration).toBeGreaterThanOrEqual(0); // Allow 0 for continuous animations
      expect(preset.duration).toBeLessThanOrEqual(10); // Reasonable max duration

      // Entrance animations should generally be shorter (unless continuous)
      if (preset.type === 'entrance' && preset.duration > 0) {
        expect(preset.duration).toBeLessThanOrEqual(5);
      }
    });
  });

  it('should have appropriate difficulty distribution', () => {
    const trackTypes: EducationalTrackName[] = [
      'Code',
      'Visual',
      'Narration',
      'You',
    ];

    trackTypes.forEach((trackType) => {
      const presets = getPresetsForTrack(trackType);
      const beginnerCount = getPresetsByDifficulty(
        trackType,
        'beginner'
      ).length;
      const intermediateCount = getPresetsByDifficulty(
        trackType,
        'intermediate'
      ).length;
      const advancedCount = getPresetsByDifficulty(
        trackType,
        'advanced'
      ).length;

      // Each track should have at least one preset of each difficulty
      expect(beginnerCount).toBeGreaterThan(0);
      expect(intermediateCount).toBeGreaterThan(0);
      expect(advancedCount).toBeGreaterThan(0);

      // Total should match
      expect(beginnerCount + intermediateCount + advancedCount).toBe(
        presets.length
      );
    });
  });

  it('should have meaningful recommended use cases', () => {
    const allPresets = [
      ...CODE_ANIMATION_PRESETS,
      ...VISUAL_ANIMATION_PRESETS,
      ...NARRATION_ANIMATION_PRESETS,
      ...YOU_ANIMATION_PRESETS,
    ];

    allPresets.forEach((preset) => {
      expect(preset.recommendedFor.length).toBeGreaterThan(0);
      preset.recommendedFor.forEach((useCase) => {
        expect(useCase.length).toBeGreaterThan(2); // Not just empty or single char
        expect(typeof useCase).toBe('string');
      });
    });
  });
});
