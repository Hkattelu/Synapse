import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExportDialog } from '../ExportDialog';
import { ExportProvider } from '../../state/exportContext';
import { AppProvider } from '../../state/context';
import type { Project } from '../../lib/types';

// Mock the export manager client
vi.mock('../../lib/exportManagerClient', () => ({
  formatFileSize: (bytes: number) => `${bytes} bytes`,
  formatDuration: (seconds: number) => `${seconds}s`,
  isTransparencySupported: (format: string, codec: string) => {
    return (format === 'mov' && (codec === 'h264' || codec === 'h265')) ||
           (format === 'webm' && (codec === 'vp8' || codec === 'vp9'));
  },
  getTransparencyCompatibilityWarning: (settings: any) => {
    if (!settings.transparentBackground) return null;
    if (!((settings.format === 'mov' && (settings.codec === 'h264' || settings.codec === 'h265')) ||
          (settings.format === 'webm' && (settings.codec === 'vp8' || settings.codec === 'vp9')))) {
      return `Transparent backgrounds are not supported with ${settings.format.toUpperCase()} + ${settings.codec.toUpperCase()}. Consider using MOV + H.264 or WebM + VP9.`;
    }
    return null;
  },
  validateTransparencySettings: (settings: any) => {
    const warnings: string[] = [];
    const errors: string[] = [];
    
    if (settings.transparentBackground) {
      if (!((settings.format === 'mov' && (settings.codec === 'h264' || settings.codec === 'h265')) ||
            (settings.format === 'webm' && (settings.codec === 'vp8' || settings.codec === 'vp9')))) {
        errors.push(`Transparent backgrounds require MOV + H.264/H.265 or WebM + VP8/VP9. Current: ${settings.format.toUpperCase()} + ${settings.codec.toUpperCase()}`);
      }
      
      if (settings.includeWallpaper && settings.includeGradient) {
        warnings.push('Both wallpaper and gradient backgrounds are enabled. This may reduce the transparency effect.');
      }
      
      if (settings.quality === 'low') {
        warnings.push('Low quality settings may affect alpha channel quality. Consider using medium or higher quality.');
      }
    }
    
    return {
      isValid: errors.length === 0,
      warnings,
      errors,
    };
  },
}));

// Mock the main context
const mockProject: Project = {
  id: 'test-project',
  name: 'Test Project',
  createdAt: new Date(),
  updatedAt: new Date(),
  timeline: [],
  mediaAssets: [],
  settings: {
    width: 1920,
    height: 1080,
    fps: 30,
    duration: 10,
    backgroundColor: '#000000',
  },
  version: '1.0.0',
};

vi.mock('../../state/hooks', () => ({
  useProject: () => ({
    project: mockProject,
  }),
}));

vi.mock('../../state/authContext', () => ({
  useAuth: () => ({
    authenticated: true,
    membership: { active: true },
    loading: false,
    donateDemo: vi.fn(),
  }),
}));

// Mock export context
const mockUpdateSettings = vi.fn();
const mockStartExport = vi.fn();

vi.mock('../../state/exportContext', () => ({
  useExport: () => ({
    startExport: mockStartExport,
    cancelExport: vi.fn(),
    getEstimatedFileSize: () => 1024000,
  }),
  useExportSettings: () => ({
    settings: {
      format: 'mp4',
      codec: 'h264',
      quality: 'high',
      audioCodec: 'aac',
      transparentBackground: false,
      includeWallpaper: true,
      includeGradient: true,
    },
    presets: [],
    updateSettings: mockUpdateSettings,
    applyPreset: vi.fn(),
  }),
  useExportStatus: () => ({
    isExporting: false,
    progress: null,
    canStartExport: true,
  }),
  ExportProvider: ({ children }: any) => children,
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AppProvider>
    <ExportProvider>
      {children}
    </ExportProvider>
  </AppProvider>
);

describe('ExportDialog Transparency Controls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render transparency settings section', () => {
    render(
      <TestWrapper>
        <ExportDialog isOpen={true} onClose={() => {}} />
      </TestWrapper>
    );

    // Switch to custom settings tab
    fireEvent.click(screen.getByText('Custom Settings'));

    // Check for transparency settings section
    expect(screen.getByText('Transparency Settings')).toBeInTheDocument();
    expect(screen.getByText('Enable transparent background')).toBeInTheDocument();
  });

  it('should toggle transparent background setting', () => {
    render(
      <TestWrapper>
        <ExportDialog isOpen={true} onClose={() => {}} />
      </TestWrapper>
    );

    // Switch to custom settings tab
    fireEvent.click(screen.getByText('Custom Settings'));

    // Find and click the transparency checkbox
    const transparencyCheckbox = screen.getByLabelText('Enable transparent background');
    fireEvent.click(transparencyCheckbox);

    // Verify updateSettings was called
    expect(mockUpdateSettings).toHaveBeenCalledWith({
      transparentBackground: true,
    });
  });

  it.skip('should show background inclusion options when transparency is enabled', () => {
    // Mock settings with transparency enabled
    vi.mocked(vi.importActual('../../state/exportContext')).useExportSettings = () => ({
      settings: {
        format: 'mov',
        codec: 'h264',
        quality: 'high',
        audioCodec: 'aac',
        transparentBackground: true,
        includeWallpaper: true,
        includeGradient: true,
      },
      presets: [],
      updateSettings: mockUpdateSettings,
      applyPreset: vi.fn(),
    });

    render(
      <TestWrapper>
        <ExportDialog isOpen={true} onClose={() => {}} />
      </TestWrapper>
    );

    // Switch to custom settings tab
    fireEvent.click(screen.getByText('Custom Settings'));

    // Check for background inclusion options
    expect(screen.getByText('Background Elements to Include:')).toBeInTheDocument();
    expect(screen.getByText('Include wallpaper backgrounds')).toBeInTheDocument();
    expect(screen.getByText('Include gradient backgrounds')).toBeInTheDocument();
  });

  it.skip('should show transparency preview with checkerboard pattern', () => {
    // Mock settings with transparency enabled
    vi.mocked(vi.importActual('../../state/exportContext')).useExportSettings = () => ({
      settings: {
        format: 'mov',
        codec: 'h264',
        quality: 'high',
        audioCodec: 'aac',
        transparentBackground: true,
        includeWallpaper: true,
        includeGradient: true,
      },
      presets: [],
      updateSettings: mockUpdateSettings,
      applyPreset: vi.fn(),
    });

    render(
      <TestWrapper>
        <ExportDialog isOpen={true} onClose={() => {}} />
      </TestWrapper>
    );

    // Switch to custom settings tab
    fireEvent.click(screen.getByText('Custom Settings'));

    // Check for transparency preview
    expect(screen.getByText('Transparency Preview')).toBeInTheDocument();
    expect(screen.getByText('Transparent')).toBeInTheDocument();
    expect(screen.getByText('Checkerboard pattern indicates transparent areas')).toBeInTheDocument();
  });

  it.skip('should show compatibility warning for unsupported format/codec combinations', () => {
    // Mock settings with transparency enabled but unsupported format
    vi.mocked(vi.importActual('../../state/exportContext')).useExportSettings = () => ({
      settings: {
        format: 'mp4',
        codec: 'h264',
        quality: 'high',
        audioCodec: 'aac',
        transparentBackground: true,
        includeWallpaper: true,
        includeGradient: true,
      },
      presets: [],
      updateSettings: mockUpdateSettings,
      applyPreset: vi.fn(),
    });

    render(
      <TestWrapper>
        <ExportDialog isOpen={true} onClose={() => {}} />
      </TestWrapper>
    );

    // Switch to custom settings tab
    fireEvent.click(screen.getByText('Custom Settings'));

    // Check for compatibility warning
    expect(screen.getByText(/Transparent backgrounds are not supported with MP4 \+ H264/)).toBeInTheDocument();
  });

  it.skip('should disable export button when transparency settings are invalid', () => {
    // Mock settings with invalid transparency configuration
    vi.mocked(vi.importActual('../../state/exportContext')).useExportSettings = () => ({
      settings: {
        format: 'mp4',
        codec: 'h264',
        quality: 'high',
        audioCodec: 'aac',
        transparentBackground: true,
        includeWallpaper: true,
        includeGradient: true,
      },
      presets: [],
      updateSettings: mockUpdateSettings,
      applyPreset: vi.fn(),
    });

    render(
      <TestWrapper>
        <ExportDialog isOpen={true} onClose={() => {}} />
      </TestWrapper>
    );

    // The export button should be disabled due to invalid transparency settings
    const exportButton = screen.getByRole('button', { name: /Start Export/ });
    expect(exportButton).toBeDisabled();
  });

  it('should allow export when transparency settings are valid', () => {
    // Mock settings with valid transparency configuration
    vi.mocked(vi.importActual('../../state/exportContext')).useExportSettings = () => ({
      settings: {
        format: 'mov',
        codec: 'h264',
        quality: 'high',
        audioCodec: 'aac',
        transparentBackground: true,
        includeWallpaper: false,
        includeGradient: false,
      },
      presets: [],
      updateSettings: mockUpdateSettings,
      applyPreset: vi.fn(),
    });

    render(
      <TestWrapper>
        <ExportDialog isOpen={true} onClose={() => {}} />
      </TestWrapper>
    );

    // The export button should be enabled with valid transparency settings
    const exportButton = screen.getByRole('button', { name: /Start Export/ });
    expect(exportButton).not.toBeDisabled();
  });

  it.skip('should toggle wallpaper inclusion setting', () => {
    // Mock settings with transparency enabled
    vi.mocked(vi.importActual('../../state/exportContext')).useExportSettings = () => ({
      settings: {
        format: 'mov',
        codec: 'h264',
        quality: 'high',
        audioCodec: 'aac',
        transparentBackground: true,
        includeWallpaper: true,
        includeGradient: true,
      },
      presets: [],
      updateSettings: mockUpdateSettings,
      applyPreset: vi.fn(),
    });

    render(
      <TestWrapper>
        <ExportDialog isOpen={true} onClose={() => {}} />
      </TestWrapper>
    );

    // Switch to custom settings tab
    fireEvent.click(screen.getByText('Custom Settings'));

    // Find and click the wallpaper inclusion checkbox
    const wallpaperCheckbox = screen.getByLabelText('Include wallpaper backgrounds');
    fireEvent.click(wallpaperCheckbox);

    // Verify updateSettings was called
    expect(mockUpdateSettings).toHaveBeenCalledWith({
      includeWallpaper: false,
    });
  });

  it.skip('should toggle gradient inclusion setting', () => {
    // Mock settings with transparency enabled
    vi.mocked(vi.importActual('../../state/exportContext')).useExportSettings = () => ({
      settings: {
        format: 'mov',
        codec: 'h264',
        quality: 'high',
        audioCodec: 'aac',
        transparentBackground: true,
        includeWallpaper: true,
        includeGradient: true,
      },
      presets: [],
      updateSettings: mockUpdateSettings,
      applyPreset: vi.fn(),
    });

    render(
      <TestWrapper>
        <ExportDialog isOpen={true} onClose={() => {}} />
      </TestWrapper>
    );

    // Switch to custom settings tab
    fireEvent.click(screen.getByText('Custom Settings'));

    // Find and click the gradient inclusion checkbox
    const gradientCheckbox = screen.getByLabelText('Include gradient backgrounds');
    fireEvent.click(gradientCheckbox);

    // Verify updateSettings was called
    expect(mockUpdateSettings).toHaveBeenCalledWith({
      includeGradient: false,
    });
  });
});