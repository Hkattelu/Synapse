// State management types for Synapse Studio

import type {
  Project,
  TimelineItem,
  MediaAsset,
  UIState,
  MusicTrack,
} from '../lib/types';
import type { StoredProject } from '../lib/projectManager';

// Action types for state management
export type ProjectAction =
  | { type: 'CREATE_PROJECT'; payload: { name: string } }
  | { type: 'LOAD_PROJECT'; payload: Project }
  | { type: 'LOAD_PROJECTS_LIST'; payload: StoredProject[] }
  | { type: 'SWITCH_PROJECT'; payload: string }
  | { type: 'UPDATE_PROJECT'; payload: Partial<Project> }
  | { type: 'SAVE_PROJECT' }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'DUPLICATE_PROJECT'; payload: string }
  | { type: 'RENAME_PROJECT'; payload: { id: string; name: string } }
  | { type: 'IMPORT_PROJECT'; payload: Project }
  | { type: 'EXPORT_PROJECT'; payload: string }
  | { type: 'RESET_PROJECT' };

export type TimelineAction =
  | { type: 'ADD_TIMELINE_ITEM'; payload: TimelineItem }
  | { type: 'REMOVE_TIMELINE_ITEM'; payload: string }
  | {
    type: 'UPDATE_TIMELINE_ITEM';
    payload: { id: string; updates: Partial<TimelineItem> };
  }
  | {
    type: 'MOVE_TIMELINE_ITEM';
    payload: { id: string; startTime: number; track: number };
  }
  | { type: 'RESIZE_TIMELINE_ITEM'; payload: { id: string; duration: number } }
  | { type: 'SELECT_TIMELINE_ITEMS'; payload: string[] }
  | { type: 'CLEAR_TIMELINE_SELECTION' }
  | { type: 'DUPLICATE_TIMELINE_ITEM'; payload: string };

export type MediaAction =
  | { type: 'ADD_MEDIA_ASSET'; payload: MediaAsset }
  | { type: 'REMOVE_MEDIA_ASSET'; payload: string }
  | {
    type: 'UPDATE_MEDIA_ASSET';
    payload: { id: string; updates: Partial<MediaAsset> };
  };

export type UIAction =
  | { type: 'SET_CURRENT_VIEW'; payload: 'dashboard' | 'studio' }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'TOGGLE_INSPECTOR' }
  | { type: 'TOGGLE_MEDIA_BIN' }
  | { type: 'UPDATE_PLAYBACK_STATE'; payload: Partial<UIState['playback']> }
  | { type: 'UPDATE_TIMELINE_VIEW'; payload: Partial<UIState['timeline']> }
  | { type: 'LOAD_MUSIC_LIBRARY'; payload: MusicTrack[] }
  | { type: 'RESET_UI_STATE' };

export type SetLoadingAction = {
  type: 'SET_LOADING';
  payload: { isLoading: boolean; message?: string };
};

export type AppAction =
  | ProjectAction
  | TimelineAction
  | MediaAction
  | UIAction
  | SetLoadingAction;

// Combined application state
export interface AppState {
  // Current active project
  project: Project | null;
  // Collection of all saved projects
  projects: StoredProject[];
  // UI state
  ui: UIState;
  // Project state tracking
  lastSaved: Date | null;
  isDirty: boolean;
  // Loading states
  isLoading: boolean;
  loadingMessage?: string;
}

// Context types
export interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}
