// Unit tests for state persistence

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  saveToLocalStorage,
  loadFromLocalStorage,
  clearLocalStorage,
  getStorageSize,
  isLocalStorageAvailable,
} from '../persistence';
import type { AppState } from '../types';
import { initialState } from '../reducers';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('State Persistence', () => {
  const testKey = 'test-synapse-studio';

  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('saveToLocalStorage', () => {
    it('should save state to localStorage', () => {
      const testState: AppState = {
        ...initialState,
        project: {
          id: 'test-project',
          name: 'Test Project',
          createdAt: new Date('2024-01-01T00:00:00Z'),
          updatedAt: new Date('2024-01-02T00:00:00Z'),
          timeline: [],
          mediaAssets: [
            {
              id: 'asset-1',
              name: 'test.mp4',
              type: 'video',
              url: 'blob:test',
              metadata: { fileSize: 1024, mimeType: 'video/mp4' },
              createdAt: new Date('2024-01-01T12:00:00Z'),
            },
          ],
          settings: {
            width: 1920,
            height: 1080,
            fps: 30,
            duration: 60,
            backgroundColor: '#000000',
          },
          version: '1.0.0',
        },
        lastSaved: new Date('2024-01-02T12:00:00Z'),
        isDirty: true,
      };

      saveToLocalStorage(testKey, testState);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        testKey,
        expect.stringContaining('"name":"Test Project"')
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        testKey,
        expect.stringContaining('"createdAt":"2024-01-01T00:00:00.000Z"')
      );
    });

    it('should handle save errors gracefully', () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage quota exceeded');
      });

      const testState: AppState = { ...initialState };

      expect(() => saveToLocalStorage(testKey, testState)).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save state to localStorage:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('loadFromLocalStorage', () => {
    it('should load state from localStorage', () => {
      const savedData = {
        project: {
          id: 'test-project',
          name: 'Test Project',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-02T00:00:00.000Z',
          timeline: [],
          mediaAssets: [
            {
              id: 'asset-1',
              name: 'test.mp4',
              type: 'video',
              url: 'blob:test',
              metadata: { fileSize: 1024, mimeType: 'video/mp4' },
              createdAt: '2024-01-01T12:00:00.000Z',
            },
          ],
          settings: {
            width: 1920,
            height: 1080,
            fps: 30,
            duration: 60,
            backgroundColor: '#000000',
          },
          version: '1.0.0',
        },
        ui: initialState.ui,
        lastSaved: '2024-01-02T12:00:00.000Z',
        isDirty: false,
      };

      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(savedData));

      const loadedState = loadFromLocalStorage(testKey);

      expect(loadedState).toBeDefined();
      expect(loadedState?.project?.name).toBe('Test Project');
      expect(loadedState?.project?.createdAt).toBeInstanceOf(Date);
      expect(loadedState?.project?.updatedAt).toBeInstanceOf(Date);
      expect(loadedState?.project?.mediaAssets[0].createdAt).toBeInstanceOf(
        Date
      );
      expect(loadedState?.lastSaved).toBeInstanceOf(Date);
    });

    it('should return null when no data exists', () => {
      localStorageMock.getItem.mockReturnValueOnce(null);

      const loadedState = loadFromLocalStorage(testKey);

      expect(loadedState).toBeNull();
    });

    it('should handle load errors gracefully', () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      localStorageMock.getItem.mockReturnValueOnce('invalid-json');

      const loadedState = loadFromLocalStorage(testKey);

      expect(loadedState).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load state from localStorage:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should handle missing project gracefully', () => {
      const savedData = {
        project: null,
        ui: initialState.ui,
        lastSaved: null,
        isDirty: false,
      };

      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(savedData));

      const loadedState = loadFromLocalStorage(testKey);

      expect(loadedState).toBeDefined();
      expect(loadedState?.project).toBeNull();
      expect(loadedState?.lastSaved).toBeNull();
    });
  });

  describe('clearLocalStorage', () => {
    it('should clear localStorage', () => {
      clearLocalStorage(testKey);

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(testKey);
    });

    it('should handle clear errors gracefully', () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      localStorageMock.removeItem.mockImplementationOnce(() => {
        throw new Error('Clear failed');
      });

      expect(() => clearLocalStorage(testKey)).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to clear localStorage:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('getStorageSize', () => {
    it('should return storage size in bytes', () => {
      const testData = 'test data';
      localStorageMock.getItem.mockReturnValueOnce(testData);

      const size = getStorageSize(testKey);

      expect(size).toBe(new Blob([testData]).size);
    });

    it('should return 0 for non-existent key', () => {
      localStorageMock.getItem.mockReturnValueOnce(null);

      const size = getStorageSize(testKey);

      expect(size).toBe(0);
    });

    it('should handle size calculation errors gracefully', () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('Get item failed');
      });

      const size = getStorageSize(testKey);

      expect(size).toBe(0);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to get storage size:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('isLocalStorageAvailable', () => {
    it('should return true when localStorage is available', () => {
      const available = isLocalStorageAvailable();

      expect(available).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        '__localStorage_test__',
        'test'
      );
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        '__localStorage_test__'
      );
    });

    it('should return false when localStorage is not available', () => {
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('localStorage not available');
      });

      const available = isLocalStorageAvailable();

      expect(available).toBe(false);
    });
  });

  describe('Date serialization edge cases', () => {
    it('should handle projects with missing optional dates', () => {
      const savedData = {
        project: {
          id: 'test-project',
          name: 'Test Project',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-02T00:00:00.000Z',
          timeline: [],
          mediaAssets: [],
          settings: {
            width: 1920,
            height: 1080,
            fps: 30,
            duration: 60,
            backgroundColor: '#000000',
          },
          version: '1.0.0',
        },
        ui: initialState.ui,
        lastSaved: null,
        isDirty: false,
      };

      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(savedData));

      const loadedState = loadFromLocalStorage(testKey);

      expect(loadedState).toBeDefined();
      expect(loadedState?.lastSaved).toBeNull();
    });

    it('should handle media assets with various date formats', () => {
      const savedData = {
        project: {
          id: 'test-project',
          name: 'Test Project',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-02T00:00:00.000Z',
          timeline: [],
          mediaAssets: [
            {
              id: 'asset-1',
              name: 'test1.mp4',
              type: 'video',
              url: 'blob:test1',
              metadata: { fileSize: 1024, mimeType: 'video/mp4' },
              createdAt: '2024-01-01T12:00:00.000Z',
            },
            {
              id: 'asset-2',
              name: 'test2.mp4',
              type: 'video',
              url: 'blob:test2',
              metadata: { fileSize: 2048, mimeType: 'video/mp4' },
              createdAt: '2024-01-01T13:00:00Z', // Different format
            },
          ],
          settings: {
            width: 1920,
            height: 1080,
            fps: 30,
            duration: 60,
            backgroundColor: '#000000',
          },
          version: '1.0.0',
        },
        ui: initialState.ui,
        lastSaved: '2024-01-02T12:00:00.000Z',
        isDirty: false,
      };

      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(savedData));

      const loadedState = loadFromLocalStorage(testKey);

      expect(loadedState).toBeDefined();
      expect(loadedState?.project?.mediaAssets).toHaveLength(2);
      expect(loadedState?.project?.mediaAssets[0].createdAt).toBeInstanceOf(
        Date
      );
      expect(loadedState?.project?.mediaAssets[1].createdAt).toBeInstanceOf(
        Date
      );
    });
  });
});
