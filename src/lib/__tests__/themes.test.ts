import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ThemeManager } from '../themes/ThemeManager';
import { BUILT_IN_THEMES } from '../themes/definitions';
import { generateThemePreview, getThemeColorPalette } from '../themes/preview';
import type { ThemeDefinition } from '../themes/types';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('ThemeManager', () => {
  let themeManager: ThemeManager;

  beforeEach(() => {
    // Clear localStorage mocks
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
    
    // Create fresh instance
    themeManager = new ThemeManager();
  });

  describe('initialization', () => {
    it('should initialize with built-in themes', () => {
      const themes = themeManager.getAllThemes();
      expect(themes.length).toBeGreaterThan(0);
      expect(themes.length).toBe(BUILT_IN_THEMES.length);
    });

    it('should have all expected built-in themes', () => {
      const expectedThemes = [
        'vscode-dark-plus',
        'vscode-light-plus',
        'github-dark',
        'github-light',
        'dracula',
        'monokai',
        'solarized-dark',
        'solarized-light',
        'one-dark-pro',
        'material-ocean',
        'high-contrast-dark',
        'high-contrast-light',
      ];

      expectedThemes.forEach(themeId => {
        const theme = themeManager.getTheme(themeId);
        expect(theme).toBeTruthy();
        expect(theme?.id).toBe(themeId);
      });
    });

    it('should initialize categories', () => {
      const categories = themeManager.getCategories();
      expect(categories.length).toBeGreaterThan(0);
      
      const categoryIds = categories.map(cat => cat.id);
      expect(categoryIds).toContain('popular');
      expect(categoryIds).toContain('light');
      expect(categoryIds).toContain('dark');
      expect(categoryIds).toContain('high-contrast');
    });
  });

  describe('theme retrieval', () => {
    it('should get theme by ID', () => {
      const theme = themeManager.getTheme('dracula');
      expect(theme).toBeTruthy();
      expect(theme?.name).toBe('Dracula');
      expect(theme?.category).toBe('dark');
    });

    it('should return null for non-existent theme', () => {
      const theme = themeManager.getTheme('non-existent');
      expect(theme).toBeNull();
    });

    it('should get themes by category', () => {
      const darkThemes = themeManager.getThemesByCategory('dark');
      expect(darkThemes.length).toBeGreaterThan(0);
      darkThemes.forEach(theme => {
        expect(theme.category).toBe('dark');
      });
    });

    it('should return empty array for non-existent category', () => {
      const themes = themeManager.getThemesByCategory('non-existent');
      expect(themes).toEqual([]);
    });
  });

  describe('theme search', () => {
    it('should search themes by name', () => {
      const results = themeManager.searchThemes('dracula');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(theme => theme.name.toLowerCase().includes('dracula'))).toBe(true);
    });

    it('should search themes by tag', () => {
      const results = themeManager.searchThemes('popular');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should search themes by author', () => {
      const results = themeManager.searchThemes('microsoft');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return empty array for no matches', () => {
      const results = themeManager.searchThemes('nonexistenttheme123');
      expect(results).toEqual([]);
    });
  });

  describe('theme registration', () => {
    const customTheme: ThemeDefinition = {
      id: 'custom-test',
      name: 'Custom Test Theme',
      category: 'dark',
      colors: {
        background: '#000000',
        foreground: '#ffffff',
        comment: '#888888',
        keyword: '#ff0000',
        string: '#00ff00',
        number: '#0000ff',
        operator: '#ffffff',
        punctuation: '#ffffff',
        function: '#ffff00',
        variable: '#ff00ff',
        type: '#00ffff',
        class: '#ffff00',
        constant: '#0000ff',
        property: '#ff00ff',
        tag: '#ff0000',
        attribute: '#00ff00',
        boolean: '#0000ff',
        regex: '#00ff00',
        escape: '#ffff00',
        selection: '#333333',
        lineHighlight: '#111111',
        cursor: '#ffffff',
        diffAdded: '#00ff00',
        diffRemoved: '#ff0000',
        diffModified: '#ffff00',
      },
    };

    it('should register a new theme', () => {
      themeManager.registerTheme(customTheme);
      const retrieved = themeManager.getTheme('custom-test');
      expect(retrieved).toEqual(customTheme);
    });

    it('should throw error for invalid theme', () => {
      const invalidTheme = {
        id: 'invalid',
        name: 'Invalid Theme',
        category: 'invalid-category' as any,
        colors: {
          background: '#000000',
          // Missing required colors
        },
      } as ThemeDefinition;

      expect(() => themeManager.registerTheme(invalidTheme)).toThrow();
    });

    it('should remove custom theme', () => {
      themeManager.registerTheme(customTheme);
      expect(themeManager.getTheme('custom-test')).toBeTruthy();
      
      const removed = themeManager.removeTheme('custom-test');
      expect(removed).toBe(true);
      expect(themeManager.getTheme('custom-test')).toBeNull();
    });

    it('should not remove built-in theme', () => {
      const removed = themeManager.removeTheme('dracula');
      expect(removed).toBe(false);
      expect(themeManager.getTheme('dracula')).toBeTruthy();
    });
  });

  describe('favorites management', () => {
    it('should add theme to favorites', () => {
      themeManager.addToFavorites('dracula');
      expect(themeManager.isFavorite('dracula')).toBe(true);
      
      const favorites = themeManager.getFavoriteThemes();
      expect(favorites.some(theme => theme.id === 'dracula')).toBe(true);
    });

    it('should remove theme from favorites', () => {
      themeManager.addToFavorites('dracula');
      expect(themeManager.isFavorite('dracula')).toBe(true);
      
      themeManager.removeFromFavorites('dracula');
      expect(themeManager.isFavorite('dracula')).toBe(false);
    });

    it('should not add non-existent theme to favorites', () => {
      themeManager.addToFavorites('non-existent');
      expect(themeManager.isFavorite('non-existent')).toBe(false);
    });
  });

  describe('recent themes tracking', () => {
    it('should record theme usage', () => {
      themeManager.recordThemeUsage('dracula');
      themeManager.recordThemeUsage('monokai');
      
      const recent = themeManager.getRecentThemes();
      expect(recent.length).toBeGreaterThan(0);
      expect(recent[0].id).toBe('monokai'); // Most recent first
    });

    it('should limit recent themes to 10', () => {
      // Add more than 10 themes
      const themes = themeManager.getAllThemes();
      themes.slice(0, 15).forEach(theme => {
        themeManager.recordThemeUsage(theme.id);
      });
      
      const recent = themeManager.getRecentThemes();
      expect(recent.length).toBeLessThanOrEqual(10);
    });
  });

  describe('theme conversion', () => {
    it('should convert theme to legacy format', () => {
      const legacy = themeManager.toLegacyTheme('dracula');
      expect(legacy).toBeTruthy();
      expect(legacy?.background).toBe('#282a36');
      expect(legacy?.color).toBe('#f8f8f2'); // foreground -> color
      expect(legacy?.keyword).toBe('#ff79c6');
    });

    it('should return null for non-existent theme', () => {
      const legacy = themeManager.toLegacyTheme('non-existent');
      expect(legacy).toBeNull();
    });
  });

  describe('theme import/export', () => {
    const customTheme: ThemeDefinition = {
      id: 'export-test',
      name: 'Export Test Theme',
      category: 'dark',
      colors: {
        background: '#000000',
        foreground: '#ffffff',
        comment: '#888888',
        keyword: '#ff0000',
        string: '#00ff00',
        number: '#0000ff',
        operator: '#ffffff',
        punctuation: '#ffffff',
        function: '#ffff00',
        variable: '#ff00ff',
        type: '#00ffff',
        class: '#ffff00',
        constant: '#0000ff',
        property: '#ff00ff',
        tag: '#ff0000',
        attribute: '#00ff00',
        boolean: '#0000ff',
        regex: '#00ff00',
        escape: '#ffff00',
        selection: '#333333',
        lineHighlight: '#111111',
        cursor: '#ffffff',
        diffAdded: '#00ff00',
        diffRemoved: '#ff0000',
        diffModified: '#ffff00',
      },
    };

    it('should export theme as JSON', () => {
      themeManager.registerTheme(customTheme);
      const exported = themeManager.exportTheme('export-test');
      expect(exported).toBeTruthy();
      
      const parsed = JSON.parse(exported!);
      expect(parsed.id).toBe('export-test');
      expect(parsed.name).toBe('Export Test Theme');
    });

    it('should import theme from JSON', () => {
      const themeJson = JSON.stringify(customTheme);
      const imported = themeManager.importTheme(themeJson);
      
      expect(imported).toEqual(customTheme);
      expect(themeManager.getTheme('export-test')).toEqual(customTheme);
    });

    it('should return null for invalid JSON', () => {
      const imported = themeManager.importTheme('invalid json');
      expect(imported).toBeNull();
    });
  });

  describe('theme statistics', () => {
    it('should provide theme statistics', () => {
      const stats = themeManager.getThemeStats();
      expect(stats.total).toBeGreaterThan(0);
      expect(stats.byCategory.dark).toBeGreaterThan(0);
      expect(stats.byCategory.light).toBeGreaterThan(0);
      expect(typeof stats.favorites).toBe('number');
      expect(typeof stats.custom).toBe('number');
    });
  });
});

describe('Theme Preview Utilities', () => {
  describe('generateThemePreview', () => {
    it('should generate HTML preview for theme', () => {
      const preview = generateThemePreview('dracula', 'javascript');
      expect(preview).toContain('background-color: #282a36');
      expect(preview).toContain('color: #f8f8f2');
      expect(preview).toContain('function');
    });

    it('should handle different languages', () => {
      const jsPreview = generateThemePreview('dracula', 'javascript');
      const pyPreview = generateThemePreview('dracula', 'python');
      
      expect(jsPreview).toContain('function');
      expect(pyPreview).toContain('def');
    });

    it('should return empty string for non-existent theme', () => {
      const preview = generateThemePreview('non-existent');
      expect(preview).toBe('');
    });
  });

  describe('getThemeColorPalette', () => {
    it('should return color palette for theme', () => {
      const palette = getThemeColorPalette('dracula');
      expect(palette.length).toBe(8);
      expect(palette).toContain('#282a36'); // background
      expect(palette).toContain('#f8f8f2'); // foreground
    });

    it('should return empty array for non-existent theme', () => {
      const palette = getThemeColorPalette('non-existent');
      expect(palette).toEqual([]);
    });
  });
});

describe('Built-in Themes Validation', () => {
  it('should have valid structure for all built-in themes', () => {
    BUILT_IN_THEMES.forEach(theme => {
      expect(theme.id).toBeTruthy();
      expect(theme.name).toBeTruthy();
      expect(['light', 'dark', 'high-contrast']).toContain(theme.category);
      
      // Check required colors
      const requiredColors = [
        'background', 'foreground', 'comment', 'keyword', 'string',
        'number', 'operator', 'punctuation', 'function', 'variable'
      ];
      
      requiredColors.forEach(color => {
        expect(theme.colors[color as keyof typeof theme.colors]).toBeTruthy();
      });
    });
  });

  it('should have unique IDs for all themes', () => {
    const ids = BUILT_IN_THEMES.map(theme => theme.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should have proper color format (hex)', () => {
    BUILT_IN_THEMES.forEach(theme => {
      Object.values(theme.colors).forEach(color => {
        expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });
  });
});