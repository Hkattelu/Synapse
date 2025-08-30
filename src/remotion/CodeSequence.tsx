import React, { useMemo } from 'react';
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import type { CodeSequenceProps } from './types';
import { diffLines } from 'diff';
import { formatCode } from '../lib/format';

// Import Prism.js - languages are loaded via vite-plugin-prismjs
import Prism from 'prismjs';
import { useAnimationStyles } from './animations/useAnimationStyles';
import {
  parseActiveLines,
  useTypewriterCount,
} from './animations/useCodeContentEffects';
import { useDiffAnimations } from './animations/useDiffAnimations';
import { themeManager } from '../lib/themes';
import { BackgroundRenderer } from './components/BackgroundRenderer';

// Legacy theme mapping for backward compatibility
const LEGACY_THEMES = {
  dark: 'vscode-dark-plus',
  light: 'vscode-light-plus',
  monokai: 'monokai',
  github: 'github-light',
  dracula: 'dracula',
  'solarized-dark': 'solarized-dark',
  'solarized-light': 'solarized-light',
  'vscode-dark-plus': 'vscode-dark-plus',
};

export const CodeSequence: React.FC<CodeSequenceProps> = ({
  item,
  startFrame,
  durationInFrames,
  animation,
  exportSettings,
}) => {
  const escapeHtml = (s: string): string =>
    s.replace(
      /[&<>"']/g,
      (ch) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        })[ch as '&' | '<' | '>' | '"' | "'"] as string
    );
  const encodeForHtml = (s: string): string => {
    const util = (Prism as any)?.util;
    if (util && typeof util.encode === 'function') {
      try {
        return String(util.encode(s));
      } catch {
        // fall through
      }
    }
    return escapeHtml(s);
  };
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Get code content from item properties
  const codeContentRaw =
    item.properties.codeText || item.properties.text || '// No code content';
  const language = item.properties.language || 'javascript';
  const theme = item.properties.theme || 'dark';
  // Get font settings from theme or fallback to item properties
  const themeId = LEGACY_THEMES[theme as keyof typeof LEGACY_THEMES] || theme;
  const themeDefinition = themeManager.getTheme(themeId);
  

  
  const fontSize = item.properties.fontSize || themeDefinition?.fonts?.size || 16;
  const fontFamily = item.properties.fontFamily || 
    themeDefinition?.fonts?.monospace || 
    'Monaco, Menlo, "Ubuntu Mono", monospace';
  const lineHeight = themeDefinition?.fonts?.lineHeight || 1.5;
  const showLineNumbers = item.properties.showLineNumbers ?? false;
  const animationMode = item.properties.animationMode || 'typing';
  const typingSpeedCps = item.properties.typingSpeedCps || 30;
  const anim = animation ?? item.animation;
  const lineRevealIntervalMs = item.properties.lineRevealIntervalMs || 350;

  // Format code when pasted (placeholder: synchronous passthrough to avoid async in render)
  const codeContent = useMemo(() => {
    return codeContentRaw;
  }, [codeContentRaw, language]);

  // Get theme colors using new theme system
  const getThemeColors = useMemo(() => {
    // Map legacy theme names to new theme IDs
    const themeId = LEGACY_THEMES[theme as keyof typeof LEGACY_THEMES] || theme;
    
    // Try to get theme from new system
    const themeDefinition = themeManager.getTheme(themeId);
    if (themeDefinition) {
      // Record theme usage for recent themes tracking
      themeManager.recordThemeUsage(themeId);
      return themeDefinition.colors;
    }
    
    // Fallback to default dark theme
    const fallbackTheme = themeManager.getTheme('vscode-dark-plus');
    return fallbackTheme?.colors || {
      background: '#1e1e1e',
      foreground: '#d4d4d4',
      comment: '#6a9955',
      keyword: '#569cd6',
      string: '#ce9178',
      number: '#b5cea8',
      operator: '#d4d4d4',
      punctuation: '#d4d4d4',
      function: '#dcdcaa',
      variable: '#9cdcfe',
      type: '#4ec9b0',
      class: '#4ec9b0',
      constant: '#4fc1ff',
      property: '#9cdcfe',
      tag: '#569cd6',
      attribute: '#92c5f8',
      boolean: '#569cd6',
      regex: '#d16969',
      escape: '#d7ba7d',
      selection: '#264f78',
      lineHighlight: '#2a2d2e',
      cursor: '#d4d4d4',
      diffAdded: '#144212',
      diffRemoved: '#5a1e1e',
      diffModified: '#1e3a8a',
    };
  }, [theme]);

  const themeColors = getThemeColors;

  // Background configuration with export settings consideration
  const backgroundConfig = useMemo(() => {
    const { backgroundType, backgroundWallpaper, backgroundGradient, backgroundOpacity } = item.properties;
    
    // If transparent background export is enabled, check inclusion settings
    if (exportSettings?.transparentBackground) {
      // Skip wallpaper if not included in transparent export
      if (backgroundType === 'wallpaper' && !exportSettings.includeWallpaper) {
        return null;
      }
      
      // Skip gradient if not included in transparent export
      if (backgroundType === 'gradient' && !exportSettings.includeGradient) {
        return null;
      }
    }
    
    if (!backgroundType || backgroundType === 'none') {
      return null;
    }
    
    switch (backgroundType) {
      case 'wallpaper':
        return backgroundWallpaper ? {
          type: 'wallpaper' as const,
          wallpaper: {
            assetId: backgroundWallpaper,
            opacity: backgroundOpacity || 1,
            blendMode: 'normal' as const
          }
        } : null;
        
      case 'gradient':
        return backgroundGradient ? {
          type: 'gradient' as const,
          gradient: backgroundGradient
        } : null;
        
      case 'color':
        return {
          type: 'color' as const,
          color: themeColors.background
        };
        
      default:
        return null;
    }
  }, [
    item.properties.backgroundType, 
    item.properties.backgroundWallpaper, 
    item.properties.backgroundGradient, 
    item.properties.backgroundOpacity, 
    themeColors.background,
    exportSettings?.transparentBackground,
    exportSettings?.includeWallpaper,
    exportSettings?.includeGradient
  ]);

  // Calculate position and transformations
  const x = item.properties.x || 0;
  const y = item.properties.y || 0;
  const scale = item.properties.scale || 1;
  const rotation = item.properties.rotation || 0;
  const opacity = item.properties.opacity || 1;

  // Highlight code using Prism
  const highlightedCode = useMemo(() => {
    if (!Prism) {
      return encodeForHtml(codeContent);
    }

    try {
      // Ensure the language is supported
      const prismLanguage = Prism.languages[language] ? language : 'javascript';
      return Prism.highlight(
        codeContent,
        Prism.languages[prismLanguage],
        prismLanguage
      );
    } catch (error) {
      console.warn('Failed to highlight code:', error);
      return encodeForHtml(codeContent);
    }
  }, [codeContent, language]);

  // Calculate typing animation progress
  const relativeFrame = frame - startFrame;
  // Typing speed based on characters per second
  const totalCharacters = codeContent.length;
  const presetChars = useTypewriterCount(
    anim?.preset === 'typewriter' ? anim : undefined,
    totalCharacters,
    startFrame
  );
  const legacyChars = Math.floor(
    Math.max(0, frame - startFrame) * (typingSpeedCps / fps)
  );
  const charactersToShow =
    anim?.preset === 'typewriter' ? presetChars : legacyChars;

  // Line-by-line reveal calculations
  const lines = useMemo(() => codeContent.split(/\r?\n/), [codeContent]);
  const revealIntervalFrames = Math.max(
    1,
    Math.round((lineRevealIntervalMs / 1000) * fps)
  );
  const linesToShow = Math.floor(
    Math.max(0, relativeFrame) / revealIntervalFrames
  );

  // Helper function to highlight code
  const highlightCodeHelper = useMemo(() => {
    return (code: string, lang: string) => {
      const prismLanguage = Prism.languages[lang] ? lang : 'javascript';
      try {
        return Prism.highlight(code, Prism.languages[prismLanguage], prismLanguage);
      } catch {
        return encodeForHtml(code);
      }
    };
  }, []);

  // Handle new diff animations
  const diffAnimationResult = useDiffAnimations(
    anim,
    item.properties.codeText || '',
    item.properties.codeTextB || '',
    language,
    startFrame,
    highlightCodeHelper,
    encodeForHtml
  );

  // Create animated code content
  const animatedCode = useMemo(() => {
    const prismLanguage = Prism.languages[language] ? language : 'javascript';

    // Handle new diff animation presets
    if (anim && ['diffSlide', 'diffFade', 'diffHighlight', 'typewriterDiff'].includes(anim.preset)) {
      return diffAnimationResult.animatedHtml;
    }

    // New preset: Line Focus (dims non-active lines)
    if (anim?.preset === 'lineFocus') {
      let start = 1;
      let end = lines.length;
      try {
        const parsed = parseActiveLines(anim.activeLines);
        start = parsed.start;
        end = parsed.end;
      } catch {}
      const linesArr = lines;
      const html = linesArr
        .map((ln, idx) => {
          const lineNo = idx + 1;
          const isActive = lineNo >= start && lineNo <= end;
          let inner = '';
          try {
            inner = Prism.highlight(
              ln,
              Prism.languages[prismLanguage],
              prismLanguage
            );
          } catch {
            inner = encodeForHtml(ln);
          }
          const opacity = isActive
            ? 1
            : Math.max(0, Math.min(1, anim.focusOpacity));
          return `<span class="code-line" style="opacity:${opacity}">${inner}</span>`;
        })
        .join('\n');
      return html;
    }

    if (animationMode === 'line-by-line') {
      const visible = lines
        .slice(0, Math.min(linesToShow, lines.length))
        .join('\n');
      try {
        return Prism.highlight(
          visible,
          Prism.languages[prismLanguage],
          prismLanguage
        );
      } catch {
        return encodeForHtml(visible);
      }
    }

    if (animationMode === 'diff') {
      const a = (item.properties.codeText || '').replace(/\r?\n$/, '');
      const b = (item.properties.codeTextB || '').replace(/\r?\n$/, '');
      const parts = diffLines(a + '\n', b + '\n');
      return parts
        .map((p) => {
          const cls = p.added ? 'added' : p.removed ? 'removed' : 'unchanged';
          try {
            const inner = Prism.highlight(
              p.value,
              Prism.languages[prismLanguage],
              prismLanguage
            );
            return `<span class="diff-${cls}">${inner}</span>`;
          } catch {
            const safe = encodeForHtml(p.value);
            return `<span class="diff-${cls}">${safe}</span>`;
          }
        })
        .join('');
    }

    // typing or none
    if (anim?.preset === 'typewriter' || animationMode === 'typing') {
      if (charactersToShow >= totalCharacters) return highlightedCode;
      const truncated = codeContent.substring(0, Math.max(0, charactersToShow));
      try {
        return Prism.highlight(
          truncated,
          Prism.languages[prismLanguage],
          prismLanguage
        );
      } catch {
        return encodeForHtml(truncated);
      }
    }

    return highlightedCode;
  }, [
    animationMode,
    charactersToShow,
    codeContent,
    highlightedCode,
    language,
    lines,
    linesToShow,
    item.properties.codeText,
    item.properties.codeTextB,
    anim,
    diffAnimationResult.animatedHtml,
  ]);

  // Style for the container
  const motionAnim =
    anim && (anim.preset === 'slide' || anim.preset === 'kenBurns')
      ? anim
      : undefined;
  const animStyles = useAnimationStyles(motionAnim, {
    startFrame,
    durationInFrames,
  });

  const containerStyle: React.CSSProperties = {
    transform:
      `${animStyles.transform ?? ''} translate(${x}px, ${y}px) scale(${scale}) rotate(${rotation}deg)`.trim(),
    opacity: (animStyles.opacity ?? 1) * opacity,
    // Handle background color based on export settings and background configuration
    backgroundColor: (() => {
      // If transparent background export is enabled, use transparent
      if (exportSettings?.transparentBackground) {
        return 'transparent';
      }
      // If custom background is configured, use transparent to let background layer show
      if (backgroundConfig) {
        return 'transparent';
      }
      // Otherwise use theme background
      return themeColors.background;
    })(),
    color: themeColors.foreground,
    fontFamily,
    fontSize: `${fontSize}px`,
    lineHeight,
    padding: '20px',
    overflow: 'hidden',
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
  };

  // Code container style for proper layering over background
  const codeContainerStyle: React.CSSProperties = {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    height: '100%',
  };

  // Enhanced CSS for comprehensive syntax highlighting
  const syntaxStyles = `
    .token.comment,
    .token.prolog,
    .token.doctype,
    .token.cdata {
      color: ${themeColors.comment};
    }
    
    .token.punctuation {
      color: ${themeColors.punctuation};
    }
    
    .token.property {
      color: ${themeColors.property};
    }
    
    .token.tag {
      color: ${themeColors.tag};
    }
    
    .token.constant,
    .token.symbol {
      color: ${themeColors.constant};
    }
    
    .token.deleted {
      color: ${themeColors.diffRemoved};
      background-color: rgba(255, 0, 0, 0.1);
    }
    
    .token.boolean {
      color: ${themeColors.boolean};
    }
    
    .token.number {
      color: ${themeColors.number};
    }
    
    .token.selector,
    .token.attr-name,
    .token.string,
    .token.char,
    .token.builtin {
      color: ${themeColors.string};
    }
    
    .token.inserted {
      color: ${themeColors.diffAdded};
      background-color: rgba(0, 255, 0, 0.1);
    }
    
    .token.operator,
    .token.entity,
    .token.url {
      color: ${themeColors.operator};
    }
    
    .language-css .token.string,
    .style .token.string,
    .token.variable {
      color: ${themeColors.variable};
    }
    
    .token.atrule,
    .token.attr-value {
      color: ${themeColors.attribute};
    }
    
    .token.function {
      color: ${themeColors.function};
    }
    
    .token.class-name {
      color: ${themeColors.class};
    }
    
    .token.keyword {
      color: ${themeColors.keyword};
    }
    
    .token.regex {
      color: ${themeColors.regex};
    }
    
    .token.important {
      color: ${themeColors.keyword};
      font-weight: bold;
    }
    
    .token.escape {
      color: ${themeColors.escape};
    }
    
    .token.type {
      color: ${themeColors.type};
    }
    
    /* Selection and cursor styles */
    ::selection {
      background-color: ${themeColors.selection};
    }
    
    /* Line highlighting */
    .line-highlight {
      background-color: ${themeColors.lineHighlight};
    }
  `;

  return (
    <Sequence from={startFrame} durationInFrames={durationInFrames}>
      <AbsoluteFill style={containerStyle}>
        {/* Background layer */}
        {backgroundConfig && (
          <BackgroundRenderer
            config={backgroundConfig}
            opacity={item.properties.backgroundOpacity || 1}
            style={{ zIndex: 0 }}
          />
        )}
        
        {/* Code content layer */}
        <div style={codeContainerStyle}>
          <style>{syntaxStyles}</style>
          <pre
            style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
          >
            <code
              dangerouslySetInnerHTML={{ __html: animatedCode }}
              style={{ fontFamily: 'inherit' }}
            />
            {/* Typing cursor */}
            {(anim?.preset === 'typewriter' || animationMode === 'typing') &&
              charactersToShow < totalCharacters && (
                <span
                  style={{
                    backgroundColor: themeColors.cursor,
                    width: '2px',
                    height: `${fontSize}px`,
                    display: 'inline-block',
                    animation: 'blink 1s infinite',
                    marginLeft: '2px',
                  }}
                />
              )}
          </pre>
        </div>

        {/* Blinking cursor animation */}
        <style>
          {(() => {
            const numberingCss = showLineNumbers
              ? anim?.preset === 'lineFocus'
                ? `pre { counter-reset: line; }
                   code > .code-line { counter-increment: line; }
                   code > .code-line::before { content: counter(line); display: inline-block; width: 2.5em; margin-right: 1em; text-align: right; color: ${themeColors.comment}; }`
                : `pre { counter-reset: line; }
                   code span { counter-increment: line; }
                   code span::before { content: counter(line); display: inline-block; width: 2.5em; margin-right: 1em; text-align: right; color: ${themeColors.comment}; }`
              : '';
            
            const diffAnimationCss = diffAnimationResult.needsSpecialStyling ? `
              .diff-added { display: block; transition: all 0.3s ease; }
              .diff-removed { display: block; transition: all 0.3s ease; }
              .diff-unchanged { display: block; }
              .typewriter-cursor { animation: blink 1s infinite; }
            ` : `
              .diff-added { 
                background-color: ${themeColors.diffAdded}; 
                display: block; 
                border-left: 3px solid ${themeColors.diffAdded}; 
                padding-left: 0.5em; 
              }
              .diff-removed { 
                background-color: ${themeColors.diffRemoved}; 
                display: block; 
                text-decoration: line-through; 
                opacity: 0.85; 
                border-left: 3px solid ${themeColors.diffRemoved}; 
                padding-left: 0.5em; 
              }
              .diff-unchanged { display: block; }
            `;
            
            return `
            @keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }
            ${diffAnimationCss}
            .code-line { display: block; }
            ${numberingCss}
            `;
          })()}
        </style>
      </AbsoluteFill>
    </Sequence>
  );
};
