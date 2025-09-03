import { describe, it, expect, vi } from 'vitest';
import { validateWallpaperAsset, validateImageFile } from '../validation/backgroundValidation';
import type { WallpaperAsset } from '../backgrounds/types';

describe('Backgrounds - GIF support', () => {
  it('accepts GIF format in wallpaper asset validation', () => {
    const asset: WallpaperAsset = {
      id: 'gif-test-1',
      name: 'Subtle Loop',
      url: 'https://example.com/wallpapers/subtle.gif',
      thumbnail: 'data:image/jpeg;base64,thumb',
      dimensions: { width: 1920, height: 1080 },
      category: 'abstract',
      format: 'gif',
      animated: true,
      stillUrl: 'https://example.com/wallpapers/subtle-still.jpg',
      tags: ['animated', 'subtle'],
      license: 'CC0',
    };

    const result = validateWallpaperAsset(asset);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('accepts image/gif uploads in validateImageFile', () => {
    const file = new File([new Uint8Array([71, 73, 70])], 'loop.gif', { type: 'image/gif' });
    const result = validateImageFile(file);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
