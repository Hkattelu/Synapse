// State reducers for Synapse Studio

import type {
  AppState,
  AppAction,
  ProjectAction,
  TimelineAction,
  MediaAction,
  UIAction,
} from './types';
import type { Project, ProjectSettings, UIState } from '../lib/types';
import type { StoredProject } from '../lib/projectManager';
import { ProjectManager, downloadProjectFile } from '../lib/projectManager';
import { generateId } from '../lib/utils';

// Default project settings
const defaultProjectSettings: ProjectSettings = {
  width: 1920,
  height: 1080,
  fps: 30,
  duration: 60,
  backgroundColor: '#000000',
  audioSampleRate: 48000,
};

// Default UI state
const defaultUIState: UIState = {
  currentView: 'dashboard',
  sidebarVisible: true,
  inspectorVisible: true,
  mediaBinVisible: true,
  playback: {
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    muted: false,
  },
  timeline: {
    zoom: 1,
    scrollPosition: 0,
    selectedItems: [],
    snapToGrid: true,
    gridSize: 0.5,
    showKeyframes: true,
    trackHeight: 80,
    selectedKeyframes: [],
    timelineMode: 'standard' as const,
    verticalScrollPosition: 0,
  },
  musicLibrary: {
    tracks: [],
  },
};

// Initial application state
export const initialState: AppState = {
  project: null,
  projects: [],
  ui: defaultUIState,
  lastSaved: null,
  isDirty: false,
  isLoading: false,
};

// Project reducer
function projectReducer(state: AppState, action: ProjectAction): AppState {
  switch (action.type) {
    case 'CREATE_PROJECT': {
      const newProject: Project = {
        id: generateId(),
        name: action.payload.name,
        createdAt: new Date(),
        updatedAt: new Date(),
        timeline: [],
        mediaAssets: [],
        settings: defaultProjectSettings,
        version: '1.0.0',
      };
      return {
        ...state,
        project: newProject,
        isDirty: true,
        ui: { ...state.ui, currentView: 'studio' },
      };
    }

    case 'LOAD_PROJECT':
      return {
        ...state,
        project: action.payload,
        isDirty: false,
        ui: { ...state.ui, currentView: 'studio' },
      };

    case 'UPDATE_PROJECT':
      if (!state.project) return state;
      return {
        ...state,
        project: {
          ...state.project,
          ...action.payload,
          updatedAt: new Date(),
        },
        isDirty: true,
      };

    case 'SAVE_PROJECT':
      return {
        ...state,
        lastSaved: new Date(),
        isDirty: false,
      };

    case 'LOAD_PROJECTS_LIST':
      return {
        ...state,
        projects: action.payload,
        isLoading: false,
      };

    case 'SWITCH_PROJECT': {
      const storedProject = state.projects.find(
        (p) => p.project.id === action.payload
      );
      if (!storedProject) return state;

      return {
        ...state,
        project: storedProject.project,
        isDirty: false,
        lastSaved: storedProject.lastOpened,
        ui: { ...state.ui, currentView: 'studio' },
      };
    }

    case 'DELETE_PROJECT': {
      const updatedProjects = state.projects.filter(
        (p) => p.project.id !== action.payload
      );
      const currentProjectDeleted = state.project?.id === action.payload;

      return {
        ...state,
        projects: updatedProjects,
        project: currentProjectDeleted ? null : state.project,
        isDirty: currentProjectDeleted ? false : state.isDirty,
        lastSaved: currentProjectDeleted ? null : state.lastSaved,
        ui: currentProjectDeleted
          ? { ...state.ui, currentView: 'dashboard' }
          : state.ui,
      };
    }

    case 'DUPLICATE_PROJECT': {
      const originalProject = state.projects.find(
        (p) => p.project.id === action.payload
      )?.project;
      if (!originalProject) return state;

      // Create duplicated project with new ID
      const duplicatedProject: Project = {
        ...originalProject,
        id: generateId(),
        name: `${originalProject.name} (Copy)`,
        createdAt: new Date(),
        updatedAt: new Date(),
        timeline: originalProject.timeline.map((item) => ({
          ...item,
          id: generateId(),
        })),
        mediaAssets: originalProject.mediaAssets.map((asset) => ({
          ...asset,
          id: generateId(),
          createdAt: new Date(),
        })),
      };

      const newStoredProject: StoredProject = {
        project: duplicatedProject,
        lastOpened: new Date(),
      };

      return {
        ...state,
        projects: [newStoredProject, ...state.projects],
        project: duplicatedProject,
        isDirty: true,
        ui: { ...state.ui, currentView: 'studio' },
      };
    }

    case 'RENAME_PROJECT': {
      const updatedProjects = state.projects.map((p) =>
        p.project.id === action.payload.id
          ? {
              ...p,
              project: {
                ...p.project,
                name: action.payload.name,
                updatedAt: new Date(),
              },
              lastOpened: new Date(),
            }
          : p
      );

      const updatedCurrentProject =
        state.project?.id === action.payload.id
          ? {
              ...state.project,
              name: action.payload.name,
              updatedAt: new Date(),
            }
          : state.project;

      return {
        ...state,
        projects: updatedProjects,
        project: updatedCurrentProject,
        isDirty: state.project?.id === action.payload.id ? true : state.isDirty,
      };
    }

    case 'IMPORT_PROJECT': {
      const newStoredProject: StoredProject = {
        project: action.payload,
        lastOpened: new Date(),
      };

      return {
        ...state,
        projects: [newStoredProject, ...state.projects],
        project: action.payload,
        isDirty: true,
        ui: { ...state.ui, currentView: 'studio' },
      };
    }

    case 'EXPORT_PROJECT': {
      if (!state.project) return state;

      // Trigger file download (side effect handled outside reducer)
      try {
        downloadProjectFile(state.project);
      } catch (error) {
        console.error('Failed to export project:', error);
      }

      return state;
    }

    case 'RESET_PROJECT':
      return {
        ...state,
        project: null,
        isDirty: false,
        lastSaved: null,
        ui: { ...state.ui, currentView: 'dashboard' },
      };

    default:
      return state;
  }
}

// Timeline reducer
function timelineReducer(state: AppState, action: TimelineAction): AppState {
  if (!state.project) return state;

  switch (action.type) {
    case 'ADD_TIMELINE_ITEM':
      return {
        ...state,
        project: {
          ...state.project,
          timeline: [...state.project.timeline, action.payload],
          updatedAt: new Date(),
        },
        isDirty: true,
      };

    case 'REMOVE_TIMELINE_ITEM':
      return {
        ...state,
        project: {
          ...state.project,
          timeline: state.project.timeline.filter(
            (item) => item.id !== action.payload
          ),
          updatedAt: new Date(),
        },
        ui: {
          ...state.ui,
          timeline: {
            ...state.ui.timeline,
            selectedItems: state.ui.timeline.selectedItems.filter(
              (id) => id !== action.payload
            ),
          },
        },
        isDirty: true,
      };

    case 'UPDATE_TIMELINE_ITEM':
      return {
        ...state,
        project: {
          ...state.project,
          timeline: state.project.timeline.map((item) =>
            item.id === action.payload.id
              ? { ...item, ...action.payload.updates }
              : item
          ),
          updatedAt: new Date(),
        },
        isDirty: true,
      };

    case 'MOVE_TIMELINE_ITEM':
      return {
        ...state,
        project: {
          ...state.project,
          timeline: state.project.timeline.map((item) =>
            item.id === action.payload.id
              ? {
                  ...item,
                  startTime: action.payload.startTime,
                  track: action.payload.track,
                }
              : item
          ),
          updatedAt: new Date(),
        },
        isDirty: true,
      };

    case 'RESIZE_TIMELINE_ITEM':
      return {
        ...state,
        project: {
          ...state.project,
          timeline: state.project.timeline.map((item) =>
            item.id === action.payload.id
              ? { ...item, duration: Math.max(0.1, action.payload.duration) }
              : item
          ),
          updatedAt: new Date(),
        },
        isDirty: true,
      };

    case 'SELECT_TIMELINE_ITEMS':
      return {
        ...state,
        ui: {
          ...state.ui,
          timeline: {
            ...state.ui.timeline,
            selectedItems: action.payload,
          },
        },
      };

    case 'CLEAR_TIMELINE_SELECTION':
      return {
        ...state,
        ui: {
          ...state.ui,
          timeline: {
            ...state.ui.timeline,
            selectedItems: [],
          },
        },
      };

    case 'DUPLICATE_TIMELINE_ITEM': {
      const itemToDuplicate = state.project.timeline.find(
        (item) => item.id === action.payload
      );
      if (!itemToDuplicate) return state;

      const duplicatedItem = {
        ...itemToDuplicate,
        id: generateId(),
        startTime: itemToDuplicate.startTime + itemToDuplicate.duration,
      };

      return {
        ...state,
        project: {
          ...state.project,
          timeline: [...state.project.timeline, duplicatedItem],
          updatedAt: new Date(),
        },
        isDirty: true,
      };
    }

    default:
      return state;
  }
}

// Media reducer
function mediaReducer(state: AppState, action: MediaAction): AppState {
  if (!state.project) return state;

  switch (action.type) {
    case 'ADD_MEDIA_ASSET':
      return {
        ...state,
        project: {
          ...state.project,
          mediaAssets: [...state.project.mediaAssets, action.payload],
          updatedAt: new Date(),
        },
        isDirty: true,
      };

    case 'REMOVE_MEDIA_ASSET': {
      // Also remove any timeline items that reference this asset
      const filteredTimeline = state.project.timeline.filter(
        (item) => item.assetId !== action.payload
      );

      return {
        ...state,
        project: {
          ...state.project,
          mediaAssets: state.project.mediaAssets.filter(
            (asset) => asset.id !== action.payload
          ),
          timeline: filteredTimeline,
          updatedAt: new Date(),
        },
        isDirty: true,
      };
    }

    case 'UPDATE_MEDIA_ASSET':
      return {
        ...state,
        project: {
          ...state.project,
          mediaAssets: state.project.mediaAssets.map((asset) =>
            asset.id === action.payload.id
              ? { ...asset, ...action.payload.updates }
              : asset
          ),
          updatedAt: new Date(),
        },
        isDirty: true,
      };

    default:
      return state;
  }
}

// UI reducer
function uiReducer(state: AppState, action: UIAction): AppState {
  switch (action.type) {
    case 'SET_CURRENT_VIEW':
      return {
        ...state,
        ui: {
          ...state.ui,
          currentView: action.payload,
        },
      };

    case 'TOGGLE_SIDEBAR':
      return {
        ...state,
        ui: {
          ...state.ui,
          sidebarVisible: !state.ui.sidebarVisible,
        },
      };

    case 'TOGGLE_INSPECTOR':
      return {
        ...state,
        ui: {
          ...state.ui,
          inspectorVisible: !state.ui.inspectorVisible,
        },
      };

    case 'TOGGLE_MEDIA_BIN':
      return {
        ...state,
        ui: {
          ...state.ui,
          mediaBinVisible: !state.ui.mediaBinVisible,
        },
      };

    case 'UPDATE_PLAYBACK_STATE':
      return {
        ...state,
        ui: {
          ...state.ui,
          playback: {
            ...state.ui.playback,
            ...action.payload,
          },
        },
      };

    case 'UPDATE_TIMELINE_VIEW':
      return {
        ...state,
        ui: {
          ...state.ui,
          timeline: {
            ...state.ui.timeline,
            ...action.payload,
          },
        },
      };

    case 'LOAD_MUSIC_LIBRARY':
      return {
        ...state,
        ui: {
          ...state.ui,
          musicLibrary: {
            tracks: action.payload,
          },
        },
      };

    case 'RESET_UI_STATE':
      return {
        ...state,
        ui: defaultUIState,
      };

    default:
      return state;
  }
}

// Main app reducer
export function appReducer(state: AppState, action: AppAction): AppState {
  // Route actions to appropriate reducers
  switch (action.type) {
    // Project actions
    case 'CREATE_PROJECT':
    case 'LOAD_PROJECT':
    case 'LOAD_PROJECTS_LIST':
    case 'SWITCH_PROJECT':
    case 'UPDATE_PROJECT':
    case 'SAVE_PROJECT':
    case 'DELETE_PROJECT':
    case 'DUPLICATE_PROJECT':
    case 'RENAME_PROJECT':
    case 'IMPORT_PROJECT':
    case 'EXPORT_PROJECT':
    case 'RESET_PROJECT':
      return projectReducer(state, action as ProjectAction);

    // Timeline actions
    case 'ADD_TIMELINE_ITEM':
    case 'REMOVE_TIMELINE_ITEM':
    case 'UPDATE_TIMELINE_ITEM':
    case 'MOVE_TIMELINE_ITEM':
    case 'RESIZE_TIMELINE_ITEM':
    case 'SELECT_TIMELINE_ITEMS':
    case 'CLEAR_TIMELINE_SELECTION':
    case 'DUPLICATE_TIMELINE_ITEM':
      return timelineReducer(state, action as TimelineAction);

    // Media actions
    case 'ADD_MEDIA_ASSET':
    case 'REMOVE_MEDIA_ASSET':
    case 'UPDATE_MEDIA_ASSET':
      return mediaReducer(state, action as MediaAction);

    // UI actions
    case 'SET_CURRENT_VIEW':
    case 'TOGGLE_SIDEBAR':
    case 'TOGGLE_INSPECTOR':
    case 'TOGGLE_MEDIA_BIN':
    case 'UPDATE_PLAYBACK_STATE':
    case 'UPDATE_TIMELINE_VIEW':
    case 'RESET_UI_STATE':
      return uiReducer(state, action as UIAction);

    default:
      return state;
  }
}
