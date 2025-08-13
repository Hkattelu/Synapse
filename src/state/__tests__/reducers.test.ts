// Unit tests for state reducers

import { describe, it, expect, beforeEach } from 'vitest';
import { appReducer, initialState } from '../reducers';
import type { AppState, AppAction } from '../types';
import type { TimelineItem, MediaAsset } from '../../lib/types';

describe('appReducer', () => {
  let state: AppState;

  beforeEach(() => {
    state = { ...initialState };
  });

  describe('Project Actions', () => {
    it('should create a new project', () => {
      const action: AppAction = {
        type: 'CREATE_PROJECT',
        payload: { name: 'Test Project' },
      };

      const newState = appReducer(state, action);

      expect(newState.project).toBeDefined();
      expect(newState.project?.name).toBe('Test Project');
      expect(newState.project?.timeline).toEqual([]);
      expect(newState.project?.mediaAssets).toEqual([]);
      expect(newState.isDirty).toBe(true);
      expect(newState.ui.currentView).toBe('studio');
    });

    it('should load an existing project', () => {
      const mockProject = {
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

      const action: AppAction = {
        type: 'LOAD_PROJECT',
        payload: mockProject,
      };

      const newState = appReducer(state, action);

      expect(newState.project).toEqual(mockProject);
      expect(newState.isDirty).toBe(false);
      expect(newState.ui.currentView).toBe('studio');
    });

    it('should update project properties', () => {
      // First create a project
      state = appReducer(state, {
        type: 'CREATE_PROJECT',
        payload: { name: 'Test Project' },
      });

      const action: AppAction = {
        type: 'UPDATE_PROJECT',
        payload: { name: 'Updated Project' },
      };

      const newState = appReducer(state, action);

      expect(newState.project?.name).toBe('Updated Project');
      expect(newState.isDirty).toBe(true);
      expect(newState.project?.updatedAt).toBeInstanceOf(Date);
    });

    it('should save project and clear dirty flag', () => {
      // Create and modify a project
      state = appReducer(state, {
        type: 'CREATE_PROJECT',
        payload: { name: 'Test Project' },
      });

      const action: AppAction = { type: 'SAVE_PROJECT' };
      const newState = appReducer(state, action);

      expect(newState.isDirty).toBe(false);
      expect(newState.lastSaved).toBeInstanceOf(Date);
    });

    it('should reset project state', () => {
      // Create a project first
      state = appReducer(state, {
        type: 'CREATE_PROJECT',
        payload: { name: 'Test Project' },
      });

      const action: AppAction = { type: 'RESET_PROJECT' };
      const newState = appReducer(state, action);

      expect(newState.project).toBeNull();
      expect(newState.isDirty).toBe(false);
      expect(newState.lastSaved).toBeNull();
      expect(newState.ui.currentView).toBe('dashboard');
    });
  });

  describe('Timeline Actions', () => {
    const mockTimelineItem: TimelineItem = {
      id: 'item-1',
      assetId: 'asset-1',
      startTime: 0,
      duration: 5,
      track: 0,
      type: 'video',
      properties: {},
      animations: [],
    };

    beforeEach(() => {
      // Create a project for timeline operations
      state = appReducer(state, {
        type: 'CREATE_PROJECT',
        payload: { name: 'Test Project' },
      });
    });

    it('should add timeline item', () => {
      const action: AppAction = {
        type: 'ADD_TIMELINE_ITEM',
        payload: mockTimelineItem,
      };

      const newState = appReducer(state, action);

      expect(newState.project?.timeline).toHaveLength(1);
      expect(newState.project?.timeline[0]).toEqual(mockTimelineItem);
      expect(newState.isDirty).toBe(true);
    });

    it('should remove timeline item', () => {
      // Add item first
      state = appReducer(state, {
        type: 'ADD_TIMELINE_ITEM',
        payload: mockTimelineItem,
      });

      const action: AppAction = {
        type: 'REMOVE_TIMELINE_ITEM',
        payload: 'item-1',
      };

      const newState = appReducer(state, action);

      expect(newState.project?.timeline).toHaveLength(0);
      expect(newState.ui.timeline.selectedItems).not.toContain('item-1');
      expect(newState.isDirty).toBe(true);
    });

    it('should update timeline item', () => {
      // Add item first
      state = appReducer(state, {
        type: 'ADD_TIMELINE_ITEM',
        payload: mockTimelineItem,
      });

      const action: AppAction = {
        type: 'UPDATE_TIMELINE_ITEM',
        payload: {
          id: 'item-1',
          updates: { duration: 10, properties: { volume: 0.5 } },
        },
      };

      const newState = appReducer(state, action);

      expect(newState.project?.timeline[0].duration).toBe(10);
      expect(newState.project?.timeline[0].properties.volume).toBe(0.5);
      expect(newState.isDirty).toBe(true);
    });

    it('should move timeline item', () => {
      // Add item first
      state = appReducer(state, {
        type: 'ADD_TIMELINE_ITEM',
        payload: mockTimelineItem,
      });

      const action: AppAction = {
        type: 'MOVE_TIMELINE_ITEM',
        payload: { id: 'item-1', startTime: 10, track: 1 },
      };

      const newState = appReducer(state, action);

      expect(newState.project?.timeline[0].startTime).toBe(10);
      expect(newState.project?.timeline[0].track).toBe(1);
      expect(newState.isDirty).toBe(true);
    });

    it('should resize timeline item with minimum duration', () => {
      // Add item first
      state = appReducer(state, {
        type: 'ADD_TIMELINE_ITEM',
        payload: mockTimelineItem,
      });

      const action: AppAction = {
        type: 'RESIZE_TIMELINE_ITEM',
        payload: { id: 'item-1', duration: 0.05 }, // Below minimum
      };

      const newState = appReducer(state, action);

      expect(newState.project?.timeline[0].duration).toBe(0.1); // Minimum enforced
      expect(newState.isDirty).toBe(true);
    });

    it('should select timeline items', () => {
      const action: AppAction = {
        type: 'SELECT_TIMELINE_ITEMS',
        payload: ['item-1', 'item-2'],
      };

      const newState = appReducer(state, action);

      expect(newState.ui.timeline.selectedItems).toEqual(['item-1', 'item-2']);
    });

    it('should clear timeline selection', () => {
      // Select items first
      state = appReducer(state, {
        type: 'SELECT_TIMELINE_ITEMS',
        payload: ['item-1', 'item-2'],
      });

      const action: AppAction = { type: 'CLEAR_TIMELINE_SELECTION' };
      const newState = appReducer(state, action);

      expect(newState.ui.timeline.selectedItems).toEqual([]);
    });

    it('should duplicate timeline item', () => {
      // Add item first
      state = appReducer(state, {
        type: 'ADD_TIMELINE_ITEM',
        payload: mockTimelineItem,
      });

      const action: AppAction = {
        type: 'DUPLICATE_TIMELINE_ITEM',
        payload: 'item-1',
      };

      const newState = appReducer(state, action);

      expect(newState.project?.timeline).toHaveLength(2);
      expect(newState.project?.timeline[1].startTime).toBe(5); // Original duration
      expect(newState.project?.timeline[1].id).not.toBe('item-1');
      expect(newState.isDirty).toBe(true);
    });
  });

  describe('Media Actions', () => {
    const mockMediaAsset: MediaAsset = {
      id: 'asset-1',
      name: 'test-video.mp4',
      type: 'video',
      url: 'blob:test-url',
      duration: 30,
      metadata: {
        fileSize: 1024,
        mimeType: 'video/mp4',
      },
      createdAt: new Date(),
    };

    beforeEach(() => {
      // Create a project for media operations
      state = appReducer(state, {
        type: 'CREATE_PROJECT',
        payload: { name: 'Test Project' },
      });
    });

    it('should add media asset', () => {
      const action: AppAction = {
        type: 'ADD_MEDIA_ASSET',
        payload: mockMediaAsset,
      };

      const newState = appReducer(state, action);

      expect(newState.project?.mediaAssets).toHaveLength(1);
      expect(newState.project?.mediaAssets[0]).toEqual(mockMediaAsset);
      expect(newState.isDirty).toBe(true);
    });

    it('should remove media asset and associated timeline items', () => {
      // Add asset and timeline item
      state = appReducer(state, {
        type: 'ADD_MEDIA_ASSET',
        payload: mockMediaAsset,
      });
      state = appReducer(state, {
        type: 'ADD_TIMELINE_ITEM',
        payload: {
          id: 'item-1',
          assetId: 'asset-1',
          startTime: 0,
          duration: 5,
          track: 0,
          type: 'video',
          properties: {},
          animations: [],
        },
      });

      const action: AppAction = {
        type: 'REMOVE_MEDIA_ASSET',
        payload: 'asset-1',
      };

      const newState = appReducer(state, action);

      expect(newState.project?.mediaAssets).toHaveLength(0);
      expect(newState.project?.timeline).toHaveLength(0); // Associated timeline item removed
      expect(newState.isDirty).toBe(true);
    });

    it('should update media asset', () => {
      // Add asset first
      state = appReducer(state, {
        type: 'ADD_MEDIA_ASSET',
        payload: mockMediaAsset,
      });

      const action: AppAction = {
        type: 'UPDATE_MEDIA_ASSET',
        payload: {
          id: 'asset-1',
          updates: { name: 'updated-video.mp4', duration: 45 },
        },
      };

      const newState = appReducer(state, action);

      expect(newState.project?.mediaAssets[0].name).toBe('updated-video.mp4');
      expect(newState.project?.mediaAssets[0].duration).toBe(45);
      expect(newState.isDirty).toBe(true);
    });
  });

  describe('UI Actions', () => {
    it('should set current view', () => {
      const action: AppAction = {
        type: 'SET_CURRENT_VIEW',
        payload: 'studio',
      };

      const newState = appReducer(state, action);

      expect(newState.ui.currentView).toBe('studio');
    });

    it('should toggle sidebar visibility', () => {
      const initialVisibility = state.ui.sidebarVisible;
      const action: AppAction = { type: 'TOGGLE_SIDEBAR' };

      const newState = appReducer(state, action);

      expect(newState.ui.sidebarVisible).toBe(!initialVisibility);
    });

    it('should update playback state', () => {
      const action: AppAction = {
        type: 'UPDATE_PLAYBACK_STATE',
        payload: { isPlaying: true, currentTime: 10, volume: 0.8 },
      };

      const newState = appReducer(state, action);

      expect(newState.ui.playback.isPlaying).toBe(true);
      expect(newState.ui.playback.currentTime).toBe(10);
      expect(newState.ui.playback.volume).toBe(0.8);
    });

    it('should update timeline view state', () => {
      const action: AppAction = {
        type: 'UPDATE_TIMELINE_VIEW',
        payload: { zoom: 2, scrollPosition: 100, snapToGrid: false },
      };

      const newState = appReducer(state, action);

      expect(newState.ui.timeline.zoom).toBe(2);
      expect(newState.ui.timeline.scrollPosition).toBe(100);
      expect(newState.ui.timeline.snapToGrid).toBe(false);
    });

    it('should reset UI state', () => {
      // Modify UI state first
      state = appReducer(state, {
        type: 'UPDATE_PLAYBACK_STATE',
        payload: { isPlaying: true, currentTime: 10 },
      });

      const action: AppAction = { type: 'RESET_UI_STATE' };
      const newState = appReducer(state, action);

      expect(newState.ui.playback.isPlaying).toBe(false);
      expect(newState.ui.playback.currentTime).toBe(0);
      expect(newState.ui.currentView).toBe('dashboard');
    });
  });

  describe('Edge Cases', () => {
    it('should handle timeline actions when no project exists', () => {
      const action: AppAction = {
        type: 'ADD_TIMELINE_ITEM',
        payload: {
          id: 'item-1',
          assetId: 'asset-1',
          startTime: 0,
          duration: 5,
          track: 0,
          type: 'video',
          properties: {},
          animations: [],
        },
      };

      const newState = appReducer(state, action);

      expect(newState).toEqual(state); // No change when no project
    });

    it('should handle media actions when no project exists', () => {
      const action: AppAction = {
        type: 'ADD_MEDIA_ASSET',
        payload: {
          id: 'asset-1',
          name: 'test.mp4',
          type: 'video',
          url: 'blob:test',
          metadata: { fileSize: 1024, mimeType: 'video/mp4' },
          createdAt: new Date(),
        },
      };

      const newState = appReducer(state, action);

      expect(newState).toEqual(state); // No change when no project
    });

    it('should handle duplicate of non-existent timeline item', () => {
      // Create project but don't add any items
      state = appReducer(state, {
        type: 'CREATE_PROJECT',
        payload: { name: 'Test Project' },
      });

      const action: AppAction = {
        type: 'DUPLICATE_TIMELINE_ITEM',
        payload: 'non-existent-id',
      };

      const newState = appReducer(state, action);

      expect(newState.project?.timeline).toHaveLength(0);
    });
  });
});
