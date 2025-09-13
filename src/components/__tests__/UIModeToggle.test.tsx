import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UIModeToggle } from '../UIModeToggle';
import { useUI } from '../../state/hooks';

// Mock the hooks
vi.mock('../../state/hooks', () => ({
  useUI: vi.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('UIModeToggle', () => {
  const mockSetUIMode = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useUI as any).mockReturnValue({
      ui: { mode: 'simplified' },
      setUIMode: mockSetUIMode,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders both mode buttons', () => {
    render(<UIModeToggle />);

    expect(screen.getByText('Simplified')).toBeInTheDocument();
    expect(screen.getByText('Advanced')).toBeInTheDocument();
  });

  it('highlights the current mode', () => {
    render(<UIModeToggle />);

    const simplifiedButton = screen.getByText('Simplified').closest('button');
    const advancedButton = screen.getByText('Advanced').closest('button');

    expect(simplifiedButton).toHaveClass('text-purple-600');
    expect(advancedButton).toHaveClass('text-white/70');
  });

  it('switches to advanced mode when clicked', () => {
    render(<UIModeToggle />);

    const advancedButton = screen.getByText('Advanced');
    fireEvent.click(advancedButton);

    expect(mockSetUIMode).toHaveBeenCalledWith('advanced');
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'synapse-ui-mode',
      'advanced'
    );
  });

  it('switches to simplified mode when clicked', () => {
    (useUI as any).mockReturnValue({
      ui: { mode: 'advanced' },
      setUIMode: mockSetUIMode,
    });

    render(<UIModeToggle />);

    const simplifiedButton = screen.getByText('Simplified');
    fireEvent.click(simplifiedButton);

    expect(mockSetUIMode).toHaveBeenCalledWith('simplified');
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'synapse-ui-mode',
      'simplified'
    );
  });

  it('handles localStorage errors gracefully', () => {
    localStorageMock.setItem.mockImplementation(() => {
      throw new Error('localStorage error');
    });

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(<UIModeToggle />);

    const advancedButton = screen.getByText('Advanced');
    fireEvent.click(advancedButton);

    expect(mockSetUIMode).toHaveBeenCalledWith('advanced');
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to save UI mode preference:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('applies custom className', () => {
    const { container } = render(<UIModeToggle className="custom-class" />);

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('shows correct tooltips', () => {
    render(<UIModeToggle />);

    const simplifiedButton = screen.getByText('Simplified').closest('button');
    const advancedButton = screen.getByText('Advanced').closest('button');

    expect(simplifiedButton).toHaveAttribute(
      'title',
      'Simplified Mode - Streamlined interface for educational content'
    );
    expect(advancedButton).toHaveAttribute(
      'title',
      'Advanced Mode - Full feature access with detailed controls'
    );
  });
});
