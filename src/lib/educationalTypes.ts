// Educational track system types for Synapse Studio

import type { TimelineItem, ItemProperties, TimelineItemType } from './types';

// Educational track types
export type EducationalTrackName = 'Code' | 'Visual' | 'Narration' | 'You';

export interface EducationalTrack {
  id: string;
  name: EducationalTrackName;
  trackNumber: number; // Maps to existing track system (0-3)
  color: string;
  icon: string;
  defaultProperties: Partial<ItemProperties>;
  allowedContentTypes: TimelineItemType[];
  suggestedAnimations: string[];
}

// Educational metadata for timeline items
export interface EducationalMetadata {
  contentPurpose: 'demonstration' | 'explanation' | 'narration' | 'personal';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
}

// Extended timeline item with educational metadata
export interface EducationalTimelineItem extends TimelineItem {
  educationalTrack?: string; // Maps to EducationalTrack.id
  suggestedTrack?: string; // For migration conflicts
  educationalMetadata?: EducationalMetadata;
}

// Smart content placement types
export interface PlacementSuggestion {
  suggestedTrack: EducationalTrack;
  confidence: number;
  reason: string;
  alternatives: EducationalTrack[];
}

// UI mode system
export interface UIMode {
  mode: 'simplified' | 'advanced';
  showTrackLabels: boolean;
  showAdvancedControls: boolean;
  enableCustomTracks: boolean;
}

// Content addition button configuration
export interface ContentAdditionButton {
  type: 'code' | 'video' | 'assets';
  label: string;
  icon: string;
  targetTrack: EducationalTrack;
  defaultAction: () => void;
  quickActions: QuickAction[];
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  action: () => void;
}

// Migration system types
export interface MigrationConflict {
  itemId: string;
  currentTrack: number;
  suggestedTrack: EducationalTrack;
  reason: string;
  alternatives: EducationalTrack[];
}

export interface MigrationResult {
  success: boolean;
  migratedItems: number;
  conflicts: MigrationConflict[];
  warnings: string[];
}

export interface MigrationDecision {
  conflictId: string;
  selectedTrack: EducationalTrack;
  userOverride: boolean;
}

// Track conflict handling
export interface TrackConflictHandler {
  onInvalidPlacement: (item: TimelineItem, track: EducationalTrack) => void;
  onSuggestAlternative: (suggestions: PlacementSuggestion[]) => void;
  onForceOverride: (item: TimelineItem, track: EducationalTrack) => void;
}

export interface MigrationConflictResolver {
  onMultipleItemsPerTrack: (items: TimelineItem[], track: number) => EducationalTrack[];
  onUnknownContentType: (item: TimelineItem) => EducationalTrack;
  onUserDecision: (conflicts: MigrationConflict[]) => MigrationDecision[];
}

// Educational track configuration constant
export const EDUCATIONAL_TRACKS: EducationalTrack[] = [
  {
    id: 'code',
    name: 'Code',
    trackNumber: 0,
    color: '#8B5CF6', // Purple
    icon: 'code',
    defaultProperties: {
      theme: 'vscode-dark-plus',
      fontSize: 16,
      showLineNumbers: true,
      animationMode: 'typing',
      typingSpeedCps: 20,
    },
    allowedContentTypes: ['code'],
    suggestedAnimations: ['typewriter', 'lineFocus', 'diffHighlight']
  },
  {
    id: 'visual',
    name: 'Visual',
    trackNumber: 1,
    color: '#10B981', // Green
    icon: 'monitor',
    defaultProperties: {
      autoFocus: true,
      focusScale: 1.2,
    },
    allowedContentTypes: ['video', 'visual-asset'],
    suggestedAnimations: ['kenBurns', 'slide', 'fade']
  },
  {
    id: 'narration',
    name: 'Narration',
    trackNumber: 2,
    color: '#F59E0B', // Amber
    icon: 'mic',
    defaultProperties: {
      volume: 0.8,
    },
    allowedContentTypes: ['audio'],
    suggestedAnimations: ['fade']
  },
  {
    id: 'you',
    name: 'You',
    trackNumber: 3,
    color: '#EF4444', // Red
    icon: 'user',
    defaultProperties: {
      talkingHeadEnabled: true,
      talkingHeadCorner: 'bottom-right',
      talkingHeadSize: 'md',
    },
    allowedContentTypes: ['video'],
    suggestedAnimations: ['fade', 'slide']
  }
];

// Helper functions for educational tracks
export function getEducationalTrackById(id: string): EducationalTrack | undefined {
  return EDUCATIONAL_TRACKS.find(track => track.id === id);
}

export function getEducationalTrackByNumber(trackNumber: number): EducationalTrack | undefined {
  return EDUCATIONAL_TRACKS.find(track => track.trackNumber === trackNumber);
}

export function getEducationalTrackByName(name: EducationalTrackName): EducationalTrack | undefined {
  return EDUCATIONAL_TRACKS.find(track => track.name === name);
}

export function isContentTypeAllowed(track: EducationalTrack, contentType: TimelineItemType): boolean {
  return track.allowedContentTypes.includes(contentType);
}

// Language detection and defaults for Code track
export interface LanguageDetectionResult {
  language: string;
  confidence: number;
  alternatives: Array<{ language: string; confidence: number }>;
}

// Simple language detection based on common patterns
export function detectLanguageFromCode(code: string, filename?: string): LanguageDetectionResult {
  if (!code.trim()) {
    return {
      language: 'javascript',
      confidence: 0,
      alternatives: [],
    };
  }

  const scores: Record<string, number> = {};
  const languages = ['javascript', 'typescript', 'python', 'java', 'cpp', 'html', 'css', 'json', 'glsl', 'gdscript'];

  // Initialize scores
  languages.forEach(lang => scores[lang] = 0);

  // Check filename extension if provided
  if (filename) {
    const ext = filename.toLowerCase().split('.').pop();
    const extensionMap: Record<string, string[]> = {
      javascript: ['js', 'mjs'],
      typescript: ['ts', 'tsx'],
      python: ['py', 'pyw'],
      java: ['java'],
      cpp: ['cpp', 'cc', 'cxx', 'c++', 'hpp', 'h'],
      html: ['html', 'htm'],
      css: ['css', 'scss', 'sass'],
      json: ['json'],
      glsl: ['glsl', 'vert', 'frag', 'vs', 'fs'],
      gdscript: ['gd'],
    };

    for (const [lang, extensions] of Object.entries(extensionMap)) {
      if (ext && extensions.includes(ext)) {
        scores[lang] += 3.0;
      }
    }
  }

  // Simple pattern matching
  const patterns: Record<string, RegExp[]> = {
    javascript: [/function\s+\w+/, /const\s+\w+\s*=/, /=>\s*{/, /console\.log/, /require\(/],
    typescript: [/interface\s+\w+/, /type\s+\w+\s*=/, /:\s*(string|number|boolean)/, /<[A-Z]\w*>/],
    python: [/def\s+\w+\s*\(/, /import\s+\w+/, /from\s+\w+\s+import/, /print\(/, /if\s+__name__/],
    java: [/public\s+class/, /public\s+static\s+void\s+main/, /System\.out\.println/, /import\s+java\./],
    cpp: [/#include\s*</, /std::/, /cout\s*<</, /namespace\s+\w+/],
    html: [/<!DOCTYPE\s+html>/i, /<html[^>]*>/i, /<\/\w+>/, /<\w+[^>]*>/],
    css: [/\w+\s*:\s*[^;]+;/, /\.\w+\s*{/, /#\w+\s*{/, /@media\s*\(/],
    json: [/^\s*{[\s\S]*}\s*$/, /"\w+":\s*"[^"]*"/, /"\w+":\s*\d+/],
    glsl: [/#version\s+\d+/, /gl_Position\s*=/, /attribute\s+\w+/, /uniform\s+\w+/],
    gdscript: [/extends\s+\w+/, /@export\s+var/, /func\s+\w+\s*\(/, /signal\s+\w+/],
  };

  for (const [lang, langPatterns] of Object.entries(patterns)) {
    for (const pattern of langPatterns) {
      if (pattern.test(code)) {
        scores[lang] += 1.0;
      }
    }
  }

  // Sort by score
  const sortedLanguages = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .map(([lang, score]) => ({
      language: lang,
      confidence: Math.min(score * 20, 100), // Scale to 0-100
    }));

  const topLanguage = sortedLanguages[0];
  const alternatives = sortedLanguages.slice(1, 4);

  return {
    language: topLanguage.confidence > 10 ? topLanguage.language : 'javascript',
    confidence: topLanguage.confidence,
    alternatives,
  };
}

// Get language-specific defaults for Code track
export function getCodeLanguageDefaults(language: string): Partial<ItemProperties> {
  const defaults: Record<string, Partial<ItemProperties>> = {
    javascript: {
      theme: 'vscode-dark-plus',
      fontSize: 16,
      showLineNumbers: true,
      animationMode: 'typing',
      typingSpeedCps: 20,
    },
    typescript: {
      theme: 'vscode-dark-plus',
      fontSize: 16,
      showLineNumbers: true,
      animationMode: 'typing',
      typingSpeedCps: 18,
    },
    python: {
      theme: 'monokai',
      fontSize: 16,
      showLineNumbers: true,
      animationMode: 'line-by-line',
      lineRevealIntervalMs: 400,
    },
    java: {
      theme: 'github-light',
      fontSize: 15,
      showLineNumbers: true,
      animationMode: 'typing',
      typingSpeedCps: 15,
    },
    cpp: {
      theme: 'dracula',
      fontSize: 15,
      showLineNumbers: true,
      animationMode: 'typing',
      typingSpeedCps: 15,
    },
    html: {
      theme: 'vscode-light-plus',
      fontSize: 16,
      showLineNumbers: false,
      animationMode: 'typing',
      typingSpeedCps: 25,
    },
    css: {
      theme: 'vscode-light-plus',
      fontSize: 16,
      showLineNumbers: false,
      animationMode: 'typing',
      typingSpeedCps: 25,
    },
    json: {
      theme: 'vscode-dark-plus',
      fontSize: 16,
      showLineNumbers: false,
      animationMode: 'typing',
      typingSpeedCps: 30,
    },
    glsl: {
      theme: 'dracula',
      fontSize: 16,
      showLineNumbers: true,
      animationMode: 'line-by-line',
      lineRevealIntervalMs: 300,
    },
    gdscript: {
      theme: 'monokai',
      fontSize: 16,
      showLineNumbers: true,
      animationMode: 'typing',
      typingSpeedCps: 20,
    },
  };

  return defaults[language] || defaults.javascript;
}