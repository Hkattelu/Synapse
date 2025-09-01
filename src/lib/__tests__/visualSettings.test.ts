import { describe, it, expect, vi, beforeEach } from 'vitest';
import { visualSettingsManager } from '../settings/VisualSettingsManager';

// Mock localStorage for node/jsdom
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    key: vi.fn(),
    length: 0,
  } as unknown as Storage;
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('VisualSettingsManager - reduce motion', () => {
  beforeEach(() => {
    (localStorage as any).clear();
    vi.clearAllMocks();
  });

  it('persists and retrieves reduce motion preference', () => {
    visualSettingsManager.setReduceMotion(true);
    expect(visualSettingsManager.getReduceMotion()).toBe(true);
    visualSettingsManager.setReduceMotion(false);
    expect(visualSettingsManager.getReduceMotion()).toBe(false);
  });
});
