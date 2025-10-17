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

    // Project card is rendered with accessible name "Open project Alpha"
    const openCard = screen.getByRole('button', { name: /Open project Alpha/i });
    expect(openCard).toBeInTheDocument();
    fireEvent.click(openCard);
    expect(switchProject).toHaveBeenCalledWith('a');
  });
});
