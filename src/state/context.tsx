// React Context for global state management

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AppState, AppAction, AppContextType } from './types';
import { appReducer, initialState } from './reducers';
import { saveToLocalStorage, loadFromLocalStorage } from './persistence';

// Create the context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Storage key for localStorage
const STORAGE_KEY = 'synapse-studio-state';

interface AppProviderProps {
  children: ReactNode;
}

// Context provider component
export function AppProvider({ children }: AppProviderProps) {
  // Initialize state from localStorage if available
  const [state, dispatch] = useReducer(appReducer, initialState, (initial) => {
    const savedState = loadFromLocalStorage(STORAGE_KEY);
    return savedState || initial;
  });

  // Auto-save to localStorage when state changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveToLocalStorage(STORAGE_KEY, state);
    }, 1000); // Debounce saves by 1 second

    return () => clearTimeout(timeoutId);
  }, [state]);

  // Auto-save project when it becomes dirty
  useEffect(() => {
    if (state.isDirty && state.project) {
      const autoSaveTimeout = setTimeout(() => {
        dispatch({ type: 'SAVE_PROJECT' });
      }, 5000); // Auto-save after 5 seconds of inactivity

      return () => clearTimeout(autoSaveTimeout);
    }
  }, [state.isDirty, state.project]);

  const contextValue: AppContextType = {
    state,
    dispatch,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
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