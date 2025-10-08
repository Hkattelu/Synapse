import { vi } from 'vitest';
// Mock auth to avoid real network I/O in tests (must be declared before imports that consume it)
vi.mock('../state/authContext', () => ({
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
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExportDialog } from '../components/ExportDialog';
import { ExportProvider } from '../state/exportContext';
import { AppProvider } from '../state/context';
import { UploadManagerProvider } from '../state/uploadManager';
import {
  exportManager,
  DEFAULT_EXPORT_PRESETS,
  getDefaultExportSettings,
  formatFileSize,
  formatDuration,
  estimateFileSize,
} from '../lib/exportManager';
import type { Project } from '../lib/types';

// Mock Remotion modules
vi.mock('@remotion/bundler', () => ({
  bundle: vi.fn(() => Promise.resolve('/mock/bundle/path')),
}));

vi.mock('@remotion/renderer', () => ({
  renderMedia: vi.fn(() => Promise.resolve()),
  getCompositions: vi.fn(() =>
    Promise.resolve([
      {
        id: 'MainComposition',
        width: 1920,
        height: 1080,
        fps: 30,
        durationInFrames: 900,
      },
    ])
  ),
}));

// Mock fs module
vi.mock('fs', () => ({
  promises: {
    mkdir: vi.fn(() => Promise.resolve()),
    stat: vi.fn(() => Promise.resolve({ size: 10485760 })), // 10MB
  },
}));

// Create a mock project
const mockProject: Project = {
  id: 'test-project',
  name: 'Test Project',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
  timeline: [
    {
      id: 'clip1',
      assetId: 'asset1',
      startTime: 0,
      duration: 5,
      track: 0,
      type: 'title',
      properties: { text: 'Hello World' },
      animations: [],
      keyframes: [],
    },
  ],
  mediaAssets: [
    {
      id: 'asset1',
      name: 'Title Asset',
      type: 'code',
      url: '',
      metadata: { fileSize: 1024, mimeType: 'text/plain' },
      createdAt: new Date('2024-01-01'),
    },
  ],
  settings: {
    width: 1920,
    height: 1080,
    fps: 30,
    duration: 30,
    backgroundColor: '#000000',
  },
  version: '1.0.0',
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AppProvider>
    <UploadManagerProvider>
      <ExportProvider>{children}</ExportProvider>
    </UploadManagerProvider>
  </AppProvider>
);

describe('Export System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Export Manager', () => {
    it('should create default export settings', () => {
      const settings = getDefaultExportSettings(mockProject);

      expect(settings).toMatchObject({
        format: 'mp4',
        codec: 'h264',
        quality: 'high',
        width: 1920,
        height: 1080,
        fps: 30,
        audioCodec: 'aac',
      });
    });

    it('should provide default export presets (including vertical)', () => {
      expect(DEFAULT_EXPORT_PRESETS.length).toBeGreaterThanOrEqual(6);
      expect(DEFAULT_EXPORT_PRESETS[0]).toMatchObject({
        id: 'youtube-1080p',
        name: 'YouTube 1080p',
        category: 'web',
        isDefault: true,
      });
      // Verify a vertical preset exists
      expect(
        DEFAULT_EXPORT_PRESETS.some(
          (p: { id: string }) => p.id === 'vertical-1080x1920'
        )
      ).toBe(true);
    });

    it('should format file size correctly', () => {
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(1048576)).toBe('1.0 MB');
      expect(formatFileSize(1073741824)).toBe('1.0 GB');
    });

    it('should format duration correctly', () => {
      expect(formatDuration(65)).toBe('1:05');
      expect(formatDuration(3665)).toBe('1:01:05');
    });

    it('should estimate file size', () => {
      const settings = getDefaultExportSettings(mockProject);
      const estimatedSize = estimateFileSize(settings, 30);

      expect(estimatedSize).toBeGreaterThan(0);
      expect(typeof estimatedSize).toBe('number');
    });
  });

  describe('Export Dialog', () => {
    it('should render export dialog when open', () => {
      render(
        <TestWrapper>
          <ExportDialog isOpen={true} onClose={() => {}} />
        </TestWrapper>
      );

      expect(screen.getByText('Export Video')).toBeInTheDocument();
      expect(
        screen.getAllByText((content, element) =>
          (element?.textContent || '').includes(
            'Export "Test Project" as video'
          )
        ).length
      ).toBeGreaterThan(0);
    });

    it('should not render when closed', () => {
      render(
        <TestWrapper>
          <ExportDialog isOpen={false} onClose={() => {}} />
        </TestWrapper>
      );

      expect(screen.queryByText('Export Video')).not.toBeInTheDocument();
    });

    it('should display export presets', () => {
      render(
        <TestWrapper>
          <ExportDialog isOpen={true} onClose={() => {}} />
        </TestWrapper>
      );

      expect(screen.getByText('YouTube 1080p')).toBeInTheDocument();
      expect(screen.getByText('Twitter/X 720p')).toBeInTheDocument();
      expect(screen.getByText('Instagram Square')).toBeInTheDocument();
    });

    it('should switch between presets and custom settings tabs', () => {
      render(
        <TestWrapper>
          <ExportDialog isOpen={true} onClose={() => {}} />
        </TestWrapper>
      );

      const customTab = screen.getByText('Custom Settings');
      fireEvent.click(customTab);

      expect(screen.getByText('Video Settings')).toBeInTheDocument();
      expect(screen.getByText('Audio Settings')).toBeInTheDocument();
    });

    it('should display estimated file size and duration', () => {
      render(
        <TestWrapper>
          <ExportDialog isOpen={true} onClose={() => {}} />
        </TestWrapper>
      );

      expect(screen.getByText(/Estimated file size:/)).toBeInTheDocument();
      expect(screen.getByText(/Duration:/)).toBeInTheDocument();
    });

    it('should close dialog when cancel is clicked', () => {
      const onClose = vi.fn();
      render(
        <TestWrapper>
          <ExportDialog isOpen={true} onClose={onClose} />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Cancel'));
      expect(onClose).toHaveBeenCalled();
    });

    // Selection and value propagation to context are covered in component tests.
  });

  describe('Export Process', () => {
    it('should start export process', async () => {
      const { bundle } = await import('@remotion/bundler');
      const { renderMedia } = await import('@remotion/renderer');

      const settings = getDefaultExportSettings(mockProject);

      // Mock successful export
      vi.mocked(bundle).mockResolvedValue('/mock/bundle');
      vi.mocked(renderMedia).mockResolvedValue({} as any);

      const exportPromise = exportManager.startExport(mockProject, settings);

      expect(exportManager.isCurrentlyExporting()).toBe(true);

      await exportPromise;

      expect(bundle).toHaveBeenCalled();
      expect(renderMedia).toHaveBeenCalled();
    });

    it('should handle export errors', async () => {
      const { bundle } = await import('@remotion/bundler');

      vi.mocked(bundle).mockRejectedValue(new Error('Bundle failed'));

      const settings = getDefaultExportSettings(mockProject);

      await expect(
        exportManager.startExport(mockProject, settings)
      ).rejects.toThrow('Export failed: Bundle failed');
    });

    it('should track export progress', async () => {
      const progressCallback = vi.fn();
      exportManager.setProgressCallback(progressCallback);

      const { bundle } = await import('@remotion/bundler');
      const { renderMedia } = await import('@remotion/renderer');

      vi.mocked(bundle).mockResolvedValue('/mock/bundle');
      vi.mocked(renderMedia).mockImplementation(
        async (options: {
          onProgress?: (p: {
            renderedFrames: number;
            encodedFrames: number;
          }) => void;
        }): Promise<void> => {
          // Simulate progress callback
          options.onProgress?.({ renderedFrames: 450, encodedFrames: 450 });
          return Promise.resolve();
        }
      );

      const settings = getDefaultExportSettings(mockProject);
      await exportManager.startExport(mockProject, settings);

      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'preparing',
          progress: 0,
        })
      );

      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
          progress: 100,
        })
      );
    });

    it('should cancel export', () => {
      const progressCallback = vi.fn();
      exportManager.setProgressCallback(progressCallback);

      // Start a mock export
      const job = {
        id: 'test-job',
        projectId: mockProject.id,
        projectName: mockProject.name,
        settings: getDefaultExportSettings(mockProject),
        progress: { status: 'rendering' as const, progress: 50 },
        createdAt: new Date(),
        retryCount: 0,
        maxRetries: 3,
      };

      // Simulate active export
      type MinimalJob = {
        id: string;
        projectId: string;
        projectName: string;
        settings: ReturnType<typeof getDefaultExportSettings>;
        progress: { status: 'rendering'; progress: number };
        createdAt: Date;
        retryCount: number;
        maxRetries: number;
      };
      (
        exportManager as unknown as {
          currentJob: MinimalJob | null;
          isExporting: boolean;
        }
      ).currentJob = job as MinimalJob;
      (
        exportManager as unknown as {
          currentJob: MinimalJob | null;
          isExporting: boolean;
        }
      ).isExporting = true;

      exportManager.cancelExport();

      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'cancelled',
        })
      );
    });
  });

  describe('Export Context', () => {
    it('should provide export state and actions', () => {
      render(
        <TestWrapper>
          <div data-testid="test">Test</div>
        </TestWrapper>
      );

      // The context should be available without throwing
      expect(screen.getByTestId('test')).toBeInTheDocument();
    });
  });
});
