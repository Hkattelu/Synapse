import React, { useEffect, useMemo, useState } from 'react';
import { themeManager } from '../../lib/themes';
import { backgroundManager } from '../../lib/backgrounds';
import { visualSettingsManager } from '../../lib/settings/VisualSettingsManager';
import type {
  ItemProperties,
  BackgroundConfig,
  GradientConfig,
} from '../../lib/types';

interface PreviewPanelProps {
  item: {
    type: string;
    properties: ItemProperties;
  };
  previewType: 'theme' | 'background' | 'animation';
  className?: string;
}

export function PreviewPanel({
  item,
  previewType,
  className = '',
}: PreviewPanelProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationFrame, setAnimationFrame] = useState(0);
  let rafId: number | undefined;

  // Sample code for preview
  const sampleCode =
    item.properties.codeText ||
    item.properties.text ||
    `function greet(name) {\n  console.log(\`Hello, \${name}!\`);\n  return \`Welcome to Synapse!\`;\n}\n\nconst user = "Developer";\nconst message = greet(user);`;

  // Normalize line endings to avoid CR rendering as extra newlines on Windows
  const normalizedCode = useMemo(
    () => sampleCode.replace(/\r\n/g, '\n').replace(/\r/g, '\n'),
    [sampleCode]
  );

  // Current theme
  const currentTheme = useMemo(() => {
    return themeManager.getTheme(item.properties.theme || 'vscode-dark-plus');
  }, [item.properties.theme]);

  // Background config from item
  const currentBackground = useMemo((): BackgroundConfig | null => {
    const props = item.properties;
    if (!props.backgroundType || props.backgroundType === 'none') return null;
    switch (props.backgroundType) {
      case 'color':
        return { type: 'color', color: props.backgroundColor || '#1e1e1e' };
      case 'gradient':
        return props.backgroundGradient
          ? { type: 'gradient', gradient: props.backgroundGradient }
          : null;
      case 'wallpaper':
        return props.backgroundWallpaper
          ? {
              type: 'wallpaper',
              wallpaper: {
                assetId: props.backgroundWallpaper,
                opacity: props.backgroundOpacity || 1,
                blendMode: 'normal',
              },
            }
          : null;
      default:
        return null;
    }
  }, [item.properties]);

  // Local animation loop (for small UI preview only)
  useEffect(() => {
    if (isPlaying && previewType === 'animation') {
      const animate = () => {
        setAnimationFrame((prev) => (prev + 1) % 120); // ~2s loop @60fps
        rafId = requestAnimationFrame(animate);
      };
      rafId = requestAnimationFrame(animate);
    } else if (rafId) {
      cancelAnimationFrame(rafId);
    }
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isPlaying, previewType]);

  // Gradient CSS
  const generateGradientCSS = (gradient: GradientConfig): string => {
    const colorStops = gradient.colors
      .sort((a, b) => a.position - b.position)
      .map((stop) => `${stop.color} ${(stop.position * 100).toFixed(1)}%`)
      .join(', ');
    if (gradient.type === 'linear') {
      const angle = gradient.angle || 45;
      return `linear-gradient(${angle}deg, ${colorStops})`;
    } else {
      const centerX = (gradient.centerX || 0.5) * 100;
      const centerY = (gradient.centerY || 0.5) * 100;
      return `radial-gradient(circle at ${centerX}% ${centerY}%, ${colorStops})`;
    }
  };

  // Background style for preview boxes
  const getBackgroundStyle = (): React.CSSProperties => {
    if (!currentBackground) return { backgroundColor: '#1e1e1e' };
    switch (currentBackground.type) {
      case 'color': {
        return { backgroundColor: currentBackground.color };
      }
      case 'gradient': {
        return currentBackground.gradient
          ? { background: generateGradientCSS(currentBackground.gradient) }
          : { backgroundColor: '#1e1e1e' };
      }
      case 'wallpaper': {
        if (!currentBackground.wallpaper?.assetId)
          return { backgroundColor: '#2a2a2a' };
        const wp = backgroundManager.getWallpaperById(
          currentBackground.wallpaper.assetId
        );
        if (!wp) return { backgroundColor: '#2a2a2a' };
        const reduceMotion = (() => {
          try {
            const pref = visualSettingsManager.getReduceMotion?.();
            if (typeof pref === 'boolean') return pref;
          } catch {
            void 0; // ignore
          }
          if (typeof window !== 'undefined' && 'matchMedia' in window) {
            try {
              return window.matchMedia('(prefers-reduced-motion: reduce)')
                .matches;
            } catch {
              void 0; // ignore
            }
          }
          return false;
        })();
        const src =
          reduceMotion && (wp.stillUrl || wp.thumbnail)
            ? (wp.stillUrl || wp.thumbnail)!
            : wp.url;
        return {
          backgroundColor: '#000',
          backgroundImage: `url(${src})`,
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
        };
      }
      default: {
        return { backgroundColor: '#1e1e1e' };
      }
    }
  };

  // Theme preview content
  const renderThemePreview = () => {
    if (!currentTheme) return null;
    const lines = normalizedCode.split('\n').slice(0, 8);
    return (
      <div className="theme-preview h-full">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-text-primary">
            Theme Preview
          </h4>
          <div className="text-xs text-text-secondary">{currentTheme.name}</div>
        </div>
        <div
          className="code-preview rounded border border-border-subtle p-3 h-full overflow-hidden"
          style={{
            backgroundColor: currentTheme.colors.background,
            color: currentTheme.colors.foreground,
            fontFamily:
              currentTheme.fonts?.monospace ||
              'Monaco, Menlo, "Ubuntu Mono", monospace',
            fontSize: `${item.properties.fontSize || 14}px`,
            lineHeight: 1.5,
          }}
        >
          {lines.map((line, index) => (
            <div key={index} className="whitespace-pre">
              {item.properties.showLineNumbers && (
                <span
                  className="inline-block w-8 text-right mr-3 select-none"
                  style={{ color: currentTheme.colors.comment, opacity: 0.6 }}
                >
                  {index + 1}
                </span>
              )}
              <span
                dangerouslySetInnerHTML={{
                  __html: highlightSyntax(line, currentTheme),
                }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Background preview content
  const renderBackgroundPreview = () => {
    return (
      <div className="background-preview h-full">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-text-primary">
            Background Preview
          </h4>
          <div className="text-xs text-text-secondary">
            {currentBackground?.type || 'none'}
          </div>
        </div>
        <div className="preview-container h-full rounded border border-border-subtle overflow-hidden relative">
          {/* Background layer */}
          <div
            className="absolute inset-0"
            style={{
              ...getBackgroundStyle(),
              opacity: item.properties.backgroundOpacity || 1,
            }}
          />
          {/* Foreground sample */}
          <div className="relative z-10 p-4 h-full flex items-center justify-center">
            <div
              className="bg-black/20 backdrop-blur-sm rounded p-3 text-white text-sm font-mono"
              style={{
                backgroundColor:
                  (currentTheme?.colors.background || '#1e1e1e') + '80',
                color: currentTheme?.colors.foreground || '#ffffff',
              }}
            >
              <div>function example() {'{'}</div>
              <div className="ml-4">return "Hello World";</div>
              <div>{'}'}</div>
            </div>
          </div>
          {/* Checkerboard when none */}
          {!currentBackground && (
            <div className="absolute inset-0 opacity-20">
              <div
                className="w-full h-full"
                style={{
                  backgroundImage:
                    'repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%) 50% / 20px 20px',
                }}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  // Animation preview content
  const renderAnimationPreview = () => {
    const animationType =
      item.properties.diffAnimationType ||
      item.properties.animationMode ||
      'none';
    return (
      <div className="animation-preview h-full">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-text-primary">
            Animation Preview
          </h4>
          <div className="flex items-center space-x-2">
            <div className="text-xs text-text-secondary">{animationType}</div>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1 rounded hover:bg-background-tertiary transition-colors"
            >
              {isPlaying ? (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h8a2 2 0 012 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2v-8a2 2 0 012-2z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
        <div
          className="preview-container rounded border border-border-subtle p-3 h-full overflow-hidden"
          style={getBackgroundStyle()}
        >
          <div
            className="code-preview h-full"
            style={{
              backgroundColor: currentTheme?.colors.background || '#1e1e1e',
              color: currentTheme?.colors.foreground || '#ffffff',
              fontFamily:
                currentTheme?.fonts?.monospace ||
                'Monaco, Menlo, "Ubuntu Mono", monospace',
              fontSize: `${item.properties.fontSize || 14}px`,
              lineHeight: 1.5,
              padding: '12px',
              borderRadius: '4px',
            }}
          >
            {renderAnimatedCode()}
          </div>
        </div>
      </div>
    );
  };

  // Render animated snippet
  const renderAnimatedCode = () => {
    const lines = normalizedCode.split('\n').slice(0, 6);
    const animationType =
      item.properties.diffAnimationType || item.properties.animationMode;
    const progress = animationFrame / 120;
    switch (animationType) {
      case 'typing': {
        const totalChars = normalizedCode.length;
        const visibleChars = Math.floor(totalChars * progress);
        const visibleText = normalizedCode.substring(0, visibleChars);
        return (
          <div className="whitespace-pre-wrap">
            {visibleText}
            {isPlaying && <span className="animate-pulse">|</span>}
          </div>
        );
      }
      case 'line-by-line': {
        const visibleLines = Math.floor(lines.length * progress);
        return (
          <div>
            {lines.map((line, index) => (
              <div
                key={index}
                className="whitespace-pre transition-opacity duration-300"
                style={{
                  opacity: index <= visibleLines ? 1 : 0.2,
                  transform:
                    index <= visibleLines
                      ? 'translateX(0)'
                      : 'translateX(-10px)',
                  transition: 'all 0.3s ease',
                }}
              >
                {line}
              </div>
            ))}
          </div>
        );
      }
      case 'slide': {
        const slideOffset = isPlaying
          ? Math.sin(progress * Math.PI * 2) * 10
          : 0;
        return (
          <div
            style={{
              transform: `translateX(${slideOffset}px)`,
              transition: 'transform 0.1s ease',
            }}
          >
            {lines.map((line, index) => (
              <div key={index} className="whitespace-pre">
                {line}
              </div>
            ))}
          </div>
        );
      }
      case 'fade': {
        const fadeOpacity = isPlaying
          ? 0.5 + 0.5 * Math.sin(progress * Math.PI * 4)
          : 1;
        return (
          <div
            style={{ opacity: fadeOpacity, transition: 'opacity 0.1s ease' }}
          >
            {lines.map((line, index) => (
              <div key={index} className="whitespace-pre">
                {line}
              </div>
            ))}
          </div>
        );
      }
      default: {
        return (
          <div>
            {lines.map((line, index) => (
              <div key={index} className="whitespace-pre">
                {line}
              </div>
            ))}
          </div>
        );
      }
    }
  };

  // Tiny syntax coloring for preview
  const highlightSyntax = (
    line: string,
    theme: { colors: Record<string, string> }
  ): string => {
    if (!theme) return line;
    return line
      .replace(
        /\b(function|const|let|var|return|if|else|for|while|class|import|export)\b/g,
        `<span style='color: ${theme.colors.keyword}'>$1</span>`
      )
      .replace(
        /(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g,
        `<span style='color: ${theme.colors.string}'>$1$2$1</span>`
      )
      .replace(
        /\b(\d+(?:\.\d+)?)\b/g,
        `<span style='color: ${theme.colors.number || theme.colors.string}'>$1</span>`
      )
      .replace(
        /\/\/.*$/g,
        `<span style='color: ${theme.colors.comment}'>$&</span>`
      )
      .replace(
        /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/g,
        `<span style='color: ${theme.colors.function}'>$1</span>`
      );
  };

  return (
    <div className={`preview-panel ${className}`}>
      {previewType === 'theme' && renderThemePreview()}
      {previewType === 'background' && renderBackgroundPreview()}
      {previewType === 'animation' && renderAnimationPreview()}
    </div>
  );
}
