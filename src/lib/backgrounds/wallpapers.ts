// Built-in wallpaper collection

import type { WallpaperAsset, WallpaperCollection } from './types';

// Built-in abstract wallpapers
const abstractWallpapers: WallpaperAsset[] = [
  {
    id: 'abstract-gradient-1',
    name: 'Purple Gradient',
    url: '/wallpapers/abstract/gradient-purple.jpg',
    thumbnail: '/wallpapers/abstract/thumbs/gradient-purple-thumb.jpg',
    dimensions: { width: 1920, height: 1080 },
    category: 'abstract',
    format: 'jpg',
    tags: ['gradient', 'purple', 'smooth'],
    license: 'CC0'
  },
  {
    id: 'abstract-gradient-2',
    name: 'Blue Wave',
    url: '/wallpapers/abstract/wave-blue.jpg',
    thumbnail: '/wallpapers/abstract/thumbs/wave-blue-thumb.jpg',
    dimensions: { width: 1920, height: 1080 },
    category: 'abstract',
    format: 'jpg',
    tags: ['wave', 'blue', 'flowing'],
    license: 'CC0'
  },
  {
    id: 'abstract-geometric-1',
    name: 'Geometric Shapes',
    url: '/wallpapers/abstract/geometric-shapes.svg',
    thumbnail: '/wallpapers/abstract/thumbs/geometric-shapes-thumb.jpg',
    dimensions: { width: 1920, height: 1080 },
    category: 'abstract',
    format: 'svg',
    tags: ['geometric', 'shapes', 'modern'],
    license: 'CC0'
  }
];

// Built-in tech wallpapers
const techWallpapers: WallpaperAsset[] = [
  {
    id: 'tech-circuit-1',
    name: 'Circuit Board',
    url: '/wallpapers/tech/circuit-board.jpg',
    thumbnail: '/wallpapers/tech/thumbs/circuit-board-thumb.jpg',
    dimensions: { width: 1920, height: 1080 },
    category: 'tech',
    format: 'jpg',
    tags: ['circuit', 'technology', 'dark'],
    license: 'CC0'
  },
  {
    id: 'tech-code-1',
    name: 'Code Matrix',
    url: '/wallpapers/tech/code-matrix.jpg',
    thumbnail: '/wallpapers/tech/thumbs/code-matrix-thumb.jpg',
    dimensions: { width: 1920, height: 1080 },
    category: 'tech',
    format: 'jpg',
    tags: ['code', 'matrix', 'programming'],
    license: 'CC0'
  },
  {
    id: 'tech-binary-1',
    name: 'Binary Flow',
    url: '/wallpapers/tech/binary-flow.jpg',
    thumbnail: '/wallpapers/tech/thumbs/binary-flow-thumb.jpg',
    dimensions: { width: 1920, height: 1080 },
    category: 'tech',
    format: 'jpg',
    tags: ['binary', 'flow', 'data'],
    license: 'CC0'
  }
];

// Built-in minimal wallpapers
const minimalWallpapers: WallpaperAsset[] = [
  {
    id: 'minimal-solid-1',
    name: 'Clean White',
    url: '/wallpapers/minimal/clean-white.jpg',
    thumbnail: '/wallpapers/minimal/thumbs/clean-white-thumb.jpg',
    dimensions: { width: 1920, height: 1080 },
    category: 'minimal',
    format: 'jpg',
    tags: ['white', 'clean', 'simple'],
    license: 'CC0'
  },
  {
    id: 'minimal-solid-2',
    name: 'Soft Gray',
    url: '/wallpapers/minimal/soft-gray.jpg',
    thumbnail: '/wallpapers/minimal/thumbs/soft-gray-thumb.jpg',
    dimensions: { width: 1920, height: 1080 },
    category: 'minimal',
    format: 'jpg',
    tags: ['gray', 'soft', 'neutral'],
    license: 'CC0'
  },
  {
    id: 'minimal-texture-1',
    name: 'Paper Texture',
    url: '/wallpapers/minimal/paper-texture.jpg',
    thumbnail: '/wallpapers/minimal/thumbs/paper-texture-thumb.jpg',
    dimensions: { width: 1920, height: 1080 },
    category: 'minimal',
    format: 'jpg',
    tags: ['paper', 'texture', 'subtle'],
    license: 'CC0'
  }
];

// Built-in nature wallpapers
const natureWallpapers: WallpaperAsset[] = [
  {
    id: 'nature-forest-1',
    name: 'Forest Path',
    url: '/wallpapers/nature/forest-path.jpg',
    thumbnail: '/wallpapers/nature/thumbs/forest-path-thumb.jpg',
    dimensions: { width: 1920, height: 1080 },
    category: 'nature',
    format: 'jpg',
    tags: ['forest', 'path', 'green'],
    license: 'CC0'
  },
  {
    id: 'nature-mountain-1',
    name: 'Mountain Vista',
    url: '/wallpapers/nature/mountain-vista.jpg',
    thumbnail: '/wallpapers/nature/thumbs/mountain-vista-thumb.jpg',
    dimensions: { width: 1920, height: 1080 },
    category: 'nature',
    format: 'jpg',
    tags: ['mountain', 'vista', 'landscape'],
    license: 'CC0'
  },
  {
    id: 'nature-ocean-1',
    name: 'Ocean Waves',
    url: '/wallpapers/nature/ocean-waves.jpg',
    thumbnail: '/wallpapers/nature/thumbs/ocean-waves-thumb.jpg',
    dimensions: { width: 1920, height: 1080 },
    category: 'nature',
    format: 'jpg',
    tags: ['ocean', 'waves', 'blue'],
    license: 'CC0'
  }
];

// Built-in wallpaper collections
export const builtInCollections: WallpaperCollection[] = [
  {
    id: 'abstract',
    name: 'Abstract',
    description: 'Modern abstract designs and gradients',
    wallpapers: abstractWallpapers,
    category: 'abstract'
  },
  {
    id: 'tech',
    name: 'Technology',
    description: 'Tech-themed backgrounds for coding content',
    wallpapers: techWallpapers,
    category: 'tech'
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean and simple backgrounds',
    wallpapers: minimalWallpapers,
    category: 'minimal'
  },
  {
    id: 'nature',
    name: 'Nature',
    description: 'Beautiful natural landscapes',
    wallpapers: natureWallpapers,
    category: 'nature'
  }
];

// Get all built-in wallpapers as a flat array
export const getAllBuiltInWallpapers = (): WallpaperAsset[] => {
  return builtInCollections.flatMap(collection => collection.wallpapers);
};

// Get wallpapers by category
export const getWallpapersByCategory = (category: WallpaperAsset['category']): WallpaperAsset[] => {
  const collection = builtInCollections.find(c => c.category === category);
  return collection ? collection.wallpapers : [];
};

// Get wallpaper by ID
export const getWallpaperById = (id: string): WallpaperAsset | null => {
  const allWallpapers = getAllBuiltInWallpapers();
  return allWallpapers.find(w => w.id === id) || null;
};