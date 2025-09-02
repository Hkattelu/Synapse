// Background management system

import type {
  WallpaperAsset,
  WallpaperCollection,
  BackgroundPreview,
  BackgroundManagerEvents,
} from './types';
import type { BackgroundConfig, GradientConfig } from '../types';
import { validateAnyColor } from '../validation/colorValidation';
import {
  validateWallpaperAsset,
  validateImageFile,
  createFallbackBackground,
} from '../validation/backgroundValidation';
import {
  builtInCollections,
  getAllBuiltInWallpapers,
  getWallpaperById,
  getWallpapersByCategory,
} from './wallpapers';
import {
  GradientBuilder,
  validateGradient,
  generateGradientCSS,
  gradientPresets,
  getGradientPresetById,
  getGradientPresetsByCategory,
} from './gradients';

export class BackgroundManager {
  private customWallpapers: WallpaperAsset[] = [];
  private customCollections: WallpaperCollection[] = [];
  private eventListeners: Partial<BackgroundManagerEvents> = {};
  private previewCache = new Map<string, BackgroundPreview>();

  constructor() {
    // Initialize with built-in collections
  }

  // Event handling
  on<K extends keyof BackgroundManagerEvents>(
    event: K,
    listener: BackgroundManagerEvents[K]
  ): void {
    this.eventListeners[event] = listener;
  }

  off<K extends keyof BackgroundManagerEvents>(event: K): void {
    delete this.eventListeners[event];
  }

  private emit<K extends keyof BackgroundManagerEvents>(
    event: K,
    ...args: Parameters<BackgroundManagerEvents[K]>
  ): void {
    const listener = this.eventListeners[event];
    if (listener) {
      // TypeScript cannot infer the spread tuple type for this index signature; use a wrapper function
      (listener as (...a: unknown[]) => void)(...args);
    }
  }

  // Wallpaper management
  getAllWallpapers(): WallpaperAsset[] {
    return [...getAllBuiltInWallpapers(), ...this.customWallpapers];
  }

  getWallpapersByCategory(
    category: WallpaperAsset['category']
  ): WallpaperAsset[] {
    const builtIn = getWallpapersByCategory(category);
    const custom = this.customWallpapers.filter((w) => w.category === category);
    return [...builtIn, ...custom];
  }

  getWallpaperById(id: string): WallpaperAsset | null {
    // Check built-in first
    const builtIn = getWallpaperById(id);
    if (builtIn) return builtIn;

    // Check custom wallpapers
    return this.customWallpapers.find((w) => w.id === id) || null;
  }

  getAllCollections(): WallpaperCollection[] {
    return [...builtInCollections, ...this.customCollections];
  }

  getCollectionById(id: string): WallpaperCollection | null {
    const allCollections = this.getAllCollections();
    return allCollections.find((c) => c.id === id) || null;
  }

  // Custom wallpaper management
  async addCustomWallpaper(
    file: File,
    category: WallpaperAsset['category']
  ): Promise<WallpaperAsset> {
    try {
      // Validate the file first
      const fileValidation = this.validateImageFile(file);
      if (!fileValidation.isValid) {
        const error = new Error(
          `Invalid image file: ${fileValidation.errors.join(', ')}`
        );
        this.emit('wallpaperError', error, 'unknown');
        throw error;
      }

      if (fileValidation.warnings.length > 0) {
        console.warn('Image file warnings:', fileValidation.warnings);
      }

      // Generate unique ID
      const id = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create object URL for the file
      const url = URL.createObjectURL(file);

      // Get image dimensions
      const dimensions = await this.getImageDimensions(url);

      // Generate thumbnail
      const thumbnail = await this.generateThumbnail(url, 200, 150);

      const wallpaper: WallpaperAsset = {
        id,
        name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
        url,
        thumbnail,
        dimensions,
        category,
        format: this.getImageFormat(file.type),
        fileSize: file.size,
        tags: ['custom'],
        license: 'Custom',
      };

      // Validate the complete wallpaper asset
      const assetValidation = this.validateWallpaperAsset(wallpaper);
      if (!assetValidation.isValid) {
        // Clean up object URLs
        URL.revokeObjectURL(url);
        URL.revokeObjectURL(thumbnail);

        const error = new Error(
          `Invalid wallpaper asset: ${assetValidation.errors.join(', ')}`
        );
        this.emit('wallpaperError', error, id);
        throw error;
      }

      if (assetValidation.warnings.length > 0) {
        console.warn('Wallpaper asset warnings:', assetValidation.warnings);
      }

      this.customWallpapers.push(wallpaper);
      this.emit('wallpaperLoaded', wallpaper);

      return wallpaper;
    } catch (error) {
      this.emit('wallpaperError', error as Error, 'unknown');
      throw error;
    }
  }

  removeCustomWallpaper(id: string): boolean {
    const index = this.customWallpapers.findIndex((w) => w.id === id);
    if (index === -1) return false;

    const wallpaper = this.customWallpapers[index];
    // Clean up object URL
    if (wallpaper.url.startsWith('blob:')) {
      URL.revokeObjectURL(wallpaper.url);
    }
    if (wallpaper.thumbnail.startsWith('blob:')) {
      URL.revokeObjectURL(wallpaper.thumbnail);
    }

    this.customWallpapers.splice(index, 1);
    return true;
  }

  // Background configuration helpers
  createWallpaperBackground(
    wallpaperId: string,
    opacity: number = 1,
    blendMode: 'normal' | 'multiply' | 'overlay' | 'soft-light' = 'normal'
  ): BackgroundConfig {
    return {
      type: 'wallpaper',
      wallpaper: {
        assetId: wallpaperId,
        opacity,
        blendMode,
      },
    };
  }

  createGradientBackground(gradient: GradientConfig): BackgroundConfig {
    // Validate gradient before creating background
    const validation = this.validateGradientConfig(gradient);
    if (!validation.isValid) {
      console.warn('Invalid gradient configuration:', validation.errors);
      // Return a fallback gradient
      return this.createFallbackBackground({ type: 'gradient', gradient });
    }

    if (validation.warnings.length > 0) {
      console.warn('Gradient configuration warnings:', validation.warnings);
    }

    return {
      type: 'gradient',
      gradient,
    };
  }

  createColorBackground(color: string): BackgroundConfig {
    // Validate color before creating background
    const validation = this.validateColor(color);
    if (!validation.isValid) {
      console.warn('Invalid color:', validation.error);
      // Return fallback background
      return this.createFallbackBackground({ type: 'color', color });
    }

    return {
      type: 'color',
      color: validation.normalizedColor || color,
    };
  }

  // Gradient utilities
  createGradientBuilder(
    initialConfig?: Partial<GradientConfig>
  ): GradientBuilder {
    return new GradientBuilder(initialConfig);
  }

  validateGradientConfig(config: GradientConfig) {
    return validateGradient(config);
  }

  getGradientCSS(config: GradientConfig): string {
    return generateGradientCSS(config);
  }

  getAllGradientPresets() {
    return gradientPresets;
  }

  getGradientPresetById(id: string) {
    return getGradientPresetById(id);
  }

  getGradientPresetsByCategory(
    category: 'warm' | 'cool' | 'neutral' | 'vibrant' | 'monochrome'
  ) {
    return getGradientPresetsByCategory(category);
  }

  // Preview generation
  async generateBackgroundPreview(
    config: BackgroundConfig
  ): Promise<BackgroundPreview> {
    const cacheKey = JSON.stringify(config);

    // Check cache first
    if (this.previewCache.has(cacheKey)) {
      return this.previewCache.get(cacheKey)!;
    }

    let preview: BackgroundPreview;

    switch (config.type) {
      case 'wallpaper':
        preview = await this.generateWallpaperPreview(config);
        break;
      case 'gradient':
        preview = await this.generateGradientPreview(config);
        break;
      case 'color':
        preview = await this.generateColorPreview(config);
        break;
      default:
        throw new Error(`Unsupported background type: ${config.type}`);
    }

    // Cache the preview
    this.previewCache.set(cacheKey, preview);
    this.emit('previewGenerated', preview);

    return preview;
  }

  private async generateWallpaperPreview(
    config: BackgroundConfig
  ): Promise<BackgroundPreview> {
    if (!config.wallpaper) {
      throw new Error('Wallpaper config is required');
    }

    const wallpaper = this.getWallpaperById(config.wallpaper.assetId);
    if (!wallpaper) {
      throw new Error(`Wallpaper not found: ${config.wallpaper.assetId}`);
    }

    // For now, return the thumbnail as preview
    // In a full implementation, you might want to apply opacity and blend mode
    return {
      type: 'wallpaper',
      previewUrl: wallpaper.thumbnail,
      config,
    };
  }

  private async generateGradientPreview(
    config: BackgroundConfig
  ): Promise<BackgroundPreview> {
    if (!config.gradient) {
      throw new Error('Gradient config is required');
    }

    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 150;
    const ctx = canvas.getContext('2d')!;

    const gradient = this.createCanvasGradient(
      ctx,
      config.gradient,
      canvas.width,
      canvas.height
    );
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const previewUrl = canvas.toDataURL('image/png');

    return {
      type: 'gradient',
      previewUrl,
      config,
    };
  }

  private async generateColorPreview(
    config: BackgroundConfig
  ): Promise<BackgroundPreview> {
    if (!config.color) {
      throw new Error('Color is required');
    }

    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 150;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = config.color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const previewUrl = canvas.toDataURL('image/png');

    return {
      type: 'color',
      previewUrl,
      config,
    };
  }

  // Utility methods
  private async getImageDimensions(
    url: string
  ): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  private async generateThumbnail(
    url: string,
    maxWidth: number,
    maxHeight: number
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        // Calculate thumbnail dimensions maintaining aspect ratio
        const aspectRatio = img.width / img.height;
        let thumbWidth = maxWidth;
        let thumbHeight = maxHeight;

        if (aspectRatio > maxWidth / maxHeight) {
          thumbHeight = maxWidth / aspectRatio;
        } else {
          thumbWidth = maxHeight * aspectRatio;
        }

        canvas.width = thumbWidth;
        canvas.height = thumbHeight;

        ctx.drawImage(img, 0, 0, thumbWidth, thumbHeight);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  private getImageFormat(
    mimeType: string
  ): 'jpg' | 'png' | 'svg' | 'webp' | 'gif' {
    switch (mimeType) {
      case 'image/jpeg':
        return 'jpg';
      case 'image/png':
        return 'png';
      case 'image/svg+xml':
        return 'svg';
      case 'image/webp':
        return 'webp';
      case 'image/gif':
        return 'gif';
      default:
        return 'jpg';
    }
  }

  private createCanvasGradient(
    ctx: CanvasRenderingContext2D,
    config: GradientConfig,
    width: number,
    height: number
  ): CanvasGradient {
    let gradient: CanvasGradient;

    if (config.type === 'linear') {
      const angle = ((config.angle || 0) * Math.PI) / 180;
      const x1 = width / 2 - (Math.cos(angle) * width) / 2;
      const y1 = height / 2 - (Math.sin(angle) * height) / 2;
      const x2 = width / 2 + (Math.cos(angle) * width) / 2;
      const y2 = height / 2 + (Math.sin(angle) * height) / 2;

      gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    } else {
      const centerX = (config.centerX || 0.5) * width;
      const centerY = (config.centerY || 0.5) * height;
      const radius = Math.max(width, height) / 2;

      gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        radius
      );
    }

    // Add color stops
    config.colors.forEach(({ color, position }) => {
      gradient.addColorStop(position, color);
    });

    return gradient;
  }

  // Validation methods
  validateColor(color: string) {
    try {
      return validateAnyColor(color);
    } catch (error) {
      console.error('Color validation error:', error);
      return { isValid: false, error: 'Validation module unavailable' };
    }
  }

  validateWallpaperAsset(asset: WallpaperAsset) {
    try {
      return validateWallpaperAsset(asset);
    } catch (error) {
      console.error('Wallpaper asset validation error:', error);
      return {
        isValid: false,
        errors: ['Validation module unavailable'],
        warnings: [],
        fileValidation: { format: false, size: false, dimensions: false },
      };
    }
  }

  validateImageFile(file: File) {
    try {
      return validateImageFile(file);
    } catch (error) {
      console.error('Image file validation error:', error);
      return {
        isValid: false,
        errors: ['Validation module unavailable'],
        warnings: [],
      };
    }
  }

  createFallbackBackground(
    originalConfig?: Partial<BackgroundConfig>
  ): BackgroundConfig {
    try {
      return createFallbackBackground(originalConfig);
    } catch (error) {
      console.error('Failed to create fallback background:', error);
      return { type: 'none' };
    }
  }

  // Cleanup
  dispose(): void {
    // Clean up custom wallpaper object URLs
    this.customWallpapers.forEach((wallpaper) => {
      if (wallpaper.url.startsWith('blob:')) {
        URL.revokeObjectURL(wallpaper.url);
      }
      if (wallpaper.thumbnail.startsWith('blob:')) {
        URL.revokeObjectURL(wallpaper.thumbnail);
      }
    });

    // Clear caches
    this.customWallpapers = [];
    this.customCollections = [];
    this.previewCache.clear();
    this.eventListeners = {};
  }
}

// Singleton instance
export const backgroundManager = new BackgroundManager();
