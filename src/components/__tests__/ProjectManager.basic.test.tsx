import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProjectManager } from '../ProjectManager';
import { MemoryRouter } from 'react-router-dom';

const mockProjects = [
  {
    project: {
      id: 'a',
      name: 'Alpha',
      version: '1.0.0',
      timeline: [],
      mediaAssets: [],
      createdAt: new Date('2024-01-01'),
    },
    lastOpened: new Date('2024-06-01'),
  },
];

const switchProject = vi.fn();
const deleteProject = vi.fn();
const duplicateProject = vi.fn();
const renameProject = vi.fn();
const exportProject = vi.fn();
const importProject = vi.fn();

vi.mock('../../state/hooks', () => ({
  useProject: () => ({
    projects: mockProjects,
    switchProject,
    deleteProject,
    duplicateProject,
    renameProject,
    exportProject,
    importProject,
  }),
}));

describe('ProjectManager (basic)', () => {
  it('renders project card and triggers open on button click', () => {
    render(
      <MemoryRouter>
        <ProjectManager />
      </MemoryRouter>
    );

    expect(screen.getByText('Your Projects')).toBeInTheDocument();
    expect(screen.getByText('Alpha')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Open Project/i }));
    expect(switchProject).toHaveBeenCalledWith('a');
  });
});
