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
const mockUpdateSettings = vi.fn();
const mockApplyPreset = vi.fn();

vi.mock('../../lib/flags', () => ({ FLAGS: { ALLOW_ANON_EXPORT: false } }));

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
        settings: {
          format: 'mp4',
          quality: 'medium',
          width: 1280,
          height: 720,
        },
      },
      {
        id: 'vertical-1080x1920',
        name: 'Vertical 1080×1920',
        description: 'Portrait Full HD',
        settings: { format: 'mp4', quality: 'high', width: 1080, height: 1920 },
      },
    ],
    updateSettings: mockUpdateSettings,
    applyPreset: mockApplyPreset,
  }),
  useExportStatus: () => ({
    isExporting: false,
    progress: null,
    canStartExport: true,
  }),
}));

vi.mock('../../state/uploadManager', () => ({
  useUploadManager: () => ({
    counts: { total: 0, inProgress: 0, failed: 0, completed: 0 },
    inProgress: [],
    failed: [],
    showPanel: vi.fn(),
    setAutoExportWhenReady: vi.fn(),
    allUploaded: true,
  }),
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
    // Duration (mm:ss) - allow duplication or combined text nodes
    expect(
      screen.getAllByText((content, element) =>
        (element?.textContent || '').includes('2:00')
      ).length
    ).toBeGreaterThan(0);
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

  it('supports Vertical mode toggle and custom resolution entry', () => {
    render(<ExportDialog isOpen={true} onClose={vi.fn()} />);

    // Go to Custom Settings
    fireEvent.click(screen.getByRole('button', { name: /Custom Settings/i }));

    // Orientation toggle should be present showing Landscape initially
    const orientationBtn = screen.getByRole('button', {
      name: /Landscape \(16:9\)/i,
    });
    fireEvent.click(orientationBtn);

    // Toggling should call updateSettings with portrait defaults
    expect(mockUpdateSettings).toHaveBeenCalledWith({
      width: 1080,
      height: 1920,
    });

    // Enter a custom size via inputs
    const spinboxes = screen.getAllByRole('spinbutton');
    const widthInput = spinboxes[0];
    const heightInput = spinboxes[1];
    fireEvent.change(widthInput, { target: { value: '720' } });
    fireEvent.change(heightInput, { target: { value: '1280' } });
    expect(mockUpdateSettings).toHaveBeenCalledWith({ width: 720 });
    expect(mockUpdateSettings).toHaveBeenCalledWith({ height: 1280 });
  });

  it('shows vertical presets and applies them from Presets tab', () => {
    render(<ExportDialog isOpen={true} onClose={vi.fn()} />);

    // Presets tab is default; click vertical card
    fireEvent.click(screen.getByText('Vertical 1080×1920'));
    expect(mockApplyPreset).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'vertical-1080x1920' })
    );
  });
});
