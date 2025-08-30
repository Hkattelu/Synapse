import React, { useState, useMemo } from 'react';
import { themeManager, generateThemeCard, type ThemeDefinition } from '../../lib/themes';

interface ThemePickerProps {
  value: string;
  onChange: (themeId: string) => void;
  className?: string;
}

export function ThemePicker({ value, onChange, className = '' }: ThemePickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFavorites, setShowFavorites] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Get all themes and categories
  const allThemes = useMemo(() => themeManager.getAllThemes(), []);
  const categories = useMemo(() => themeManager.getCategories(), []);
  const favoriteThemes = useMemo(() => themeManager.getFavoriteThemes(), []);

  // Filter themes based on search, category, and favorites
  const filteredThemes = useMemo(() => {
    let themes = allThemes;

    // Filter by favorites
    if (showFavorites) {
      themes = favoriteThemes;
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      themes = themes.filter(theme => theme.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      themes = themeManager.searchThemes(searchQuery);
    }

    return themes;
  }, [allThemes, favoriteThemes, selectedCategory, showFavorites, searchQuery]);

  // Get current theme
  const currentTheme = themeManager.getTheme(value);

  const handleThemeSelect = (themeId: string) => {
    onChange(themeId);
    themeManager.recordThemeUsage(themeId);
    setIsExpanded(false);
  };

  const toggleFavorite = (themeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (themeManager.isFavorite(themeId)) {
      themeManager.removeFromFavorites(themeId);
    } else {
      themeManager.addToFavorites(themeId);
    }
    // Force re-render by updating a state
    setShowFavorites(prev => prev);
  };

  if (!isExpanded) {
    return (
      <div className={`theme-picker-compact ${className}`}>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          Theme
        </label>
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full bg-background-tertiary border border-border-subtle rounded px-3 py-2 text-left text-text-primary text-sm hover:border-primary-500 focus:outline-none focus:border-primary-500 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div 
                className="w-4 h-4 rounded border border-border-subtle"
                style={{ backgroundColor: currentTheme?.colors.background || '#1e1e1e' }}
              />
              <span>{currentTheme?.name || 'Unknown Theme'}</span>
              <span className="text-xs text-text-tertiary capitalize">
                ({currentTheme?.category || 'unknown'})
              </span>
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
    <div className={`theme-picker-expanded ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-text-secondary">
          Theme Selection
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
          placeholder="Search themes..."
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
          
          <button
            onClick={() => setShowFavorites(!showFavorites)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              showFavorites 
                ? 'bg-primary-500 text-white' 
                : 'bg-background-tertiary text-text-secondary hover:text-text-primary border border-border-subtle'
            }`}
          >
            ★ Favorites
          </button>
        </div>
      </div>

      {/* Theme Grid */}
      <div className="max-h-64 overflow-y-auto">
        <div className="grid grid-cols-1 gap-2">
          {filteredThemes.map(theme => {
            const isFavorite = themeManager.isFavorite(theme.id);
            const isSelected = theme.id === value;
            
            return (
              <div
                key={theme.id}
                onClick={() => handleThemeSelect(theme.id)}
                className={`theme-card cursor-pointer border rounded p-2 transition-all hover:border-primary-500 ${
                  isSelected 
                    ? 'border-primary-500 bg-primary-500/10' 
                    : 'border-border-subtle hover:bg-background-tertiary'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded border border-border-subtle"
                      style={{ backgroundColor: theme.colors.background }}
                    />
                    <span className="text-sm font-medium text-text-primary">
                      {theme.name}
                    </span>
                    <span className="text-xs text-text-tertiary capitalize">
                      {theme.category}
                    </span>
                  </div>
                  
                  <button
                    onClick={(e) => toggleFavorite(theme.id, e)}
                    className={`text-xs transition-colors ${
                      isFavorite 
                        ? 'text-yellow-500 hover:text-yellow-600' 
                        : 'text-text-tertiary hover:text-text-secondary'
                    }`}
                  >
                    ★
                  </button>
                </div>
                
                {/* Color palette preview */}
                <div className="flex space-x-1 mb-1">
                  {[
                    theme.colors.background,
                    theme.colors.foreground,
                    theme.colors.keyword,
                    theme.colors.string,
                    theme.colors.function,
                    theme.colors.variable,
                  ].map((color, index) => (
                    <div
                      key={index}
                      className="w-2 h-2 rounded-sm border border-border-subtle"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                
                {/* Mini code preview */}
                <div 
                  className="text-xs p-1 rounded border border-border-subtle overflow-hidden"
                  style={{ 
                    backgroundColor: theme.colors.background,
                    color: theme.colors.foreground,
                    fontFamily: theme.fonts?.monospace || 'monospace',
                  }}
                >
                  <div style={{ color: theme.colors.keyword }}>function</div>
                  <div style={{ color: theme.colors.string }}>"Hello World"</div>
                </div>
                
                {theme.metadata?.description && (
                  <p className="text-xs text-text-tertiary mt-1 truncate">
                    {theme.metadata.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
        
        {filteredThemes.length === 0 && (
          <div className="text-center py-4 text-text-secondary">
            <p className="text-sm">No themes found</p>
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
          <span>{filteredThemes.length} themes</span>
          <span>{favoriteThemes.length} favorites</span>
        </div>
      </div>
    </div>
  );
}