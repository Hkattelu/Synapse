// Background system exports

export { BackgroundManager, backgroundManager } from './BackgroundManager';
export {
  builtInCollections,
  getAllBuiltInWallpapers,
  getWallpaperById,
  getWallpapersByCategory,
} from './wallpapers';
export {
  GradientBuilder,
  validateGradient,
  generateGradientCSS,
  gradientPresets,
  getGradientPresetById,
  getGradientPresetsByCategory,
  searchGradientPresets,
} from './gradients';
export type {
  WallpaperAsset,
  WallpaperCollection,
  BackgroundPreview,
  BackgroundManagerEvents,
} from './types';
export type {
  GradientColorStop,
  GradientPreset,
  GradientValidationResult,
} from './gradients';
