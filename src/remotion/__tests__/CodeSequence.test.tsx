import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CodeSequence } from '../CodeSequence';
import type { TimelineItem } from '../../lib/types';

// Mock Remotion hooks
vi.mock('remotion', () => ({
  AbsoluteFill: ({ children, style }: any) => (
    <div style={style} data-testid="absolute-fill">
      {children}
    </div>
  ),
  Sequence: ({ children, from, durationInFrames }: any) => (
    <div
      data-testid="sequence"
      data-from={from}
      data-duration={durationInFrames}
    >
      {children}
    </div>
  ),
  interpolate: vi.fn((frame, input, output) => {
    const progress = (frame - input[0]) / (input[1] - input[0]);
    return Math.max(0, Math.min(1, progress));
  }),
  useCurrentFrame: vi.fn(() => 30),
  useVideoConfig: vi.fn(() => ({ fps: 30 })),
}));

// Mock Prism and its components
vi.mock('prismjs', () => ({
  default: {
    highlight: vi.fn((code, grammar, language) => code),
    languages: {
      javascript: {},
      typescript: {},
      python: {},
      java: {},
      cpp: {},
      css: {},
      json: {},
      markup: {},
    },
  },
}));

// Mock Prism component imports
vi.mock('prismjs/components/prism-javascript', () => ({}));
vi.mock('prismjs/components/prism-typescript', () => ({}));
vi.mock('prismjs/components/prism-python', () => ({}));
vi.mock('prismjs/components/prism-java', () => ({}));
vi.mock('prismjs/components/prism-cpp', () => ({}));
vi.mock('prismjs/components/prism-css', () => ({}));
vi.mock('prismjs/components/prism-json', () => ({}));
vi.mock('prismjs/components/prism-markup', () => ({}));

describe('CodeSequence', () => {
  const mockItem: TimelineItem = {
    id: 'test-code-item',
    assetId: 'test-asset',
    startTime: 0,
    duration: 5,
    track: 0,
    type: 'code',
    properties: {
      text: 'console.log("Hello, World!");',
      language: 'javascript',
      theme: 'dark',
      fontSize: 16,
    },
    animations: [],
  };

  it('renders code sequence with default properties', () => {
    const { container } = render(
      <CodeSequence item={mockItem} startFrame={0} durationInFrames={150} />
    );

    expect(container).toBeInTheDocument();
    expect(container.querySelector('pre')).toBeInTheDocument();
    expect(container.querySelector('code')).toBeInTheDocument();
  });

  it('applies correct theme colors', () => {
    const { getByTestId } = render(
      <CodeSequence
        item={{
          ...mockItem,
          properties: {
            ...mockItem.properties,
            theme: 'light',
          },
        }}
        startFrame={0}
        durationInFrames={150}
      />
    );

    const codePanel = getByTestId('code-panel');
    expect(codePanel.style.backgroundColor).toBe('rgb(255, 255, 255)');
    expect(codePanel.style.color).toBe('rgb(36, 41, 46)');
  });

  it('applies correct font size', () => {
    const fontSize = 20;
    const { getByTestId } = render(
      <CodeSequence
        item={{
          ...mockItem,
          properties: {
            ...mockItem.properties,
            fontSize,
          },
        }}
        startFrame={0}
        durationInFrames={150}
      />
    );

    const codePanel = getByTestId('code-panel');
    expect(codePanel.style.fontSize).toBe(`${fontSize}px`);
  });

  it('applies transform properties correctly', () => {
    const { getByTestId } = render(
      <CodeSequence
        item={{
          ...mockItem,
          properties: {
            ...mockItem.properties,
            x: 100,
            y: 50,
            scale: 1.5,
            rotation: 45,
            opacity: 0.8,
          },
        }}
        startFrame={0}
        durationInFrames={150}
      />
    );

    const codePanel = getByTestId('code-panel');
    expect(codePanel.style.transform).toBe(
      'translate(100px, 50px) scale(1.5) rotate(45deg)'
    );
    expect(codePanel.style.opacity).toBe('0.8');
  });

  it('handles empty code content', () => {
    const { container } = render(
      <CodeSequence
        item={{
          ...mockItem,
          properties: {
            ...mockItem.properties,
            text: '',
          },
        }}
        startFrame={0}
        durationInFrames={150}
      />
    );

    expect(container).toBeInTheDocument();
    const codeElement = container.querySelector('code');
    expect(codeElement).toBeInTheDocument();
  });

  it('handles unsupported language gracefully', () => {
    const { container } = render(
      <CodeSequence
        item={{
          ...mockItem,
          properties: {
            ...mockItem.properties,
            language: 'unsupported-language',
          },
        }}
        startFrame={0}
        durationInFrames={150}
      />
    );

    expect(container).toBeInTheDocument();
    expect(container.querySelector('code')).toBeInTheDocument();
  });

  it('applies all available themes correctly', () => {
    const themes = ['dark', 'light', 'monokai', 'github', 'dracula'];

    themes.forEach((theme) => {
      const { getByTestId, unmount } = render(
        <CodeSequence
          item={{
            ...mockItem,
            properties: {
              ...mockItem.properties,
              theme,
            },
          }}
          startFrame={0}
          durationInFrames={150}
        />
      );

      const codePanel = getByTestId('code-panel');
      expect(codePanel.style.backgroundColor).toBeTruthy();

      // Clean up to prevent multiple elements in DOM
      unmount();
    });
  });
});
