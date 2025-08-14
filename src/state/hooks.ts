// Custom hooks for state management

import { useCallback, useMemo, useState } from 'react';
import { useAppContext } from './context';
import type { TimelineItem, MediaAsset, Project } from '../lib/types';
import { generateId } from '../lib/utils';

// Hook for project operations
export function useProject() {
  const { state, dispatch } = useAppContext();

  const createProject = useCallback(
    (name: string) => {
      dispatch({ type: 'CREATE_PROJECT', payload: { name } });
    },
    [dispatch]
  );

  const loadProject = useCallback(
    (project: Project) => {
      dispatch({ type: 'LOAD_PROJECT', payload: project });
    },
    [dispatch]
  );

  const updateProject = useCallback(
    (updates: Partial<Project>) => {
      dispatch({ type: 'UPDATE_PROJECT', payload: updates });
    },
    [dispatch]
  );

  const saveProject = useCallback(() => {
    dispatch({ type: 'SAVE_PROJECT' });
  }, [dispatch]);

  const resetProject = useCallback(() => {
    dispatch({ type: 'RESET_PROJECT' });
  }, [dispatch]);

  const switchProject = useCallback(
    (projectId: string) => {
      dispatch({ type: 'SWITCH_PROJECT', payload: projectId });
    },
    [dispatch]
  );

  const deleteProject = useCallback(
    (projectId: string) => {
      dispatch({ type: 'DELETE_PROJECT', payload: projectId });
    },
    [dispatch]
  );

  const duplicateProject = useCallback(
    (projectId: string) => {
      dispatch({ type: 'DUPLICATE_PROJECT', payload: projectId });
    },
    [dispatch]
  );

  const renameProject = useCallback(
    (projectId: string, name: string) => {
      dispatch({ type: 'RENAME_PROJECT', payload: { id: projectId, name } });
    },
    [dispatch]
  );

  const importProject = useCallback(
    (project: Project) => {
      dispatch({ type: 'IMPORT_PROJECT', payload: project });
    },
    [dispatch]
  );

  const exportProject = useCallback((projectId: string) => {
    dispatch({ type: 'EXPORT_PROJECT', payload: projectId });
  }, [dispatch]);

  return {
    project: state.project,
    projects: state.projects,
    isDirty: state.isDirty,
    lastSaved: state.lastSaved,
    isLoading: state.isLoading,
    createProject,
    loadProject,
    updateProject,
    saveProject,
    resetProject,
    switchProject,
    deleteProject,
    duplicateProject,
    renameProject,
    importProject,
    exportProject,
  };
}

// Hook for timeline operations
export function useTimeline() {
  const { state, dispatch } = useAppContext();
  const [currentTime, setCurrentTime] = useState(0);

  const addTimelineItem = useCallback(
    (item: Omit<TimelineItem, 'id'>) => {
      const newItem: TimelineItem = {
        ...item,
        id: generateId(),
        keyframes: item.keyframes || [],
      };
      dispatch({ type: 'ADD_TIMELINE_ITEM', payload: newItem });
      return newItem.id;
    },
    [dispatch]
  );

  const removeTimelineItem = useCallback(
    (id: string) => {
      dispatch({ type: 'REMOVE_TIMELINE_ITEM', payload: id });
    },
    [dispatch]
  );

  const updateTimelineItem = useCallback(
    (id: string, updates: Partial<TimelineItem>) => {
      dispatch({ type: 'UPDATE_TIMELINE_ITEM', payload: { id, updates } });
    },
    [dispatch]
  );

  const moveTimelineItem = useCallback(
    (id: string, startTime: number, track: number) => {
      dispatch({
        type: 'MOVE_TIMELINE_ITEM',
        payload: { id, startTime, track },
      });
    },
    [dispatch]
  );

  const resizeTimelineItem = useCallback(
    (id: string, duration: number) => {
      dispatch({ type: 'RESIZE_TIMELINE_ITEM', payload: { id, duration } });
    },
    [dispatch]
  );

  const selectTimelineItems = useCallback(
    (ids: string[]) => {
      dispatch({ type: 'SELECT_TIMELINE_ITEMS', payload: ids });
    },
    [dispatch]
  );

  const clearTimelineSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_TIMELINE_SELECTION' });
  }, [dispatch]);

  const duplicateTimelineItem = useCallback(
    (id: string) => {
      dispatch({ type: 'DUPLICATE_TIMELINE_ITEM', payload: id });
    },
    [dispatch]
  );

  // Computed values
  const timeline = state.project?.timeline || [];
  const selectedItems = state.ui.timeline.selectedItems;
  const selectedTimelineItems = useMemo(
    () => timeline.filter((item) => selectedItems.includes(item.id)),
    [timeline, selectedItems]
  );

  const timelineDuration = useMemo(() => {
    if (timeline.length === 0) return 0;
    return Math.max(...timeline.map((item) => item.startTime + item.duration));
  }, [timeline]);

  const getItemsAtTime = useCallback(
    (time: number) => {
      return timeline.filter(
        (item) =>
          time >= item.startTime && time < item.startTime + item.duration
      );
    },
    [timeline]
  );

  const getItemsByTrack = useCallback(
    (track: number) => {
      return timeline.filter((item) => item.track === track);
    },
    [timeline]
  );

  return {
    timeline,
    selectedItems,
    selectedTimelineItems,
    timelineDuration,
    currentTime,
    setCurrentTime,
    addTimelineItem,
    removeTimelineItem,
    updateTimelineItem,
    moveTimelineItem,
    resizeTimelineItem,
    selectTimelineItems,
    clearTimelineSelection,
    duplicateTimelineItem,
    getItemsAtTime,
    getItemsByTrack,
  };
}

// Hook for media asset operations
export function useMediaAssets() {
  const { state, dispatch } = useAppContext();

  const addMediaAsset = useCallback(
    (asset: Omit<MediaAsset, 'id' | 'createdAt'>) => {
      const newAsset: MediaAsset = {
        ...asset,
        id: generateId(),
        createdAt: new Date(),
      };
      dispatch({ type: 'ADD_MEDIA_ASSET', payload: newAsset });
      return newAsset.id;
    },
    [dispatch]
  );

  const removeMediaAsset = useCallback(
    (id: string) => {
      dispatch({ type: 'REMOVE_MEDIA_ASSET', payload: id });
    },
    [dispatch]
  );

  const updateMediaAsset = useCallback(
    (id: string, updates: Partial<MediaAsset>) => {
      dispatch({ type: 'UPDATE_MEDIA_ASSET', payload: { id, updates } });
    },
    [dispatch]
  );

  const mediaAssets = state.project?.mediaAssets || [];

  const getMediaAssetById = useCallback(
    (id: string) => {
      return mediaAssets.find((asset) => asset.id === id);
    },
    [mediaAssets]
  );

  const getMediaAssetsByType = useCallback(
    (type: MediaAsset['type']) => {
      return mediaAssets.filter((asset) => asset.type === type);
    },
    [mediaAssets]
  );

  return {
    mediaAssets,
    addMediaAsset,
    removeMediaAsset,
    updateMediaAsset,
    getMediaAssetById,
    getMediaAssetsByType,
  };
}

// Hook for UI state operations
export function useUI() {
  const { state, dispatch } = useAppContext();

  const setCurrentView = useCallback(
    (view: 'dashboard' | 'studio') => {
      dispatch({ type: 'SET_CURRENT_VIEW', payload: view });
    },
    [dispatch]
  );

  const toggleSidebar = useCallback(() => {
    dispatch({ type: 'TOGGLE_SIDEBAR' });
  }, [dispatch]);

  const toggleInspector = useCallback(() => {
    dispatch({ type: 'TOGGLE_INSPECTOR' });
  }, [dispatch]);

  const toggleMediaBin = useCallback(() => {
    dispatch({ type: 'TOGGLE_MEDIA_BIN' });
  }, [dispatch]);

  const updatePlaybackState = useCallback(
    (updates: Partial<typeof state.ui.playback>) => {
      dispatch({ type: 'UPDATE_PLAYBACK_STATE', payload: updates });
    },
    [dispatch]
  );

  const updateTimelineView = useCallback(
    (updates: Partial<typeof state.ui.timeline>) => {
      dispatch({ type: 'UPDATE_TIMELINE_VIEW', payload: updates });
    },
    [dispatch, state]
  );

  const resetUIState = useCallback(() => {
    dispatch({ type: 'RESET_UI_STATE' });
  }, [dispatch]);

  return {
    ui: state.ui,
    setCurrentView,
    toggleSidebar,
    toggleInspector,
    toggleMediaBin,
    updatePlaybackState,
    updateTimelineView,
    resetUIState,
  };
}

// Hook for playback controls
export function usePlayback() {
  const { state, dispatch } = useAppContext();
  const { playback } = state.ui;

  const play = useCallback(() => {
    dispatch({ type: 'UPDATE_PLAYBACK_STATE', payload: { isPlaying: true } });
  }, [dispatch]);

  const pause = useCallback(() => {
    dispatch({ type: 'UPDATE_PLAYBACK_STATE', payload: { isPlaying: false } });
  }, [dispatch]);

  const togglePlayback = useCallback(() => {
    dispatch({
      type: 'UPDATE_PLAYBACK_STATE',
      payload: { isPlaying: !playback.isPlaying },
    });
  }, [dispatch, playback.isPlaying]);

  const seek = useCallback(
    (time: number) => {
      dispatch({
        type: 'UPDATE_PLAYBACK_STATE',
        payload: { currentTime: time },
      });
    },
    [dispatch]
  );

  const setVolume = useCallback(
    (volume: number) => {
      dispatch({
        type: 'UPDATE_PLAYBACK_STATE',
        payload: { volume: Math.max(0, Math.min(1, volume)) },
      });
    },
    [dispatch]
  );

  const toggleMute = useCallback(() => {
    dispatch({
      type: 'UPDATE_PLAYBACK_STATE',
      payload: { muted: !playback.muted },
    });
  }, [dispatch, playback.muted]);

  return {
    playback,
    play,
    pause,
    togglePlayback,
    seek,
    setVolume,
    toggleMute,
  };
}
