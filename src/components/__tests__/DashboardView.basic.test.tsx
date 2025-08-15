import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DashboardView } from '../DashboardView';

const createProject = vi.fn();
const setCurrentView = vi.fn();

vi.mock('../../state/hooks', () => ({
  useProject: () => ({ project: null, projects: [], createProject }),
  useUI: () => ({ setCurrentView }),
}));

describe('DashboardView (basic)', () => {
  it('shows create project call-to-action and can open form', () => {
    render(<DashboardView />);

    const cta = screen.getByRole('button', { name: /Create New Project/i });
    expect(cta).toBeInTheDocument();

    fireEvent.click(cta);
    expect(screen.getByText(/Create New Project/i)).toBeInTheDocument();
  });
});
