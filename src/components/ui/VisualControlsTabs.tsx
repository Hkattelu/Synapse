import React, { useState, useCallback } from 'react';
import { ThemePicker } from './ThemePicker';
import { BackgroundPicker } from './BackgroundPicker';
import { PreviewPanel } from './PreviewPanel';
import { VisualSettingsPanel } from './VisualSettingsPanel';
import { DiffSlideControls } from '../animation/controls/DiffSlideControls';
import { DiffFadeControls } from '../animation/controls/DiffFadeControls';
import { TypewriterDiffControls } from '../animation/controls/TypewriterDiffControls';
import type { ItemProperties, BackgroundConfig, AnimationConfig } from '../../lib/types';

interface VisualControlsTabsProps {
  item: {
    type: string;
    properties: ItemProperties;
  };
  onUpdateProperties: (properties: Partial<ItemProperties>) => void;
  className?: string;
}

type TabId = 'animations' | 'themes' | 'backgrounds';

interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

export function VisualControlsTabs({ 
  item, 
  onUpdateProperties, 
  className = '' 
}: VisualControlsTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('animations');
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  // Count active visual settings for badges
  const getActiveSettingsCount = useCallback((tabId: TabId): number => {
    const props = item.properties;
    
    switch (tabId) {
      case 'animations':
        let animCount = 0;
        if (props.diffAnimationType && props.diffAnimationType !== 'none') animCount++;
        if (props.animationMode && props.animationMode !== 'none') animCount++;
        return animCount;
      
      case 'themes':
        return props.theme && props.theme !== 'vscode-dark-plus' ? 1 : 0;
      
      case 'backgrounds':
        return props.backgroundType && props.backgroundType !== 'none' ? 1 : 0;
      
      default:
        return 0;
    }
  }, [item.properties]);

  // Toggle section collapse
  const toggleSection = useCallback((sectionId: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  // Tab configuration
  const tabs: TabConfig[] = [
    {
      id: 'animations',
      label: 'Animations',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      badge: getActiveSettingsCount('animations')
    },
    {
      id: 'themes',
      label: 'Themes',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3H5a2 2 0 00-2 2v12a4 4 0 004 4h2a2 2 0 002-2V5a2 2 0 00-2-2z" />
        </svg>
      ),
      badge: getActiveSettingsCount('themes')
    },
    {
      id: 'backgrounds',
      label: 'Backgrounds',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      badge: getActiveSettingsCount('backgrounds')
    }
  ];

  // Handle background config change
  const handleBackgroundChange = useCallback((config: BackgroundConfig | null) => {
    if (!config) {
      onUpdateProperties({
        backgroundType: 'none',
        backgroundWallpaper: undefined,
        backgroundGradient: undefined,
        backgroundColor: undefined
      });
    } else {
      const updates: Partial<ItemProperties> = {
        backgroundType: config.type
      };

      switch (config.type) {
        case 'color':
          updates.backgroundColor = config.color;
          updates.backgroundWallpaper = undefined;
          updates.backgroundGradient = undefined;
          break;
        case 'gradient':
          updates.backgroundGradient = config.gradient;
          updates.backgroundColor = undefined;
          updates.backgroundWallpaper = undefined;
          break;
        case 'wallpaper':
          updates.backgroundWallpaper = config.wallpaper?.assetId;
          updates.backgroundColor = undefined;
          updates.backgroundGradient = undefined;
          break;
      }

      onUpdateProperties(updates);
    }
  }, [onUpdateProperties]);

  // Get current background config
  const getCurrentBackgroundConfig = useCallback((): BackgroundConfig | undefined => {
    const props = item.properties;
    
    if (!props.backgroundType || props.backgroundType === 'none') {
      return undefined;
    }

    switch (props.backgroundType) {
      case 'color':
        return {
          type: 'color',
          color: props.backgroundColor || '#1e1e1e'
        };
      case 'gradient':
        return props.backgroundGradient ? {
          type: 'gradient',
          gradient: props.backgroundGradient
        } : undefined;
      case 'wallpaper':
        return props.backgroundWallpaper ? {
          type: 'wallpaper',
          wallpaper: {
            assetId: props.backgroundWallpaper,
            opacity: props.backgroundOpacity || 1,
            blendMode: 'normal'
          }
        } : undefined;
      default:
        return undefined;
    }
  }, [item.properties]);

  // Render collapsible section
  const renderSection = (
    id: string,
    title: string,
    children: React.ReactNode,
    hasActiveSettings = false
  ) => {
    const isCollapsed = collapsedSections.has(id);
    
    return (
      <div className="border border-border-subtle rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection(id)}
          className="w-full px-3 py-2 bg-background-tertiary hover:bg-background-secondary transition-colors flex items-center justify-between text-left"
        >
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-text-primary">{title}</span>
            {hasActiveSettings && (
              <div className="w-2 h-2 bg-primary-500 rounded-full" />
            )}
          </div>
          <svg 
            className={`w-4 h-4 text-text-secondary transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {!isCollapsed && (
          <div className="p-3 border-t border-border-subtle">
            {children}
          </div>
        )}
      </div>
    );
  };

  // Render animation controls
  const renderAnimationControls = () => {
    const props = item.properties;
    
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
        {/* Controls */}
        <div className="space-y-4">
          {/* Diff Animations - only for code items */}
          {item.type === 'code' && renderSection(
            'diff-animations',
            'Code Diff Animations',
            (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Diff Animation Type
                  </label>
                  <select
                    value={props.diffAnimationType || 'none'}
                    onChange={(e) => onUpdateProperties({ diffAnimationType: e.target.value as any })}
                    className="w-full bg-background-tertiary border border-border-subtle rounded px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-primary-500"
                  >
                    <option value="none">None</option>
                    <option value="slide">Slide</option>
                    <option value="fade">Fade</option>
                    <option value="highlight">Highlight</option>
                    <option value="typewriter-diff">Typewriter Diff</option>
                  </select>
                </div>

                {/* Render specific controls based on animation type */}
                {props.diffAnimationType === 'slide' && (
                  <DiffSlideControls
                    value={{
                      preset: 'diffSlide',
                      direction: props.diffSlideDirection || 'right',
                      speed: props.diffAnimationSpeed || 1,
                      highlightColor: props.diffHighlightColor || '#4ade80'
                    }}
                    onChange={(config) => {
                      if (config.preset === 'diffSlide') {
                        onUpdateProperties({
                          diffSlideDirection: config.direction,
                          diffAnimationSpeed: config.speed,
                          diffHighlightColor: config.highlightColor
                        });
                      }
                    }}
                  />
                )}

                {props.diffAnimationType === 'fade' && (
                  <DiffFadeControls
                    value={{
                      preset: 'diffFade',
                      fadeInDuration: props.diffFadeInDuration || 0.5,
                      fadeOutDuration: props.diffFadeOutDuration || 0.5,
                      highlightIntensity: props.diffHighlightIntensity || 0.8
                    }}
                    onChange={(config) => {
                      if (config.preset === 'diffFade') {
                        onUpdateProperties({
                          diffFadeInDuration: config.fadeInDuration,
                          diffFadeOutDuration: config.fadeOutDuration,
                          diffHighlightIntensity: config.highlightIntensity
                        });
                      }
                    }}
                  />
                )}

                {props.diffAnimationType === 'typewriter-diff' && (
                  <TypewriterDiffControls
                    value={{
                      preset: 'typewriterDiff',
                      speedCps: props.typewriterDiffSpeedCps || 30,
                      showCursor: props.typewriterDiffShowCursor || true,
                      highlightChanges: props.typewriterDiffHighlightChanges || true
                    }}
                    onChange={(config) => {
                      if (config.preset === 'typewriterDiff') {
                        onUpdateProperties({
                          typewriterDiffSpeedCps: config.speedCps,
                          typewriterDiffShowCursor: config.showCursor,
                          typewriterDiffHighlightChanges: config.highlightChanges
                        });
                      }
                    }}
                  />
                )}
              </div>
            ),
            Boolean(props.diffAnimationType && props.diffAnimationType !== 'none')
          )}

          {/* General Animation Mode */}
          {renderSection(
            'general-animations',
            'General Animations',
            (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Animation Mode
                  </label>
                  <select
                    value={props.animationMode || 'typing'}
                    onChange={(e) => onUpdateProperties({ animationMode: e.target.value as any })}
                    className="w-full bg-background-tertiary border border-border-subtle rounded px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-primary-500"
                  >
                    <option value="none">None</option>
                    <option value="typing">Typing</option>
                    <option value="line-by-line">Line by Line</option>
                    <option value="diff">Diff Highlight</option>
                  </select>
                </div>

                {props.animationMode === 'typing' && (
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Typing Speed (CPS)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={props.typingSpeedCps || 30}
                      onChange={(e) => onUpdateProperties({ typingSpeedCps: parseInt(e.target.value) })}
                      className="w-full bg-background-tertiary border border-border-subtle rounded px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-primary-500"
                    />
                  </div>
                )}

                {props.animationMode === 'line-by-line' && (
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Line Reveal Interval (ms)
                    </label>
                    <input
                      type="number"
                      min="50"
                      max="2000"
                      step="10"
                      value={props.lineRevealIntervalMs || 350}
                      onChange={(e) => onUpdateProperties({ lineRevealIntervalMs: parseInt(e.target.value) })}
                      className="w-full bg-background-tertiary border border-border-subtle rounded px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-primary-500"
                    />
                  </div>
                )}
              </div>
            ),
            Boolean(props.animationMode && props.animationMode !== 'none')
          )}
        </div>

        {/* Live Preview */}
        <div className="min-h-[300px]">
          <PreviewPanel
            item={item}
            previewType="animation"
            className="h-full"
          />
        </div>
      </div>
    );
  };

  // Render theme controls
  const renderThemeControls = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
        {/* Controls */}
        <div className="space-y-4">
          {renderSection(
            'code-themes',
            'Code Themes',
            (
              <ThemePicker
                value={item.properties.theme || 'vscode-dark-plus'}
                onChange={(themeId) => onUpdateProperties({ theme: themeId })}
              />
            ),
            Boolean(item.properties.theme && item.properties.theme !== 'vscode-dark-plus')
          )}

          {/* Font Settings */}
          {renderSection(
            'font-settings',
            'Font Settings',
            (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Font Family
                  </label>
                  <input
                    type="text"
                    value={item.properties.fontFamily || 'Monaco, Menlo, "Ubuntu Mono", monospace'}
                    onChange={(e) => onUpdateProperties({ fontFamily: e.target.value })}
                    className="w-full bg-background-tertiary border border-border-subtle rounded px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Font Size (px)
                  </label>
                  <input
                    type="number"
                    min="8"
                    max="48"
                    value={item.properties.fontSize || 14}
                    onChange={(e) => onUpdateProperties({ fontSize: parseInt(e.target.value) })}
                    className="w-full bg-background-tertiary border border-border-subtle rounded px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>
            ),
            Boolean(
              (item.properties.fontFamily && item.properties.fontFamily !== 'Monaco, Menlo, "Ubuntu Mono", monospace') ||
              (item.properties.fontSize && item.properties.fontSize !== 14)
            )
          )}
        </div>

        {/* Live Preview */}
        <div className="min-h-[300px]">
          <PreviewPanel
            item={item}
            previewType="theme"
            className="h-full"
          />
        </div>
      </div>
    );
  };

  // Render background controls
  const renderBackgroundControls = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
        {/* Controls */}
        <div className="space-y-4">
          {renderSection(
            'background-settings',
            'Background Settings',
            (
              <BackgroundPicker
                value={getCurrentBackgroundConfig()}
                onChange={handleBackgroundChange}
                opacity={item.properties.backgroundOpacity || 1}
                onOpacityChange={(opacity) => onUpdateProperties({ backgroundOpacity: opacity })}
              />
            ),
            Boolean(item.properties.backgroundType && item.properties.backgroundType !== 'none')
          )}
        </div>

        {/* Live Preview */}
        <div className="min-h-[300px]">
          <PreviewPanel
            item={item}
            previewType="background"
            className="h-full"
          />
        </div>
      </div>
    );
  };

  return (
    <div className={`visual-controls-tabs ${className}`}>
      {/* Tab Navigation */}
      <div className="flex border-b border-border-subtle mb-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary-500 text-primary-500'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-subtle'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge && tab.badge > 0 && (
              <span className="bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content mb-4">
        {activeTab === 'animations' && renderAnimationControls()}
        {activeTab === 'themes' && renderThemeControls()}
        {activeTab === 'backgrounds' && renderBackgroundControls()}
      </div>

      {/* Settings Management Panel */}
      <div className="border-t border-border-subtle pt-4">
        <VisualSettingsPanel
          currentProperties={item.properties}
          onApplySettings={(settings) => {
            onUpdateProperties(settings);
          }}
        />
      </div>
    </div>
  );
}