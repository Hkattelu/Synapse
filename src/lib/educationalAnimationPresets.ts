// Educational animation presets for each track type
// Implements track-specific animation collections and application logic

import type { AnimationPreset, TimelineItem, ItemProperties } from './types';
import type { EducationalTrack, EducationalTrackName } from './educationalTypes';

// Extended animation preset with educational metadata
export interface EducationalAnimationPreset extends AnimationPreset {
  trackType: EducationalTrackName;
  educationalPurpose: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  recommendedFor: string[];
  previewDescription: string;
}

// Code track animation presets
export const CODE_ANIMATION_PRESETS: EducationalAnimationPreset[] = [
  {
    id: 'typewriter-educational',
    name: 'Typewriter (Educational)',
    type: 'entrance',
    trackType: 'Code',
    educationalPurpose: 'Perfect for beginners - shows code being written character by character',
    difficulty: 'beginner',
    recommendedFor: ['tutorials', 'step-by-step guides', 'live coding'],
    previewDescription: 'Code appears as if being typed in real-time',
    parameters: {
      textReveal: true,
      showCursor: true,
      typingSpeed: 'educational', // Slower than normal
      pauseAtLines: true,
    },
    duration: 3.0,
    easing: 'linear',
  },
  {
    id: 'line-by-line-reveal',
    name: 'Line by Line Reveal',
    type: 'entrance',
    trackType: 'Code',
    educationalPurpose: 'Great for step-by-step explanations - reveals one line at a time',
    difficulty: 'beginner',
    recommendedFor: ['explanations', 'code walkthroughs', 'debugging'],
    previewDescription: 'Each line of code appears sequentially with pause',
    parameters: {
      revealMode: 'line-by-line',
      lineDelay: 800, // ms between lines
      highlightCurrentLine: true,
      fadeInEffect: true,
    },
    duration: 2.5,
    easing: 'easeOut',
  },
  {
    id: 'diff-highlight',
    name: 'Diff Highlighting',
    type: 'emphasis',
    trackType: 'Code',
    educationalPurpose: 'Ideal for showing code changes and refactoring',
    difficulty: 'intermediate',
    recommendedFor: ['refactoring', 'code reviews', 'before/after comparisons'],
    previewDescription: 'Highlights changes with green/red indicators',
    parameters: {
      diffMode: true,
      addedLineColor: '#22C55E',
      removedLineColor: '#EF4444',
      animateChanges: true,
      showLineNumbers: true,
    },
    duration: 2.0,
    easing: 'easeInOut',
  },
  {
    id: 'syntax-highlight-wave',
    name: 'Syntax Highlight Wave',
    type: 'emphasis',
    trackType: 'Code',
    educationalPurpose: 'Draws attention to syntax elements progressively',
    difficulty: 'intermediate',
    recommendedFor: ['syntax explanations', 'language features', 'code structure'],
    previewDescription: 'Syntax highlighting appears in waves across the code',
    parameters: {
      waveEffect: true,
      highlightDelay: 200, // ms between syntax elements
      colorIntensity: 1.2,
      resetAfter: true,
    },
    duration: 3.5,
    easing: 'easeInOut',
  },
  {
    id: 'focus-block',
    name: 'Focus Block',
    type: 'emphasis',
    trackType: 'Code',
    educationalPurpose: 'Highlights specific code blocks while dimming others',
    difficulty: 'advanced',
    recommendedFor: ['complex explanations', 'function focus', 'scope demonstration'],
    previewDescription: 'Dims surrounding code while highlighting target block',
    parameters: {
      focusMode: 'block',
      dimOpacity: 0.3,
      focusScale: 1.05,
      borderHighlight: true,
      borderColor: '#8B5CF6',
    },
    duration: 2.0,
    easing: 'easeOut',
  },
];

// Visual track animation presets
export const VISUAL_ANIMATION_PRESETS: EducationalAnimationPreset[] = [
  {
    id: 'screen-focus-zoom',
    name: 'Screen Focus Zoom',
    type: 'emphasis',
    trackType: 'Visual',
    educationalPurpose: 'Zooms into important areas of screen recordings',
    difficulty: 'beginner',
    recommendedFor: ['screen recordings', 'UI demonstrations', 'software tutorials'],
    previewDescription: 'Smoothly zooms into specified area of the screen',
    parameters: {
      focusPointX: 0.5,
      focusPointY: 0.5,
      zoomLevel: 1.8,
      transitionDuration: 1.2,
      maintainAspectRatio: true,
    },
    duration: 4.0,
    easing: 'easeInOut',
  },
  {
    id: 'highlight-callout',
    name: 'Highlight Callout',
    type: 'emphasis',
    trackType: 'Visual',
    educationalPurpose: 'Adds visual callouts to draw attention to UI elements',
    difficulty: 'beginner',
    recommendedFor: ['UI tours', 'feature highlights', 'click demonstrations'],
    previewDescription: 'Animated highlight box with optional arrow pointer',
    parameters: {
      calloutType: 'box',
      highlightColor: '#F59E0B',
      strokeWidth: 3,
      pulseEffect: true,
      showArrow: true,
      arrowDirection: 'top',
    },
    duration: 3.0,
    easing: 'bounce',
  },
  {
    id: 'side-by-side-reveal',
    name: 'Side-by-Side Reveal',
    type: 'entrance',
    trackType: 'Visual',
    educationalPurpose: 'Perfect for comparing before/after or showing parallel content',
    difficulty: 'intermediate',
    recommendedFor: ['comparisons', 'parallel workflows', 'split demonstrations'],
    previewDescription: 'Content slides in from sides to create split view',
    parameters: {
      splitDirection: 'vertical',
      leftContent: 'slide-in-left',
      rightContent: 'slide-in-right',
      splitRatio: 0.5,
      gap: 16,
    },
    duration: 2.5,
    easing: 'easeOut',
  },
  {
    id: 'pan-and-scan',
    name: 'Pan and Scan',
    type: 'emphasis',
    trackType: 'Visual',
    educationalPurpose: 'Smoothly pans across large content to show different areas',
    difficulty: 'intermediate',
    recommendedFor: ['large screenshots', 'wide layouts', 'detailed exploration'],
    previewDescription: 'Camera pans smoothly across the content',
    parameters: {
      panDirection: 'left-to-right',
      panDistance: 0.4,
      pausePoints: [0.25, 0.75], // Pause at 25% and 75%
      pauseDuration: 1.0,
      speed: 'medium',
    },
    duration: 6.0,
    easing: 'linear',
  },
  {
    id: 'layered-reveal',
    name: 'Layered Reveal',
    type: 'entrance',
    trackType: 'Visual',
    educationalPurpose: 'Reveals content in layers for complex explanations',
    difficulty: 'advanced',
    recommendedFor: ['complex diagrams', 'layered explanations', 'progressive disclosure'],
    previewDescription: 'Content appears in sequential layers with smooth transitions',
    parameters: {
      layerCount: 3,
      layerDelay: 800,
      revealDirection: 'bottom-up',
      fadeInEffect: true,
      scaleEffect: 0.95,
    },
    duration: 4.0,
    easing: 'easeOut',
  },
];

// Narration track animation presets
export const NARRATION_ANIMATION_PRESETS: EducationalAnimationPreset[] = [
  {
    id: 'voice-sync-fade',
    name: 'Voice Sync Fade',
    type: 'entrance',
    trackType: 'Narration',
    educationalPurpose: 'Fades in audio synchronized with voice detection',
    difficulty: 'beginner',
    recommendedFor: ['voiceovers', 'narration', 'audio explanations'],
    previewDescription: 'Audio fades in smoothly when voice is detected',
    parameters: {
      voiceDetection: true,
      fadeInDuration: 0.5,
      volumeThreshold: 0.1,
      smoothing: true,
    },
    duration: 1.0,
    easing: 'easeOut',
  },
  {
    id: 'audio-ducking',
    name: 'Smart Audio Ducking',
    type: 'emphasis',
    trackType: 'Narration',
    educationalPurpose: 'Automatically reduces background music when voice is present',
    difficulty: 'intermediate',
    recommendedFor: ['background music', 'mixed audio', 'professional narration'],
    previewDescription: 'Background audio ducks down during speech',
    parameters: {
      duckingAmount: 0.3, // Reduce to 30% volume
      duckingSpeed: 'fast',
      releaseSpeed: 'slow',
      voiceSensitivity: 0.15,
    },
    duration: 0.5,
    easing: 'easeInOut',
  },
  {
    id: 'waveform-sync',
    name: 'Waveform Sync Animation',
    type: 'emphasis',
    trackType: 'Narration',
    educationalPurpose: 'Visual waveform that syncs with audio for engagement',
    difficulty: 'intermediate',
    recommendedFor: ['audio visualization', 'music content', 'rhythm demonstration'],
    previewDescription: 'Animated waveform visualization synced to audio',
    parameters: {
      waveformStyle: 'bars',
      colorScheme: 'gradient',
      sensitivity: 0.8,
      smoothing: 0.7,
      barCount: 32,
    },
    duration: 0.0, // Continuous
    easing: 'linear',
  },
  {
    id: 'chapter-transition',
    name: 'Chapter Transition',
    type: 'transition',
    trackType: 'Narration',
    educationalPurpose: 'Smooth transitions between different audio segments',
    difficulty: 'advanced',
    recommendedFor: ['chapter breaks', 'topic transitions', 'structured content'],
    previewDescription: 'Crossfades between audio segments with optional silence',
    parameters: {
      crossfadeDuration: 1.5,
      silenceGap: 0.5,
      volumeCurve: 'logarithmic',
      addChapterTone: false,
    },
    duration: 2.0,
    easing: 'easeInOut',
  },
];

// You track animation presets
export const YOU_ANIMATION_PRESETS: EducationalAnimationPreset[] = [
  {
    id: 'talking-head-entrance',
    name: 'Talking Head Entrance',
    type: 'entrance',
    trackType: 'You',
    educationalPurpose: 'Professional entrance for personal video content',
    difficulty: 'beginner',
    recommendedFor: ['introductions', 'personal commentary', 'instructor presence'],
    previewDescription: 'Smooth fade-in with subtle scale animation',
    parameters: {
      fadeInDuration: 1.0,
      scaleFrom: 0.95,
      scaleTo: 1.0,
      position: 'bottom-right',
      borderRadius: 12,
    },
    duration: 1.5,
    easing: 'easeOut',
  },
  {
    id: 'picture-in-picture',
    name: 'Picture-in-Picture',
    type: 'emphasis',
    trackType: 'You',
    educationalPurpose: 'Positions personal video as overlay while maintaining focus on content',
    difficulty: 'beginner',
    recommendedFor: ['screen sharing', 'content overlay', 'presenter mode'],
    previewDescription: 'Resizes and positions video as floating overlay',
    parameters: {
      size: 'medium', // small, medium, large
      position: 'bottom-right',
      opacity: 0.95,
      borderStyle: 'subtle',
      shadowEffect: true,
    },
    duration: 1.0,
    easing: 'easeInOut',
  },
  {
    id: 'background-blur',
    name: 'Background Blur Effect',
    type: 'emphasis',
    trackType: 'You',
    educationalPurpose: 'Blurs background to focus attention on the speaker',
    difficulty: 'intermediate',
    recommendedFor: ['professional presentation', 'focus enhancement', 'background cleanup'],
    previewDescription: 'Gradually blurs background while keeping speaker in focus',
    parameters: {
      blurIntensity: 8, // pixels
      blurTransition: 1.5, // seconds
      edgeFeathering: true,
      maintainLighting: true,
    },
    duration: 2.0,
    easing: 'easeInOut',
  },
  {
    id: 'split-screen-presenter',
    name: 'Split Screen Presenter',
    type: 'emphasis',
    trackType: 'You',
    educationalPurpose: 'Creates professional split-screen layout with presenter and content',
    difficulty: 'advanced',
    recommendedFor: ['presentations', 'teaching', 'professional content'],
    previewDescription: 'Arranges presenter and content in split-screen layout',
    parameters: {
      splitRatio: 0.3, // 30% presenter, 70% content
      splitDirection: 'vertical',
      presenterSide: 'left',
      transitionStyle: 'slide',
      borderBetween: true,
    },
    duration: 2.5,
    easing: 'easeOut',
  },
  {
    id: 'gesture-highlight',
    name: 'Gesture Highlighting',
    type: 'emphasis',
    trackType: 'You',
    educationalPurpose: 'Highlights hand gestures and movements for emphasis',
    difficulty: 'advanced',
    recommendedFor: ['gesture-based teaching', 'sign language', 'physical demonstrations'],
    previewDescription: 'Adds subtle highlights to hand movements and gestures',
    parameters: {
      gestureDetection: true,
      highlightColor: '#F59E0B',
      highlightIntensity: 0.6,
      trailEffect: true,
      sensitivity: 0.7,
    },
    duration: 0.0, // Continuous
    easing: 'linear',
  },
];

// Combined presets collection
export const EDUCATIONAL_ANIMATION_PRESETS = {
  Code: CODE_ANIMATION_PRESETS,
  Visual: VISUAL_ANIMATION_PRESETS,
  Narration: NARRATION_ANIMATION_PRESETS,
  You: YOU_ANIMATION_PRESETS,
};

// Helper functions for educational animation presets
export function getPresetsForTrack(trackType: EducationalTrackName): EducationalAnimationPreset[] {
  return EDUCATIONAL_ANIMATION_PRESETS[trackType] || [];
}

export function getPresetById(id: string): EducationalAnimationPreset | undefined {
  for (const presets of Object.values(EDUCATIONAL_ANIMATION_PRESETS)) {
    const preset = presets.find(p => p.id === id);
    if (preset) return preset;
  }
  return undefined;
}

export function getPresetsByDifficulty(
  trackType: EducationalTrackName,
  difficulty: 'beginner' | 'intermediate' | 'advanced'
): EducationalAnimationPreset[] {
  return getPresetsForTrack(trackType).filter(preset => preset.difficulty === difficulty);
}

export function getRecommendedPresets(
  trackType: EducationalTrackName,
  contentType: string
): EducationalAnimationPreset[] {
  return getPresetsForTrack(trackType).filter(preset =>
    preset.recommendedFor.some(rec => rec.toLowerCase().includes(contentType.toLowerCase()))
  );
}

// Apply educational animation preset to timeline item
export function applyEducationalAnimationPreset(
  item: TimelineItem,
  preset: EducationalAnimationPreset,
  customParameters?: Record<string, unknown>
): TimelineItem {
  const updatedProperties: Partial<ItemProperties> = {
    ...item.properties,
  };

  // Apply preset-specific parameters
  const parameters = { ...preset.parameters, ...customParameters };

  // Track-specific parameter application
  switch (preset.trackType) {
    case 'Code':
      applyCodePresetParameters(updatedProperties, parameters);
      break;
    case 'Visual':
      applyVisualPresetParameters(updatedProperties, parameters);
      break;
    case 'Narration':
      applyNarrationPresetParameters(updatedProperties, parameters);
      break;
    case 'You':
      applyYouPresetParameters(updatedProperties, parameters);
      break;
  }

  return {
    ...item,
    properties: updatedProperties as ItemProperties,
    animation: {
      id: preset.id,
      name: preset.name,
      type: preset.type,
      duration: preset.duration,
      easing: preset.easing,
      parameters: parameters,
    },
  };
}

// Track-specific parameter application functions
function applyCodePresetParameters(
  properties: Partial<ItemProperties>,
  parameters: Record<string, unknown>
): void {
  if (parameters.typingSpeed === 'educational') {
    properties.typingSpeedCps = 15; // Slower for educational content
  }
  if (parameters.highlightCurrentLine) {
    properties.highlightCurrentLine = true;
  }
  if (parameters.diffMode) {
    properties.animationMode = 'diff';
  }
  if (parameters.revealMode === 'line-by-line') {
    properties.animationMode = 'line-by-line';
    properties.lineRevealIntervalMs = parameters.lineDelay as number || 800;
  }
  if (parameters.focusMode === 'block') {
    properties.focusMode = 'block';
    properties.dimOpacity = parameters.dimOpacity as number || 0.3;
  }
}

function applyVisualPresetParameters(
  properties: Partial<ItemProperties>,
  parameters: Record<string, unknown>
): void {
  if (parameters.focusPointX !== undefined) {
    properties.focusPointX = parameters.focusPointX as number;
  }
  if (parameters.focusPointY !== undefined) {
    properties.focusPointY = parameters.focusPointY as number;
  }
  if (parameters.zoomLevel !== undefined) {
    properties.focusScale = parameters.zoomLevel as number;
  }
  if (parameters.highlightColor) {
    properties.strokeColor = parameters.highlightColor as string;
  }
  if (parameters.calloutType) {
    properties.visualAssetType = parameters.calloutType as any;
  }
}

function applyNarrationPresetParameters(
  properties: Partial<ItemProperties>,
  parameters: Record<string, unknown>
): void {
  if (parameters.duckingAmount !== undefined) {
    properties.audioDucking = parameters.duckingAmount as number;
  }
  if (parameters.fadeInDuration !== undefined) {
    properties.audioFadeIn = parameters.fadeInDuration as number;
  }
  if (parameters.waveformStyle) {
    properties.showWaveform = true;
    properties.waveformStyle = parameters.waveformStyle as string;
  }
}

function applyYouPresetParameters(
  properties: Partial<ItemProperties>,
  parameters: Record<string, unknown>
): void {
  if (parameters.position) {
    properties.talkingHeadCorner = parameters.position as any;
  }
  if (parameters.size) {
    properties.talkingHeadSize = parameters.size as any;
  }
  if (parameters.blurIntensity !== undefined) {
    properties.backgroundBlur = parameters.blurIntensity as number;
  }
  if (parameters.splitRatio !== undefined) {
    properties.splitScreenRatio = parameters.splitRatio as number;
  }
}