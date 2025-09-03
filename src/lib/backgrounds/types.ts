// Background system types and interfaces

export interface WallpaperAsset {
  id: string;
  name: string;
  url: string;
  thumbnail: string;
  dimensions: { width: number; height: number };
  category: 'abstract' | 'nature' | 'tech' | 'minimal' | 'custom';
  fileSize?: number;
  // Image format; now includes GIF for subtle animated wallpapers
  format?: 'jpg' | 'png' | 'svg' | 'webp' | 'gif';
  tags?: string[];
  author?: string;
  license?: string;
  // Indicates whether this wallpaper has inherent motion (e.g., GIF)
  animated?: boolean;
  // Optional static fallback to use when reduced motion is enabled or animations are disabled
  stillUrl?: string;
}

export interface WallpaperCollection {
  id: string;
  name: string;
  description: string;
  wallpapers: WallpaperAsset[];
  category: WallpaperAsset['category'];
}

import type { BackgroundConfig } from '../types';

export interface BackgroundPreview {
  type: 'wallpaper' | 'gradient' | 'color';
  previewUrl: string; // Base64 data URL or blob URL
  config: BackgroundConfig; // The actual config used to generate this preview
}

export interface BackgroundManagerEvents {
  wallpaperLoaded: (wallpaper: WallpaperAsset) => void;
  wallpaperError: (error: Error, wallpaperId: string) => void;
  previewGenerated: (preview: BackgroundPreview) => void;
}
