import { create } from 'zustand';
import { temporal } from 'zundo';
import type { MediaAsset, Project, TimelineItem } from '../lib/types';

// Utility: omit null/undefined fields from a partial update object
function omitNil<T extends object>(obj: Partial<T> | undefined): Partial<T> {
  if (!obj) return {} as Partial<T>;
  const entries = Object.entries(obj as Record<string, unknown>);
  return Object.fromEntries(
    entries.filter(([, v]) => v !== undefined && v !== null)
  ) as Partial<T>;
}

// Simple throttle to coalesce rapid updates (e.g., drag/resize) into one history step
function throttle<T extends (...args: unknown[]) => void>(fn: T, wait = 150) {
  let last = 0;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let pendingArgs: Parameters<T> | null = null;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = wait - (now - last);
    pendingArgs = args;
    if (remaining <= 0) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      last = now;
      fn(...(pendingArgs as Parameters<T>));
      pendingArgs = null;
    } else if (!timeout) {
      timeout = setTimeout(() => {
        last = Date.now();
        fn(...(pendingArgs as Parameters<T>));
        pendingArgs = null;
        timeout = null;
      }, remaining);
    }
  };
}

export type ProjectStoreState = {
  timeline: TimelineItem[];
  mediaAssets: MediaAsset[];
  selectedItemId: string | null;

  // Core actions tracked by history
  addClipToTimeline: (clip: TimelineItem) => void;
  deleteClip: (clipId: string) => void;
  updateClipProperties: (
    clipId: string,
    updates:
      | Partial<TimelineItem>
      | { properties?: Partial<TimelineItem['properties']> }
  ) => void;
  moveClip: (clipId: string, startTime: number, track: number) => void;
  resizeClip: (clipId: string, duration: number) => void;

  addMedia: (asset: MediaAsset) => void;
  removeMedia: (assetId: string) => void;
  updateMedia: (assetId: string, updates: Partial<MediaAsset>) => void;

  // Utility actions (not tracked by history via partialize)
  clearSelection: () => void;

  // Sync helpers
  loadProjectIntoStore: (project: Project | null) => void;
};

// Create the base store first
const useProjectStoreBase = create<ProjectStoreState>((set) => ({
  timeline: [],
  mediaAssets: [],
  selectedItemId: null,

  addClipToTimeline: (clip) =>
    set((s) => ({ timeline: [...s.timeline, clip] })),

  deleteClip: (clipId) =>
    set((s) => ({ timeline: s.timeline.filter((c) => c.id !== clipId) })),

  updateClipProperties: (clipId, updates) =>
    set((s) => ({
      timeline: s.timeline.map((c) => {
        if (c.id !== clipId) return c;
        const u = updates as Partial<TimelineItem> & {
          properties?: Partial<TimelineItem['properties']>;
        };
        const { properties, ...rest } = u;
        const next: TimelineItem = {
          ...c,
          ...omitNil<TimelineItem>(rest),
          properties: properties
            ? {
                ...c.properties,
                ...omitNil<typeof c.properties>(properties),
              }
            : c.properties,
        };
        return next;
      }),
    })),

  moveClip: (clipId, startTime, track) =>
    set((s) => ({
      timeline: s.timeline.map((c) =>
        c.id === clipId ? { ...c, startTime, track } : c
      ),
    })),

  resizeClip: (clipId, duration) =>
    set((s) => ({
      timeline: s.timeline.map((c) =>
        c.id === clipId
          ? { ...c, duration: Math.max(0.1, Number(duration) || 0) }
          : c
      ),
    })),

  addMedia: (asset) =>
    set((s) => ({ mediaAssets: [...s.mediaAssets, asset] })),

  removeMedia: (assetId) =>
    set((s) => ({
      mediaAssets: s.mediaAssets.filter((a) => a.id !== assetId),
      timeline: s.timeline.filter((t) => t.assetId !== assetId),
    })),

  updateMedia: (assetId, updates) =>
    set((s) => ({
      mediaAssets: s.mediaAssets.map((a) =>
        a.id === assetId ? { ...a, ...updates } : a
      ),
    })),

  clearSelection: () => set(() => ({ selectedItemId: null })),

  loadProjectIntoStore: (project) =>
    set(() => ({
      timeline: project?.timeline ?? [],
      mediaAssets: project?.mediaAssets ?? [],
      selectedItemId: null,
    })),
}));

// Temporarily disable temporal wrapper to fix the initialization error
// TODO: Re-enable temporal wrapper once zundo compatibility issues are resolved
const useProjectStore = Object.assign(useProjectStoreBase, {
  temporal: () => ({
    undo: () => {
      console.log('Undo functionality temporarily disabled');
    },
    redo: () => {
      console.log('Redo functionality temporarily disabled');
    },
    pastStates: [],
    futureStates: [],
    clear: () => {},
  }),
}) as typeof useProjectStoreBase & {
  temporal: () => {
    undo: () => void;
    redo: () => void;
    pastStates: any[];
    futureStates: any[];
    clear: () => void;
  };
  subscribe: (listener: (state: any) => void) => () => void;
};

export { useProjectStore };

// React-friendly hook for the temporal store state (history stacks, undo/redo)
export const useProjectTemporal = () => {
  try {
    if (useProjectStore && typeof useProjectStore.temporal === 'function') {
      return useProjectStore.temporal();
    }
    throw new Error('Temporal store not available');
  } catch {
    // Fallback if temporal store isn't ready yet
    return { 
      undo: () => {}, 
      redo: () => {}, 
      pastStates: [], 
      futureStates: [],
      clear: () => {}
    };
  }
};

// Export the base store for imperative access
export const projectStoreApi = useProjectStoreBase;

// Convenience functions for outside-react usage - with safe access
export const undoProject = () => {
  try {
    if (useProjectStore && typeof useProjectStore.temporal === 'function') {
      const temporal = useProjectStore.temporal();
      if (temporal?.undo) temporal.undo();
    }
  } catch (error) {
    console.warn('Failed to undo:', error);
  }
};

export const redoProject = () => {
  try {
    if (useProjectStore && typeof useProjectStore.temporal === 'function') {
      const temporal = useProjectStore.temporal();
      if (temporal?.redo) temporal.redo();
    }
  } catch (error) {
    console.warn('Failed to redo:', error);
  }
};

export const clearProjectHistory = () => {
  try {
    if (useProjectStore && typeof useProjectStore.temporal === 'function') {
      const temporal = useProjectStore.temporal();
      if (temporal?.clear) temporal.clear();
    }
  } catch (error) {
    console.warn('Failed to clear history:', error);
  }
};
