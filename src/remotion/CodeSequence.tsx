import React, { useMemo } from 'react';
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import type { CodeSequenceProps } from './types';

// Dynamically import Prism to avoid SSR issues
let Prism: any = null;
try {
  Prism = require('prismjs');
  require('prismjs/components/prism-javascript');
  require('prismjs/components/prism-typescript');
  require('prismjs/components/prism-python');
  require('prismjs/components/prism-java');
  require('prismjs/components/prism-cpp');
  require('prismjs/components/prism-css');
  require('prismjs/components/prism-json');
  require('prismjs/components/prism-markup');
} catch (error) {
  console.warn('Failed to load Prism.js:', error);
}

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
};

export const CodeSequence: React.FC<CodeSequenceProps> = ({
  item,
  startFrame,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Get code content from item properties
  const codeContent = item.properties.text || '// No code content';
  const language = item.properties.language || 'javascript';
  const theme = item.properties.theme || 'dark';
  const fontSize = item.properties.fontSize || 16;

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
  const animationProgress = interpolate(
    relativeFrame,
    [0, durationInFrames * 0.8], // Animation completes at 80% of duration
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  // Calculate how many characters to show based on animation progress
  const totalCharacters = codeContent.length;
  const charactersToShow = Math.floor(totalCharacters * animationProgress);

  // Create animated code content
  const animatedCode = useMemo(() => {
    if (charactersToShow >= totalCharacters) {
      return highlightedCode;
    }

    // For typing animation, we need to truncate the original code and then highlight
    const truncatedCode = codeContent.substring(0, charactersToShow);

    if (!Prism) {
      return truncatedCode;
    }

    try {
      const prismLanguage = Prism.languages[language] ? language : 'javascript';
      return Prism.highlight(
        truncatedCode,
        Prism.languages[prismLanguage],
        prismLanguage
      );
    } catch (error) {
      return truncatedCode;
    }
  }, [
    codeContent,
    highlightedCode,
    charactersToShow,
    totalCharacters,
    language,
  ]);

  // Style for the container
  const containerStyle: React.CSSProperties = {
    transform: `translate(${x}px, ${y}px) scale(${scale}) rotate(${rotation}deg)`,
    opacity,
    backgroundColor: themeColors.background,
    color: themeColors.color,
    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
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
          {charactersToShow < totalCharacters && (
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
          {`
            @keyframes blink {
              0%, 50% { opacity: 1; }
              51%, 100% { opacity: 0; }
            }
          `}
        </style>
      </AbsoluteFill>
    </Sequence>
  );
};
