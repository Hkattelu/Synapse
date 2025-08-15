// React Context for global state management

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AppState, AppAction, AppContextType } from './types';
import { appReducer, initialState } from './reducers';
import { ProjectManager } from '../lib/projectManager';
import { loadSampleDataForDev } from '../data/sampleProjects';

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

  // Load projects on app startup
  useEffect(() => {
    async function loadInitialData() {
      try {
        // Show loading message
        dispatch({ type: 'SET_LOADING', payload: { isLoading: true, message: 'Loading projects…' } });
        // Load all projects
        let projects = await ProjectManager.getAllProjects();

        // In development mode, always ensure sample data exists and load starter project
        if (import.meta.env.DEV) {
          const sampleProjects = loadSampleDataForDev();
          
          // Check if sample projects exist in storage
          const hasStarterProject = projects.some(p => p.project.id === 'remotion-tutorial-sample');
          
          if (!hasStarterProject && sampleProjects.length > 0) {
            // Save sample projects to storage if they don't exist
            for (const sampleProject of sampleProjects) {
              await ProjectManager.saveProject(sampleProject.project);
            }
            // Reload projects after saving samples
            projects = await ProjectManager.getAllProjects();
          }

          // Always load the starter project in development
          const starterProject = projects.find(p => p.project.id === 'remotion-tutorial-sample');
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
              dispatch({ type: 'LOAD_PROJECT', payload: currentProject.project });
            } else {
              // If no current project, load the most recently updated one
              const sortedProjects = [...projects].sort(
                (a, b) => new Date(b.project.updatedAt).getTime() - new Date(a.project.updatedAt).getTime()
              );
              if (sortedProjects.length > 0) {
                dispatch({ type: 'LOAD_PROJECT', payload: sortedProjects[0].project });
              }
            }
          }
        }

        dispatch({ type: 'LOAD_PROJECTS_LIST', payload: projects });
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
