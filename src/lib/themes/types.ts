// Theme system types for comprehensive code editor theming

export interface ThemeDefinition {
  id: string;
  name: string;
  category: 'light' | 'dark' | 'high-contrast';
  colors: {
    // Core editor colors
    background: string;
    foreground: string;
    
    // Syntax highlighting colors
    comment: string;
    keyword: string;
    string: string;
    number: string;
    operator: string;
    punctuation: string;
    function: string;
    variable: string;
    
    // Additional syntax elements
    type: string;
    class: string;
    constant: string;
    property: string;
    tag: string;
    attribute: string;
    boolean: string;
    regex: string;
    escape: string;
    
    // UI elements
    selection: string;
    lineHighlight: string;
    cursor: string;
    
    // Diff colors
    diffAdded: string;
    diffRemoved: string;
    diffModified: string;
  };
  fonts?: {
    primary?: string;
    monospace?: string;
    size?: number;
    lineHeight?: number;
  };
  metadata?: {
    author?: string;
    description?: string;
    version?: string;
    tags?: string[];
  };
}

export interface ThemeCategory {
  id: string;
  name: string;
  description: string;
  themes: string[]; // theme IDs
}

export interface ThemePreferences {
  favoriteThemes: string[];
  recentThemes: string[];
  customThemes: string[];
}