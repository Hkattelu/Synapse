// Unit tests for state management hooks

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { TestProviders } from '../../test/TestProviders';
import {
  useProject,
  useTimeline,
  useMediaAssets,
  useUI,
  usePlayback,
} from '../hooks';
import type { Project } from '../../lib/types';

// Test wrapper component that provides shared context
function TestWrapper({ children }: { children: ReactNode }) {
  return <TestProviders>{children}</TestProviders>;
}

describe('State Management Hooks', () => {
  describe('useProject', () => {
    it('should create a new project', () => {
      const { result } = renderHook(() => useProject(), {
        wrapper: TestWrapper,
      });

      expect(result.current.project).toBeNull();
      expect(result.current.isDirty).toBe(false);

      act(() => {
        result.current.createProject('Test Project');
      });

      expect(result.current.project).toBeDefined();
      expect(result.current.project?.name).toBe('Test Project');
      expect(result.current.isDirty).toBe(true);
    });

    it('should load an existing project', () => {
      const mockProject: Project = {
        id: 'test-id',
        name: 'Loaded Project',
        createdAt: new Date(),
        updatedAt: new Date(),
        timeline: [],
        mediaAssets: [],
        settings: {
          width: 1920,
          height: 1080,
          fps: 30,
          duration: 60,
          backgroundColor: '#000000',
        },
        version: '1.0.0',
      };

      const { result } = renderHook(() => useProject(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.loadProject(mockProject);
      });

      expect(result.current.project).toEqual(mockProject);
      expect(result.current.isDirty).toBe(false);
    });

    it('should update project properties', () => {
      const { result } = renderHook(() => useProject(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.createProject('Test Project');
      });

      act(() => {
        result.current.updateProject({ name: 'Updated Project' });
      });

      expect(result.current.project?.name).toBe('Updated Project');
      expect(result.current.isDirty).toBe(true);
    });

    it('should save project', () => {
      const { result } = renderHook(() => useProject(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.createProject('Test Project');
      });

      expect(result.current.isDirty).toBe(true);

      act(() => {
        result.current.saveProject();
      });

      expect(result.current.isDirty).toBe(false);
      expect(result.current.lastSaved).toBeInstanceOf(Date);
    });

    it('should reset project', () => {
      const { result } = renderHook(() => useProject(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.createProject('Test Project');
      });

      expect(result.current.project).toBeDefined();

      act(() => {
        result.current.resetProject();
      });

      expect(result.current.project).toBeNull();
      expect(result.current.isDirty).toBe(false);
    });
  });

  describe('useTimeline', () => {
    it('should add timeline item', () => {
      const { result } = renderHook(
        () => ({
          project: useProject(),
          timeline: useTimeline(),
        }),
        {
          wrapper: TestWrapper,
        }
      );

      // Create project first
      act(() => {
        result.current.project.createProject('Test Project');
      });

      expect(result.current.timeline.timeline).toHaveLength(0);

      act(() => {
        result.current.timeline.addTimelineItem({
          assetId: 'asset-1',
          startTime: 0,
          duration: 5,
          track: 0,
          type: 'video',
          properties: {},
          animations: [],
        });
      });

      expect(result.current.timeline.timeline).toHaveLength(1);
      expect(result.current.timeline.timeline[0].assetId).toBe('asset-1');
    });

    it('should calculate timeline duration', () => {
      const { result } = renderHook(
        () => ({
          project: useProject(),
          timeline: useTimeline(),
        }),
        {
          wrapper: TestWrapper,
        }
      );

      act(() => {
        result.current.project.createProject('Test Project');
      });

      act(() => {
        result.current.timeline.addTimelineItem({
          assetId: 'asset-1',
          startTime: 0,
          duration: 5,
          track: 0,
          type: 'video',
          properties: {},
          animations: [],
        });
      });

      act(() => {
        result.current.timeline.addTimelineItem({
          assetId: 'asset-2',
          startTime: 10,
          duration: 8,
          track: 0,
          type: 'video',
          properties: {},
          animations: [],
        });
      });

      expect(result.current.timeline.timelineDuration).toBe(18); // 10 + 8
    });

    it('should select and clear timeline items', () => {
      const { result } = renderHook(
        () => ({
          project: useProject(),
          timeline: useTimeline(),
        }),
        {
          wrapper: TestWrapper,
        }
      );

      act(() => {
        result.current.project.createProject('Test Project');
      });

      let itemId: string = '';
      act(() => {
        itemId = result.current.timeline.addTimelineItem({
          assetId: 'asset-1',
          startTime: 0,
          duration: 5,
          track: 0,
          type: 'video',
          properties: {},
          animations: [],
        });
      });

      act(() => {
        result.current.timeline.selectTimelineItems([itemId]);
      });

      expect(result.current.timeline.selectedItems).toContain(itemId);
      expect(result.current.timeline.selectedTimelineItems).toHaveLength(1);

      act(() => {
        result.current.timeline.clearTimelineSelection();
      });

      expect(result.current.timeline.selectedItems).toHaveLength(0);
      expect(result.current.timeline.selectedTimelineItems).toHaveLength(0);
    });

    it('should get items at specific time', () => {
      const { result } = renderHook(
        () => ({
          project: useProject(),
          timeline: useTimeline(),
        }),
        {
          wrapper: TestWrapper,
        }
      );

      act(() => {
        result.current.project.createProject('Test Project');
      });

      act(() => {
        result.current.timeline.addTimelineItem({
          assetId: 'asset-1',
          startTime: 0,
          duration: 10,
          track: 0,
          type: 'video',
          properties: {},
          animations: [],
        });
      });

      act(() => {
        result.current.timeline.addTimelineItem({
          assetId: 'asset-2',
          startTime: 15,
          duration: 5,
          track: 0,
          type: 'video',
          properties: {},
          animations: [],
        });
      });

      const itemsAt5 = result.current.timeline.getItemsAtTime(5);
      const itemsAt16 = result.current.timeline.getItemsAtTime(16);
      const itemsAt25 = result.current.timeline.getItemsAtTime(25);

      expect(itemsAt5).toHaveLength(1);
      expect(itemsAt5[0].assetId).toBe('asset-1');
      expect(itemsAt16).toHaveLength(1);
      expect(itemsAt16[0].assetId).toBe('asset-2');
      expect(itemsAt25).toHaveLength(0);
    });
  });

  describe('useMediaAssets', () => {
    it('should add media asset', () => {
      const { result } = renderHook(
        () => ({
          project: useProject(),
          media: useMediaAssets(),
        }),
        {
          wrapper: TestWrapper,
        }
      );

      act(() => {
        result.current.project.createProject('Test Project');
      });

      expect(result.current.media.mediaAssets).toHaveLength(0);

      act(() => {
        result.current.media.addMediaAsset({
          name: 'test-video.mp4',
          type: 'video',
          url: 'blob:test-url',
          duration: 30,
          metadata: {
            fileSize: 1024,
            mimeType: 'video/mp4',
          },
        });
      });

      expect(result.current.media.mediaAssets).toHaveLength(1);
      expect(result.current.media.mediaAssets[0].name).toBe('test-video.mp4');
    });

    it('should get media assets by type', () => {
      const { result } = renderHook(
        () => ({
          project: useProject(),
          media: useMediaAssets(),
        }),
        {
          wrapper: TestWrapper,
        }
      );

      act(() => {
        result.current.project.createProject('Test Project');
      });

      act(() => {
        result.current.media.addMediaAsset({
          name: 'video.mp4',
          type: 'video',
          url: 'blob:video',
          metadata: { fileSize: 1024, mimeType: 'video/mp4' },
        });
      });

      act(() => {
        result.current.media.addMediaAsset({
          name: 'audio.mp3',
          type: 'audio',
          url: 'blob:audio',
          metadata: { fileSize: 512, mimeType: 'audio/mp3' },
        });
      });

      const videoAssets = result.current.media.getMediaAssetsByType('video');
      const audioAssets = result.current.media.getMediaAssetsByType('audio');

      expect(videoAssets).toHaveLength(1);
      expect(videoAssets[0].name).toBe('video.mp4');
      expect(audioAssets).toHaveLength(1);
      expect(audioAssets[0].name).toBe('audio.mp3');
    });
  });

  describe('useUI', () => {
    it('should toggle UI panels', () => {
      const { result } = renderHook(() => useUI(), {
        wrapper: TestWrapper,
      });

      const initialSidebarState = result.current.ui.sidebarVisible;

      act(() => {
        result.current.toggleSidebar();
      });

      expect(result.current.ui.sidebarVisible).toBe(!initialSidebarState);
    });

    it('should update timeline view', () => {
      const { result } = renderHook(() => useUI(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.updateTimelineView({
          zoom: 2,
          scrollPosition: 100,
          snapToGrid: false,
        });
      });

      expect(result.current.ui.timeline.zoom).toBe(2);
      expect(result.current.ui.timeline.scrollPosition).toBe(100);
      expect(result.current.ui.timeline.snapToGrid).toBe(false);
    });
  });

  describe('usePlayback', () => {
    it('should control playback state', () => {
      const { result } = renderHook(() => usePlayback(), {
        wrapper: TestWrapper,
      });

      expect(result.current.playback.isPlaying).toBe(false);

      act(() => {
        result.current.play();
      });

      expect(result.current.playback.isPlaying).toBe(true);

      act(() => {
        result.current.pause();
      });

      expect(result.current.playback.isPlaying).toBe(false);
    });

    it('should toggle playback', () => {
      const { result } = renderHook(() => usePlayback(), {
        wrapper: TestWrapper,
      });

      const initialState = result.current.playback.isPlaying;

      act(() => {
        result.current.togglePlayback();
      });

      expect(result.current.playback.isPlaying).toBe(!initialState);
    });

    it('should control volume with bounds', () => {
      const { result } = renderHook(() => usePlayback(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.setVolume(0.5);
      });

      expect(result.current.playback.volume).toBe(0.5);

      // Test upper bound
      act(() => {
        result.current.setVolume(1.5);
      });

      expect(result.current.playback.volume).toBe(1);

      // Test lower bound
      act(() => {
        result.current.setVolume(-0.5);
      });

      expect(result.current.playback.volume).toBe(0);
    });

    it('should toggle mute', () => {
      const { result } = renderHook(() => usePlayback(), {
        wrapper: TestWrapper,
      });

      const initialMuteState = result.current.playback.muted;

      act(() => {
        result.current.toggleMute();
      });

      expect(result.current.playback.muted).toBe(!initialMuteState);
    });

    it('should seek to specific time', () => {
      const { result } = renderHook(() => usePlayback(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.seek(15.5);
      });

      expect(result.current.playback.currentTime).toBe(15.5);
    });
  });
});
