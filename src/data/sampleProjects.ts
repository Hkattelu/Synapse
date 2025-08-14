import { Project, MediaAsset, TimelineItem } from '../lib/types';
import { StoredProject } from '../lib/projectManager';

// Simple sample project for development testing
const sampleProject: Project = {
  id: 'remotion-tutorial-sample',
  name: 'How Remotion Works - Tutorial',
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
          easing: 'easeOutBack',
        },
        {
          id: 'kf-intro-visible',
          time: 0.8,
          properties: { opacity: 1, scale: 1, y: 540 },
          easing: 'easeOutBack',
        },
        {
          id: 'kf-intro-end',
          time: 3,
          properties: { opacity: 0, scale: 1.05, y: 520 },
          easing: 'easeInQuart',
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
          easing: 'easeOutQuad',
        },
        {
          id: 'kf-subtitle-visible',
          time: 0.4,
          properties: { opacity: 1, y: 620 },
          easing: 'easeOutQuad',
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
          easing: 'easeOutQuart',
        },
        {
          id: 'kf-code-basic-visible',
          time: 0.6,
          properties: { opacity: 1, x: 960 },
          easing: 'easeOutQuart',
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
          easing: 'easeOutBack',
        },
        {
          id: 'kf-exp-1-visible',
          time: 0.5,
          properties: { opacity: 1, x: 200 },
          easing: 'easeOutBack',
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

// Export sample projects array
export const sampleProjects: Project[] = [sampleProject];

// Export sample stored projects for development
export const sampleStoredProjects: StoredProject[] = sampleProjects.map(project => ({
  project,
  lastOpened: new Date('2024-01-15T15:30:00Z'),
}));

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
    console.log('🎬 Loading sample Remotion tutorial project for development');
    return sampleStoredProjects;
  }
  return [];
};
