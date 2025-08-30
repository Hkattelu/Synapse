// Background system types and interfaces

export interface WallpaperAsset {
  id: string;
  name: string;
  url: string;
  thumbnail: string;
  dimensions: { width: number; height: number };
  category: 'abstract' | 'nature' | 'tech' | 'minimal' | 'custom';
  fileSize?: number;
  format?: 'jpg' | 'png' | 'svg' | 'webp';
  tags?: string[];
  author?: string;
  license?: string;
}

export interface WallpaperCollection {
  id: string;
  name: string;
  description: string;
  wallpapers: WallpaperAsset[];
  category: WallpaperAsset['category'];
}

export interface BackgroundPreview {
  type: 'wallpaper' | 'gradient' | 'color';
  previewUrl: string; // Base64 data URL or blob URL
  config: any; // The actual config used to generate this preview
}

export interface BackgroundManagerEvents {
  wallpaperLoaded: (wallpaper: WallpaperAsset) => void;
  wallpaperError: (error: Error, wallpaperId: string) => void;
  previewGenerated: (preview: BackgroundPreview) => void;
}