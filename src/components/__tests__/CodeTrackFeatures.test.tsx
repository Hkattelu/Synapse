// Tests for Code track specialized features

import { describe, it, expect } from 'vitest';
import {
  detectLanguageFromCode,
  getCodeLanguageDefaults,
} from '../../lib/educationalTypes';
import {
  getApplicablePresets,
  getRecommendedPresetsFor,
} from '../../remotion/animations/presets';

describe('Code Track Specialized Features', () => {
  describe('Language Detection', () => {
    it('should detect JavaScript from function syntax', () => {
      const code = `
        function hello() {
          console.log("Hello World");
        }
      `;
      const result = detectLanguageFromCode(code);
      expect(result.language).toBe('javascript');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should detect TypeScript from type annotations', () => {
      const code = `
        interface User {
          name: string;
          age: number;
        }
        
        function greet(user: User): string {
          return \`Hello \${user.name}\`;
        }
      `;
      const result = detectLanguageFromCode(code);
      expect(result.language).toBe('typescript');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should detect Python from def syntax', () => {
      const code = `
        def hello_world():
            print("Hello World")
            
        if __name__ == "__main__":
            hello_world()
      `;
      const result = detectLanguageFromCode(code);
      expect(result.language).toBe('python');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should detect HTML from tags', () => {
      const code = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Test</title>
          </head>
          <body>
            <h1>Hello World</h1>
          </body>
        </html>
      `;
      const result = detectLanguageFromCode(code);
      expect(result.language).toBe('html');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should detect GLSL from shader syntax', () => {
      const code = `
        #version 330 core
        
        attribute vec3 position;
        uniform mat4 transform;
        
        void main() {
          gl_Position = transform * vec4(position, 1.0);
        }
      `;
      const result = detectLanguageFromCode(code);
      expect(result.language).toBe('glsl');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should detect GDScript from Godot syntax', () => {
      const code = `
        extends CharacterBody2D
        
        @export var speed: float = 100.0
        @onready var sprite: Sprite2D = $Sprite2D
        
        func _ready():
            print("Player ready!")
      `;
      const result = detectLanguageFromCode(code);
      expect(result.language).toBe('gdscript');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should fallback to javascript for empty code', () => {
      const result = detectLanguageFromCode('');
      expect(result.language).toBe('javascript');
      expect(result.confidence).toBe(0);
    });

    it('should use filename extension for detection', () => {
      const code = 'print("hello")';
      const result = detectLanguageFromCode(code, 'test.py');
      expect(result.language).toBe('python');
      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  describe('Language Defaults', () => {
    it('should provide JavaScript defaults', () => {
      const defaults = getCodeLanguageDefaults('javascript');
      expect(defaults.theme).toBe('vscode-dark-plus');
      expect(defaults.fontSize).toBe(16);
      expect(defaults.showLineNumbers).toBe(true);
      expect(defaults.animationMode).toBe('typing');
      expect(defaults.typingSpeedCps).toBe(20);
    });

    it('should provide Python defaults', () => {
      const defaults = getCodeLanguageDefaults('python');
      expect(defaults.theme).toBe('monokai');
      expect(defaults.animationMode).toBe('line-by-line');
      expect(defaults.lineRevealIntervalMs).toBe(400);
    });

    it('should provide HTML defaults', () => {
      const defaults = getCodeLanguageDefaults('html');
      expect(defaults.theme).toBe('vscode-light-plus');
      expect(defaults.showLineNumbers).toBe(false);
      expect(defaults.typingSpeedCps).toBe(25);
    });

    it('should fallback to JavaScript defaults for unknown language', () => {
      const defaults = getCodeLanguageDefaults('unknown-language');
      expect(defaults.theme).toBe('vscode-dark-plus');
      expect(defaults.animationMode).toBe('typing');
    });
  });

  describe('Educational Animation Presets', () => {
    it('should get applicable presets for code items', () => {
      const presets = getApplicablePresets('code', 'code');
      expect(presets.length).toBeGreaterThan(0);

      const presetIds = presets.map((p) => p.id);
      expect(presetIds).toContain('typewriter');
      expect(presetIds).toContain('lineFocus');
      expect(presetIds).toContain('diffHighlight');
    });

    it('should get recommended presets for beginners', () => {
      const presets = getRecommendedPresetsFor('beginner');
      expect(presets.length).toBeGreaterThan(0);

      const presetIds = presets.map((p) => p.id);
      expect(presetIds).toContain('typewriter');
      expect(presetIds).toContain('lineFocus');
    });

    it('should get recommended presets for refactoring', () => {
      const presets = getRecommendedPresetsFor('refactoring');
      expect(presets.length).toBeGreaterThan(0);

      const presetIds = presets.map((p) => p.id);
      expect(presetIds).toContain('diffHighlight');
    });

    it('should get recommended presets for debugging', () => {
      const presets = getRecommendedPresetsFor('debugging');
      expect(presets.length).toBeGreaterThan(0);

      const presetIds = presets.map((p) => p.id);
      expect(presetIds).toContain('lineFocus');
      expect(presetIds).toContain('diffHighlight');
    });
  });

  describe('Educational Animation Configuration', () => {
    it('should create typewriter config with educational speed', () => {
      const presets = getApplicablePresets('code', 'code');
      const typewriterPreset = presets.find((p) => p.id === 'typewriter');

      expect(typewriterPreset).toBeDefined();
      const config = typewriterPreset!.makeDefault();
      expect(config.preset).toBe('typewriter');
      expect(config.speedCps).toBeDefined();
    });

    it('should create line focus config with educational opacity', () => {
      const presets = getApplicablePresets('code', 'code');
      const lineFocusPreset = presets.find((p) => p.id === 'lineFocus');

      expect(lineFocusPreset).toBeDefined();
      const config = lineFocusPreset!.makeDefault();
      expect(config.preset).toBe('lineFocus');
      expect(config.focusOpacity).toBeDefined();
      expect(config.activeLines).toBeDefined();
    });

    it('should create diff highlight config for educational changes', () => {
      const presets = getApplicablePresets('code', 'code');
      const diffPreset = presets.find((p) => p.id === 'diffHighlight');

      expect(diffPreset).toBeDefined();
      const config = diffPreset!.makeDefault();
      expect(config.preset).toBe('diffHighlight');
      expect(config.highlightColor).toBeDefined();
      expect(config.duration).toBeDefined();
    });
  });
});
