// Theme management system for comprehensive code editor theming

import type { ThemeDefinition, ThemeCategory, ThemePreferences } from './types';
import { BUILT_IN_THEMES, THEME_CATEGORIES } from './definitions';

export class ThemeManager {
  private themes: Map<string, ThemeDefinition> = new Map();
  private categories: ThemeCategory[] = [];
  private preferences: ThemePreferences = {
    favoriteThemes: [],
    recentThemes: [],
    customThemes: [],
  };

  constructor() {
    this.initializeBuiltInThemes();
    this.initializeCategories();
    this.loadPreferences();
  }

  /**
   * Initialize built-in themes
   */
  private initializeBuiltInThemes(): void {
    BUILT_IN_THEMES.forEach(theme => {
      this.themes.set(theme.id, theme);
    });
  }

  /**
   * Initialize theme categories
   */
  private initializeCategories(): void {
    this.categories = [...THEME_CATEGORIES];
  }

  /**
   * Load user preferences from localStorage
   */
  private loadPreferences(): void {
    try {
      const stored = localStorage.getItem('synapse-theme-preferences');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.preferences = {
          favoriteThemes: parsed.favoriteThemes || [],
          recentThemes: parsed.recentThemes || [],
          customThemes: parsed.customThemes || [],
        };
      }
    } catch (error) {
      console.warn('Failed to load theme preferences:', error);
    }
  }

  /**
   * Save user preferences to localStorage
   */
  private savePreferences(): void {
    try {
      localStorage.setItem('synapse-theme-preferences', JSON.stringify(this.preferences));
    } catch (error) {
      console.warn('Failed to save theme preferences:', error);
    }
  }

  /**
   * Get a theme by ID with fallback support
   */
  getTheme(id: string): ThemeDefinition | null {
    const theme = this.themes.get(id);
    
    if (!theme) {
      return null;
    }

    // Validate theme before returning
    if (!this.validateTheme(theme)) {
      console.warn(`Theme ${id} failed validation, creating fallback`);
      return this.createFallbackTheme(theme);
    }

    return theme;
  }

  /**
   * Get a theme by ID (original method without fallback)
   */
  getThemeUnsafe(id: string): ThemeDefinition | null {
    return this.themes.get(id) || null;
  }

  /**
   * Get all available themes
   */
  getAllThemes(): ThemeDefinition[] {
    return Array.from(this.themes.values());
  }

  /**
   * Get themes by category
   */
  getThemesByCategory(categoryId: string): ThemeDefinition[] {
    const category = this.categories.find(cat => cat.id === categoryId);
    if (!category) return [];

    return category.themes
      .map(themeId => this.themes.get(themeId))
      .filter((theme): theme is ThemeDefinition => theme !== undefined);
  }

  /**
   * Get all theme categories
   */
  getCategories(): ThemeCategory[] {
    return [...this.categories];
  }

  /**
   * Register a new theme
   */
  registerTheme(theme: ThemeDefinition): void {
    // Validate theme structure
    if (!this.validateTheme(theme)) {
      throw new Error(`Invalid theme definition: ${theme.id}`);
    }

    this.themes.set(theme.id, theme);

    // Add to custom themes if not built-in
    if (!BUILT_IN_THEMES.find(t => t.id === theme.id)) {
      if (!this.preferences.customThemes.includes(theme.id)) {
        this.preferences.customThemes.push(theme.id);
        this.savePreferences();
      }
    }
  }

  /**
   * Remove a custom theme
   */
  removeTheme(themeId: string): boolean {
    // Don't allow removal of built-in themes
    if (BUILT_IN_THEMES.find(t => t.id === themeId)) {
      return false;
    }

    const removed = this.themes.delete(themeId);
    if (removed) {
      // Remove from preferences
      this.preferences.customThemes = this.preferences.customThemes.filter(id => id !== themeId);
      this.preferences.favoriteThemes = this.preferences.favoriteThemes.filter(id => id !== themeId);
      this.preferences.recentThemes = this.preferences.recentThemes.filter(id => id !== themeId);
      this.savePreferences();
    }

    return removed;
  }

  /**
   * Search themes by name or tags
   */
  searchThemes(query: string): ThemeDefinition[] {
    const lowercaseQuery = query.toLowerCase();
    return this.getAllThemes().filter(theme => {
      const nameMatch = theme.name.toLowerCase().includes(lowercaseQuery);
      const tagMatch = theme.metadata?.tags?.some(tag => 
        tag.toLowerCase().includes(lowercaseQuery)
      ) || false;
      const authorMatch = theme.metadata?.author?.toLowerCase().includes(lowercaseQuery) || false;
      
      return nameMatch || tagMatch || authorMatch;
    });
  }

  /**
   * Get favorite themes
   */
  getFavoriteThemes(): ThemeDefinition[] {
    return this.preferences.favoriteThemes
      .map(themeId => this.themes.get(themeId))
      .filter((theme): theme is ThemeDefinition => theme !== undefined);
  }

  /**
   * Get recently used themes
   */
  getRecentThemes(): ThemeDefinition[] {
    return this.preferences.recentThemes
      .map(themeId => this.themes.get(themeId))
      .filter((theme): theme is ThemeDefinition => theme !== undefined);
  }

  /**
   * Add theme to favorites
   */
  addToFavorites(themeId: string): void {
    if (!this.themes.has(themeId)) return;

    if (!this.preferences.favoriteThemes.includes(themeId)) {
      this.preferences.favoriteThemes.push(themeId);
      this.savePreferences();
    }
  }

  /**
   * Remove theme from favorites
   */
  removeFromFavorites(themeId: string): void {
    this.preferences.favoriteThemes = this.preferences.favoriteThemes.filter(id => id !== themeId);
    this.savePreferences();
  }

  /**
   * Check if theme is favorited
   */
  isFavorite(themeId: string): boolean {
    return this.preferences.favoriteThemes.includes(themeId);
  }

  /**
   * Clear all favorite themes
   */
  clearFavorites(): void {
    this.preferences.favoriteThemes = [];
    this.savePreferences();
  }

  /**
   * Record theme usage (adds to recent themes)
   */
  recordThemeUsage(themeId: string): void {
    if (!this.themes.has(themeId)) return;

    // Remove from current position if exists
    this.preferences.recentThemes = this.preferences.recentThemes.filter(id => id !== themeId);
    
    // Add to beginning
    this.preferences.recentThemes.unshift(themeId);
    
    // Keep only last 10 recent themes
    this.preferences.recentThemes = this.preferences.recentThemes.slice(0, 10);
    
    this.savePreferences();
  }

  /**
   * Get theme preview CSS
   */
  getThemePreviewCSS(themeId: string): string {
    const theme = this.getTheme(themeId);
    if (!theme) return '';

    return `
      .theme-preview-${themeId} {
        background-color: ${theme.colors.background};
        color: ${theme.colors.foreground};
        font-family: ${theme.fonts?.monospace || 'monospace'};
        font-size: ${theme.fonts?.size || 14}px;
        line-height: ${theme.fonts?.lineHeight || 1.5};
      }
      
      .theme-preview-${themeId} .token.comment { color: ${theme.colors.comment}; }
      .theme-preview-${themeId} .token.keyword { color: ${theme.colors.keyword}; }
      .theme-preview-${themeId} .token.string { color: ${theme.colors.string}; }
      .theme-preview-${themeId} .token.number { color: ${theme.colors.number}; }
      .theme-preview-${themeId} .token.function { color: ${theme.colors.function}; }
      .theme-preview-${themeId} .token.variable { color: ${theme.colors.variable}; }
      .theme-preview-${themeId} .token.type { color: ${theme.colors.type}; }
      .theme-preview-${themeId} .token.operator { color: ${theme.colors.operator}; }
      .theme-preview-${themeId} .token.punctuation { color: ${theme.colors.punctuation}; }
    `;
  }

  /**
   * Convert theme to legacy format for backward compatibility
   */
  toLegacyTheme(themeId: string): Record<string, string> | null {
    const theme = this.getTheme(themeId);
    if (!theme) return null;

    return {
      background: theme.colors.background,
      color: theme.colors.foreground,
      comment: theme.colors.comment,
      keyword: theme.colors.keyword,
      string: theme.colors.string,
      number: theme.colors.number,
      operator: theme.colors.operator,
      punctuation: theme.colors.punctuation,
      function: theme.colors.function,
      variable: theme.colors.variable,
    };
  }

  /**
   * Validate theme definition
   */
  private validateTheme(theme: ThemeDefinition): boolean {
    try {
      const { validateTheme } = require('../validation/themeValidation');
      const result = validateTheme(theme, {
        strictColorValidation: true,
        checkContrast: false, // Don't fail on contrast issues, just warn
        requireAllColors: true,
        allowCustomProperties: false
      });
      
      if (!result.isValid) {
        console.warn('Theme validation failed:', result.errors);
        return false;
      }

      if (result.warnings.length > 0) {
        console.warn('Theme validation warnings:', result.warnings);
      }

      return true;
    } catch (error) {
      console.error('Theme validation error:', error);
      // Fallback to basic validation if validation module fails
      return this.basicValidateTheme(theme);
    }
  }

  /**
   * Basic theme validation fallback
   */
  private basicValidateTheme(theme: ThemeDefinition): boolean {
    if (!theme.id || !theme.name || !theme.category) {
      return false;
    }

    if (!['light', 'dark', 'high-contrast'].includes(theme.category)) {
      return false;
    }

    const requiredColors = [
      'background', 'foreground', 'comment', 'keyword', 'string', 
      'number', 'operator', 'punctuation', 'function', 'variable'
    ];

    for (const color of requiredColors) {
      if (!theme.colors[color as keyof typeof theme.colors]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Export theme as JSON
   */
  exportTheme(themeId: string): string | null {
    const theme = this.getTheme(themeId);
    if (!theme) return null;

    return JSON.stringify(theme, null, 2);
  }

  /**
   * Import theme from JSON
   */
  importTheme(themeJson: string): ThemeDefinition | null {
    try {
      const theme = JSON.parse(themeJson) as ThemeDefinition;
      
      if (!this.validateTheme(theme)) {
        throw new Error('Invalid theme format');
      }

      this.registerTheme(theme);
      return theme;
    } catch (error) {
      console.error('Failed to import theme:', error);
      return null;
    }
  }

  /**
   * Reset preferences to defaults
   */
  resetPreferences(): void {
    this.preferences = {
      favoriteThemes: [],
      recentThemes: [],
      customThemes: [],
    };
    this.savePreferences();
  }

  /**
   * Create a fallback theme when the original fails validation
   */
  private createFallbackTheme(originalTheme: ThemeDefinition): ThemeDefinition {
    try {
      const { createFallbackTheme } = require('../validation/themeValidation');
      return createFallbackTheme(originalTheme);
    } catch (error) {
      console.error('Failed to create fallback theme:', error);
      // Return a basic safe theme
      return {
        id: originalTheme.id || 'fallback',
        name: originalTheme.name || 'Fallback Theme',
        category: originalTheme.category || 'dark',
        colors: {
          background: '#1e1e1e',
          foreground: '#d4d4d4',
          comment: '#6a9955',
          keyword: '#c586c0',
          string: '#ce9178',
          number: '#b5cea8',
          operator: '#d4d4d4',
          punctuation: '#d4d4d4',
          function: '#dcdcaa',
          variable: '#9cdcfe',
          type: '#4ec9b0',
          class: '#4ec9b0',
          constant: '#4fc1ff',
          property: '#9cdcfe',
          tag: '#569cd6',
          attribute: '#92c5f8',
          boolean: '#569cd6',
          regex: '#d16969',
          escape: '#d7ba7d',
          selection: '#264f78',
          lineHighlight: '#2a2d2e',
          cursor: '#d4d4d4',
          diffAdded: '#144212',
          diffRemoved: '#5a1e1e',
          diffModified: '#1e3a8a',
        },
        fonts: {
          monospace: 'Consolas, "Courier New", monospace',
          size: 14,
          lineHeight: 1.5,
        },
        metadata: {
          author: 'System',
          description: 'Fallback theme used when the original theme fails validation',
          version: '1.0.0',
          tags: ['fallback'],
        },
      };
    }
  }

  /**
   * Get theme statistics
   */
  getThemeStats(): {
    total: number;
    byCategory: Record<string, number>;
    favorites: number;
    custom: number;
  } {
    const themes = this.getAllThemes();
    const byCategory: Record<string, number> = {};

    themes.forEach(theme => {
      byCategory[theme.category] = (byCategory[theme.category] || 0) + 1;
    });

    return {
      total: themes.length,
      byCategory,
      favorites: this.preferences.favoriteThemes.length,
      custom: this.preferences.customThemes.length,
    };
  }
}

// Singleton instance
export const themeManager = new ThemeManager();