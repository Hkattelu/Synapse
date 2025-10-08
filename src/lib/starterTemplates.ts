import { generateId } from './utils';
import type { MediaAsset, Project, TimelineItem } from './types';

export interface ProjectTemplateMeta {
  id: string;
  name: string;
  description: string;
  tags?: string[];
  recommended?: boolean;
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

function blankProjectTemplate(): ProjectTemplate {
  return {
    id: 'blank',
    name: 'Blank Project',
    description: 'An empty project with default 1080p settings.',
    tags: ['default', 'clean'],
    recommended: true,
    build: ({ name } = {}) => {
      const now = new Date();
      const project: Project = {
        id: generateId(),
        name: name || 'Blank Project',
        createdAt: now,
        updatedAt: now,
        timeline: [],
        mediaAssets: [],
        settings: {
          width: 1920,
          height: 1080,
          fps: 30,
          duration: 60,
          backgroundColor: '#000000',
          audioSampleRate: 48000,
        },
        version: '1.0.0',
      };
      return project;
    },
  };
}

function codeTutorialTemplate(): ProjectTemplate {
  return {
    id: 'code-tutorial',
    name: 'Quick Code Tutorial',
    description: 'A starter with a title card and a code snippet using typewriter animation.',
    tags: ['code', 'education'],
    recommended: true,
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

export const starterTemplates: ProjectTemplate[] = [
  blankProjectTemplate(),
  codeTutorialTemplate(),
  socialVerticalTitleTemplate(),
];