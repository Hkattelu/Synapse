import { generateId } from './utils';
import type { MediaAsset, Project, TimelineItem } from './types';

export interface ProjectTemplateMeta {
  id: string;
  name: string;
  description: string;
  tags?: string[];
  recommended?: boolean;
  // Visual adornments for gallery cards (used for gradients)
  emoji?: string; // e.g. "💻" (deprecated in favor of mini-previews)
  colorFrom?: string; // e.g. "#6366F1"
  colorTo?: string;   // e.g. "#A855F7"
  // Mini-preview kind for gallery rendering
  previewKind?: 'code' | 'vertical' | 'side-by-side';
}

export interface ProjectTemplate extends ProjectTemplateMeta {
  build: (opts?: { name?: string }) => Project;
}

function makeCodeAsset(displayName: string, code: string, language = 'plaintext'): MediaAsset {
  const now = new Date();
  return {
    id: generateId(),
    name: displayName,
    type: 'code',
    url: '',
    metadata: {
      fileSize: code.length,
      mimeType: 'text/plain',
      codeContent: code,
      language,
    },
    createdAt: now,
  };
}


function codeTutorialTemplate(): ProjectTemplate {
  return {
    id: 'code-tutorial',
    name: 'Quick Code Tutorial',
    description: 'A starter with a title card and a code snippet using typewriter animation.',
    tags: ['code', 'education'],
    recommended: true,
    emoji: '💻',
    colorFrom: '#6366f1', // indigo-500
    colorTo: '#a855f7',   // purple-500
    previewKind: 'code',
    build: ({ name } = {}) => {
      const now = new Date();
      const titleAsset = makeCodeAsset('Title', 'Getting Started', 'text');
      const codeSample = `function greet(name) {\n  return ` + "`Hello, ${name}!`" + `;\n}\n\nconsole.log(greet('Synapse'));`;
      const codeAsset = makeCodeAsset('Code Snippet 1', codeSample, 'javascript');

      const timeline: TimelineItem[] = [
        {
          id: generateId(),
          assetId: titleAsset.id,
          startTime: 0,
          duration: 3,
          track: 0,
          type: 'title',
          properties: {
            text: 'Getting Started',
            color: '#ffffff',
            // Center the title by default
            x: 960,
            y: 540,
          },
          animations: [],
          keyframes: [],
        },
        {
          id: generateId(),
          assetId: codeAsset.id,
          startTime: 3,
          duration: 10,
          track: 0,
          type: 'code',
          properties: {
            language: 'javascript',
            codeText: codeSample,
            animationMode: 'typing',
            typingSpeedCps: 30,
            showLineNumbers: true,
            theme: 'vscode-dark-plus',
          },
          animations: [],
          keyframes: [],
        },
      ];

      const project: Project = {
        id: generateId(),
        name: name || 'Quick Code Tutorial',
        createdAt: now,
        updatedAt: now,
        timeline,
        mediaAssets: [titleAsset, codeAsset],
        settings: {
          width: 1920,
          height: 1080,
          fps: 30,
          duration: 20,
          backgroundColor: '#0b0b0b',
          audioSampleRate: 48000,
          defaultTheme: 'vscode-dark-plus',
        },
        version: '1.0.0',
      };

      return project;
    },
  };
}

function socialVerticalTitleTemplate(): ProjectTemplate {
  return {
    id: 'social-vertical-title',
    name: 'Social Vertical Title Card',
    description: '1080×1920 project with a bold title card. Great for short intros.',
    tags: ['social', 'vertical', 'title'],
    emoji: '📱',
    colorFrom: '#f43f5e', // rose-500
    colorTo: '#f97316',   // orange-500
    previewKind: 'vertical',
    build: ({ name } = {}) => {
      const now = new Date();
      const titleText = 'Your Title Here';
      const titleAsset = makeCodeAsset('Title', titleText, 'text');

      const timeline: TimelineItem[] = [
        {
          id: generateId(),
          assetId: titleAsset.id,
          startTime: 0,
          duration: 5,
          track: 0,
          type: 'title',
          properties: {
            text: titleText,
            color: '#ffffff',
            // Emulate a simple entrance
            animationMode: 'none',
          },
          animations: [],
          keyframes: [],
        },
      ];

      const project: Project = {
        id: generateId(),
        name: name || 'Social Vertical Title',
        createdAt: now,
        updatedAt: now,
        timeline,
        mediaAssets: [titleAsset],
        settings: {
          width: 1080,
          height: 1920,
          fps: 30,
          duration: 10,
          backgroundColor: '#000000',
          audioSampleRate: 48000,
        },
        version: '1.0.0',
      };

      return project;
    },
  };
}

function sideBySideTemplate(): ProjectTemplate {
  return {
    id: 'side-by-side',
    name: 'Code + Preview (Side by Side)',
    description: '1920×1080 split layout: code at left, content preview at right.',
    tags: ['code', 'layout', 'side-by-side'],
    recommended: true,
    colorFrom: '#0ea5e9', // sky-500
    colorTo: '#22c55e',   // green-500
    previewKind: 'side-by-side',
    build: ({ name } = {}) => {
      const now = new Date();
      const sampleCode = `// Side-by-side demo\nfunction App(){\n  return <UI left=\"code\" right=\"preview\" />\n}`;
      const codeAsset = makeCodeAsset('Code Snippet', sampleCode, 'javascript');
      const previewAsset = makeCodeAsset('Preview', 'Preview content', 'text');

      const timeline: TimelineItem[] = [
        {
          id: generateId(),
          assetId: codeAsset.id,
          startTime: 0,
          duration: 8,
          track: 0,
          type: 'code',
          properties: {
            language: 'javascript',
            codeText: sampleCode,
            showLineNumbers: true,
            theme: 'vscode-dark-plus',
          },
          animations: [],
          keyframes: [],
        },
        {
          id: generateId(),
          assetId: previewAsset.id,
          startTime: 0,
          duration: 8,
          track: 1,
          type: 'title',
          properties: {
            text: 'Preview',
            color: '#ffffff',
          },
          animations: [],
          keyframes: [],
        },
      ];

      const project: Project = {
        id: generateId(),
        name: name || 'Side by Side',
        createdAt: now,
        updatedAt: now,
        timeline,
        mediaAssets: [codeAsset, previewAsset],
        settings: {
          width: 1920,
          height: 1080,
          fps: 30,
          duration: 10,
          backgroundColor: '#0b0b0b',
          audioSampleRate: 48000,
          defaultTheme: 'vscode-dark-plus',
        },
        version: '1.0.0',
      };

      return project;
    },
  };
}

export const starterTemplates: ProjectTemplate[] = [
  sideBySideTemplate(),
  codeTutorialTemplate(),
  socialVerticalTitleTemplate(),
];
