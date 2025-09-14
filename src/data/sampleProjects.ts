import type { Project } from '../lib/types';
import type { StoredProject } from '../lib/projectManager';

// Starter project for development - always loaded in dev mode
const sampleProject: Project = {
  id: 'remotion-tutorial-sample',
  name: '🎬 Synapse Studio - Starter Project',
  createdAt: new Date('2024-01-15T10:00:00Z'),
  updatedAt: new Date('2024-01-15T15:30:00Z'),
  version: '1.0.0',
  settings: {
    width: 1920,
    height: 1080,
    fps: 30,
    duration: 45,
    backgroundColor: '#24273a',
    audioSampleRate: 48000,
  },
  timeline: [
    // Opening title
    {
      id: 'timeline-intro-title',
      assetId: 'asset-title-intro',
      startTime: 0,
      duration: 3,
      track: 0,
      type: 'title',
      properties: {
        text: 'How Remotion Works',
        fontSize: 64,
        color: '#8aadf4',
        fontFamily: 'Arial',
        opacity: 1,
        x: 960,
        y: 540,
        scale: 1,
      },
      animations: [],
      keyframes: [
        {
          id: 'kf-intro-start',
          time: 0,
          properties: { opacity: 0, scale: 0.9, y: 590 },
          easing: 'easeOut',
        },
        {
          id: 'kf-intro-visible',
          time: 0.8,
          properties: { opacity: 1, scale: 1, y: 540 },
          easing: 'easeOut',
        },
        {
          id: 'kf-intro-end',
          time: 3,
          properties: { opacity: 0, scale: 1.05, y: 520 },
          easing: 'easeIn',
        },
      ],
    },
    // Subtitle
    {
      id: 'timeline-subtitle',
      assetId: 'asset-title-intro',
      startTime: 0.8,
      duration: 2.2,
      track: 1,
      type: 'title',
      properties: {
        text: 'React-based Video Creation',
        fontSize: 28,
        color: '#b8c0e0',
        fontFamily: 'Arial',
        opacity: 1,
        x: 960,
        y: 620,
        scale: 1,
      },
      animations: [],
      keyframes: [
        {
          id: 'kf-subtitle-start',
          time: 0,
          properties: { opacity: 0, y: 640 },
          easing: 'easeOut',
        },
        {
          id: 'kf-subtitle-visible',
          time: 0.4,
          properties: { opacity: 1, y: 620 },
          easing: 'easeOut',
        },
      ],
    },
    // Code example
    {
      id: 'timeline-code-basic',
      assetId: 'asset-code-basic',
      startTime: 3.5,
      duration: 8,
      track: 0,
      type: 'code',
      properties: {
        language: 'typescript',
        theme: 'oneDark',
        fontSize: 14,
        opacity: 1,
        x: 960,
        y: 540,
        scale: 1,
      },
      animations: [],
      keyframes: [
        {
          id: 'kf-code-basic-start',
          time: 0,
          properties: { opacity: 0, x: 930 },
          easing: 'easeOut',
        },
        {
          id: 'kf-code-basic-visible',
          time: 0.6,
          properties: { opacity: 1, x: 960 },
          easing: 'easeOut',
        },
      ],
    },
    // Explanation text
    {
      id: 'timeline-explanation-1',
      assetId: 'asset-title-intro',
      startTime: 4,
      duration: 3,
      track: 2,
      type: 'title',
      properties: {
        text: '1. Create React Components',
        fontSize: 36,
        color: '#a6da95',
        fontFamily: 'Arial',
        opacity: 1,
        x: 200,
        y: 200,
        scale: 1,
      },
      animations: [],
      keyframes: [
        {
          id: 'kf-exp-1-start',
          time: 0,
          properties: { opacity: 0, x: 100 },
          easing: 'easeOut',
        },
        {
          id: 'kf-exp-1-visible',
          time: 0.5,
          properties: { opacity: 1, x: 200 },
          easing: 'easeOut',
        },
      ],
    },
  ],
  mediaAssets: [
    {
      id: 'asset-code-basic',
      name: 'Basic Remotion Component',
      type: 'code',
      url: '',
      metadata: {
        fileSize: 1024,
        mimeType: 'text/plain',
        codeContent: `import { Composition } from 'remotion';

export const MyVideo = () => {
  return (
    <div style={{
      flex: 1,
      backgroundColor: 'white',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <h1>Hello Remotion!</h1>
    </div>
  );
};

export const Root = () => {
  return (
    <Composition
      id="MyVideo"
      component={MyVideo}
      durationInFrames={150}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};`,
        language: 'typescript',
      },
      createdAt: new Date('2024-01-15T10:00:00Z'),
    },
    {
      id: 'asset-title-intro',
      name: 'Intro Title',
      type: 'code',
      url: '',
      metadata: {
        fileSize: 256,
        mimeType: 'text/plain',
        codeContent: 'How Remotion Works',
        language: 'text',
      },
      createdAt: new Date('2024-01-15T10:00:00Z'),
    },
  ],
  // Optional advanced features
  trackGroups: [
    {
      id: 'group-main-content',
      name: 'Main Content',
      tracks: [0],
      color: '#8aadf4',
      visible: true,
      locked: false,
      collapsed: false,
    },
    {
      id: 'group-supporting-text',
      name: 'Supporting Text',
      tracks: [1, 2],
      color: '#a6da95',
      visible: true,
      locked: false,
      collapsed: false,
    },
  ],
  markers: [
    {
      id: 'marker-intro',
      name: 'Introduction',
      time: 0,
      color: '#8aadf4',
      description: 'Video introduction and title sequence',
    },
    {
      id: 'marker-basic-component',
      name: 'Basic Component',
      time: 3.5,
      color: '#a6da95',
      description: 'Explaining basic Remotion component structure',
    },
  ],
  regions: [
    {
      id: 'region-intro-section',
      name: 'Introduction Section',
      startTime: 0,
      endTime: 3.5,
      color: '#8aadf4',
      description: 'Opening title and subtitle sequence',
    },
    {
      id: 'region-tutorial-content',
      name: 'Tutorial Content',
      startTime: 3.5,
      endTime: 12,
      color: '#a5adcb',
      description: 'Main tutorial content with code examples',
    },
  ],
};

// Minimal, simple starter project showcasing each track
const simpleProject: Project = {
  id: 'simplified-starter',
  name: '✨ Simplified Starter',
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
  version: '1.0.0',
  settings: {
    width: 1920,
    height: 1080,
    fps: 30,
    duration: 12,
    backgroundColor: '#0f172a',
    audioSampleRate: 48000,
  },
  // One simple item per educational track
  timeline: [
    // Track 0: Code (showcases Inspector theme/font/background and typing mode)
    {
      id: 't-code',
      assetId: 'asset-code-snippet',
      startTime: 0,
      duration: 6,
      track: 0,
      type: 'code',
      properties: {
        language: 'typescript',
        theme: 'vscode-dark-plus',
        fontFamily: 'JetBrains Mono, Menlo, Monaco, "Courier New", monospace',
        fontSize: 16,
        showLineNumbers: true,
        animationMode: 'typing',
        typingSpeedCps: 24,
        // Background: subtle linear gradient
        backgroundType: 'gradient',
        backgroundGradient: {
          type: 'linear',
          angle: 135,
          colors: [
            { color: '#1f2937', position: 0 },
            { color: '#0b1324', position: 1 },
          ],
        },
        codeText:
          "import React from 'react';\n\nexport function Hello() {\n  return <h1>Hello Synapse 👋</h1>;\n}",
      },
      animations: [],
      keyframes: [],
    },

    // Track 1: Visual (simple arrow overlay)
    {
      id: 't-visual',
      assetId: 'asset-visual',
      startTime: 0,
      duration: 12,
      track: 1,
      type: 'visual-asset',
      properties: {
        visualAssetType: 'arrow',
        arrowDirection: 'right',
        arrowStyle: 'solid',
        strokeColor: '#22d3ee',
        strokeWidth: 4,
        x: 200,
        y: 400,
        scale: 1,
        animateIn: 'fade',
      },
      animations: [],
      keyframes: [],
    },

    // Track 2: Narration (audio placeholder)
    {
      id: 't-audio',
      assetId: 'asset-audio',
      startTime: 0,
      duration: 12,
      track: 2,
      type: 'audio',
      properties: {
        volume: 0.8,
      },
      animations: [],
      keyframes: [],
    },

    // Track 3: You (talking head placeholder)
    {
      id: 't-you',
      assetId: 'asset-you',
      startTime: 0,
      duration: 12,
      track: 3,
      type: 'video',
      properties: {
        talkingHeadEnabled: true,
        talkingHeadCorner: 'bottom-right',
        talkingHeadSize: 'sm',
        volume: 0,
        opacity: 1,
      },
      animations: [],
      keyframes: [],
    },
  ],
  mediaAssets: [
    {
      id: 'asset-code-snippet',
      name: 'Hello Synapse Code',
      type: 'code',
      url: '',
      metadata: {
        fileSize: 320,
        mimeType: 'text/plain',
        codeContent:
          "import React from 'react';\n\nexport function Hello() {\n  return <h1>Hello Synapse 👋</h1>;\n}",
        language: 'typescript',
      },
      createdAt: new Date('2025-01-01T00:00:00Z'),
    },
    {
      id: 'asset-visual',
      name: 'Arrow Overlay',
      type: 'visual-asset',
      url: '',
      metadata: {
        fileSize: 0,
        mimeType: 'application/json',
      },
      createdAt: new Date('2025-01-01T00:00:00Z'),
    },
    {
      id: 'asset-audio',
      name: 'Narration Placeholder',
      type: 'audio',
      url: '',
      metadata: {
        fileSize: 204800,
        mimeType: 'audio/mpeg',
      },
      createdAt: new Date('2025-01-01T00:00:00Z'),
    },
    {
      id: 'asset-you',
      name: 'Talking Head Placeholder',
      type: 'video',
      url: '',
      metadata: {
        width: 1280,
        height: 720,
        fileSize: 1048576,
        mimeType: 'video/mp4',
      },
      createdAt: new Date('2025-01-01T00:00:00Z'),
    },
  ],
  // Keep extras minimal for clarity
  trackGroups: undefined,
  markers: undefined,
  regions: undefined,
};

// Export sample projects array
export const sampleProjects: Project[] = [simpleProject];

// Export sample stored projects for development
export const sampleStoredProjects: StoredProject[] = sampleProjects.map(
  (project) => ({
    project,
    lastOpened: new Date('2024-01-15T15:30:00Z'),
  })
);

export const getDefaultProject = (): Project => sampleProjects[0];

export const createEmptyProject = (name: string): Project => ({
  id: `project-${Date.now()}`,
  name,
  createdAt: new Date(),
  updatedAt: new Date(),
  version: '1.0.0',
  settings: {
    width: 1920,
    height: 1080,
    fps: 30,
    duration: 30, // 30 seconds default
    backgroundColor: '#24273a',
    audioSampleRate: 48000,
  },
  timeline: [],
  mediaAssets: [],
});

// Function to load sample data in development mode
export const loadSampleDataForDev = () => {
  if (import.meta.env.DEV) {
    console.log('🎬 Dev Mode: Loading starter project with sample content');
    return sampleStoredProjects;
  }
  return [];
};
