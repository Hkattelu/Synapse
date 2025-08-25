// Custom hooks for state management

import { useCallback, useMemo, useState } from 'react';
import { useAppContext } from './context';
// HistoryProvider remains for legacy consumers, but timeline/media now route through zustand temporal
import type { TimelineItem, MediaAsset, Project } from '../lib/types';
import { generateId } from '../lib/utils';
import { useProjectStore } from './projectStore';

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

  const exportProject = useCallback(
    (projectId: string) => {
      dispatch({ type: 'EXPORT_PROJECT', payload: projectId });
    },
    [dispatch]
  );

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
  const timeline = useProjectStore((s) => s.timeline);
  const addClipToTimeline = useProjectStore((s) => s.addClipToTimeline);
  const deleteClip = useProjectStore((s) => s.deleteClip);
  const updateClipProperties = useProjectStore((s) => s.updateClipProperties);
  const moveClip = useProjectStore((s) => s.moveClip);
  const resizeClip = useProjectStore((s) => s.resizeClip);
  const [currentTime, setCurrentTime] = useState(0);

  // Temporal history is handled inside the zustand store; no explicit execute wrapper needed

  const addTimelineItem = useCallback(
    (item: Omit<TimelineItem, 'id'>) => {
      const newItem: TimelineItem = {
        ...item,
        id: generateId(),
        keyframes: item.keyframes || [],
      };
      // Single write path: mutate the Zustand store only; App-level bridge mirrors reducer state
      addClipToTimeline(newItem);
      return newItem.id;
    },
    [addClipToTimeline]
  );

  const removeTimelineItem = useCallback(
    (id: string) => {
      // Single write path: zustand store only
      deleteClip(id);
    },
    [deleteClip]
  );

  const updateTimelineItem = useCallback(
    (id: string, updates: Partial<TimelineItem>) => {
      // Single write path: zustand store only
      updateClipProperties(id, updates);
    },
    [updateClipProperties]
  );

  // Note: undo/redo is handled by the temporal store; we no longer compute per-call reverse patches here.

  const moveTimelineItem = useCallback(
    (id: string, startTime: number, track: number) => {
      // Single write path: zustand store only
      moveClip(id, startTime, track);
    },
    [moveClip]
  );

  const resizeTimelineItem = useCallback(
    (id: string, duration: number) => {
      // Single write path: zustand store only
      resizeClip(id, duration);
    },
    [resizeClip]
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
      const existing = timeline.find((t) => t.id === id);
      if (!existing) return null;
      const dup: TimelineItem = {
        ...existing,
        id: generateId(),
        // Nudge start slightly to avoid perfect overlap; keep same track
        startTime: existing.startTime + 0.05,
        // Ensure keyframes are duplicated by value
        keyframes: (existing.keyframes ?? []).map((k) => ({
          ...k,
          id: generateId(),
        })),
        // Shallow-copy nested properties to decouple references
        properties: { ...(existing.properties ?? {}) },
        animations: (existing.animations ?? []).map((a) => ({ ...a })),
      };
      addClipToTimeline(dup);
      return dup.id;
    },
    [timeline, addClipToTimeline]
  );

  // Computed values
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
  // No reducer writes here—Zustand is the single write path. The App-level bridge mirrors state for legacy readers.
  const mediaAssets = useProjectStore((s) => s.mediaAssets);
  const addMedia = useProjectStore((s) => s.addMedia);
  const removeMedia = useProjectStore((s) => s.removeMedia);
  const updateMedia = useProjectStore((s) => s.updateMedia);

  const addMediaAsset = useCallback(
    (asset: Omit<MediaAsset, 'id' | 'createdAt'>) => {
      const newAsset: MediaAsset = {
        ...asset,
        id: generateId(),
        createdAt: new Date(),
      };
      addMedia(newAsset);
      return newAsset.id;
    },
    [addMedia]
  );

  const removeMediaAsset = useCallback(
    (id: string) => {
      // Single write path: zustand store only
      removeMedia(id);
    },
    [removeMedia]
  );

  const updateMediaAsset = useCallback(
    (id: string, updates: Partial<MediaAsset>) => {
      // Single write path: zustand store only
      updateMedia(id, updates);
    },
    [updateMedia]
  );

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
