import React, { createContext, useCallback, useContext, useMemo, useRef } from 'react';
import type { TimelineItem } from '../lib/types';
import { useAppContext } from './context';

// Command interface for undo/redo
export interface Command {
  label: string;
  do: () => void | Promise<void>;
  undo: () => void | Promise<void>;
}

interface HistoryContextValue {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  clear: () => void;
  execute: (cmd: Command) => Promise<void>;
}

const HistoryContext = createContext<HistoryContextValue | null>(null);

export const useHistory = (): HistoryContextValue => {
  const ctx = useContext(HistoryContext);
  if (!ctx) throw new Error('useHistory must be used within HistoryProvider');
  return ctx;
};

export const HistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Using refs to avoid rerenders on every push/pop; we expose booleans via getters
  const undoStack = useRef<Command[]>([]);
  const redoStack = useRef<Command[]>([]);
  const [, force] = React.useReducer((x) => x + 1, 0);

  const undo = useCallback(() => {
    const cmd = undoStack.current.pop();
    if (!cmd) return;
    // On undo, push to redo
    Promise.resolve(cmd.undo()).finally(() => {
      redoStack.current.push(cmd);
      force();
    });
  }, []);

  const redo = useCallback(() => {
    const cmd = redoStack.current.pop();
    if (!cmd) return;
    Promise.resolve(cmd.do()).finally(() => {
      undoStack.current.push(cmd);
      force();
    });
  }, []);

  const clear = useCallback(() => {
    undoStack.current = [];
    redoStack.current = [];
    force();
  }, []);

  const execute = useCallback(async (cmd: Command) => {
    await Promise.resolve(cmd.do());
    undoStack.current.push(cmd);
    // Clear redo stack after a new action
    redoStack.current = [];
    force();
  }, []);

  const value = useMemo(
    () => ({
      undo,
      redo,
      clear,
      execute,
      get canUndo() {
        return undoStack.current.length > 0;
      },
      get canRedo() {
        return redoStack.current.length > 0;
      },
    }) as HistoryContextValue,
    [undo, redo, clear, execute]
  );

  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
};

// Prebuilt commands for timeline operations
export const createAddItemCommand = (
  item: TimelineItem,
  dispatch: (action: any) => void
): Command => ({
  label: 'Add Item',
  do: () => {
    dispatch({ type: 'ADD_TIMELINE_ITEM', payload: item });
  },
  undo: () => {
    dispatch({ type: 'REMOVE_TIMELINE_ITEM', payload: item.id });
  },
});

export const createRemoveItemCommand = (
  item: TimelineItem,
  dispatch: (action: any) => void
): Command => ({
  label: 'Remove Item',
  do: () => {
    dispatch({ type: 'REMOVE_TIMELINE_ITEM', payload: item.id });
  },
  undo: () => {
    dispatch({ type: 'ADD_TIMELINE_ITEM', payload: item });
  },
});

export const createUpdateItemCommand = (
  id: string,
  before: Partial<TimelineItem>,
  after: Partial<TimelineItem>,
  dispatch: (action: any) => void
): Command => ({
  label: 'Update Item',
  do: () => {
    dispatch({ type: 'UPDATE_TIMELINE_ITEM', payload: { id, updates: after } });
  },
  undo: () => {
    dispatch({ type: 'UPDATE_TIMELINE_ITEM', payload: { id, updates: before } });
  },
});

export const createMoveItemCommand = (
  id: string,
  from: { startTime: number; track: number },
  to: { startTime: number; track: number },
  dispatch: (action: any) => void
): Command => ({
  label: 'Move Item',
  do: () => {
    dispatch({ type: 'MOVE_TIMELINE_ITEM', payload: { id, ...to } });
  },
  undo: () => {
    dispatch({ type: 'MOVE_TIMELINE_ITEM', payload: { id, ...from } });
  },
});

export const createResizeItemCommand = (
  id: string,
  fromDuration: number,
  toDuration: number,
  dispatch: (action: any) => void
): Command => ({
  label: 'Resize Item',
  do: () => {
    dispatch({ type: 'RESIZE_TIMELINE_ITEM', payload: { id, duration: toDuration } });
  },
  undo: () => {
    dispatch({ type: 'RESIZE_TIMELINE_ITEM', payload: { id, duration: fromDuration } });
  },
});

