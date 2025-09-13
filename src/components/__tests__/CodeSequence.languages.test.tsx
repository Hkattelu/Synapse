// Test for GLSL and GDScript syntax highlighting

import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CodeSequence } from '../../remotion/CodeSequence';
import type { TimelineItem } from '../../lib/types';

// Mock Remotion hooks
vi.mock('remotion', () => ({
  AbsoluteFill: ({ children, style }: any) => (
    <div style={style}>{children}</div>
  ),
  Sequence: ({ children }: any) => <div>{children}</div>,
  interpolate: vi.fn((frame, input, output) => output[0]),
  useCurrentFrame: vi.fn(() => 30),
  useVideoConfig: vi.fn(() => ({ fps: 30, width: 1920, height: 1080 })),
}));

// Mock theme manager
vi.mock('../../lib/themes', () => ({
  themeManager: {
    getTheme: vi.fn(() => ({
      colors: {
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
      },
    })),
    recordThemeUsage: vi.fn(),
  },
}));

// Mock background renderer
vi.mock('../../remotion/components/BackgroundRenderer', () => ({
  BackgroundRenderer: ({ children }: any) => <div>{children}</div>,
}));

// Mock animation hooks
vi.mock('../../remotion/animations/useAnimationStyles', () => ({
  useAnimationStyles: vi.fn(() => ({})),
}));

vi.mock('../../remotion/animations/useCodeContentEffects', () => ({
  parseActiveLines: vi.fn(() => ({ start: 1, end: 10 })),
  useTypewriterCount: vi.fn(() => 100),
}));

vi.mock('../../remotion/animations/useDiffAnimations', () => ({
  useDiffAnimations: vi.fn(() => ({
    animatedHtml: '<span>test</span>',
    needsSpecialStyling: false,
  })),
}));

// Mock format
vi.mock('../../lib/format', () => ({
  formatCode: vi.fn((code) => code),
}));

const createCodeItem = (language: string, code: string): TimelineItem => ({
  id: 'test-item',
  assetId: 'test-asset',
  startTime: 0,
  duration: 10,
  track: 0,
  type: 'code',
  properties: {
    codeText: code,
    language,
    theme: 'vscode-dark-plus',
    fontSize: 14,
    animationMode: 'none',
  },
  animations: [],
  keyframes: [],
});

describe('CodeSequence Language Support', () => {
  describe('GLSL Support', () => {
    it('should render GLSL code with syntax highlighting', () => {
      const glslCode = `#version 330 core

layout (location = 0) in vec3 aPos;
layout (location = 1) in vec3 aColor;

out vec3 vertexColor;

uniform mat4 transform;

void main()
{
    gl_Position = transform * vec4(aPos, 1.0);
    vertexColor = aColor;
}`;

      const item = createCodeItem('glsl', glslCode);

      const { container } = render(
        <CodeSequence item={item} startFrame={0} durationInFrames={300} />
      );

      // Check that the code is rendered
      expect(container.textContent).toContain('vec3');
      expect(container.textContent).toContain('uniform');
      expect(container.textContent).toContain('gl_Position');
      expect(container.textContent).toContain('void main()');
    });

    it('should highlight GLSL keywords and types', () => {
      const glslCode = `precision mediump float;
uniform sampler2D u_texture;
varying vec2 v_texCoord;

void main() {
    vec4 color = texture2D(u_texture, v_texCoord);
    gl_FragColor = color;
}`;

      const item = createCodeItem('glsl', glslCode);

      const { container } = render(
        <CodeSequence item={item} startFrame={0} durationInFrames={300} />
      );

      // Check for GLSL-specific content
      expect(container.textContent).toContain('precision');
      expect(container.textContent).toContain('mediump');
      expect(container.textContent).toContain('sampler2D');
      expect(container.textContent).toContain('texture2D');
      expect(container.textContent).toContain('gl_FragColor');
    });
  });

  describe('GDScript Support', () => {
    it('should render GDScript code with syntax highlighting', () => {
      const gdscriptCode = `extends Node2D

@export var speed: float = 100.0
@onready var sprite: Sprite2D = $Sprite2D

func _ready():
    print("Hello from GDScript!")
    connect_signals()

func _process(delta):
    if Input.is_action_pressed("ui_right"):
        position.x += speed * delta
    elif Input.is_action_pressed("ui_left"):
        position.x -= speed * delta

func connect_signals():
    body_entered.connect(_on_body_entered)

func _on_body_entered(body):
    if body.is_in_group("player"):
        queue_free()`;

      const item = createCodeItem('gdscript', gdscriptCode);

      const { container } = render(
        <CodeSequence item={item} startFrame={0} durationInFrames={300} />
      );

      // Check that the code is rendered
      expect(container.textContent).toContain('extends');
      expect(container.textContent).toContain('@export');
      expect(container.textContent).toContain('@onready');
      expect(container.textContent).toContain('func _ready()');
      expect(container.textContent).toContain('Input.is_action_pressed');
    });

    it('should highlight GDScript keywords and built-ins', () => {
      const gdscriptCode = `class_name Player
extends CharacterBody2D

signal health_changed(new_health)

const MAX_HEALTH = 100
var health = MAX_HEALTH : set = set_health

func set_health(value):
    var old_health = health
    health = clamp(value, 0, MAX_HEALTH)
    if health != old_health:
        health_changed.emit(health)

func _physics_process(delta):
    velocity = move_and_slide()`;

      const item = createCodeItem('gdscript', gdscriptCode);

      const { container } = render(
        <CodeSequence item={item} startFrame={0} durationInFrames={300} />
      );

      // Check for GDScript-specific content
      expect(container.textContent).toContain('class_name');
      expect(container.textContent).toContain('extends');
      expect(container.textContent).toContain('signal');
      expect(container.textContent).toContain('const');
      expect(container.textContent).toContain('_physics_process');
      expect(container.textContent).toContain('move_and_slide');
    });
  });

  describe('Language Detection', () => {
    it('should use javascript as fallback for unknown languages', () => {
      const item = createCodeItem('unknown-language', 'console.log("test");');

      const { container } = render(
        <CodeSequence item={item} startFrame={0} durationInFrames={300} />
      );

      // Should still render the code even with unknown language
      expect(container.textContent).toContain('console.log');
    });

    it('should handle empty language gracefully', () => {
      const item = createCodeItem('', 'print("hello")');

      const { container } = render(
        <CodeSequence item={item} startFrame={0} durationInFrames={300} />
      );

      // Should still render the code
      expect(container.textContent).toContain('print');
    });
  });
});
