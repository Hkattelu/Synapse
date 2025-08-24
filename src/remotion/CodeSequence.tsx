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

const THEMES = {
  dark: {
    background: '#1e1e1e',
    color: '#d4d4d4',
    comment: '#6a9955',
    keyword: '#569cd6',
    string: '#ce9178',
    number: '#b5cea8',
    operator: '#d4d4d4',
    punctuation: '#d4d4d4',
    function: '#dcdcaa',
    variable: '#9cdcfe',
  },
  light: {
    background: '#ffffff',
    color: '#24292e',
    comment: '#6a737d',
    keyword: '#d73a49',
    string: '#032f62',
    number: '#005cc5',
    operator: '#24292e',
    punctuation: '#24292e',
    function: '#6f42c1',
    variable: '#e36209',
  },
  monokai: {
    background: '#272822',
    color: '#f8f8f2',
    comment: '#75715e',
    keyword: '#f92672',
    string: '#e6db74',
    number: '#ae81ff',
    operator: '#f8f8f2',
    punctuation: '#f8f8f2',
    function: '#a6e22e',
    variable: '#fd971f',
  },
  github: {
    background: '#f6f8fa',
    color: '#24292e',
    comment: '#6a737d',
    keyword: '#d73a49',
    string: '#032f62',
    number: '#005cc5',
    operator: '#24292e',
    punctuation: '#24292e',
    function: '#6f42c1',
    variable: '#e36209',
  },
  dracula: {
    background: '#282a36',
    color: '#f8f8f2',
    comment: '#6272a4',
    keyword: '#ff79c6',
    string: '#f1fa8c',
    number: '#bd93f9',
    operator: '#ff79c6',
    punctuation: '#f8f8f2',
    function: '#50fa7b',
    variable: '#8be9fd',
  },
  'solarized-dark': {
    background: '#002b36',
    color: '#93a1a1',
    comment: '#586e75',
    keyword: '#859900',
    string: '#2aa198',
    number: '#b58900',
    operator: '#93a1a1',
    punctuation: '#93a1a1',
    function: '#268bd2',
    variable: '#cb4b16',
  },
  'solarized-light': {
    background: '#fdf6e3',
    color: '#657b83',
    comment: '#93a1a1',
    keyword: '#859900',
    string: '#2aa198',
    number: '#b58900',
    operator: '#657b83',
    punctuation: '#657b83',
    function: '#268bd2',
    variable: '#cb4b16',
  },
  'vscode-dark-plus': {
    background: '#1e1e1e',
    color: '#d4d4d4',
    comment: '#6a9955',
    keyword: '#c586c0',
    string: '#ce9178',
    number: '#b5cea8',
    operator: '#d4d4d4',
    punctuation: '#d4d4d4',
    function: '#dcdcaa',
    variable: '#9cdcfe',
  },
};

export const CodeSequence: React.FC<CodeSequenceProps> = ({
  item,
  startFrame,
  durationInFrames,
  animation,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Get code content from item properties
  const codeContentRaw =
    item.properties.codeText || item.properties.text || '// No code content';
  const language = item.properties.language || 'javascript';
  const theme = item.properties.theme || 'dark';
  const fontSize = item.properties.fontSize || 16;
  const fontFamily =
    item.properties.fontFamily || 'Monaco, Menlo, "Ubuntu Mono", monospace';
  const showLineNumbers = item.properties.showLineNumbers ?? false;
  const animationMode = item.properties.animationMode || 'typing';
  const typingSpeedCps = item.properties.typingSpeedCps || 30;
  const anim = animation ?? item.animation;
  const lineRevealIntervalMs = item.properties.lineRevealIntervalMs || 350;

  // Format code when pasted (placeholder: synchronous passthrough to avoid async in render)
  const codeContent = useMemo(() => {
    return codeContentRaw;
  }, [codeContentRaw, language]);

  // Get theme colors
  const themeColors = THEMES[theme as keyof typeof THEMES] || THEMES.dark;

  // Calculate position and transformations
  const x = item.properties.x || 0;
  const y = item.properties.y || 0;
  const scale = item.properties.scale || 1;
  const rotation = item.properties.rotation || 0;
  const opacity = item.properties.opacity || 1;

  // Highlight code using Prism
  const highlightedCode = useMemo(() => {
    if (!Prism) {
      return codeContent;
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
      return codeContent;
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

  // Create animated code content
  const animatedCode = useMemo(() => {
    const prismLanguage = Prism.languages[language] ? language : 'javascript';

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
            inner = ln;
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
        return visible;
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
            return `<span class="diff-${cls}">${p.value}</span>`;
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
        return truncated;
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
    backgroundColor: themeColors.background,
    color: themeColors.color,
    fontFamily,
    fontSize: `${fontSize}px`,
    lineHeight: 1.5,
    padding: '20px',
    overflow: 'hidden',
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
  };

  // Custom CSS for syntax highlighting
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
    
    .token.property,
    .token.tag,
    .token.constant,
    .token.symbol,
    .token.deleted {
      color: ${themeColors.keyword};
    }
    
    .token.boolean,
    .token.number {
      color: ${themeColors.number};
    }
    
    .token.selector,
    .token.attr-name,
    .token.string,
    .token.char,
    .token.builtin,
    .token.inserted {
      color: ${themeColors.string};
    }
    
    .token.operator,
    .token.entity,
    .token.url,
    .language-css .token.string,
    .style .token.string,
    .token.variable {
      color: ${themeColors.variable};
    }
    
    .token.atrule,
    .token.attr-value,
    .token.function,
    .token.class-name {
      color: ${themeColors.function};
    }
    
    .token.keyword {
      color: ${themeColors.keyword};
    }
    
    .token.regex,
    .token.important {
      color: ${themeColors.string};
    }
  `;

  return (
    <Sequence from={startFrame} durationInFrames={durationInFrames}>
      <AbsoluteFill style={containerStyle}>
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
                  backgroundColor: themeColors.color,
                  width: '2px',
                  height: `${fontSize}px`,
                  display: 'inline-block',
                  animation: 'blink 1s infinite',
                  marginLeft: '2px',
                }}
              />
            )}
        </pre>

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
            return `
            @keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }
            .diff-added { background-color: rgba(16, 185, 129, 0.15); display: block; }
            .diff-removed { background-color: rgba(239, 68, 68, 0.15); display: block; text-decoration: line-through; opacity: 0.85; }
            .diff-unchanged { display: block; }
            .code-line { display: block; }
            ${numberingCss}
            `;
          })()}
        </style>
      </AbsoluteFill>
    </Sequence>
  );
};
