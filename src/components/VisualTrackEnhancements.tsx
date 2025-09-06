// Visual track enhancements UI components
// Provides screen recording indicators, thumbnail previews, and animation controls

import React, { useState, useCallback, useMemo } from 'react';
import { useMediaAssets } from '../state/hooks';
import type { TimelineItem, MediaAsset } from '../lib/types';
import type { EducationalTrack } from '../lib/educationalTypes';
import {
  analyzeScreenRecording,
  getScreenRecordingIndicators,
  generateThumbnailUrl,
  VISUAL_ANIMATION_PRESETS,
  applyVisualAnimationPreset,
  getRecommendedPresetsForContent,
  type ScreenRecordingAnalysis,
  type VisualAnimationPreset,
  type SideBySideLayout,
} from '../lib/visualTrackEnhancements';
import { 
  Monitor, 
  Play, 
  Code, 
  MousePointer, 
  Maximize, 
  Zap, 
  Eye, 
  ArrowRight 
} from 'lucide-react';

interface VisualTrackClipProps {
  item: TimelineItem;
  asset: MediaAsset | undefined;
  track: EducationalTrack;
  isSelected: boolean;
  style: React.CSSProperties;
  onItemUpdate: (item: TimelineItem) => void;
}

export function VisualTrackClip({
  item,
  asset,
  track,
  isSelected,
  style,
  onItemUpdate,
}: VisualTrackClipProps) {
  const [showAnimationMenu, setShowAnimationMenu] = useState(false);
  
  // Analyze screen recording if it's a video asset
  const screenRecordingAnalysis = useMemo(() => {
    return asset ? analyzeScreenRecording(asset) : null;
  }, [asset]);

  const indicators = useMemo(() => {
    return screenRecordingAnalysis ? getScreenRecordingIndicators(screenRecordingAnalysis) : [];
  }, [screenRecordingAnalysis]);

  const recommendedPresets = useMemo(() => {
    return asset ? getRecommendedPresetsForContent(asset, screenRecordingAnalysis || undefined) : [];
  }, [asset, screenRecordingAnalysis]);

  const handleApplyPreset = useCallback((preset: VisualAnimationPreset) => {
    const updatedItem = applyVisualAnimationPreset(item, preset);
    onItemUpdate(updatedItem);
    setShowAnimationMenu(false);
  }, [item, onItemUpdate]);

  const thumbnailUrl = useMemo(() => {
    return asset ? generateThumbnailUrl(asset) : null;
  }, [asset]);

  return (
    <div
      className={`
        absolute rounded cursor-move select-none border-2 transition-all overflow-hidden
        ${isSelected ? 'border-accent-yellow shadow-glow' : 'border-transparent'}
        hover:border-text-secondary group
      `}
      style={{
        ...style,
        backgroundColor: `${track.color}22`,
        borderColor: isSelected ? '#F59E0B' : track.color,
      }}
    >
      {/* Thumbnail Preview */}
      {thumbnailUrl && (
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20 group-hover:opacity-30 transition-opacity"
          style={{ backgroundImage: `url(${thumbnailUrl})` }}
        />
      )}

      {/* Content */}
      <div className="relative p-2 h-full flex flex-col justify-between text-xs overflow-hidden">
        {/* Header with title and indicators */}
        <div className="flex items-start justify-between gap-1">
          <div className="flex-1 min-w-0">
            <div className="font-medium text-text-primary truncate flex items-center gap-1 mb-1">
              <Monitor className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{asset?.name || 'Visual Content'}</span>
            </div>
            
            {/* Screen Recording Indicators */}
            <div className="flex flex-wrap gap-1 mb-1">
              {indicators.map((indicator) => (
                <ScreenRecordingIndicator
                  key={indicator.type}
                  type={indicator.type}
                  label={indicator.label}
                  confidence={indicator.confidence}
                />
              ))}
            </div>
          </div>

          {/* Animation Menu Button */}
          <button
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white hover:bg-opacity-20 rounded"
            onClick={(e) => {
              e.stopPropagation();
              setShowAnimationMenu(!showAnimationMenu);
            }}
            title="Animation Presets"
          >
            <Zap className="w-3 h-3" />
          </button>
        </div>

        {/* Content Info */}
        <div className="text-text-secondary text-opacity-75">
          <div className="flex items-center justify-between">
            <span>
              {asset?.type === 'video' ? 'Video' : 'Image'}
              {asset?.metadata.width && asset?.metadata.height && (
                <span className="ml-1">
                  {asset.metadata.width}×{asset.metadata.height}
                </span>
              )}
            </span>
            <span>{Math.round(item.duration * 10) / 10}s</span>
          </div>
        </div>

        {/* Animation Menu */}
        {showAnimationMenu && (
          <AnimationPresetsMenu
            presets={recommendedPresets}
            onApplyPreset={handleApplyPreset}
            onClose={() => setShowAnimationMenu(false)}
          />
        )}
      </div>

      {/* Resize Handles */}
      <div className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize bg-text-primary bg-opacity-20 opacity-0 hover:opacity-100 transition-opacity" />
      <div className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize bg-text-primary bg-opacity-20 opacity-0 hover:opacity-100 transition-opacity" />
    </div>
  );
}

interface ScreenRecordingIndicatorProps {
  type: string;
  label: string;
  confidence: number;
}

function ScreenRecordingIndicator({ type, label, confidence }: ScreenRecordingIndicatorProps) {
  const getIndicatorIcon = () => {
    switch (type) {
      case 'screen-recording':
        return <Monitor className="w-2 h-2" />;
      case 'code-content':
        return <Code className="w-2 h-2" />;
      case 'ui-elements':
        return <MousePointer className="w-2 h-2" />;
      case 'ultrawide':
        return <Maximize className="w-2 h-2" />;
      default:
        return <Eye className="w-2 h-2" />;
    }
  };

  const getIndicatorColor = () => {
    if (confidence > 0.8) return 'bg-green-600';
    if (confidence > 0.6) return 'bg-yellow-600';
    return 'bg-gray-600';
  };

  return (
    <div 
      className={`
        inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs text-white
        ${getIndicatorColor()}
      `}
      title={`${label} (${Math.round(confidence * 100)}% confidence)`}
    >
      {getIndicatorIcon()}
      <span className="text-xs leading-none">{label}</span>
    </div>
  );
}

interface AnimationPresetsMenuProps {
  presets: VisualAnimationPreset[];
  onApplyPreset: (preset: VisualAnimationPreset) => void;
  onClose: () => void;
}

function AnimationPresetsMenu({ presets, onApplyPreset, onClose }: AnimationPresetsMenuProps) {
  return (
    <div className="absolute top-full left-0 mt-1 bg-bg-primary border border-border-subtle rounded-lg shadow-lg z-50 min-w-48">
      <div className="p-2">
        <div className="text-xs font-medium text-text-primary mb-2">Animation Presets</div>
        
        {presets.length > 0 ? (
          <div className="space-y-1">
            {presets.map((preset) => (
              <button
                key={preset.id}
                className="w-full text-left px-2 py-1.5 text-xs hover:bg-bg-secondary rounded flex items-center gap-2"
                onClick={() => onApplyPreset(preset)}
              >
                <div className="flex-1">
                  <div className="font-medium text-text-primary">{preset.name}</div>
                  <div className="text-text-secondary text-opacity-75">{preset.description}</div>
                </div>
                <ArrowRight className="w-3 h-3 text-text-secondary" />
              </button>
            ))}
          </div>
        ) : (
          <div className="text-xs text-text-secondary text-opacity-75 py-2">
            No recommended presets for this content
          </div>
        )}
        
        <div className="border-t border-border-subtle mt-2 pt-2">
          <button
            className="w-full text-left px-2 py-1 text-xs text-text-secondary hover:text-text-primary"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Side-by-side layout controls
interface SideBySideLayoutControlsProps {
  currentLayout?: SideBySideLayout;
  onLayoutChange: (layout: SideBySideLayout) => void;
  codeItems: TimelineItem[];
  visualItems: TimelineItem[];
}

export function SideBySideLayoutControls({
  currentLayout,
  onLayoutChange,
  codeItems,
  visualItems,
}: SideBySideLayoutControlsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const layoutOptions: Array<{
    type: SideBySideLayout['type'];
    label: string;
    description: string;
  }> = [
    {
      type: 'left-right',
      label: 'Code Left, Visual Right',
      description: 'Traditional side-by-side layout',
    },
    {
      type: 'right-left',
      label: 'Visual Left, Code Right',
      description: 'Visual content takes priority',
    },
    {
      type: 'top-bottom',
      label: 'Code Top, Visual Bottom',
      description: 'Vertical stacking layout',
    },
    {
      type: 'bottom-top',
      label: 'Visual Top, Code Bottom',
      description: 'Visual content on top',
    },
  ];

  const handleLayoutSelect = useCallback((type: SideBySideLayout['type']) => {
    const newLayout: SideBySideLayout = {
      type,
      primaryContent: 'code', // Default to code as primary for consistency
      splitRatio: 0.5,
      gap: 16,
      alignment: 'start',
    };
    
    onLayoutChange(newLayout);
    setIsOpen(false);
  }, [onLayoutChange]);

  // Only show if we have both code and visual items
  if (codeItems.length === 0 || visualItems.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <button
        className="flex items-center gap-2 px-3 py-2 bg-bg-secondary hover:bg-bg-tertiary rounded-lg text-sm transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-1">
          <div className="w-3 h-2 bg-purple-500 rounded-sm" />
          <div className="w-3 h-2 bg-green-500 rounded-sm" />
        </div>
        <span>Side-by-Side Layout</span>
        <ArrowRight className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-bg-primary border border-border-subtle rounded-lg shadow-lg z-50 min-w-64">
          <div className="p-3">
            <div className="text-sm font-medium text-text-primary mb-3">Choose Layout</div>
            
            <div className="space-y-2">
              {layoutOptions.map((option) => (
                <button
                  key={option.type}
                  className={`
                    w-full text-left p-3 rounded-lg border transition-colors
                    ${currentLayout?.type === option.type
                      ? 'border-accent-yellow bg-accent-yellow bg-opacity-10'
                      : 'border-border-subtle hover:border-border-primary hover:bg-bg-secondary'
                    }
                  `}
                  onClick={() => handleLayoutSelect(option.type)}
                >
                  <div className="font-medium text-text-primary text-sm">{option.label}</div>
                  <div className="text-text-secondary text-xs mt-1">{option.description}</div>
                </button>
              ))}
            </div>
            
            <div className="border-t border-border-subtle mt-3 pt-3">
              <button
                className="w-full text-center px-3 py-2 text-sm text-text-secondary hover:text-text-primary"
                onClick={() => setIsOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Visual track optimization suggestions
interface OptimizationSuggestionsProps {
  analysis: ScreenRecordingAnalysis;
  onApplyOptimization: (optimization: any) => void;
}

export function OptimizationSuggestions({ analysis, onApplyOptimization }: OptimizationSuggestionsProps) {
  if (!analysis.isScreenRecording || analysis.optimizationSuggestions.length === 0) {
    return null;
  }

  return (
    <div className="bg-bg-secondary border border-border-subtle rounded-lg p-3 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Zap className="w-4 h-4 text-yellow-500" />
        <span className="text-sm font-medium text-text-primary">Optimization Suggestions</span>
      </div>
      
      <div className="space-y-2">
        {analysis.optimizationSuggestions.map((suggestion, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-2 bg-bg-primary rounded border border-border-subtle"
          >
            <div className="flex-1">
              <div className="text-sm text-text-primary">{suggestion.description}</div>
              <div className="text-xs text-text-secondary">
                Confidence: {Math.round(suggestion.confidence * 100)}%
              </div>
            </div>
            <button
              className="px-3 py-1 bg-accent-yellow text-bg-primary text-xs font-medium rounded hover:bg-opacity-90 transition-colors"
              onClick={() => onApplyOptimization(suggestion)}
            >
              Apply
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Enhanced thumbnail preview with screen recording detection
interface EnhancedThumbnailProps {
  asset: MediaAsset;
  className?: string;
  showIndicators?: boolean;
}

export function EnhancedThumbnail({ asset, className = '', showIndicators = true }: EnhancedThumbnailProps) {
  const analysis = useMemo(() => analyzeScreenRecording(asset), [asset]);
  const thumbnailUrl = useMemo(() => generateThumbnailUrl(asset), [asset]);
  const indicators = useMemo(() => getScreenRecordingIndicators(analysis), [analysis]);

  return (
    <div className={`relative ${className}`}>
      {/* Thumbnail Image */}
      <div 
        className="w-full h-full bg-cover bg-center rounded border border-border-subtle"
        style={{ backgroundImage: `url(${thumbnailUrl})` }}
      />
      
      {/* Play Overlay for Videos */}
      {asset.type === 'video' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black bg-opacity-50 rounded-full p-2">
            <Play className="w-4 h-4 text-white" />
          </div>
        </div>
      )}
      
      {/* Screen Recording Indicators */}
      {showIndicators && indicators.length > 0 && (
        <div className="absolute top-1 left-1 flex flex-wrap gap-1">
          {indicators.slice(0, 2).map((indicator) => (
            <div
              key={indicator.type}
              className="bg-black bg-opacity-75 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1"
            >
              {indicator.type === 'screen-recording' && <Monitor className="w-2 h-2" />}
              {indicator.type === 'code-content' && <Code className="w-2 h-2" />}
              <span>{indicator.label}</span>
            </div>
          ))}
        </div>
      )}
      
      {/* Duration Badge */}
      {asset.duration && (
        <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1.5 py-0.5 rounded">
          {Math.round(asset.duration)}s
        </div>
      )}
    </div>
  );
}