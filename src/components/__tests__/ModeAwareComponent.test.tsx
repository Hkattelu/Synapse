import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
  ModeAwareComponent,
  useFeatureVisibility,
  useModeClasses,
} from '../ModeAwareComponent';
import { useUI } from '../../state/hooks';
import { renderHook } from '@testing-library/react';

// Mock the hooks
vi.mock('../../state/hooks', () => ({
  useUI: vi.fn(),
}));

describe('ModeAwareComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('with simplified mode', () => {
    beforeEach(() => {
      (useUI as any).mockReturnValue({
        ui: { mode: 'simplified' },
      });
    });

    it('renders children when mode is "both"', () => {
      render(
        <ModeAwareComponent mode="both">
          <div>Test content</div>
        </ModeAwareComponent>
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('renders children when mode matches current mode', () => {
      render(
        <ModeAwareComponent mode="simplified">
          <div>Simplified content</div>
        </ModeAwareComponent>
      );

      expect(screen.getByText('Simplified content')).toBeInTheDocument();
    });

    it('does not render children when mode does not match', () => {
      render(
        <ModeAwareComponent mode="advanced">
          <div>Advanced content</div>
        </ModeAwareComponent>
      );

      expect(screen.queryByText('Advanced content')).not.toBeInTheDocument();
    });

    it('renders fallback when mode does not match and fallback is provided', () => {
      render(
        <ModeAwareComponent
          mode="advanced"
          fallback={<div>Fallback content</div>}
        >
          <div>Advanced content</div>
        </ModeAwareComponent>
      );

      expect(screen.queryByText('Advanced content')).not.toBeInTheDocument();
      expect(screen.getByText('Fallback content')).toBeInTheDocument();
    });

    it('applies className to wrapper', () => {
      const { container } = render(
        <ModeAwareComponent mode="both" className="test-class">
          <div>Test content</div>
        </ModeAwareComponent>
      );

      expect(container.firstChild).toHaveClass('test-class');
    });
  });

  describe('with advanced mode', () => {
    beforeEach(() => {
      (useUI as any).mockReturnValue({
        ui: { mode: 'advanced' },
      });
    });

    it('renders children when mode matches current mode', () => {
      render(
        <ModeAwareComponent mode="advanced">
          <div>Advanced content</div>
        </ModeAwareComponent>
      );

      expect(screen.getByText('Advanced content')).toBeInTheDocument();
    });

    it('does not render children when mode does not match', () => {
      render(
        <ModeAwareComponent mode="simplified">
          <div>Simplified content</div>
        </ModeAwareComponent>
      );

      expect(screen.queryByText('Simplified content')).not.toBeInTheDocument();
    });
  });
});

describe('useFeatureVisibility', () => {
  it('returns true for "both" mode regardless of current mode', () => {
    (useUI as any).mockReturnValue({
      ui: { mode: 'simplified' },
    });

    const { result } = renderHook(() => useFeatureVisibility('both'));
    expect(result.current).toBe(true);

    (useUI as any).mockReturnValue({
      ui: { mode: 'advanced' },
    });

    const { result: result2 } = renderHook(() => useFeatureVisibility('both'));
    expect(result2.current).toBe(true);
  });

  it('returns true when feature mode matches current mode', () => {
    (useUI as any).mockReturnValue({
      ui: { mode: 'simplified' },
    });

    const { result } = renderHook(() => useFeatureVisibility('simplified'));
    expect(result.current).toBe(true);
  });

  it('returns false when feature mode does not match current mode', () => {
    (useUI as any).mockReturnValue({
      ui: { mode: 'simplified' },
    });

    const { result } = renderHook(() => useFeatureVisibility('advanced'));
    expect(result.current).toBe(false);
  });
});

describe('useModeClasses', () => {
  it('returns simplified classes when in simplified mode', () => {
    (useUI as any).mockReturnValue({
      ui: { mode: 'simplified' },
    });

    const { result } = renderHook(() =>
      useModeClasses('simple-class', 'advanced-class')
    );
    expect(result.current).toBe('simple-class');
  });

  it('returns advanced classes when in advanced mode', () => {
    (useUI as any).mockReturnValue({
      ui: { mode: 'advanced' },
    });

    const { result } = renderHook(() =>
      useModeClasses('simple-class', 'advanced-class')
    );
    expect(result.current).toBe('advanced-class');
  });

  it('handles empty class strings', () => {
    (useUI as any).mockReturnValue({
      ui: { mode: 'simplified' },
    });

    const { result } = renderHook(() => useModeClasses());
    expect(result.current).toBe('');
  });
});
