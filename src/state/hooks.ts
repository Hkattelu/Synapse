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

  // Temporarily use the base store directly to avoid temporal issues
  const timeline = state.project?.timeline || [];
  const [currentTime, setCurrentTime] = useState(0);

  // Temporal history is handled inside the zustand store; no explicit execute wrapper needed

  const addTimelineItem = useCallback(
    (item: Omit<TimelineItem, 'id'>) => {
      const newItem: TimelineItem = {
        ...item,
        id: generateId(),
        keyframes: item.keyframes || [],
      };
      // Use dispatch for now to avoid temporal store issues
      dispatch({
        type: 'UPDATE_PROJECT',
        payload: { timeline: [...timeline, newItem] },
      });
      return newItem.id;
    },
    [dispatch, timeline]
  );

  const removeTimelineItem = useCallback(
    (id: string) => {
      // Use dispatch for now to avoid temporal store issues
      const newTimeline = timeline.filter((item) => item.id !== id);
      dispatch({ type: 'UPDATE_PROJECT', payload: { timeline: newTimeline } });
    },
    [dispatch, timeline]
  );

  const updateTimelineItem = useCallback(
    (id: string, updates: Partial<TimelineItem>) => {
      // Use dispatch for now to avoid temporal store issues
      const newTimeline = timeline.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      );
      dispatch({ type: 'UPDATE_PROJECT', payload: { timeline: newTimeline } });
    },
    [dispatch, timeline]
  );

  // Note: undo/redo is handled by the temporal store; we no longer compute per-call reverse patches here.

  const moveTimelineItem = useCallback(
    (id: string, startTime: number, track: number) => {
      // Use dispatch for now to avoid temporal store issues
      const newTimeline = timeline.map((item) =>
        item.id === id ? { ...item, startTime, track } : item
      );
      dispatch({ type: 'UPDATE_PROJECT', payload: { timeline: newTimeline } });
    },
    [dispatch, timeline]
  );

  const resizeTimelineItem = useCallback(
    (id: string, duration: number) => {
      // Use dispatch for now to avoid temporal store issues
      const newTimeline = timeline.map((item) =>
        item.id === id
          ? { ...item, duration: Math.max(0.1, Number(duration) || 0) }
          : item
      );
      dispatch({ type: 'UPDATE_PROJECT', payload: { timeline: newTimeline } });
    },
    [dispatch, timeline]
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
      const newTimeline = [...timeline, dup];
      dispatch({ type: 'UPDATE_PROJECT', payload: { timeline: newTimeline } });
      return dup.id;
    },
    [timeline, dispatch]
  );

  // Split items at a given time. If ids provided, only split those ids that intersect time;
  // otherwise split all items that intersect the time.
  const splitTimelineItemsAt = useCallback(
    (time: number, ids?: string[]) => {
      const EPS = 1e-6;
      const targetIds = ids && ids.length > 0 ? new Set(ids) : null;
      const updated: TimelineItem[] = [];
      for (const item of timeline) {
        const start = item.startTime;
        const end = item.startTime + item.duration;
        const intersects = time > start + EPS && time < end - EPS;
        const shouldConsider = !targetIds || targetIds.has(item.id);
        if (intersects && shouldConsider) {
          // Keep original as left piece (update duration)
          const left: TimelineItem = { ...item, duration: time - start };
          // Create right piece
          const right: TimelineItem = {
            ...item,
            id: generateId(),
            startTime: time,
            duration: end - time,
            // Duplicate keyframes/animations by value to decouple references
            keyframes: (item.keyframes ?? []).map((k) => ({ ...k, id: generateId() })),
            animations: (item.animations ?? []).map((a) => ({ ...a })),
            properties: { ...(item.properties ?? {}) },
          };
          updated.push(left, right);
        } else {
          updated.push(item);
        }
      }
      if (updated !== timeline) {
        dispatch({ type: 'UPDATE_PROJECT', payload: { timeline: updated } });
      }
    },
    [timeline, dispatch]
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
    splitTimelineItemsAt,
    getItemsAtTime,
    getItemsByTrack,
  };
}

// Hook for media asset operations
export function useMediaAssets() {
  const { state, dispatch } = useAppContext();
  // Temporarily use the reducer state to avoid temporal store issues
  const mediaAssets = state.project?.mediaAssets || [];

  const addMediaAsset = useCallback(
    (asset: Omit<MediaAsset, 'id' | 'createdAt'>) => {
      const newAsset: MediaAsset = {
        ...asset,
        id: generateId(),
        createdAt: new Date(),
      };
      const newMediaAssets = [...mediaAssets, newAsset];
      dispatch({
        type: 'UPDATE_PROJECT',
        payload: { mediaAssets: newMediaAssets },
      });
      return newAsset.id;
    },
    [dispatch, mediaAssets]
  );

  const removeMediaAsset = useCallback(
    (id: string) => {
      const newMediaAssets = mediaAssets.filter((asset) => asset.id !== id);
      const newTimeline =
        state.project?.timeline?.filter((item) => item.assetId !== id) || [];
      dispatch({
        type: 'UPDATE_PROJECT',
        payload: { mediaAssets: newMediaAssets, timeline: newTimeline },
      });
    },
    [dispatch, mediaAssets, state.project?.timeline]
  );

  const updateMediaAsset = useCallback(
    (id: string, updates: Partial<MediaAsset>) => {
      const newMediaAssets = mediaAssets.map((asset) =>
        asset.id === id ? { ...asset, ...updates } : asset
      );
      dispatch({
        type: 'UPDATE_PROJECT',
        payload: { mediaAssets: newMediaAssets },
      });
    },
    [dispatch, mediaAssets]
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

  const setUIMode = useCallback(
    (mode: 'simplified' | 'advanced') => {
      dispatch({ type: 'SET_UI_MODE', payload: mode });
    },
    [dispatch]
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
    setUIMode,
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
