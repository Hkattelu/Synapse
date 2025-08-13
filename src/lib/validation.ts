// Validation functions for data models

import type {
  MediaAsset,
  MediaAssetType,
  TimelineItem,
  TimelineItemType,
  AnimationPreset,
  AnimationType,
  Project,
  ProjectSettings,
  ItemProperties,
} from './types';

// Validation error types
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Helper functions
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const isValidId = (id: string): boolean => {
  return typeof id === 'string' && id.length > 0 && id.trim() === id;
};

const isPositiveNumber = (value: number): boolean => {
  return typeof value === 'number' && value > 0 && !isNaN(value);
};

const isNonNegativeNumber = (value: number): boolean => {
  return typeof value === 'number' && value >= 0 && !isNaN(value);
};

// Media Asset validation
export const validateMediaAsset = (
  asset: Partial<MediaAsset>
): ValidationResult => {
  const errors: ValidationError[] = [];

  if (!asset.id || !isValidId(asset.id)) {
    errors.push({
      field: 'id',
      message: 'ID is required and must be a non-empty string',
    });
  }

  if (
    !asset.name ||
    typeof asset.name !== 'string' ||
    asset.name.trim().length === 0
  ) {
    errors.push({
      field: 'name',
      message: 'Name is required and must be a non-empty string',
    });
  }

  const validTypes: MediaAssetType[] = ['video', 'image', 'audio', 'code'];
  if (!asset.type || !validTypes.includes(asset.type)) {
    errors.push({
      field: 'type',
      message: `Type must be one of: ${validTypes.join(', ')}`,
    });
  }

  if (!asset.url || !isValidUrl(asset.url)) {
    errors.push({
      field: 'url',
      message: 'URL is required and must be a valid URL',
    });
  }

  if (asset.duration !== undefined && !isPositiveNumber(asset.duration)) {
    errors.push({
      field: 'duration',
      message: 'Duration must be a positive number',
    });
  }

  if (!asset.metadata) {
    errors.push({ field: 'metadata', message: 'Metadata is required' });
  } else {
    if (!isPositiveNumber(asset.metadata.fileSize)) {
      errors.push({
        field: 'metadata.fileSize',
        message: 'File size must be a positive number',
      });
    }

    if (
      !asset.metadata.mimeType ||
      typeof asset.metadata.mimeType !== 'string'
    ) {
      errors.push({
        field: 'metadata.mimeType',
        message: 'MIME type is required',
      });
    }
  }

  if (!asset.createdAt || !(asset.createdAt instanceof Date)) {
    errors.push({
      field: 'createdAt',
      message: 'Created date is required and must be a Date object',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Timeline Item validation
export const validateTimelineItem = (
  item: Partial<TimelineItem>
): ValidationResult => {
  const errors: ValidationError[] = [];

  if (!item.id || !isValidId(item.id)) {
    errors.push({
      field: 'id',
      message: 'ID is required and must be a non-empty string',
    });
  }

  if (!item.assetId || !isValidId(item.assetId)) {
    errors.push({
      field: 'assetId',
      message: 'Asset ID is required and must be a non-empty string',
    });
  }

  if (!isNonNegativeNumber(item.startTime!)) {
    errors.push({
      field: 'startTime',
      message: 'Start time must be a non-negative number',
    });
  }

  if (!isPositiveNumber(item.duration!)) {
    errors.push({
      field: 'duration',
      message: 'Duration must be a positive number',
    });
  }

  if (!isNonNegativeNumber(item.track!)) {
    errors.push({
      field: 'track',
      message: 'Track must be a non-negative number',
    });
  }

  const validTypes: TimelineItemType[] = ['video', 'code', 'title', 'audio'];
  if (!item.type || !validTypes.includes(item.type)) {
    errors.push({
      field: 'type',
      message: `Type must be one of: ${validTypes.join(', ')}`,
    });
  }

  if (!item.properties || typeof item.properties !== 'object') {
    errors.push({
      field: 'properties',
      message: 'Properties object is required',
    });
  }

  if (!Array.isArray(item.animations)) {
    errors.push({
      field: 'animations',
      message: 'Animations must be an array',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Animation Preset validation
export const validateAnimationPreset = (
  preset: Partial<AnimationPreset>
): ValidationResult => {
  const errors: ValidationError[] = [];

  if (!preset.id || !isValidId(preset.id)) {
    errors.push({
      field: 'id',
      message: 'ID is required and must be a non-empty string',
    });
  }

  if (
    !preset.name ||
    typeof preset.name !== 'string' ||
    preset.name.trim().length === 0
  ) {
    errors.push({
      field: 'name',
      message: 'Name is required and must be a non-empty string',
    });
  }

  const validTypes: AnimationType[] = [
    'entrance',
    'exit',
    'emphasis',
    'transition',
  ];
  if (!preset.type || !validTypes.includes(preset.type)) {
    errors.push({
      field: 'type',
      message: `Type must be one of: ${validTypes.join(', ')}`,
    });
  }

  if (!preset.parameters || typeof preset.parameters !== 'object') {
    errors.push({
      field: 'parameters',
      message: 'Parameters object is required',
    });
  }

  if (!isPositiveNumber(preset.duration!)) {
    errors.push({
      field: 'duration',
      message: 'Duration must be a positive number',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Project validation
export const validateProject = (
  project: Partial<Project>
): ValidationResult => {
  const errors: ValidationError[] = [];

  if (!project.id || !isValidId(project.id)) {
    errors.push({
      field: 'id',
      message: 'ID is required and must be a non-empty string',
    });
  }

  if (
    !project.name ||
    typeof project.name !== 'string' ||
    project.name.trim().length === 0
  ) {
    errors.push({
      field: 'name',
      message: 'Name is required and must be a non-empty string',
    });
  }

  if (!project.createdAt || !(project.createdAt instanceof Date)) {
    errors.push({
      field: 'createdAt',
      message: 'Created date is required and must be a Date object',
    });
  }

  if (!project.updatedAt || !(project.updatedAt instanceof Date)) {
    errors.push({
      field: 'updatedAt',
      message: 'Updated date is required and must be a Date object',
    });
  }

  if (!Array.isArray(project.timeline)) {
    errors.push({ field: 'timeline', message: 'Timeline must be an array' });
  }

  if (!Array.isArray(project.mediaAssets)) {
    errors.push({
      field: 'mediaAssets',
      message: 'Media assets must be an array',
    });
  }

  if (!project.settings) {
    errors.push({
      field: 'settings',
      message: 'Project settings are required',
    });
  } else {
    const settingsValidation = validateProjectSettings(project.settings);
    if (!settingsValidation.isValid) {
      errors.push(
        ...settingsValidation.errors.map((error) => ({
          field: `settings.${error.field}`,
          message: error.message,
        }))
      );
    }
  }

  if (!project.version || typeof project.version !== 'string') {
    errors.push({
      field: 'version',
      message: 'Version is required and must be a string',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Project Settings validation
export const validateProjectSettings = (
  settings: Partial<ProjectSettings>
): ValidationResult => {
  const errors: ValidationError[] = [];

  if (!isPositiveNumber(settings.width!)) {
    errors.push({ field: 'width', message: 'Width must be a positive number' });
  }

  if (!isPositiveNumber(settings.height!)) {
    errors.push({
      field: 'height',
      message: 'Height must be a positive number',
    });
  }

  if (!isPositiveNumber(settings.fps!)) {
    errors.push({ field: 'fps', message: 'FPS must be a positive number' });
  }

  if (!isPositiveNumber(settings.duration!)) {
    errors.push({
      field: 'duration',
      message: 'Duration must be a positive number',
    });
  }

  if (
    !settings.backgroundColor ||
    typeof settings.backgroundColor !== 'string'
  ) {
    errors.push({
      field: 'backgroundColor',
      message: 'Background color is required and must be a string',
    });
  }

  if (
    settings.audioSampleRate !== undefined &&
    !isPositiveNumber(settings.audioSampleRate)
  ) {
    errors.push({
      field: 'audioSampleRate',
      message: 'Audio sample rate must be a positive number',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Item Properties validation
export const validateItemProperties = (
  properties: Partial<ItemProperties>
): ValidationResult => {
  const errors: ValidationError[] = [];

  // Transform properties validation
  if (properties.x !== undefined && typeof properties.x !== 'number') {
    errors.push({ field: 'x', message: 'X position must be a number' });
  }

  if (properties.y !== undefined && typeof properties.y !== 'number') {
    errors.push({ field: 'y', message: 'Y position must be a number' });
  }

  if (properties.scale !== undefined && !isPositiveNumber(properties.scale)) {
    errors.push({ field: 'scale', message: 'Scale must be a positive number' });
  }

  if (
    properties.rotation !== undefined &&
    typeof properties.rotation !== 'number'
  ) {
    errors.push({ field: 'rotation', message: 'Rotation must be a number' });
  }

  if (
    properties.opacity !== undefined &&
    (typeof properties.opacity !== 'number' ||
      properties.opacity < 0 ||
      properties.opacity > 1)
  ) {
    errors.push({
      field: 'opacity',
      message: 'Opacity must be a number between 0 and 1',
    });
  }

  // Video-specific properties validation
  if (
    properties.volume !== undefined &&
    (typeof properties.volume !== 'number' ||
      properties.volume < 0 ||
      properties.volume > 1)
  ) {
    errors.push({
      field: 'volume',
      message: 'Volume must be a number between 0 and 1',
    });
  }

  if (
    properties.playbackRate !== undefined &&
    !isPositiveNumber(properties.playbackRate)
  ) {
    errors.push({
      field: 'playbackRate',
      message: 'Playback rate must be a positive number',
    });
  }

  // Code-specific properties validation
  if (
    properties.language !== undefined &&
    typeof properties.language !== 'string'
  ) {
    errors.push({ field: 'language', message: 'Language must be a string' });
  }

  if (properties.theme !== undefined && typeof properties.theme !== 'string') {
    errors.push({ field: 'theme', message: 'Theme must be a string' });
  }

  if (
    properties.fontSize !== undefined &&
    !isPositiveNumber(properties.fontSize)
  ) {
    errors.push({
      field: 'fontSize',
      message: 'Font size must be a positive number',
    });
  }

  // Title-specific properties validation
  if (properties.text !== undefined && typeof properties.text !== 'string') {
    errors.push({ field: 'text', message: 'Text must be a string' });
  }

  if (
    properties.fontFamily !== undefined &&
    typeof properties.fontFamily !== 'string'
  ) {
    errors.push({
      field: 'fontFamily',
      message: 'Font family must be a string',
    });
  }

  if (properties.color !== undefined && typeof properties.color !== 'string') {
    errors.push({ field: 'color', message: 'Color must be a string' });
  }

  if (
    properties.backgroundColor !== undefined &&
    typeof properties.backgroundColor !== 'string'
  ) {
    errors.push({
      field: 'backgroundColor',
      message: 'Background color must be a string',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
