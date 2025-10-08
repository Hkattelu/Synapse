import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VisualControlsTabs } from '../ui/VisualControlsTabs';

// Mock PreviewPanel to avoid heavy rendering
vi.mock('../ui/PreviewPanel', () => ({
  PreviewPanel: (props: any) => <div data-testid="preview" {...props} />,
}));

// Mock ThemePicker (not used for video tab)
vi.mock('../ui/ThemePicker', () => ({
  ThemePicker: (props: any) => <div data-testid="theme-picker" {...props} />,
}));

describe('VisualControlsTabs - Talking Head for video', () => {
  const baseItem = {
    type: 'video',
    properties: {},
  } as any;

  const noop = () => {};

  it('opens the Talking Head tab by default for video items', () => {
    render(<VisualControlsTabs item={baseItem} onUpdateProperties={noop} />);

    // Talking Head content should be visible without clicking
    // We show the Position control in the talking head tab
    expect(screen.getByText('Position')).toBeInTheDocument();
  });

  it('renders a 3x3 grid of position buttons and no Backgrounds tab', () => {
    render(<VisualControlsTabs item={baseItem} onUpdateProperties={noop} />);

    const positions = [
      'top left',
      'top center',
      'top right',
      'left center',
      'center',
      'right center',
      'bottom left',
      'bottom center',
      'bottom right',
    ];

    positions.forEach((label) => {
      // Buttons render visible text as lowercased with spaces
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    });

    // Backgrounds tab should not exist anymore
    expect(screen.queryByText('Backgrounds')).toBeNull();
  });
});