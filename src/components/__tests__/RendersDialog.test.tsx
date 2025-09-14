import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import RendersDialog from '../../components/renders/RendersDialog';

// Mock useProject to provide a project id
vi.mock('../../state/hooks', async (orig) => {
  const mod = await orig();
  return {
    ...mod,
    useProject: () => ({ project: { id: 'proj-1', name: 'Demo' } }),
  };
});

// Mock api methods
vi.mock('../../lib/api', () => {
  return {
    api: {
      listRenders: async (projectId: string) => ({
        items: [
          {
            id: 'r1',
            filename: 'demo.mp4',
            publicUrl: '/downloads/demo.mp4',
            size: 1024 * 1024,
            createdAt: new Date().toISOString(),
          },
        ],
      }),
      deleteRender: async (id: string) => ({ ok: true }),
    },
  };
});

describe('RendersDialog', () => {
  it('lists render entries and shows actions', async () => {
    render(<RendersDialog isOpen={true} onClose={() => {}} />);

    await waitFor(() => screen.getByText(/demo\.mp4/i));
    expect(screen.getByText(/demo\.mp4/i)).toBeInTheDocument();
    // Buttons present
    expect(screen.getByRole('button', { name: /preview/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /download/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });
});
