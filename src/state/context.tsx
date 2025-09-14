// React Context for global state management

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
} from 'react';
import type { ReactNode } from 'react';
import type { AppState, AppAction, AppContextType } from './types';
import { appReducer, initialState } from './reducers';
import { ProjectManager } from '../lib/projectManager';
import { loadSampleDataForDev } from '../data/sampleProjects';
import { projectStoreApi, clearProjectHistory } from './projectStore';

// Create the context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Storage key for localStorage
const STORAGE_KEY = 'synapse-studio-state';

interface AppProviderProps {
  children: ReactNode;
}

// Context provider component
export function AppProvider({ children }: AppProviderProps) {
  // Initialize state with project manager integration
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Keep zustand project store in sync with current project and reset history on project switches
  const lastProjectIdRef = useRef<string | null>(null);
  useEffect(() => {
    const currentId = state.project?.id ?? null;
    if (currentId !== lastProjectIdRef.current) {
      try {
        // Load current project timeline/media into the temporal store
        if (projectStoreApi?.getState) {
          projectStoreApi.getState().loadProjectIntoStore(state.project);
        }
        // Clear undo/redo stacks when switching projects
        clearProjectHistory();
        lastProjectIdRef.current = currentId;
      } catch (error) {
        console.warn('Failed to sync project store:', error);
        lastProjectIdRef.current = currentId;
      }
    }
  }, [state.project]);

  // Load projects on app startup
  useEffect(() => {
    async function loadInitialData() {
      try {
        // Show loading message
        dispatch({
          type: 'SET_LOADING',
          payload: { isLoading: true, message: 'Loading projects…' },
        });
        // Load all projects
        let projects = await ProjectManager.getAllProjects();

        // In development mode, always ensure sample data exists and load starter project
        if (import.meta.env.DEV) {
          const sampleStored = loadSampleDataForDev();
          const sampleIds = new Set(sampleStored.map((s) => s.project.id));

          // Ensure sample projects exist in storage
          const missingSamples = sampleStored.filter(
            (s) => !projects.some((p) => p.project.id === s.project.id)
          );
          if (missingSamples.length > 0) {
            for (const s of missingSamples) {
              await ProjectManager.saveProject(s.project);
            }
            projects = await ProjectManager.getAllProjects();
          }

          // Prefer loading the first sample project in dev
          const preferredId = sampleStored[0]?.project.id;
          const starterProject =
            (preferredId &&
              projects.find((p) => p.project.id === preferredId)) ||
            projects.find((p) => sampleIds.has(p.project.id));

          if (starterProject) {
            console.log('🎬 Loading starter project for development');
            dispatch({
              type: 'LOAD_PROJECT',
              payload: starterProject.project,
            });
          }
        }
        // In production mode, load the last opened project
        else {
          // Load current project if exists
          if (projects.length > 0) {
            const currentProject = ProjectManager.getCurrentProject();
            if (currentProject) {
              dispatch({
                type: 'LOAD_PROJECT',
                payload: currentProject.project,
              });
            } else {
              // If no current project, load the most recently updated one
              const sortedProjects = [...projects].sort(
                (a, b) =>
                  new Date(b.project.updatedAt).getTime() -
                  new Date(a.project.updatedAt).getTime()
              );
              if (sortedProjects.length > 0) {
                dispatch({
                  type: 'LOAD_PROJECT',
                  payload: sortedProjects[0].project,
                });
              }
            }
          }
        }

        dispatch({ type: 'LOAD_PROJECTS_LIST', payload: projects });

        // Fetch Music Library metadata (public JSON) in parallel to startup
        // Non-fatal if it fails; UI will simply show empty library
        try {
          // Skip in tests and non-window environments to avoid noisy fetches
          const isVitest = Boolean((import.meta as any)?.vitest);
          if (typeof window !== 'undefined' && !isVitest) {
            // Build URL from Vite base so non-root deployments work (e.g., /app/)
            const rawBase = (import.meta as any)?.env?.BASE_URL ?? '/';
            const origin = window.location?.origin ?? 'http://localhost';
            const baseUrl = new URL(rawBase, origin);
            const url = new URL('music/library.json', baseUrl).toString();

            // Fire-and-forget; do not block startup loading state
            void fetch(url)
              .then(async (res) => {
                if (!res.ok) return;
                const raw = await res.json();
                if (!Array.isArray(raw)) return;
                const normalized = raw
                  .filter(
                    (t: unknown) =>
                      t &&
                      typeof (t as any).title === 'string' &&
                      typeof (t as any).url === 'string' &&
                      Number.isFinite(Number((t as any).duration))
                  )
                  .map((t: any) => {
                    const duration = Number((t as any).duration);
                    const title = String((t as any).title);
                    const urlStr = String((t as any).url);
                    const genre =
                      typeof (t as any).genre === 'string' &&
                      (t as any).genre.trim().length > 0
                        ? (t as any).genre
                        : 'Misc';
                    const id = String((t as any).id ?? `${title}::${urlStr}`);
                    return {
                      id,
                      title,
                      duration,
                      genre,
                      url: urlStr,
                      license:
                        typeof (t as any).license === 'string'
                          ? (t as any).license
                          : undefined,
                      source:
                        typeof (t as any).source === 'string'
                          ? (t as any).source
                          : undefined,
                    };
                  });
                dispatch({ type: 'LOAD_MUSIC_LIBRARY', payload: normalized });
              })
              .catch((err) => {
                console.warn('Music library fetch failed:', err);
              });
          }
        } catch (err) {
          console.warn('Music library fetch failed:', err);
        }

        dispatch({ type: 'SET_LOADING', payload: { isLoading: false } });
      } catch (error) {
        console.error('Failed to load initial data:', error);
        dispatch({ type: 'SET_LOADING', payload: { isLoading: false } });
      }
    }

    loadInitialData();
  }, []);

  // Auto-save project when it becomes dirty
  useEffect(() => {
    if (state.isDirty && state.project) {
      const autoSaveTimeout = setTimeout(async () => {
        try {
          await ProjectManager.saveProject(state.project!);
          dispatch({ type: 'SAVE_PROJECT' });
        } catch (error) {
          console.error('Failed to auto-save project:', error);
        }
      }, 5000); // Auto-save after 5 seconds of inactivity

      return () => clearTimeout(autoSaveTimeout);
    }
  }, [state.isDirty, state.project]);

  const contextValue: AppContextType = {
    state,
    dispatch,
  };

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
}

// Hook to use the app context
export function useAppContext(): AppContextType {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

// Hook to get just the state
export function useAppState(): AppState {
  const { state } = useAppContext();
  return state;
}

// Hook to get just the dispatch function
export function useAppDispatch(): React.Dispatch<AppAction> {
  const { dispatch } = useAppContext();
  return dispatch;
}
