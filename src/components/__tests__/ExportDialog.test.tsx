import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExportDialog } from '../ExportDialog';
vi.mock('../../state/authContext', () => ({
  useAuth: () => ({
    authenticated: true,
    membership: { active: true },
    login: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn(),
    donateDemo: vi.fn(),
    loading: false,
    error: undefined,
  }),
}));

vi.mock('../../state/hooks', () => ({
  useProject: () => ({
    project: {
      id: 'p1',
      name: 'Demo Project',
      settings: { width: 1920, height: 1080, duration: 120 },
    },
  }),
}));

const startExport = vi.fn();
const cancelExport = vi.fn();
const getEstimatedFileSize = vi.fn(() => 1024 * 1024 * 50);

vi.mock('../../state/exportContext', () => ({
  useExport: () => ({ startExport, cancelExport, getEstimatedFileSize }),
  useExportSettings: () => ({
    settings: {
      format: 'mp4',
      codec: 'h264',
      quality: 'high',
      width: undefined,
      height: undefined,
      audioCodec: 'aac',
      audioBitrate: 128,
    },
    presets: [
      {
        id: 'youtube-1080p',
        name: 'YouTube 1080p',
        description: 'Best for YouTube at 1080p',
        settings: { format: 'mp4', quality: 'high', width: 1920, height: 1080 },
      },
      {
        id: 'web-720p',
        name: 'Web 720p',
        description: 'Smaller size 720p',
        settings: { format: 'mp4', quality: 'medium', width: 1280, height: 720 },
      },
    ],
    updateSettings: vi.fn(),
    applyPreset: vi.fn(),
  }),
  useExportStatus: () => ({ isExporting: false, progress: null, canStartExport: true }),
}));

describe('ExportDialog', () => {
  beforeEach(() => {
    startExport.mockClear();
    cancelExport.mockClear();
    getEstimatedFileSize.mockClear();
  });

  it('renders when open and shows project name and estimated size', () => {
    render(<ExportDialog isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('Export Video')).toBeInTheDocument();
    expect(screen.getByText(/Export "Demo Project"/)).toBeInTheDocument();
    // Estimated file size 50 MB
    expect(screen.getByText(/50.0 MB/)).toBeInTheDocument();
    // Duration (mm:ss)
    expect(screen.getByText('2:00')).toBeInTheDocument();
  });

  it('starts export when Start Export is clicked', async () => {
    const onClose = vi.fn();
    render(<ExportDialog isOpen={true} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: /Start Export/i }));
    expect(startExport).toHaveBeenCalledTimes(1);
  });

  it('can switch to Custom Settings tab', () => {
    render(<ExportDialog isOpen={true} onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /Custom Settings/i }));

    // Check for selects and inputs exist (labels are not programmatically associated)
    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBeGreaterThanOrEqual(3);
    const numberInputs = screen.getAllByRole('spinbutton');
    expect(numberInputs.length).toBeGreaterThanOrEqual(3);
  });
});
