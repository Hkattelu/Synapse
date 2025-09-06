import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '../ui/Button';

describe('Button (UI)', () => {
  it('renders with default variant and size', () => {
    render(<Button>Click me</Button>);
    const btn = screen.getByRole('button', { name: /click me/i });
    expect(btn.className).toMatch(/bg-blue-600/);
    expect(btn.className).toMatch(/px-4 py-2/);
  });

  it('supports outline + sm and disabled', () => {
    render(
      <Button variant="outline" size="sm" disabled>
        Outline
      </Button>
    );
    const btn = screen.getByRole('button', { name: /outline/i });
    expect(btn).toBeDisabled();
    expect(btn.className).toMatch(/border-gray-300/);
    expect(btn.className).toMatch(/px-3 py-2/);
  });
});
