// Theme preview utilities

import type { ThemeDefinition } from './types';
import { themeManager } from './ThemeManager';

/**
 * Sample code for theme previews
 */
export const PREVIEW_CODE = {
  javascript: `// JavaScript Example
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

const result = fibonacci(10);
console.log(\`Result: \${result}\`);`,

  typescript: `// TypeScript Example
interface User {
  id: number;
  name: string;
  email?: string;
}

class UserService {
  private users: User[] = [];
  
  addUser(user: User): void {
    this.users.push(user);
  }
  
  findById(id: number): User | undefined {
    return this.users.find(u => u.id === id);
  }
}`,

  python: `# Python Example
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    
    return quicksort(left) + middle + quicksort(right)

numbers = [3, 6, 8, 10, 1, 2, 1]
sorted_numbers = quicksort(numbers)
print(f"Sorted: {sorted_numbers}")`,

  css: `/* CSS Example */
.theme-preview {
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.theme-preview:hover {
  transform: translateY(-2px);
  transition: transform 0.2s ease;
}

@media (max-width: 768px) {
  .theme-preview {
    padding: 0.5rem;
  }
}`,
};

/**
 * Generate theme preview HTML
 */
export function generateThemePreview(
  themeId: string,
  language: keyof typeof PREVIEW_CODE = 'javascript',
  options: {
    showLineNumbers?: boolean;
    fontSize?: number;
    width?: number;
    height?: number;
  } = {}
): string {
  const theme = themeManager.getTheme(themeId);
  if (!theme) return '';

  const {
    showLineNumbers = true,
    fontSize = 12,
    width = 300,
    height = 200,
  } = options;

  const code = PREVIEW_CODE[language];
  const lines = code.split('\n');

  const lineNumbersHtml = showLineNumbers
    ? lines
        .map((_, i) => `<span class="line-number">${i + 1}</span>`)
        .join('\n')
    : '';

  const codeHtml = lines
    .map((line) => {
      // Simple syntax highlighting for preview
      let highlighted = line
        .replace(
          /(\/\/.*$|#.*$|\/\*.*?\*\/)/g,
          `<span class="comment">$1</span>`
        )
        .replace(
          /\b(function|class|const|let|var|if|else|for|while|return|def|import|from|interface|type)\b/g,
          `<span class="keyword">$1</span>`
        )
        .replace(
          /(['"`])((?:\\.|(?!\1)[^\\])*?)\1/g,
          `<span class="string">$1$2$1</span>`
        )
        .replace(/\b(\d+(?:\.\d+)?)\b/g, `<span class="number">$1</span>`)
        .replace(
          /\b(true|false|null|undefined|None|True|False)\b/g,
          `<span class="boolean">$1</span>`
        );

      return `<span>${highlighted}</span>`;
    })
    .join('\n');

  return `
    <div class="theme-preview" style="
      background-color: ${theme.colors.background};
      color: ${theme.colors.foreground};
      font-family: ${theme.fonts?.monospace || 'monospace'};
      font-size: ${fontSize}px;
      line-height: ${theme.fonts?.lineHeight || 1.5};
      width: ${width}px;
      height: ${height}px;
      padding: 8px;
      border-radius: 4px;
      overflow: hidden;
      position: relative;
      border: 1px solid ${theme.colors.selection};
    ">
      <style>
        .theme-preview .comment { color: ${theme.colors.comment}; }
        .theme-preview .keyword { color: ${theme.colors.keyword}; }
        .theme-preview .string { color: ${theme.colors.string}; }
        .theme-preview .number { color: ${theme.colors.number}; }
        .theme-preview .boolean { color: ${theme.colors.boolean}; }
        .theme-preview .line-number { 
          color: ${theme.colors.comment}; 
          margin-right: 8px; 
          user-select: none;
          opacity: 0.7;
        }
      </style>
      <div style="display: flex;">
        ${showLineNumbers ? `<div class="line-numbers" style="margin-right: 8px;">${lineNumbersHtml}</div>` : ''}
        <div class="code-content">
          <pre style="margin: 0; font-family: inherit;"><code>${codeHtml}</code></pre>
        </div>
      </div>
    </div>
  `;
}

/**
 * Generate theme preview CSS for use in components
 */
export function generateThemePreviewCSS(themeId: string): string {
  return themeManager.getThemePreviewCSS(themeId);
}

/**
 * Get theme color palette for quick preview
 */
export function getThemeColorPalette(themeId: string): string[] {
  const theme = themeManager.getTheme(themeId);
  if (!theme) return [];

  return [
    theme.colors.background,
    theme.colors.foreground,
    theme.colors.keyword,
    theme.colors.string,
    theme.colors.function,
    theme.colors.variable,
    theme.colors.comment,
    theme.colors.number,
  ];
}

/**
 * Generate a compact theme card for selection UI
 */
export function generateThemeCard(themeId: string): {
  id: string;
  name: string;
  category: string;
  colors: string[];
  previewHtml: string;
} | null {
  const theme = themeManager.getTheme(themeId);
  if (!theme) return null;

  return {
    id: theme.id,
    name: theme.name,
    category: theme.category,
    colors: getThemeColorPalette(themeId),
    previewHtml: generateThemePreview(themeId, 'javascript', {
      showLineNumbers: false,
      fontSize: 10,
      width: 200,
      height: 120,
    }),
  };
}
