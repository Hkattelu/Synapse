import { create } from 'zustand';
import { temporal } from 'zundo';
import type { MediaAsset, Project, TimelineItem } from '@/lib/types';

// Simple throttle to coalesce rapid updates (e.g., drag/resize) into one history step
function throttle<T extends (...args: any[]) => void>(fn: T, wait = 150) {
  let last = 0;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let pendingArgs: any[] | null = null;
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      fn(...(pendingArgs as any[]));
      pendingArgs = null;
    } else if (!timeout) {
      timeout = setTimeout(() => {
        last = Date.now();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        fn(...(pendingArgs as any[]));
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
    updates: Partial<TimelineItem> & {
      properties?: Partial<TimelineItem['properties']>;
    }
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

// Vanilla store with temporal history. We track only timeline and mediaAssets in history.
export const useProjectStore = create(
  temporal<ProjectStoreState>(
    (set, get) => ({
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
            const u = updates;

            // Start with existing item
            let next: TimelineItem = c;

            // Apply defined top-level fields (excluding 'properties')
            (Object.keys(u) as (keyof TimelineItem)[]).forEach((k) => {
              if (k === 'properties') return;
              const v = u[k];
              if (v !== undefined) {
                next = { ...next, [k]: v } as TimelineItem;
              }
            });

            // Merge nested properties, ignoring undefined entries
            if (u.properties) {
              const definedProps = Object.fromEntries(
                Object.entries(u.properties).filter(([, v]) => v !== undefined)
              ) as Partial<TimelineItem['properties']>;

              if (Object.keys(definedProps).length > 0) {
                next = {
                  ...next,
                  properties: { ...next.properties, ...definedProps },
                };
              }
            }

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

      addMedia: (asset) => set((s) => ({ mediaAssets: [...s.mediaAssets, asset] })),

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
    }),
    {
      // Only record timeline + media changes in history
      partialize: (state) => ({
        timeline: state.timeline,
        mediaAssets: state.mediaAssets,
      }),
      // Group rapid successive updates (e.g., drag/resize)
      handleSet: (handle) => throttle(handle, 150),
      // Keep a reasonable cap on history
      limit: 200,
    }
  )
);

// React-friendly hook for the temporal store state (history stacks, undo/redo)
export const useProjectTemporal = create(useProjectStore.temporal);

// Convenience functions for outside-react usage
export const undoProject = () => useProjectStore.temporal.getState().undo();
export const redoProject = () => useProjectStore.temporal.getState().redo();
export const clearProjectHistory = () =>
  useProjectStore.temporal.getState().clear();
