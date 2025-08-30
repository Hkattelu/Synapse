import { describe, it, expect, beforeEach, vi } from 'vitest';
import { visualSettingsManager, DEFAULT_VISUAL_SETTINGS } from '../VisualSettingsManager';

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

describe('VisualSettingsManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Default Settings', () => {
    it('should have correct default visual settings', () => {
      expect(DEFAULT_VISUAL_SETTINGS).toEqual({
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
        diffHighlightColor: '#4ade80'
      });
    });
  });

  describe('Save and Load Defaults', () => {
    it('should save settings as defaults', () => {
      const testSettings = {
        theme: 'monokai',
        fontSize: 16,
        animationMode: 'line-by-line' as const
      };

      visualSettingsManager.saveAsDefaults(testSettings);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'synapse-visual-settings',
        expect.stringContaining('"theme":"monokai"')
      );
    });

    it('should load saved defaults', () => {
      const savedSettings = {
        theme: 'monokai',
        fontSize: 16,
        savedAt: '2023-01-01T00:00:00.000Z'
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedSettings));

      const loaded = visualSettingsManager.loadDefaults();

      expect(loaded).toEqual(expect.objectContaining({
        theme: 'monokai',
        fontSize: 16
      }));
    });

    it('should return default settings when no saved settings exist', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const loaded = visualSettingsManager.loadDefaults();

      expect(loaded).toEqual(DEFAULT_VISUAL_SETTINGS);
    });

    it('should handle corrupted saved settings gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');

      const loaded = visualSettingsManager.loadDefaults();

      expect(loaded).toEqual(DEFAULT_VISUAL_SETTINGS);
    });
  });

  describe('Reset to Defaults', () => {
    it('should reset to factory defaults', () => {
      const reset = visualSettingsManager.resetToDefaults();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('synapse-visual-settings');
      expect(reset).toEqual(DEFAULT_VISUAL_SETTINGS);
    });
  });

  describe('Custom Themes', () => {
    it('should save custom theme', () => {
      const customTheme = {
        id: 'custom-theme-1',
        name: 'My Custom Theme',
        colors: { background: '#000000', foreground: '#ffffff' }
      };

      visualSettingsManager.saveCustomTheme(customTheme);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'synapse-custom-themes',
        expect.stringContaining('"id":"custom-theme-1"')
      );
    });

    it('should get custom themes', () => {
      const themes = [
        { id: 'theme1', name: 'Theme 1', isCustom: true },
        { id: 'theme2', name: 'Theme 2', isCustom: true }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(themes));

      const result = visualSettingsManager.getCustomThemes();

      expect(result).toEqual(themes);
    });

    it('should delete custom theme', () => {
      const themes = [
        { id: 'theme1', name: 'Theme 1' },
        { id: 'theme2', name: 'Theme 2' }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(themes));

      visualSettingsManager.deleteCustomTheme('theme1');

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'synapse-custom-themes',
        expect.stringContaining('"id":"theme2"')
      );
    });
  });

  describe('Custom Gradients', () => {
    it('should save custom gradient', () => {
      const gradient = {
        id: 'gradient-1',
        name: 'My Gradient',
        type: 'linear' as const,
        colors: [
          { color: '#ff0000', position: 0 },
          { color: '#0000ff', position: 1 }
        ]
      };

      visualSettingsManager.saveCustomGradient(gradient);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'synapse-custom-gradients',
        expect.stringContaining('"id":"gradient-1"')
      );
    });

    it('should get custom gradients', () => {
      const gradients = [
        { id: 'grad1', name: 'Gradient 1', type: 'linear', colors: [], isCustom: true, createdAt: '2023-01-01' }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(gradients));

      const result = visualSettingsManager.getCustomGradients();

      expect(result).toEqual(gradients);
    });
  });

  describe('Export and Import', () => {
    it('should export settings config', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'synapse-visual-settings') {
          return JSON.stringify({ theme: 'monokai' });
        }
        if (key === 'synapse-custom-themes') {
          return JSON.stringify([{ id: 'theme1', name: 'Theme 1' }]);
        }
        return null;
      });

      const config = visualSettingsManager.exportSettings();

      expect(config).toEqual(expect.objectContaining({
        version: '1.0.0',
        themes: expect.objectContaining({
          customThemes: [{ id: 'theme1', name: 'Theme 1' }]
        }),
        defaults: expect.objectContaining({
          theme: 'monokai'
        }),
        metadata: expect.objectContaining({
          exportedAt: expect.any(String)
        })
      }));
    });

    it('should generate settings file blob', () => {
      const blob = visualSettingsManager.generateSettingsFile();

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/json');
    });

    it('should import valid settings', async () => {
      const validConfig = {
        version: '1.0.0',
        themes: {
          customThemes: [{ id: 'imported-theme', name: 'Imported Theme' }],
          favoriteThemes: []
        },
        backgrounds: {
          customGradients: [],
          customWallpapers: []
        },
        defaults: {
          theme: 'imported-theme',
          fontSize: 18,
          fontFamily: 'Arial',
          animationMode: 'typing',
          backgroundType: 'none'
        },
        metadata: {
          exportedAt: '2023-01-01T00:00:00.000Z'
        }
      };

      const result = await visualSettingsManager.importSettings(validConfig);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Settings imported successfully!');
    });

    it('should reject invalid settings version', async () => {
      const invalidConfig = {
        version: '2.0.0', // Unsupported version
        themes: { customThemes: [], favoriteThemes: [] },
        backgrounds: { customGradients: [], customWallpapers: [] },
        defaults: {},
        metadata: { exportedAt: '2023-01-01T00:00:00.000Z' }
      };

      const result = await visualSettingsManager.importSettings(invalidConfig);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Unsupported settings version');
    });
  });

  describe('Storage Management', () => {
    it('should get storage info', () => {
      localStorageMock.getItem = vi.fn();
      // Mock localStorage keys
      Object.defineProperty(localStorage, 'length', { value: 2 });
      Object.defineProperty(localStorage, 'key', {
        value: vi.fn((index) => index === 0 ? 'synapse-visual-settings' : 'other-key')
      });
      
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'synapse-visual-settings') return '{"theme":"monokai"}';
        return null;
      });

      const info = visualSettingsManager.getStorageInfo();

      expect(info).toEqual(expect.objectContaining({
        used: expect.any(Number),
        available: expect.any(Number),
        percentage: expect.any(Number)
      }));
    });

    it('should clear all custom settings', () => {
      visualSettingsManager.clearAllCustomSettings();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('synapse-visual-settings');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('synapse-custom-themes');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('synapse-custom-gradients');
    });
  });
});