// Demo component to showcase EducationalTrack functionality
import React, { useState } from 'react';
import { EducationalTrack } from './EducationalTrack';
import { EDUCATIONAL_TRACKS } from '../lib/educationalTypes';
import type { TimelineItem } from '../lib/types';

// Mock timeline items for demonstration
const mockTimelineItems: TimelineItem[] = [
  {
    id: 'code-item-1',
    assetId: 'code-asset-1',
    startTime: 0,
    duration: 8,
    track: 0,
    type: 'code',
    properties: {
      codeText:
        'function fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n-1) + fibonacci(n-2);\n}',
      language: 'javascript',
      theme: 'vscode-dark-plus',
    },
    animations: [],
    keyframes: [],
  },
  {
    id: 'visual-item-1',
    assetId: 'visual-asset-1',
    startTime: 2,
    duration: 6,
    track: 1,
    type: 'video',
    properties: {
      autoFocus: true,
      focusScale: 1.2,
    },
    animations: [],
    keyframes: [],
  },
  {
    id: 'narration-item-1',
    assetId: 'narration-asset-1',
    startTime: 1,
    duration: 10,
    track: 2,
    type: 'audio',
    properties: {
      volume: 0.8,
    },
    animations: [],
    keyframes: [],
  },
  {
    id: 'you-item-1',
    assetId: 'you-asset-1',
    startTime: 0,
    duration: 12,
    track: 3,
    type: 'video',
    properties: {
      talkingHeadEnabled: true,
      talkingHeadCorner: 'bottom-right',
      talkingHeadSize: 'md',
    },
    animations: [],
    keyframes: [],
  },
];

// Mock media assets
const mockMediaAssets = {
  'code-asset-1': {
    id: 'code-asset-1',
    name: 'fibonacci.js',
    type: 'code' as const,
    url: 'blob:code-url',
    metadata: {
      fileSize: 256,
      mimeType: 'text/javascript',
      codeContent:
        'function fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n-1) + fibonacci(n-2);\n}',
      language: 'javascript',
    },
    createdAt: new Date(),
  },
  'visual-asset-1': {
    id: 'visual-asset-1',
    name: 'screen-recording.mp4',
    type: 'video' as const,
    url: 'blob:video-url',
    duration: 6,
    metadata: {
      width: 1920,
      height: 1080,
      fps: 30,
      fileSize: 5242880,
      mimeType: 'video/mp4',
    },
    thumbnail:
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjYwIiB2aWV3Qm94PSIwIDAgMTAwIDYwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjMTBCOTgxIiBmaWxsLW9wYWNpdHk9IjAuMiIvPgo8dGV4dCB4PSI1MCIgeT0iMzUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzEwQjk4MSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+VmlkZW88L3RleHQ+Cjwvc3ZnPgo=',
    createdAt: new Date(),
  },
  'narration-asset-1': {
    id: 'narration-asset-1',
    name: 'voiceover.mp3',
    type: 'audio' as const,
    url: 'blob:audio-url',
    duration: 10,
    metadata: {
      fileSize: 1048576,
      mimeType: 'audio/mpeg',
    },
    createdAt: new Date(),
  },
  'you-asset-1': {
    id: 'you-asset-1',
    name: 'talking-head.mp4',
    type: 'video' as const,
    url: 'blob:personal-video-url',
    duration: 12,
    metadata: {
      width: 1280,
      height: 720,
      fps: 30,
      fileSize: 8388608,
      mimeType: 'video/mp4',
    },
    thumbnail:
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjYwIiB2aWV3Qm94PSIwIDAgMTAwIDYwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjRUY0NDQ0IiBmaWxsLW9wYWNpdHk9IjAuMiIvPgo8Y2lyY2xlIGN4PSI1MCIgY3k9IjMwIiByPSIxNSIgZmlsbD0iI0VGNDQzNCIgZmlsbC1vcGFjaXR5PSIwLjMiLz4KPHN2ZyB4PSI0MiIgeT0iMjIiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNFRjQ0NDQiIHN0cm9rZS13aWR0aD0iMiI+CjxwYXRoIGQ9Ik0xOSAyMXYtMmE0IDQgMCAwIDAtNC00SDlhNCA0IDAgMCAwLTQgNHYyIi8+CjxjaXJjbGUgY3g9IjEyIiBjeT0iNyIgcj0iNCIvPgo8L3N2Zz4KPC9zdmc+Cg==',
    createdAt: new Date(),
  },
};

export function EducationalTrackDemo() {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [dragState, setDragState] = useState({
    isDragging: false,
    itemId: null as string | null,
  });

  const timeToPixels = (time: number) => time * 50; // 50 pixels per second

  const handleItemMouseDown = (e: React.MouseEvent, item: TimelineItem) => {
    e.preventDefault();
    setSelectedItems([item.id]);
    setDragState({
      isDragging: true,
      itemId: item.id,
    });
  };

  const handleItemDrop = (item: TimelineItem) => {
    // Mock drop handler
    console.log('Item dropped:', item);
  };

  const getMediaAssetById = (id: string) => {
    return mockMediaAssets[id as keyof typeof mockMediaAssets];
  };

  // Mock the useMediaAssets hook
  React.useEffect(() => {
    // Override the hook for this demo
    (window as any).__mockMediaAssets = { getMediaAssetById };
  }, []);

  return (
    <div className="educational-track-demo p-6 bg-background-secondary min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-text-primary mb-6">
          Educational Track Component Demo
        </h2>

        <div className="bg-background rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Track Overview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {EDUCATIONAL_TRACKS.map((track) => (
              <div
                key={track.id}
                className="p-3 rounded-lg border border-border-subtle"
                style={{ backgroundColor: `${track.color}11` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: track.color }}
                  />
                  <span className="font-medium text-text-primary">
                    {track.name}
                  </span>
                </div>
                <p className="text-xs text-text-secondary">
                  Track {track.trackNumber + 1} •{' '}
                  {track.allowedContentTypes.join(', ')}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-background rounded-lg p-4">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Timeline Tracks
          </h3>
          <div className="space-y-2">
            {EDUCATIONAL_TRACKS.map((track) => (
              <EducationalTrack
                key={track.id}
                track={track}
                items={mockTimelineItems}
                isActive={false}
                trackHeight={80}
                timeToPixels={timeToPixels}
                onItemDrop={handleItemDrop}
                onItemMouseDown={handleItemMouseDown}
                selectedItems={selectedItems}
                dragState={dragState}
              />
            ))}
          </div>
        </div>

        <div className="mt-6 p-4 bg-background rounded-lg">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Features Demonstrated
          </h3>
          <ul className="space-y-2 text-text-secondary">
            <li>• Track-specific visual styling and colors</li>
            <li>• Educational track headers with icons and labels</li>
            <li>• Code track with syntax highlighting preview</li>
            <li>• Visual track with thumbnail previews</li>
            <li>• Narration track with waveform visualization</li>
            <li>• You track with talking head indicators</li>
            <li>• Timeline item selection and drag states</li>
            <li>• Track-specific content previews</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
