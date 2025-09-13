import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { WallpaperPicker } from '../ui/WallpaperPicker';

vi.mock('../../lib/backgrounds', () => {
  const mockWallpapers = [
    {
      id: 'animated-gif-1',
      name: 'Animated Test',
      url: 'blob:gif',
      thumbnail: 'data:image/jpeg;base64,thumb',
      dimensions: { width: 1920, height: 1080 },
      category: 'abstract',
      format: 'gif',
      animated: true,
      tags: ['animated'],
      license: 'CC0',
    },
  ];
  return {
    backgroundManager: {
      getAllWallpapers: () => mockWallpapers,
      getWallpaperById: (id: string) =>
        mockWallpapers.find((w) => w.id === id) || null,
      addCustomWallpaper: vi.fn(),
    },
  };
});

describe('WallpaperPicker - animated badges', () => {
  it('shows Animated badge for GIF wallpapers', () => {
    const onChange = vi.fn();
    render(<WallpaperPicker value={undefined} onChange={onChange} />);

    // Expand
    fireEvent.click(
      screen.getByText('Wallpaper').closest('div')!.querySelector('button')!
    );

    // Verify badges present (case-insensitive, allow multiple matches)
    const animatedBadges = screen.getAllByText(/Animated/i);
    expect(animatedBadges.length).toBeGreaterThan(0);
    expect(screen.getByText(/GIF/i)).toBeInTheDocument();
  });
});
