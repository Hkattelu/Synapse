import React, { useState, useMemo, useCallback } from 'react';
import { backgroundManager, type WallpaperAsset } from '../../lib/backgrounds';

interface WallpaperPickerProps {
  value?: string; // wallpaper ID
  onChange: (wallpaperId: string | null) => void;
  className?: string;
}

export function WallpaperPicker({ value, onChange, className = '' }: WallpaperPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Get all wallpapers and categories
  const allWallpapers = useMemo(() => backgroundManager.getAllWallpapers(), []);
  const categories = useMemo(() => {
    const cats = new Set(allWallpapers.map(w => w.category));
    return Array.from(cats).map(cat => ({ id: cat, name: cat.charAt(0).toUpperCase() + cat.slice(1) }));
  }, [allWallpapers]);

  // Filter wallpapers based on search and category
  const filteredWallpapers = useMemo(() => {
    let wallpapers = allWallpapers;

    // Filter by category
    if (selectedCategory !== 'all') {
      wallpapers = wallpapers.filter(w => w.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      wallpapers = wallpapers.filter(w => 
        w.name.toLowerCase().includes(query) ||
        w.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return wallpapers;
  }, [allWallpapers, selectedCategory, searchQuery]);

  // Get current wallpaper
  const currentWallpaper = value ? backgroundManager.getWallpaperById(value) : null;

  const handleWallpaperSelect = (wallpaperId: string | null) => {
    onChange(wallpaperId);
    setIsExpanded(false);
  };

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    try {
      const wallpaper = await backgroundManager.addCustomWallpaper(file, 'custom');
      onChange(wallpaper.id);
      setIsExpanded(false);
    } catch (error) {
      console.error('Failed to upload wallpaper:', error);
      alert('Failed to upload wallpaper. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset file input
      event.target.value = '';
    }
  }, [onChange]);

  if (!isExpanded) {
    return (
      <div className={`wallpaper-picker-compact ${className}`}>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          Wallpaper
        </label>
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full bg-background-tertiary border border-border-subtle rounded px-3 py-2 text-left text-text-primary text-sm hover:border-primary-500 focus:outline-none focus:border-primary-500 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {currentWallpaper ? (
                <>
                  <img 
                    src={currentWallpaper.thumbnail} 
                    alt={currentWallpaper.name}
                    className="w-4 h-4 rounded object-cover border border-border-subtle"
                  />
                  <span>{currentWallpaper.name}</span>
                  <span className="text-xs text-text-tertiary capitalize">
                    ({currentWallpaper.category})
                  </span>
                </>
              ) : (
                <>
                  <div className="w-4 h-4 rounded border border-border-subtle bg-background-secondary" />
                  <span>No wallpaper</span>
                </>
              )}
            </div>
            <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className={`wallpaper-picker-expanded ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-text-secondary">
          Wallpaper Selection
        </label>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-text-secondary hover:text-text-primary p-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-2 mb-3">
        <input
          type="text"
          placeholder="Search wallpapers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-background-tertiary border border-border-subtle rounded px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-primary-500"
        />
        
        <div className="flex items-center space-x-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex-1 bg-background-tertiary border border-border-subtle rounded px-2 py-1 text-text-primary text-xs focus:outline-none focus:border-primary-500"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          
          <label className="relative cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="sr-only"
            />
            <span className={`px-2 py-1 text-xs rounded transition-colors border border-border-subtle ${
              isUploading 
                ? 'bg-background-secondary text-text-tertiary cursor-not-allowed' 
                : 'bg-background-tertiary text-text-secondary hover:text-text-primary hover:border-primary-500'
            }`}>
              {isUploading ? 'Uploading...' : '+ Upload'}
            </span>
          </label>
        </div>
      </div>

      {/* Wallpaper Grid */}
      <div className="max-h-64 overflow-y-auto">
        {/* None option */}
        <div
          onClick={() => handleWallpaperSelect(null)}
          className={`wallpaper-card cursor-pointer border rounded p-2 mb-2 transition-all hover:border-primary-500 ${
            !value 
              ? 'border-primary-500 bg-primary-500/10' 
              : 'border-border-subtle hover:bg-background-tertiary'
          }`}
        >
          <div className="flex items-center space-x-2">
            <div className="w-12 h-8 rounded border border-border-subtle bg-background-secondary flex items-center justify-center">
              <svg className="w-4 h-4 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <span className="text-sm font-medium text-text-primary">No wallpaper</span>
          </div>
        </div>

        {/* Wallpaper options */}
        <div className="grid grid-cols-1 gap-2">
          {filteredWallpapers.map(wallpaper => {
            const isSelected = wallpaper.id === value;
            
            return (
              <div
                key={wallpaper.id}
                onClick={() => handleWallpaperSelect(wallpaper.id)}
                className={`wallpaper-card cursor-pointer border rounded p-2 transition-all hover:border-primary-500 ${
                  isSelected 
                    ? 'border-primary-500 bg-primary-500/10' 
                    : 'border-border-subtle hover:bg-background-tertiary'
                }`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <img 
                    src={wallpaper.thumbnail} 
                    alt={wallpaper.name}
                    className="w-12 h-8 rounded object-cover border border-border-subtle"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-text-primary truncate">
                        {wallpaper.name}
                      </span>
                      <span className="text-xs text-text-tertiary capitalize ml-2">
                        {wallpaper.category}
                      </span>
                    </div>
                    <div className="text-xs text-text-tertiary">
                      {wallpaper.dimensions.width} × {wallpaper.dimensions.height}
                      {wallpaper.fileSize && (
                        <span className="ml-2">
                          {(wallpaper.fileSize / 1024 / 1024).toFixed(1)}MB
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {wallpaper.tags && wallpaper.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {wallpaper.tags.slice(0, 3).map(tag => (
                      <span 
                        key={tag}
                        className="text-xs px-1 py-0.5 bg-background-secondary text-text-tertiary rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {wallpaper.tags.length > 3 && (
                      <span className="text-xs text-text-tertiary">
                        +{wallpaper.tags.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {filteredWallpapers.length === 0 && (
          <div className="text-center py-4 text-text-secondary">
            <p className="text-sm">No wallpapers found</p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-primary-500 hover:text-primary-600 mt-1"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>

      {/* Quick stats */}
      <div className="mt-3 pt-2 border-t border-border-subtle">
        <div className="flex justify-between text-xs text-text-tertiary">
          <span>{filteredWallpapers.length} wallpapers</span>
          <span>{categories.length} categories</span>
        </div>
      </div>
    </div>
  );
}