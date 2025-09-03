// Educational Animation Preview System
// Provides real-time preview of educational animations

import React, { useState, useEffect, useRef } from 'react';
import type { EducationalAnimationPreset } from '../lib/educationalAnimationPresets';
import type { TimelineItem } from '../lib/types';

interface EducationalAnimationPreviewProps {
  preset: EducationalAnimationPreset;
  item?: TimelineItem;
  isPlaying: boolean;
  onPlayComplete?: () => void;
  className?: string;
}

export function EducationalAnimationPreview({
  preset,
  item,
  isPlaying,
  onPlayComplete,
  className = '',
}: EducationalAnimationPreviewProps) {
  const [animationProgress, setAnimationProgress] = useState(0);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>();

  useEffect(() => {
    if (isPlaying) {
      startTimeRef.current = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTimeRef.current!;
        const progress = Math.min(elapsed / (preset.duration * 1000), 1);
        
        setAnimationProgress(progress);
        
        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          onPlayComplete?.();
        }
      };
      
      animationRef.current = requestAnimationFrame(animate);
    } else {
      setAnimationProgress(0);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, preset.duration, onPlayComplete]);

  const getEasingValue = (progress: number): number => {
    switch (preset.easing) {
      case 'easeIn':
        return progress * progress;
      case 'easeOut':
        return 1 - Math.pow(1 - progress, 2);
      case 'easeInOut':
        return progress < 0.5 
          ? 2 * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      case 'bounce':
        const n1 = 7.5625;
        const d1 = 2.75;
        if (progress < 1 / d1) {
          return n1 * progress * progress;
        } else if (progress < 2 / d1) {
          return n1 * (progress -= 1.5 / d1) * progress + 0.75;
        } else if (progress < 2.5 / d1) {
          return n1 * (progress -= 2.25 / d1) * progress + 0.9375;
        } else {
          return n1 * (progress -= 2.625 / d1) * progress + 0.984375;
        }
      case 'linear':
      default:
        return progress;
    }
  };

  const easedProgress = getEasingValue(animationProgress);

  return (
    <div className={`educational-animation-preview ${className}`}>
      <div className="preview-container border-2 border-gray-200 rounded-lg p-4 bg-white min-h-[120px] flex items-center justify-center relative overflow-hidden">
        {renderPreviewContent(preset, easedProgress, isPlaying)}
        
        {/* Progress indicator */}
        {isPlaying && (
          <div className="absolute bottom-2 left-2 right-2">
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div 
                className="bg-purple-600 h-1 rounded-full transition-all duration-100"
                style={{ width: `${animationProgress * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Animation info */}
      <div className="mt-2 text-xs text-gray-600 flex justify-between">
        <span>{preset.name}</span>
        <span>{preset.duration}s • {preset.easing}</span>
      </div>
    </div>
  );
}

function renderPreviewContent(
  preset: EducationalAnimationPreset, 
  progress: number, 
  isPlaying: boolean
): React.ReactNode {
  switch (preset.trackType) {
    case 'Code':
      return renderCodePreview(preset, progress, isPlaying);
    case 'Visual':
      return renderVisualPreview(preset, progress, isPlaying);
    case 'Narration':
      return renderNarrationPreview(preset, progress, isPlaying);
    case 'You':
      return renderYouPreview(preset, progress, isPlaying);
    default:
      return <div className="w-16 h-16 bg-gray-200 rounded" />;
  }
}

function renderCodePreview(preset: EducationalAnimationPreset, progress: number, isPlaying: boolean): React.ReactNode {
  const sampleCode = `function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n-1) + fibonacci(n-2);
}`;

  const lines = sampleCode.split('\n');

  switch (preset.id) {
    case 'typewriter-educational':
      const totalChars = sampleCode.length;
      const visibleChars = Math.floor(progress * totalChars);
      const visibleText = sampleCode.substring(0, visibleChars);
      
      return (
        <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-xs w-full max-w-sm">
          <pre className="whitespace-pre-wrap">
            {visibleText}
            {isPlaying && progress < 1 && (
              <span className="animate-pulse">|</span>
            )}
          </pre>
        </div>
      );

    case 'line-by-line-reveal':
      const visibleLines = Math.floor(progress * lines.length);
      
      return (
        <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-xs w-full max-w-sm">
          {lines.map((line, index) => (
            <div 
              key={index}
              className={`transition-all duration-300 ${
                index <= visibleLines 
                  ? 'opacity-100 transform translate-y-0' 
                  : 'opacity-0 transform translate-y-2'
              } ${index === visibleLines ? 'bg-blue-900 bg-opacity-50' : ''}`}
            >
              {line}
            </div>
          ))}
        </div>
      );

    default:
      return (
        <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-xs">
          <div className={`transition-opacity duration-1000 ${isPlaying ? 'opacity-100' : 'opacity-50'}`}>
            {sampleCode}
          </div>
        </div>
      );
  }
}

function renderVisualPreview(preset: EducationalAnimationPreset, progress: number, isPlaying: boolean): React.ReactNode {
  switch (preset.id) {
    case 'screen-focus-zoom':
      const zoomScale = 1 + (progress * 0.8); // Zoom from 1x to 1.8x
      
      return (
        <div className="bg-blue-100 border-2 border-blue-300 rounded p-4 relative overflow-hidden w-32 h-20">
          <div 
            className="w-full h-full bg-gradient-to-br from-blue-200 to-blue-400 rounded transition-transform duration-100"
            style={{ transform: `scale(${zoomScale})` }}
          >
            <div className="w-4 h-4 bg-blue-600 rounded absolute top-2 left-2" />
            <div className="w-6 h-2 bg-blue-600 rounded absolute bottom-2 right-2" />
          </div>
        </div>
      );

    default:
      return (
        <div className="bg-blue-100 border-2 border-blue-300 rounded p-4 relative overflow-hidden">
          <div className={`w-8 h-8 bg-blue-500 rounded transition-all duration-1000 ${
            isPlaying ? 'transform scale-110 shadow-lg' : ''
          }`} />
        </div>
      );
  }
}

function renderNarrationPreview(preset: EducationalAnimationPreset, progress: number, isPlaying: boolean): React.ReactNode {
  return (
    <div className="bg-amber-100 p-3 rounded flex items-center justify-center">
      <div className="flex space-x-1">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className={`w-1 bg-amber-500 rounded transition-all duration-200 ${
              isPlaying ? 'h-6 animate-pulse' : 'h-2'
            }`}
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

function renderYouPreview(preset: EducationalAnimationPreset, progress: number, isPlaying: boolean): React.ReactNode {
  return (
    <div className="bg-red-100 border-2 border-red-300 rounded-full w-16 h-16 flex items-center justify-center relative">
      <div className={`w-8 h-8 bg-red-500 rounded-full transition-all duration-1000 ${
        isPlaying ? 'transform scale-110' : ''
      }`} />
    </div>
  );
}