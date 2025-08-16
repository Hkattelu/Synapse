import '@testing-library/jest-dom';
import { vi } from 'vitest';
import Prism from 'prismjs';

// Silence AppProvider project loading and saving side-effects in tests
vi.mock('../lib/projectManager', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    ProjectManager: {
      ...actual.ProjectManager,
      getAllProjects: vi.fn(async () => []),
      getCurrentProject: vi.fn(() => null),
      saveProject: vi.fn(async () => {}),
      getProjectStats: vi.fn(() => ({ projects: 0, assets: 0, totalSize: 0 })),
    },
  };
});

// Provide safe defaults for animation presets used by Inspector tests
vi.mock('../lib/animationPresets', () => ({
  ANIMATION_PRESETS: [],
  getAnimationsByType: () => [],
  getCompatibleAnimations: () => [],
}));

// Polyfill IntersectionObserver for tests (used by framer-motion and others)
if (!(globalThis as any).IntersectionObserver) {
  (globalThis as any).IntersectionObserver = class {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return []; }
    root: Element | null = null;
    rootMargin: string = '';
    thresholds: ReadonlyArray<number> = [];
  } as any;
}

// Prism markdown patch: ensure nested structures exist before markdown component loads
try {
  // Some Prism plugins expect nested objects; ensure structure exists
  (Prism as any).languages = (Prism as any).languages || {};
  (Prism as any).languages.markdown = (Prism as any).languages.markdown || {
    inside: { content: { inside: {} } },
  };
} catch {}
