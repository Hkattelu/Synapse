import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExportDialog } from '../components/ExportDialog';
import { ExportProvider } from '../state/exportContext';
import { AppProvider } from '../state/context';

// Mock auth so the Start Export button is enabled in tests
vi.mock('../state/authContext', () => ({
  useAuth: () => ({
    authenticated: true,
    membership: { active: true, trialUsed: 0, trialLimit: 2 },
    login: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn(),
    donateDemo: vi.fn(),
    loading: false,
    error: undefined,
  }),
}));

// Mock the active project
vi.mock('../state/hooks', () => ({
  useProject: () => ({
    project: {
      id: 'p-e2e',
      name: 'E2E Project',
      settings: { width: 1920, height: 1080, fps: 30, duration: 10, backgroundColor: '#000' },
      timeline: [],
      mediaAssets: [],
    },
  }),
}));

// Spy on browser download helper
import * as ExportClientModule from '../lib/exportManagerClient';

// Mock API used by ClientExportManager to orchestrate renders
let getStatusCall = 0;
vi.mock('../lib/api', () => {
  class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
    }
  }
  return {
    ApiError,
    api: {
      startRender: vi.fn(async () => ({ jobId: 'job-1' })),
      getRenderStatus: vi.fn(async () => {
        // Simulate a few polling steps
        getStatusCall++;
        if (getStatusCall < 2) {
          return { status: 'rendering', progress: 15, renderedFrames: 45, totalFrames: 300 };
        }
        if (getStatusCall < 3) {
          return { status: 'rendering', progress: 60, renderedFrames: 180, totalFrames: 300 };
        }
        return { status: 'completed' };
      }),
      cancelExportJob: vi.fn(async () => ({ ok: true })),
      renderDownloadUrl: vi.fn((id: string) => `/api/render/${id}/download`),
    },
  };
});

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AppProvider>
    <ExportProvider>{children}</ExportProvider>
  </AppProvider>
);

describe('Export end-to-end flow', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    getStatusCall = 0;
  });

  afterEach(() => {
    // Cleanup potential globals
    // @ts-expect-error test cleanup
    delete (globalThis as any).window?.SynapseFS;
    vi.clearAllMocks();
  });

  it('triggers a browser download after export completes', async () => {
    const downloadSpy = vi.spyOn(ExportClientModule, 'downloadExportedFile').mockImplementation(() => {});

    render(
      <Wrapper>
        <ExportDialog isOpen={true} onClose={() => {}} />
      </Wrapper>
    );

    // Kick off export
    const startBtn = screen.getByRole('button', { name: /Start Export/i });
    fireEvent.click(startBtn);

    // Wait for completion UI
    await waitFor(() => expect(screen.getByText(/Export completed successfully/i)).toBeInTheDocument(), { timeout: 10_000 });

    // The dialog auto-triggers a download exactly once
    await waitFor(() => expect(downloadSpy).toHaveBeenCalledTimes(1));
    const [hrefArg, nameArg] = downloadSpy.mock.calls[0];
    expect(String(hrefArg)).toMatch(/\/api\/render\/job-1\/download$/);
    // Suggested filename should have an extension
    expect(String(nameArg)).toMatch(/\.\w+$/);
  });

  it('uses Electron save dialog when available and writes file', async () => {
    // Mock Electron SynapseFS API on window
    const writeFile = vi.fn(async () => true as const);
    const showSaveDialog = vi.fn(async () => 'C:/Users/test/Downloads/e2e-video.mp4');

    // @ts-expect-error define minimal window
    if (!globalThis.window) (globalThis as any).window = {};
    // @ts-expect-error assign mock
    (window as any).SynapseFS = {
      showSaveDialog,
      writeFile,
    };

    // Mock fetch for the outputUrl to provide content
    const buf = new Uint8Array([1, 2, 3, 4]).buffer;
    const fetchMock = vi.spyOn(globalThis, 'fetch' as any).mockResolvedValue({
      arrayBuffer: async () => buf,
    } as any);

    // Also spy on browser helper to ensure it is NOT called in Electron branch
    const downloadSpy = vi.spyOn(ExportClientModule, 'downloadExportedFile').mockImplementation(() => {});

    render(
      <Wrapper>
        <ExportDialog isOpen={true} onClose={() => {}} />
      </Wrapper>
    );

    // Reset baseline to ignore unrelated initial fetches in the app
    fetchMock.mockClear();

    fireEvent.click(screen.getByRole('button', { name: /Start Export/i }));

    await waitFor(() => expect(screen.getByText(/Export completed successfully/i)).toBeInTheDocument(), { timeout: 10_000 });

    // Electron path should invoke save dialog and write file, not browser download
    await waitFor(() => expect(showSaveDialog).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalled();
    expect(writeFile).toHaveBeenCalledTimes(1);
    expect(downloadSpy).not.toHaveBeenCalled();
  });
});
