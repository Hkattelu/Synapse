// Lightweight syntax highlighting preview component for Code track timeline items

import React, { useMemo } from 'react';
import Prism from 'prismjs';
import { themeManager } from '../lib/themes';
import type { TimelineItem } from '../lib/types';

interface CodeSyntaxPreviewProps {
  item: TimelineItem;
  maxLines?: number;
  showLanguage?: boolean;
  className?: string;
}

export function CodeSyntaxPreview({
  item,
  maxLines = 3,
  showLanguage = true,
  className = '',
}: CodeSyntaxPreviewProps) {
  const codeText = item.properties.codeText || item.properties.text || '';
  const language = item.properties.language || 'javascript';
  const theme = item.properties.theme || 'vscode-dark-plus';

  // Get theme colors
  const themeColors = useMemo(() => {
    const themeDefinition = themeManager.getTheme(theme);
    if (themeDefinition) {
      return themeDefinition.colors;
    }

    // Fallback colors
    return {
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
    };
  }, [theme]);

  // Highlight code and truncate to maxLines
  const highlightedCode = useMemo(() => {
    if (!codeText.trim()) {
      return '<span class="text-gray-500">// No code content</span>';
    }

    try {
      const lines = codeText.split('\n');
      const truncatedCode = lines.slice(0, maxLines).join('\n');
      const hasMore = lines.length > maxLines;

      const prismLanguage = Prism.languages[language] ? language : 'javascript';
      let highlighted = Prism.highlight(
        truncatedCode,
        Prism.languages[prismLanguage],
        prismLanguage
      );

      if (hasMore) {
        highlighted += '\n<span class="text-gray-500">...</span>';
      }

      return highlighted;
    } catch (error) {
      console.warn('Failed to highlight code:', error);
      const lines = codeText.split('\n');
      const truncatedCode = lines.slice(0, maxLines).join('\n');
      const hasMore = lines.length > maxLines;

      return (
        escapeHtml(truncatedCode) +
        (hasMore ? '\n<span class="text-gray-500">...</span>' : '')
      );
    }
  }, [codeText, language, maxLines]);

  // Escape HTML for fallback
  const escapeHtml = (text: string): string => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  // Generate CSS for syntax highlighting
  const syntaxStyles = useMemo(
    () => `
    .code-preview {
      background-color: ${themeColors.background};
      color: ${themeColors.foreground};
    }
    
    .code-preview .token.comment,
    .code-preview .token.prolog,
    .code-preview .token.doctype,
    .code-preview .token.cdata {
      color: ${themeColors.comment};
    }
    
    .code-preview .token.punctuation {
      color: ${themeColors.punctuation};
    }
    
    .code-preview .token.keyword {
      color: ${themeColors.keyword};
    }
    
    .code-preview .token.string,
    .code-preview .token.char,
    .code-preview .token.builtin {
      color: ${themeColors.string};
    }
    
    .code-preview .token.number {
      color: ${themeColors.number};
    }
    
    .code-preview .token.operator {
      color: ${themeColors.operator};
    }
    
    .code-preview .token.function {
      color: ${themeColors.function};
    }
    
    .code-preview .token.variable {
      color: ${themeColors.variable};
    }
  `,
    [themeColors]
  );

  // Enforce an 80-character max visual width for preview content
  const maxPreviewWidthCh = 80;

  return (
    <div className={`code-syntax-preview ${className}`}>
      <style>{syntaxStyles}</style>

      {showLanguage && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
            {language.toUpperCase()}
          </span>
          {item.properties.animationMode && (
            <span className="text-xs text-gray-500">
              {item.properties.animationMode}
            </span>
          )}
        </div>
      )}

      <div className="code-preview rounded border overflow-hidden" style={{ maxWidth: `${maxPreviewWidthCh}ch` }}>
        <pre className="text-xs p-2 m-0 overflow-hidden" style={{ maxWidth: `${maxPreviewWidthCh}ch`, whiteSpace: 'pre-wrap' }}>
          <code
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
            style={{
              fontFamily:
                item.properties.fontFamily ||
                'Monaco, Menlo, "Ubuntu Mono", monospace',
              fontSize: Math.min(item.properties.fontSize || 14, 12),
              lineHeight: 1.3,
              overflowWrap: 'anywhere',
              wordBreak: 'break-word',
              display: 'inline-block',
              maxWidth: '100%'
            }}
          />
        </pre>
      </div>
    </div>
  );
}

// Language indicator component for minimal displays
export function LanguageIndicator({
  language,
  className = '',
}: {
  language: string;
  className?: string;
}) {
  const getLanguageColor = (lang: string): string => {
    const colors: Record<string, string> = {
      javascript: '#f7df1e',
      typescript: '#3178c6',
      python: '#3776ab',
      java: '#ed8b00',
      cpp: '#00599c',
      html: '#e34f26',
      css: '#1572b6',
      json: '#000000',
      glsl: '#5d4e75',
      gdscript: '#478cbf',
    };
    return colors[lang] || '#6b7280';
  };

  return (
    <div
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded ${className}`}
      style={{ backgroundColor: `${getLanguageColor(language)}20` }}
    >
      <div
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: getLanguageColor(language) }}
      />
      {language.toUpperCase()}
    </div>
  );
}

// Animation mode indicator
export function AnimationModeIndicator({
  mode,
  className = '',
}: {
  mode: string;
  className?: string;
}) {
  const getModeIcon = (mode: string): string => {
    switch (mode) {
      case 'typing':
        return '⌨️';
      case 'line-by-line':
        return '📝';
      case 'diff':
        return '🔄';
      default:
        return '▶️';
    }
  };

  const getModeColor = (mode: string): string => {
    switch (mode) {
      case 'typing':
        return '#10b981';
      case 'line-by-line':
        return '#f59e0b';
      case 'diff':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <div
      className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${className}`}
      style={{
        backgroundColor: `${getModeColor(mode)}20`,
        color: getModeColor(mode),
      }}
    >
      <span>{getModeIcon(mode)}</span>
      {mode}
    </div>
  );
}
