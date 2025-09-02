import type { ItemProperties, GradientConfig } from '../types';
import { themeManager } from '../themes';

// Visual settings configuration for export/import
export interface VisualSettingsConfig {
  version: string;
  themes: {
    customThemes: unknown[];
    favoriteThemes: string[];
  };
  backgrounds: {
    customGradients: GradientConfig[];
    customWallpapers: string[];
  };
  defaults: {
    theme: string;
    fontSize: number;
    fontFamily: string;
    animationMode: string;
    backgroundType: string;
  };
  metadata: {
    exportedAt: string;
    exportedBy?: string;
    description?: string;
  };
}

// Default visual settings
export const DEFAULT_VISUAL_SETTINGS: Partial<ItemProperties> = {
  theme: 'vscode-dark-plus',
  fontSize: 14,
  fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
  animationMode: 'typing',
  typingSpeedCps: 30,
  lineRevealIntervalMs: 350,
  showLineNumbers: false,
  backgroundType: 'none',
  backgroundOpacity: 1,
  diffAnimationType: 'none',
  diffAnimationSpeed: 1,
  diffHighlightColor: '#4ade80',
};

class VisualSettingsManager {
  private readonly STORAGE_KEY = 'synapse-visual-settings';
  private readonly CUSTOM_THEMES_KEY = 'synapse-custom-themes';
  private readonly CUSTOM_GRADIENTS_KEY = 'synapse-custom-gradients';
  private readonly ACCESSIBILITY_KEY = 'synapse-accessibility';

  // Save current visual settings as defaults
  saveAsDefaults(properties: Partial<ItemProperties>): void {
    try {
      const settings = {
        theme: properties.theme || DEFAULT_VISUAL_SETTINGS.theme,
        fontSize: properties.fontSize || DEFAULT_VISUAL_SETTINGS.fontSize,
        fontFamily: properties.fontFamily || DEFAULT_VISUAL_SETTINGS.fontFamily,
        animationMode:
          properties.animationMode || DEFAULT_VISUAL_SETTINGS.animationMode,
        typingSpeedCps:
          properties.typingSpeedCps || DEFAULT_VISUAL_SETTINGS.typingSpeedCps,
        lineRevealIntervalMs:
          properties.lineRevealIntervalMs ||
          DEFAULT_VISUAL_SETTINGS.lineRevealIntervalMs,
        showLineNumbers:
          properties.showLineNumbers ?? DEFAULT_VISUAL_SETTINGS.showLineNumbers,
        backgroundType:
          properties.backgroundType || DEFAULT_VISUAL_SETTINGS.backgroundType,
        backgroundOpacity:
          properties.backgroundOpacity ??
          DEFAULT_VISUAL_SETTINGS.backgroundOpacity,
        diffAnimationType:
          properties.diffAnimationType ||
          DEFAULT_VISUAL_SETTINGS.diffAnimationType,
        diffAnimationSpeed:
          properties.diffAnimationSpeed ||
          DEFAULT_VISUAL_SETTINGS.diffAnimationSpeed,
        diffHighlightColor:
          properties.diffHighlightColor ||
          DEFAULT_VISUAL_SETTINGS.diffHighlightColor,
        savedAt: new Date().toISOString(),
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save visual settings:', error);
    }
  }

  // Load saved defaults
  loadDefaults(): Partial<ItemProperties> {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const settings = JSON.parse(saved);
        return {
          ...DEFAULT_VISUAL_SETTINGS,
          ...settings,
        };
      }
    } catch (error) {
      console.error('Failed to load visual settings:', error);
    }

    return { ...DEFAULT_VISUAL_SETTINGS };
  }

  // Reset to factory defaults
  resetToDefaults(): Partial<ItemProperties> {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to reset visual settings:', error);
    }

    return { ...DEFAULT_VISUAL_SETTINGS };
  }

  // Save custom theme
  saveCustomTheme(theme: unknown): void {
    try {
      const existing = this.getCustomThemes();
      const t = theme as { id: string } & Record<string, unknown>;
      const updated = (existing as Array<{ id: string }>).filter(
        (x) => x.id !== t.id
      );
      updated.push({
        ...t,
        createdAt: new Date().toISOString(),
        isCustom: true,
      });

      localStorage.setItem(this.CUSTOM_THEMES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save custom theme:', error);
    }
  }

  // Get custom themes
  getCustomThemes(): unknown[] {
    try {
      const saved = localStorage.getItem(this.CUSTOM_THEMES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load custom themes:', error);
      return [];
    }
  }

  // Delete custom theme
  deleteCustomTheme(themeId: string): void {
    try {
      const existing = this.getCustomThemes();
      const updated = existing.filter((t) => t.id !== themeId);
      localStorage.setItem(this.CUSTOM_THEMES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to delete custom theme:', error);
    }
  }

  // Save custom gradient
  saveCustomGradient(
    gradient: GradientConfig & { id: string; name: string }
  ): void {
    try {
      const existing = this.getCustomGradients();
      const updated = existing.filter((g) => g.id !== gradient.id);
      updated.push({
        ...gradient,
        createdAt: new Date().toISOString(),
        isCustom: true,
      });

      localStorage.setItem(this.CUSTOM_GRADIENTS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save custom gradient:', error);
    }
  }

  // Get custom gradients
  getCustomGradients(): (GradientConfig & {
    id: string;
    name: string;
    createdAt: string;
    isCustom: boolean;
  })[] {
    try {
      const saved = localStorage.getItem(this.CUSTOM_GRADIENTS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load custom gradients:', error);
      return [];
    }
  }

  // Delete custom gradient
  deleteCustomGradient(gradientId: string): void {
    try {
      const existing = this.getCustomGradients();
      const updated = existing.filter((g) => g.id !== gradientId);
      localStorage.setItem(this.CUSTOM_GRADIENTS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to delete custom gradient:', error);
    }
  }

  // Export all visual settings
  exportSettings(): VisualSettingsConfig {
    const defaults = this.loadDefaults();
    const customThemes = this.getCustomThemes();
    const customGradients = this.getCustomGradients();
    const favoriteThemes = themeManager.getFavoriteThemes().map((t) => t.id);

    return {
      version: '1.0.0',
      themes: {
        customThemes,
        favoriteThemes,
      },
      backgrounds: {
        customGradients,
        customWallpapers: [], // TODO: Implement custom wallpapers
      },
      defaults: {
        theme: defaults.theme || DEFAULT_VISUAL_SETTINGS.theme!,
        fontSize: defaults.fontSize || DEFAULT_VISUAL_SETTINGS.fontSize!,
        fontFamily: defaults.fontFamily || DEFAULT_VISUAL_SETTINGS.fontFamily!,
        animationMode:
          defaults.animationMode || DEFAULT_VISUAL_SETTINGS.animationMode!,
        backgroundType:
          defaults.backgroundType || DEFAULT_VISUAL_SETTINGS.backgroundType!,
      },
      metadata: {
        exportedAt: new Date().toISOString(),
        description: 'Synapse Visual Settings Export',
      },
    };
  }

  // Import visual settings
  async importSettings(
    config: VisualSettingsConfig
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Validate config version
      if (!config.version || config.version !== '1.0.0') {
        return {
          success: false,
          message:
            'Unsupported settings version. Please use a compatible export file.',
        };
      }

      // Import custom themes
      if (config.themes?.customThemes?.length > 0) {
        for (const theme of config.themes.customThemes) {
          this.saveCustomTheme(theme);
        }
      }

      // Import favorite themes
      if (config.themes?.favoriteThemes?.length > 0) {
        for (const themeId of config.themes.favoriteThemes) {
          const theme = themeManager.getTheme(themeId);
          if (theme) {
            themeManager.addToFavorites(themeId);
          }
        }
      }

      // Import custom gradients
      if (config.backgrounds?.customGradients?.length > 0) {
        for (const gradient of config.backgrounds.customGradients) {
          // Ensure gradient has required properties
          if ('id' in gradient && 'name' in gradient) {
            this.saveCustomGradient(
              gradient as GradientConfig & { id: string; name: string }
            );
          }
        }
      }

      // Import default settings
      if (config.defaults) {
        const defaultSettings: Partial<ItemProperties> = {
          theme: config.defaults.theme,
          fontSize: config.defaults.fontSize,
          fontFamily: config.defaults.fontFamily,
          animationMode: config.defaults.animationMode as string,
          backgroundType: config.defaults.backgroundType as string,
        };
        this.saveAsDefaults(defaultSettings);
      }

      // Import accessibility preferences if present (forward-compatible)
      const prefs = (config as { preferences?: { reduceMotion?: boolean } })
        .preferences;
      if (prefs && typeof prefs.reduceMotion === 'boolean') {
        this.setReduceMotion(prefs.reduceMotion);
      }

      return {
        success: true,
        message: 'Settings imported successfully!',
      };
    } catch (error) {
      console.error('Failed to import settings:', error);
      return {
        success: false,
        message: 'Failed to import settings. Please check the file format.',
      };
    }
  }

  // Generate settings file for download
  generateSettingsFile(): Blob {
    const config = this.exportSettings();
    const jsonString = JSON.stringify(config, null, 2);
    return new Blob([jsonString], { type: 'application/json' });
  }

  // Parse settings file from upload
  async parseSettingsFile(file: File): Promise<VisualSettingsConfig> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const config = JSON.parse(e.target?.result as string);
          resolve(config);
        } catch {
          reject(new Error('Invalid settings file format'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read settings file'));
      reader.readAsText(file);
    });
  }

  // Get storage usage info
  getStorageInfo(): { used: number; available: number; percentage: number } {
    try {
      let used = 0;

      // Calculate used storage
      for (const key in localStorage) {
        if (key.startsWith('synapse-')) {
          used += localStorage[key].length;
        }
      }

      // Estimate available storage (5MB typical limit)
      const available = 5 * 1024 * 1024; // 5MB in bytes
      const percentage = (used / available) * 100;

      return {
        used,
        available,
        percentage: Math.min(percentage, 100),
      };
    } catch {
      console.error('Failed to get storage info:', error);
      return { used: 0, available: 0, percentage: 0 };
    }
  }

  // Clear all custom settings
  clearAllCustomSettings(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.CUSTOM_THEMES_KEY);
      localStorage.removeItem(this.CUSTOM_GRADIENTS_KEY);

      // Clear theme manager favorites
      themeManager.clearFavorites();
    } catch (error) {
      console.error('Failed to clear custom settings:', error);
    }
  }

  // Accessibility: Reduce motion preference
  setReduceMotion(value: boolean): void {
    try {
      const currentRaw = localStorage.getItem(this.ACCESSIBILITY_KEY);
      const current = currentRaw ? JSON.parse(currentRaw) : {};
      const next = {
        ...current,
        reduceMotion: value,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(this.ACCESSIBILITY_KEY, JSON.stringify(next));
    } catch {
      console.error('Failed to save accessibility preferences:', error);
    }
  }

  getReduceMotion(): boolean {
    try {
      const raw = localStorage.getItem(this.ACCESSIBILITY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.reduceMotion === 'boolean')
          return parsed.reduceMotion;
      }
    } catch {
      // ignore
    }
    // Fallback to system setting
    if (typeof window !== 'undefined' && 'matchMedia' in window) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  }
}

// Export singleton instance
export const visualSettingsManager = new VisualSettingsManager();
