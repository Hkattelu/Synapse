import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Inspector } from '../Inspector';
import type { TimelineItem } from '../../lib/types';

// Mock the hooks
const mockUpdateTimelineItem = vi.fn();
const mockGetMediaAssetById = vi.fn();

vi.mock('../../state/hooks', () => ({
  useTimeline: () => ({
    selectedTimelineItems: [mockCodeItem],
    updateTimelineItem: mockUpdateTimelineItem,
  }),
  useMediaAssets: () => ({
    getMediaAssetById: mockGetMediaAssetById,
  }),
}));

// Mock validation
vi.mock('../../lib/validation', () => ({
  validateItemProperties: vi.fn(() => ({ isValid: true, errors: [] })),
}));

const mockCodeItem: TimelineItem = {
  id: 'test-code-item',
  assetId: 'test-code-asset',
  startTime: 0,
  duration: 10,
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

const mockCodeAsset = {
  id: 'test-code-asset',
  name: 'Test Code Clip',
  type: 'code' as const,
  url: '',
  duration: 10,
  metadata: {
    fileSize: 0,
    mimeType: 'text/plain',
    codeContent: 'console.log("Hello, World!");',
    language: 'javascript',
  },
  createdAt: new Date(),
};

describe('Inspector - Code Properties', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetMediaAssetById.mockReturnValue(mockCodeAsset);
  });

  it('renders code properties section for code items', () => {
    render(<Inspector />);

    expect(screen.getByText('Code')).toBeInTheDocument();
    expect(screen.getByLabelText('Code Content')).toBeInTheDocument();
    expect(screen.getByLabelText('Language')).toBeInTheDocument();
    expect(screen.getByLabelText('Theme')).toBeInTheDocument();
    expect(screen.getByLabelText('Font Size')).toBeInTheDocument();
  });

  it('displays current code content in textarea', () => {
    render(<Inspector />);

    const codeTextarea = screen.getByLabelText('Code Content') as HTMLTextAreaElement;
    expect(codeTextarea.value).toBe('console.log("Hello, World!");');
    expect(codeTextarea.rows).toBe(8); // Should have more rows for code
  });

  it('updates code content when textarea changes', async () => {
    render(<Inspector />);

    const codeTextarea = screen.getByLabelText('Code Content');
    const newCode = 'function hello() {\n  return "Hello, World!";\n}';

    fireEvent.change(codeTextarea, { target: { value: newCode } });

    await waitFor(() => {
      expect(mockUpdateTimelineItem).toHaveBeenCalledWith(
        'test-code-item',
        {
          properties: expect.objectContaining({
            text: newCode,
          }),
        }
      );
    });
  });

  it('updates language selection', async () => {
    render(<Inspector />);

    const languageSelect = screen.getByLabelText('Language');
    fireEvent.change(languageSelect, { target: { value: 'python' } });

    await waitFor(() => {
      expect(mockUpdateTimelineItem).toHaveBeenCalledWith(
        'test-code-item',
        {
          properties: expect.objectContaining({
            language: 'python',
          }),
        }
      );
    });
  });

  it('updates theme selection', async () => {
    render(<Inspector />);

    const themeSelect = screen.getByLabelText('Theme');
    fireEvent.change(themeSelect, { target: { value: 'monokai' } });

    await waitFor(() => {
      expect(mockUpdateTimelineItem).toHaveBeenCalledWith(
        'test-code-item',
        {
          properties: expect.objectContaining({
            theme: 'monokai',
          }),
        }
      );
    });
  });

  it('updates font size', async () => {
    render(<Inspector />);

    const fontSizeInput = screen.getByLabelText('Font Size');
    fireEvent.change(fontSizeInput, { target: { value: '20' } });

    await waitFor(() => {
      expect(mockUpdateTimelineItem).toHaveBeenCalledWith(
        'test-code-item',
        {
          properties: expect.objectContaining({
            fontSize: 20,
          }),
        }
      );
    });
  });

  it('shows all supported languages in dropdown', () => {
    render(<Inspector />);

    const languageSelect = screen.getByLabelText('Language');
    const options = Array.from(languageSelect.querySelectorAll('option'));
    const optionValues = options.map(option => option.getAttribute('value'));

    expect(optionValues).toContain('javascript');
    expect(optionValues).toContain('typescript');
    expect(optionValues).toContain('python');
    expect(optionValues).toContain('java');
    expect(optionValues).toContain('cpp');
    expect(optionValues).toContain('html');
    expect(optionValues).toContain('css');
    expect(optionValues).toContain('json');
  });

  it('shows all supported themes in dropdown', () => {
    render(<Inspector />);

    const themeSelect = screen.getByLabelText('Theme');
    const options = Array.from(themeSelect.querySelectorAll('option'));
    const optionValues = options.map(option => option.getAttribute('value'));

    expect(optionValues).toContain('dark');
    expect(optionValues).toContain('light');
    expect(optionValues).toContain('monokai');
    expect(optionValues).toContain('github');
    expect(optionValues).toContain('dracula');
  });

  it('applies monospace font to code textarea', () => {
    render(<Inspector />);

    const codeTextarea = screen.getByLabelText('Code Content');
    const computedStyle = window.getComputedStyle(codeTextarea);
    
    // Check if monospace font family is applied
    expect(codeTextarea.style.fontFamily).toContain('Monaco');
  });

  it('validates font size input range', async () => {
    render(<Inspector />);

    const fontSizeInput = screen.getByLabelText('Font Size') as HTMLInputElement;
    
    // Test minimum value
    expect(fontSizeInput.min).toBe('8');
    // Test maximum value
    expect(fontSizeInput.max).toBe('48');
    // Test step
    expect(fontSizeInput.step).toBe('1');
  });
});