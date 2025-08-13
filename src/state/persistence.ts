// State persistence utilities for localStorage

import type { AppState } from './types';

// Save state to localStorage
export function saveToLocalStorage(key: string, state: AppState): void {
  try {
    const serializedState = JSON.stringify({
      ...state,
      // Convert dates to ISO strings for serialization
      project: state.project ? {
        ...state.project,
        createdAt: state.project.createdAt.toISOString(),
        updatedAt: state.project.updatedAt.toISOString(),
        mediaAssets: state.project.mediaAssets.map(asset => ({
          ...asset,
          createdAt: asset.createdAt.toISOString(),
        })),
      } : null,
      lastSaved: state.lastSaved?.toISOString() || null,
    });
    
    localStorage.setItem(key, serializedState);
  } catch (error) {
    console.error('Failed to save state to localStorage:', error);
  }
}

// Load state from localStorage
export function loadFromLocalStorage(key: string): AppState | null {
  try {
    const serializedState = localStorage.getItem(key);
    if (serializedState === null) {
      return null;
    }

    const parsedState = JSON.parse(serializedState);
    
    // Convert ISO strings back to Date objects
    return {
      ...parsedState,
      project: parsedState.project ? {
        ...parsedState.project,
        createdAt: new Date(parsedState.project.createdAt),
        updatedAt: new Date(parsedState.project.updatedAt),
        mediaAssets: parsedState.project.mediaAssets.map((asset: any) => ({
          ...asset,
          createdAt: new Date(asset.createdAt),
        })),
      } : null,
      lastSaved: parsedState.lastSaved ? new Date(parsedState.lastSaved) : null,
    };
  } catch (error) {
    console.error('Failed to load state from localStorage:', error);
    return null;
  }
}

// Clear state from localStorage
export function clearLocalStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
  }
}

// Get storage size in bytes
export function getStorageSize(key: string): number {
  try {
    const item = localStorage.getItem(key);
    return item ? new Blob([item]).size : 0;
  } catch (error) {
    console.error('Failed to get storage size:', error);
    return 0;
  }
}

// Check if localStorage is available
export function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__localStorage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
}