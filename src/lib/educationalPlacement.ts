// Smart content placement system for educational tracks
// Analyzes MediaAsset properties and suggests appropriate track placement

import type { MediaAsset, TimelineItem, TimelineItemType } from './types';
import type { 
  EducationalTrack, 
  PlacementSuggestion,
  EducationalTrackName 
} from './educationalTypes';
import { 
  EDUCATIONAL_TRACKS, 
  getEducationalTrackById, 
  getEducationalTrackByName,
  getEducationalTrackByNumber,
  isContentTypeAllowed 
} from './educationalTypes';

// Content type mapping with confidence scoring
interface ContentTypeMapping {
  contentType: TimelineItemType;
  primaryTrack: EducationalTrackName;
  confidence: number;
  alternatives: Array<{
    track: EducationalTrackName;
    confidence: number;
    reason: string;
  }>;
}

// Content analysis patterns for enhanced placement suggestions
interface ContentAnalysisPattern {
  pattern: RegExp | ((asset: MediaAsset) => boolean);
  trackPreference: EducationalTrackName;
  confidence: number;
  reason: string;
}

// Base content type to track mappings
const CONTENT_TYPE_MAPPINGS: ContentTypeMapping[] = [
  {
    contentType: 'code',
    primaryTrack: 'Code',
    confidence: 0.95,
    alternatives: [
      { track: 'Visual', confidence: 0.3, reason: 'Code can be displayed as visual content' }
    ]
  },
  {
    contentType: 'audio',
    primaryTrack: 'Narration',
    confidence: 0.9,
    alternatives: []
  },
  {
    contentType: 'video',
    primaryTrack: 'Visual',
    confidence: 0.7,
    alternatives: [
      { track: 'You', confidence: 0.8, reason: 'Personal video content works better on You track' }
    ]
  },
  // Images map to video timeline items in editor
  {
    contentType: 'video',
    primaryTrack: 'Visual',
    confidence: 0.7,
    alternatives: []
  },
  {
    contentType: 'visual-asset',
    primaryTrack: 'Visual',
    confidence: 0.85,
    alternatives: []
  },
  {
    contentType: 'title',
    primaryTrack: 'Visual',
    confidence: 0.8,
    alternatives: []
  }
];

// Advanced content analysis patterns for more intelligent suggestions
const CONTENT_ANALYSIS_PATTERNS: ContentAnalysisPattern[] = [
  // Screen recording detection
  {
    pattern: (asset: MediaAsset) => 
      asset.type === 'video' && 
      asset.name.toLowerCase().includes('screen') ||
      asset.name.toLowerCase().includes('recording') ||
      asset.name.toLowerCase().includes('demo'),
    trackPreference: 'Visual',
    confidence: 0.9,
    reason: 'Screen recording content is best suited for Visual track'
  },
  
  // Talking head video detection
  {
    pattern: (asset: MediaAsset) => 
      asset.type === 'video' && (
        asset.name.toLowerCase().includes('talking') ||
        asset.name.toLowerCase().includes('head') ||
        asset.name.toLowerCase().includes('presenter') ||
        asset.name.toLowerCase().includes('webcam') ||
        asset.name.toLowerCase().includes('camera')
      ),
    trackPreference: 'You',
    confidence: 0.95,
    reason: 'Personal video content should be placed on You track'
  },

  // Code file detection by extension
  {
    pattern: (asset: MediaAsset) => {
      const codeExtensions = ['.js', '.ts', '.py', '.java', '.cpp', '.c', '.html', '.css', '.jsx', '.tsx', '.vue', '.php', '.rb', '.go', '.rs', '.swift', '.kt'];
      return asset.type === 'code' || codeExtensions.some(ext => asset.name.toLowerCase().endsWith(ext));
    },
    trackPreference: 'Code',
    confidence: 0.95,
    reason: 'Code files should be placed on Code track for syntax highlighting'
  },

  // Audio content detection
  {
    pattern: (asset: MediaAsset) => 
      asset.type === 'audio' || 
      asset.metadata.mimeType?.startsWith('audio/') ||
      ['.mp3', '.wav', '.ogg', '.m4a', '.aac'].some(ext => asset.name.toLowerCase().endsWith(ext)),
    trackPreference: 'Narration',
    confidence: 0.9,
    reason: 'Audio content belongs on Narration track'
  },

  // Voiceover detection
  {
    pattern: (asset: MediaAsset) => 
      asset.type === 'audio' && (
        asset.name.toLowerCase().includes('voice') ||
        asset.name.toLowerCase().includes('narration') ||
        asset.name.toLowerCase().includes('commentary') ||
        asset.name.toLowerCase().includes('explanation')
      ),
    trackPreference: 'Narration',
    confidence: 0.95,
    reason: 'Voiceover content is perfect for Narration track'
  },

  // Background music detection
  {
    pattern: (asset: MediaAsset) => 
      asset.type === 'audio' && (
        asset.name.toLowerCase().includes('music') ||
        asset.name.toLowerCase().includes('background') ||
        asset.name.toLowerCase().includes('bgm') ||
        asset.name.toLowerCase().includes('ambient')
      ),
    trackPreference: 'Narration',
    confidence: 0.8,
    reason: 'Background music should be managed on Narration track'
  },

  // Educational diagram/visual aid detection
  {
    pattern: (asset: MediaAsset) => 
      (asset.type === 'image' || asset.type === 'visual-asset') && (
        asset.name.toLowerCase().includes('diagram') ||
        asset.name.toLowerCase().includes('chart') ||
        asset.name.toLowerCase().includes('graph') ||
        asset.name.toLowerCase().includes('illustration') ||
        asset.name.toLowerCase().includes('visual')
      ),
    trackPreference: 'Visual',
    confidence: 0.9,
    reason: 'Educational diagrams and visual aids belong on Visual track'
  }
];

/**
 * Analyzes a MediaAsset and suggests the most appropriate educational track placement
 * @param asset - The media asset to analyze
 * @param context - Optional context about the current timeline state
 * @returns PlacementSuggestion with recommended track and alternatives
 */
export function suggestTrackPlacement(
  asset: MediaAsset,
  context?: {
    existingItems?: TimelineItem[];
    currentTime?: number;
    selectedTrack?: number;
  }
): PlacementSuggestion {
  // Start with base content type mapping
  const effectiveType: TimelineItemType = asset.type === 'image' ? 'video' : (asset.type as TimelineItemType);
  const baseMapping = CONTENT_TYPE_MAPPINGS.find(mapping => 
    mapping.contentType === effectiveType
  );

  if (!baseMapping) {
    // Fallback to Visual track for unknown content types
    const fallbackTrack = getEducationalTrackByName('Visual')!;
    return {
      suggestedTrack: fallbackTrack,
      confidence: 0.5,
      reason: 'Unknown content type, defaulting to Visual track',
      alternatives: EDUCATIONAL_TRACKS.filter(track => track.id !== fallbackTrack.id)
    };
  }

  // Apply advanced content analysis patterns
  let bestSuggestion = {
    track: baseMapping.primaryTrack,
    confidence: baseMapping.confidence,
    reason: `${asset.type} content typically belongs on ${baseMapping.primaryTrack} track`
  };

  // Check each analysis pattern
  for (const pattern of CONTENT_ANALYSIS_PATTERNS) {
    const matches = typeof pattern.pattern === 'function' 
      ? pattern.pattern(asset)
      : pattern.pattern.test(asset.name);

    if (matches && pattern.confidence > bestSuggestion.confidence) {
      bestSuggestion = {
        track: pattern.trackPreference,
        confidence: pattern.confidence,
        reason: pattern.reason
      };
    }
  }

  // Apply contextual adjustments
  if (context) {
    bestSuggestion = applyContextualAdjustments(asset, bestSuggestion, context);
  }

  const suggestedTrack = getEducationalTrackByName(bestSuggestion.track)!;
  
  // Build alternatives list
  const alternatives = buildAlternativesList(asset, suggestedTrack, baseMapping);

  return {
    suggestedTrack,
    confidence: bestSuggestion.confidence,
    reason: bestSuggestion.reason,
    alternatives
  };
}

/**
 * Applies contextual adjustments based on timeline state
 */
function applyContextualAdjustments(
  asset: MediaAsset,
  suggestion: { track: EducationalTrackName; confidence: number; reason: string },
  context: {
    existingItems?: TimelineItem[];
    currentTime?: number;
    selectedTrack?: number;
  }
): { track: EducationalTrackName; confidence: number; reason: string } {
  let adjustedSuggestion = { ...suggestion };
  const effectiveType: TimelineItemType = asset.type === 'image' ? 'video' : (asset.type as TimelineItemType);

  // If user has a track selected and it's compatible, boost confidence
  if (context.selectedTrack !== undefined) {
    const selectedEducationalTrack = getEducationalTrackByNumber(context.selectedTrack);
    if (selectedEducationalTrack && isContentTypeAllowed(selectedEducationalTrack, effectiveType)) {
      // Boost confidence for user's selected track if it's compatible
      if (selectedEducationalTrack.name === suggestion.track) {
        adjustedSuggestion.confidence = Math.min(0.98, adjustedSuggestion.confidence + 0.1);
        adjustedSuggestion.reason += ' (matches selected track)';
      }
    }
  }

  // Analyze existing content for pattern detection
  if (context.existingItems && context.existingItems.length > 0) {
    const recentItems = context.existingItems
      .filter(item => context.currentTime ? 
        Math.abs(item.startTime - context.currentTime) < 30 : true)
      .slice(-3); // Look at last 3 items

    // If there's a pattern of similar content types, maintain consistency
    const trackUsagePattern = recentItems.reduce((acc, item) => {
      const track = getEducationalTrackByNumber(item.track);
      if (track) {
        acc[track.name] = (acc[track.name] || 0) + 1;
      }
      return acc;
    }, {} as Record<EducationalTrackName, number>);

    const mostUsedTrack = Object.entries(trackUsagePattern)
      .sort(([,a], [,b]) => b - a)[0];

    if (mostUsedTrack && mostUsedTrack[1] >= 2) {
      const [trackName, count] = mostUsedTrack;
      const track = getEducationalTrackByName(trackName as EducationalTrackName);
      
      if (track && isContentTypeAllowed(track, effectiveType)) {
        adjustedSuggestion.track = trackName as EducationalTrackName;
        adjustedSuggestion.confidence = Math.min(0.9, adjustedSuggestion.confidence + 0.15);
        adjustedSuggestion.reason = `Maintaining consistency with recent ${trackName} track usage`;
      }
    }
  }

  return adjustedSuggestion;
}

/**
 * Builds a list of alternative track suggestions
 */
function buildAlternativesList(
  asset: MediaAsset,
  suggestedTrack: EducationalTrack,
  baseMapping: ContentTypeMapping
): EducationalTrack[] {
  const alternatives: EducationalTrack[] = [];
  const effectiveType: TimelineItemType = asset.type === 'image' ? 'video' : (asset.type as TimelineItemType);

  // Add base mapping alternatives
  for (const alt of baseMapping.alternatives) {
    const track = getEducationalTrackByName(alt.track);
    if (track && track.id !== suggestedTrack.id) {
      alternatives.push(track);
    }
  }

  // Add any other compatible tracks not already included
  for (const track of EDUCATIONAL_TRACKS) {
    if (track.id !== suggestedTrack.id && 
        !alternatives.find(alt => alt.id === track.id) &&
        isContentTypeAllowed(track, effectiveType)) {
      alternatives.push(track);
    }
  }

  // Sort alternatives by how well they match the content type
  return alternatives.sort((a, b) => {
    const aScore = getTrackCompatibilityScore(asset, a);
    const bScore = getTrackCompatibilityScore(asset, b);
    return bScore - aScore;
  });
}

/**
 * Calculates a compatibility score between an asset and a track
 */
function getTrackCompatibilityScore(asset: MediaAsset, track: EducationalTrack): number {
  let score = 0;
  const effectiveType: TimelineItemType = asset.type === 'image' ? 'video' : (asset.type as TimelineItemType);

  // Base compatibility from allowed content types
  if (isContentTypeAllowed(track, effectiveType)) {
    score += 0.5;
  }

  // Bonus for specific content patterns
  switch (track.name) {
    case 'Code':
      if (asset.type === 'code' || asset.metadata.language) {
        score += 0.4;
      }
      break;
    case 'Visual':
      if (asset.type === 'video' || asset.type === 'visual-asset') {
        score += 0.3;
      }
      if (asset.name.toLowerCase().includes('screen')) {
        score += 0.2;
      }
      break;
    case 'Narration':
      if (asset.type === 'audio') {
        score += 0.4;
      }
      if (asset.name.toLowerCase().includes('voice') || 
          asset.name.toLowerCase().includes('narration')) {
        score += 0.2;
      }
      break;
    case 'You':
      if (asset.type === 'video' && (
          asset.name.toLowerCase().includes('talking') ||
          asset.name.toLowerCase().includes('presenter') ||
          asset.name.toLowerCase().includes('webcam')
      )) {
        score += 0.4;
      }
      break;
  }

  return score;
}

/**
 * Validates if a placement suggestion is appropriate
 * @param asset - The media asset
 * @param targetTrack - The target educational track
 * @returns Validation result with any warnings or conflicts
 */
export function validateTrackPlacement(
  asset: MediaAsset,
  targetTrack: EducationalTrack
): {
  isValid: boolean;
  warnings: string[];
  conflicts: string[];
  suggestion?: PlacementSuggestion;
} {
  const warnings: string[] = [];
  const conflicts: string[] = [];
  let isValid = true;

  // Check if content type is allowed on the target track
  const effectiveType: TimelineItemType = asset.type === 'image' ? 'video' : (asset.type as TimelineItemType);
  if (!isContentTypeAllowed(targetTrack, effectiveType)) {
    isValid = false;
    conflicts.push(
      `${asset.type} content is not typically placed on ${targetTrack.name} track`
    );
  }

  // Get the optimal suggestion for comparison
  const optimalSuggestion = suggestTrackPlacement(asset);
  
  // Warn if placing on a suboptimal track
  if (targetTrack.id !== optimalSuggestion.suggestedTrack.id) {
    warnings.push(
      `Consider placing this ${asset.type} content on ${optimalSuggestion.suggestedTrack.name} track instead. ${optimalSuggestion.reason}`
    );
  }

  // Check for specific content type warnings
  if (asset.type === 'video' && targetTrack.name === 'Code') {
    warnings.push('Video content on Code track may not display syntax highlighting properly');
  }

  if (asset.type === 'audio' && targetTrack.name !== 'Narration') {
    warnings.push('Audio content works best on Narration track for proper mixing and controls');
  }

  return {
    isValid,
    warnings,
    conflicts,
    suggestion: isValid ? undefined : optimalSuggestion
  };
}

/**
 * Analyzes multiple assets and provides batch placement suggestions
 * @param assets - Array of media assets to analyze
 * @param context - Optional context about the current timeline state
 * @returns Array of placement suggestions for each asset
 */
export function suggestBatchTrackPlacement(
  assets: MediaAsset[],
  context?: {
    existingItems?: TimelineItem[];
    currentTime?: number;
    selectedTrack?: number;
  }
): PlacementSuggestion[] {
  return assets.map(asset => suggestTrackPlacement(asset, context));
}

/**
 * Gets content type statistics for educational track usage analysis
 * @param items - Timeline items to analyze
 * @returns Statistics about content distribution across tracks
 */
export function getTrackUsageStatistics(items: TimelineItem[]): {
  trackUsage: Record<EducationalTrackName, number>;
  contentTypeDistribution: Record<string, Record<EducationalTrackName, number>>;
  totalItems: number;
} {
  const trackUsage: Record<EducationalTrackName, number> = {
    'Code': 0,
    'Visual': 0,
    'Narration': 0,
    'You': 0
  };

  const contentTypeDistribution: Record<string, Record<EducationalTrackName, number>> = {};
  
  for (const item of items) {
    const track = getEducationalTrackByNumber(item.track);
    if (track) {
      trackUsage[track.name]++;
      
      if (!contentTypeDistribution[item.type]) {
        contentTypeDistribution[item.type] = {
          'Code': 0,
          'Visual': 0,
          'Narration': 0,
          'You': 0
        };
      }
      contentTypeDistribution[item.type][track.name]++;
    }
  }

  return {
    trackUsage,
    contentTypeDistribution,
    totalItems: items.length
  };
}