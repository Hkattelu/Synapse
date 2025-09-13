// Demo component showcasing Code track specialized features

import React, { useState } from 'react';
import {
  CodeSyntaxPreview,
  LanguageIndicator,
  AnimationModeIndicator,
} from './CodeSyntaxPreview';
import {
  detectLanguageFromCode,
  getCodeLanguageDefaults,
} from '../lib/educationalTypes';
import {
  getApplicablePresets,
  getRecommendedPresetsFor,
} from '../remotion/animations/presets';
import type { TimelineItem } from '../lib/types';

export function CodeTrackDemo() {
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [codeContent, setCodeContent] = useState(`function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}`);

  // Create a mock timeline item for demonstration
  const mockItem: TimelineItem = {
    id: 'demo-code-item',
    assetId: 'demo-asset',
    startTime: 0,
    duration: 5,
    track: 0,
    type: 'code',
    properties: {
      codeText: codeContent,
      language: selectedLanguage,
      theme: 'vscode-dark-plus',
      fontSize: 16,
      showLineNumbers: true,
      animationMode: 'typing',
      typingSpeedCps: 20,
      ...getCodeLanguageDefaults(selectedLanguage),
    },
    animation: undefined,
    animations: [],
    keyframes: [],
  };

  const handleLanguageDetection = () => {
    const detection = detectLanguageFromCode(codeContent);
    setSelectedLanguage(detection.language);
    console.log('Language detection result:', detection);
  };

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    // Apply language defaults
    const defaults = getCodeLanguageDefaults(language);
    console.log('Language defaults for', language, ':', defaults);
  };

  const applicablePresets = getApplicablePresets('code', 'code');
  const beginnerPresets = getRecommendedPresetsFor('beginner');
  const refactoringPresets = getRecommendedPresetsFor('refactoring');

  const sampleCodes: Record<string, string> = {
    javascript: `function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}`,
    typescript: `interface User {
  name: string;
  age: number;
}

function greetUser(user: User): string {
  return \`Hello, \${user.name}!\`;
}`,
    python: `def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print(fibonacci(10))`,
    java: `public class Fibonacci {
    public static int fibonacci(int n) {
        if (n <= 1) return n;
        return fibonacci(n - 1) + fibonacci(n - 2);
    }
}`,
    html: `<!DOCTYPE html>
<html>
  <head>
    <title>Hello World</title>
  </head>
  <body>
    <h1>Welcome!</h1>
  </body>
</html>`,
    glsl: `#version 330 core

attribute vec3 position;
uniform mat4 transform;

void main() {
  gl_Position = transform * vec4(position, 1.0);
}`,
    gdscript: `extends CharacterBody2D

@export var speed: float = 100.0
@onready var sprite: Sprite2D = $Sprite2D

func _ready():
    print("Player ready!")`,
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-text-primary mb-2">
          Code Track Specialized Features Demo
        </h1>
        <p className="text-text-secondary">
          Showcasing educational code features including language detection,
          syntax highlighting, and educational animation presets.
        </p>
      </div>

      {/* Language Selection and Detection */}
      <div className="bg-background-secondary rounded-lg p-4">
        <h2 className="text-lg font-semibold text-text-primary mb-3">
          Language Detection & Selection
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Select Language:
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="w-full bg-background-tertiary border border-border-subtle rounded px-3 py-2 text-text-primary"
            >
              {Object.keys(sampleCodes).map((lang) => (
                <option key={lang} value={lang}>
                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Quick Sample:
            </label>
            <button
              onClick={() => setCodeContent(sampleCodes[selectedLanguage])}
              className="w-full px-3 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
            >
              Load{' '}
              {selectedLanguage.charAt(0).toUpperCase() +
                selectedLanguage.slice(1)}{' '}
              Sample
            </button>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Code Content:
          </label>
          <textarea
            value={codeContent}
            onChange={(e) => setCodeContent(e.target.value)}
            className="w-full h-32 bg-background-tertiary border border-border-subtle rounded px-3 py-2 text-text-primary font-mono text-sm"
            placeholder="Enter your code here..."
          />
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={handleLanguageDetection}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            🔍 Auto-Detect Language
          </button>

          <div className="flex items-center gap-2">
            <LanguageIndicator language={selectedLanguage} />
            <AnimationModeIndicator
              mode={mockItem.properties.animationMode || 'typing'}
            />
          </div>
        </div>
      </div>

      {/* Syntax Highlighting Preview */}
      <div className="bg-background-secondary rounded-lg p-4">
        <h2 className="text-lg font-semibold text-text-primary mb-3">
          Syntax Highlighting Preview
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-text-secondary mb-2">
              Timeline Preview (2 lines):
            </h3>
            <CodeSyntaxPreview
              item={mockItem}
              maxLines={2}
              showLanguage={true}
            />
          </div>

          <div>
            <h3 className="text-sm font-medium text-text-secondary mb-2">
              Full Preview:
            </h3>
            <CodeSyntaxPreview
              item={mockItem}
              maxLines={10}
              showLanguage={true}
            />
          </div>
        </div>
      </div>

      {/* Educational Animation Presets */}
      <div className="bg-background-secondary rounded-lg p-4">
        <h2 className="text-lg font-semibold text-text-primary mb-3">
          Educational Animation Presets
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="text-sm font-medium text-text-secondary mb-2">
              All Available Presets:
            </h3>
            <div className="space-y-1">
              {applicablePresets.map((preset) => (
                <div
                  key={preset.id}
                  className="text-sm text-text-primary bg-background-tertiary px-2 py-1 rounded"
                >
                  {preset.title}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-text-secondary mb-2">
              Beginner Recommended:
            </h3>
            <div className="space-y-1">
              {beginnerPresets.map((preset) => (
                <div
                  key={preset.id}
                  className="text-sm text-text-primary bg-green-100 text-green-800 px-2 py-1 rounded"
                >
                  {preset.title}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-text-secondary mb-2">
              Refactoring Recommended:
            </h3>
            <div className="space-y-1">
              {refactoringPresets.map((preset) => (
                <div
                  key={preset.id}
                  className="text-sm text-text-primary bg-blue-100 text-blue-800 px-2 py-1 rounded"
                >
                  {preset.title}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Language Defaults */}
      <div className="bg-background-secondary rounded-lg p-4">
        <h2 className="text-lg font-semibold text-text-primary mb-3">
          Language-Specific Defaults
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.keys(sampleCodes).map((lang) => {
            const defaults = getCodeLanguageDefaults(lang);
            return (
              <div key={lang} className="bg-background-tertiary p-3 rounded">
                <h4 className="text-sm font-medium text-text-primary mb-2 capitalize">
                  {lang}
                </h4>
                <div className="text-xs text-text-secondary space-y-1">
                  <div>Theme: {defaults.theme}</div>
                  <div>Animation: {defaults.animationMode}</div>
                  <div>
                    Speed:{' '}
                    {defaults.typingSpeedCps || defaults.lineRevealIntervalMs}
                    {defaults.typingSpeedCps ? ' cps' : ' ms'}
                  </div>
                  <div>Line #: {defaults.showLineNumbers ? 'Yes' : 'No'}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Educational Tips */}
      <div className="bg-background-secondary rounded-lg p-4">
        <h2 className="text-lg font-semibold text-text-primary mb-3">
          Educational Usage Tips
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-text-secondary">
          <div>
            <h3 className="font-medium text-text-primary mb-2">
              Animation Speeds:
            </h3>
            <ul className="space-y-1">
              <li>
                • <strong>Slow (10-15 cps):</strong> Perfect for beginners
              </li>
              <li>
                • <strong>Medium (20-25 cps):</strong> Good for most tutorials
              </li>
              <li>
                • <strong>Fast (30+ cps):</strong> Advanced users only
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium text-text-primary mb-2">
              Animation Types:
            </h3>
            <ul className="space-y-1">
              <li>
                • <strong>Typing:</strong> Character-by-character reveal
              </li>
              <li>
                • <strong>Line Focus:</strong> Highlight specific lines
              </li>
              <li>
                • <strong>Diff:</strong> Show code changes
              </li>
              <li>
                • <strong>Line-by-line:</strong> Reveal one line at a time
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
