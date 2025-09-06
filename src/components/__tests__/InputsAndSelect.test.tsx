import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../ui/Select';

describe('UI Primitives: Input, Label, Select', () => {
  it('Input forwards props and merges classes', () => {
    render(<Input placeholder="Email" className="test-class" />);
    const el = screen.getByPlaceholderText('Email') as HTMLInputElement;
    expect(el).toBeInTheDocument();
    expect(el.className).toMatch(/test-class/);
  });

  it('Label renders children and className', () => {
    render(
      <Label className="my-1" htmlFor="x">
        Name
      </Label>
    );
    const el = screen.getByText('Name');
    expect(el.tagName).toBe('LABEL');
    expect(el).toHaveAttribute('for', 'x');
    expect(el.className).toMatch(/my-1/);
  });

  it('Select composition renders trigger, value, content, and items', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Pick one" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">A</SelectItem>
          <SelectItem value="b">B</SelectItem>
        </SelectContent>
      </Select>
    );

    expect(screen.getByText('Pick one')).toBeInTheDocument();
    expect(screen.getByText('A')).toHaveAttribute('data-value', 'a');
    expect(screen.getByText('B')).toHaveAttribute('data-value', 'b');
  });
});
