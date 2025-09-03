// Tests for project migration manager component

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProjectMigrationManager, useMigrationManager } from '../ProjectMigrationManager';
import type { Project } from '../../lib/types';
import * as trackMigration from '../../lib/trackMigration';

// Mock the track migration module
vi.mock('../../lib/trackMigration', () => ({
  migrateProjectToEducationalTracks: vi.fn(),
  rollbackProjectMigration: vi.fn(),
  getProjectBackups: vi.fn(),
  validateProjectForMigration: vi.fn(),
  previewProjectMigration: vi.fn(),
  isProjectMigrated: vi.fn(),
  getMigrationStatistics: vi.fn()
}));

// Mock data
const mockProject: Project = {
  id: 'test-project-1',
  name: 'Test Project',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  version: '1.0.0',
  settings: {
    width: 1920,
    height: 1080,
    fps: 30,
    duration: 60,
    backgroundColor: '#000000'
  },
  timeline: [
    {
      id: 'item-1',
      assetId: 'asset-1',
      startTime: 0,
      duration: 10,
      track: 0,
      type: 'code',
      properties: {},
      animations: [],
      keyframes: []
    }
  ],
  mediaAssets: [
    {
      id: 'asset-1',
      name: 'Test Code Asset',
      type: 'code',
      url: 'https://example.com/asset-1',
      duration: 30,
      metadata: {
        fileSize: 1024,
        mimeType: 'text/plain',
        codeContent: 'console.log("Hello World");',
        language: 'javascript'
      },
      createdAt: new Date('2024-01-01')
    }
  ]
};

const mockStatistics = {
  totalItems: 1,
  itemsByTrack: {
    Code: 1,
    Visual: 0,
    Narration: 0,
    You: 0
  },
  itemsByType: {
    code: 1,
    video: 0,
    audio: 0,
    title: 0,
    'visual-asset': 0
  },
  averageConfidence: 95,
  conflictCount: 0
};

const mockPreview = {
  conflicts: [],
  trackAssignments: [
    {
      itemId: 'item-1',
      currentTrack: 0,
      suggestedTrack: {
        id: 'code',
        name: 'Code',
        trackNumber: 0,
        color: '#8B5CF6',
        icon: 'code',
        defaultProperties: {},
        allowedContentTypes: ['code'],
        suggestedAnimations: []
      },
      confidence: 95,
      reason: 'Code content detected'
    }
  ],
  warnings: []
};

describe('ProjectMigrationManager', () => {
  const mockOnProjectUpdate = vi.fn();
  const mockOnMigrationComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    vi.mocked(trackMigration.isProjectMigrated).mockReturnValue(false);
    vi.mocked(trackMigration.validateProjectForMigration).mockReturnValue({
      canMigrate: true,
      issues: []
    });
    vi.mocked(trackMigration.previewProjectMigration).mockReturnValue(mockPreview);
    vi.mocked(trackMigration.getMigrationStatistics).mockReturnValue(mockStatistics);
    vi.mocked(trackMigration.getProjectBackups).mockReturnValue([]);
    vi.mocked(trackMigration.migrateProjectToEducationalTracks).mockReturnValue({
      success: true,
      migratedItems: 1,
      conflicts: [],
      warnings: []
    });
  });

  it('should render migration interface for non-migrated project', () => {
    render(
      <ProjectMigrationManager
        project={mockProject}
        onProjectUpdate={mockOnProjectUpdate}
        onMigrationComplete={mockOnMigrationComplete}
      />
    );

    expect(screen.getByText('Educational Track Migration')).toBeInTheDocument();
    expect(screen.getByText('Convert your project to use the new educational track system')).toBeInTheDocument();
    expect(screen.getByText('Start Migration')).toBeInTheDocument();
  });

  it('should show already migrated status for migrated project', () => {
    vi.mocked(trackMigration.isProjectMigrated).mockReturnValue(true);

    render(
      <ProjectMigrationManager
        project={mockProject}
        onProjectUpdate={mockOnProjectUpdate}
        onMigrationComplete={mockOnMigrationComplete}
      />
    );

    expect(screen.getByText('Project Already Migrated')).toBeInTheDocument();
    expect(screen.getByText('This project has already been migrated to use educational tracks.')).toBeInTheDocument();
  });

  it('should start migration process when button clicked', async () => {
    render(
      <ProjectMigrationManager
        project={mockProject}
        onProjectUpdate={mockOnProjectUpdate}
        onMigrationComplete={mockOnMigrationComplete}
      />
    );

    const startButton = screen.getByText('Start Migration');
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(trackMigration.validateProjectForMigration).toHaveBeenCalledWith(mockProject);
      expect(trackMigration.previewProjectMigration).toHaveBeenCalledWith(mockProject);
      expect(trackMigration.getMigrationStatistics).toHaveBeenCalledWith(mockProject);
    });
  });

  it('should show error when project validation fails', async () => {
    vi.mocked(trackMigration.validateProjectForMigration).mockReturnValue({
      canMigrate: false,
      issues: ['Project has no timeline items']
    });

    render(
      <ProjectMigrationManager
        project={mockProject}
        onProjectUpdate={mockOnProjectUpdate}
        onMigrationComplete={mockOnMigrationComplete}
      />
    );

    const startButton = screen.getByText('Start Migration');
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(screen.getByText('❌ Migration Failed')).toBeInTheDocument();
      expect(screen.getByText(/Project has no timeline items/)).toBeInTheDocument();
    });
  });

  it('should display migration benefits', () => {
    render(
      <ProjectMigrationManager
        project={mockProject}
        onProjectUpdate={mockOnProjectUpdate}
        onMigrationComplete={mockOnMigrationComplete}
      />
    );

    expect(screen.getByText('Benefits of Educational Tracks')).toBeInTheDocument();
    expect(screen.getByText('Code Track:')).toBeInTheDocument();
    expect(screen.getByText('Visual Track:')).toBeInTheDocument();
    expect(screen.getByText('Narration Track:')).toBeInTheDocument();
    expect(screen.getByText('You Track:')).toBeInTheDocument();
  });

  it('should handle successful migration', async () => {
    render(
      <ProjectMigrationManager
        project={mockProject}
        onProjectUpdate={mockOnProjectUpdate}
        onMigrationComplete={mockOnMigrationComplete}
      />
    );

    const startButton = screen.getByText('Start Migration');
    fireEvent.click(startButton);

    // Wait for preview dialog and proceed
    await waitFor(() => {
      expect(screen.getByText('Migration Preview')).toBeInTheDocument();
    });

    const proceedButton = screen.getByText('Migrate Project');
    fireEvent.click(proceedButton);

    await waitFor(() => {
      expect(trackMigration.migrateProjectToEducationalTracks).toHaveBeenCalled();
      expect(mockOnProjectUpdate).toHaveBeenCalled();
      expect(mockOnMigrationComplete).toHaveBeenCalledWith(
        true,
        'Successfully migrated 1 timeline items to educational tracks'
      );
    });
  });

  it('should handle migration with conflicts', async () => {
    const conflictPreview = {
      ...mockPreview,
      conflicts: [
        {
          itemId: 'item-1',
          currentTrack: 0,
          suggestedTrack: mockPreview.trackAssignments[0].suggestedTrack,
          reason: 'Test conflict',
          alternatives: []
        }
      ]
    };

    vi.mocked(trackMigration.previewProjectMigration).mockReturnValue(conflictPreview);
    vi.mocked(trackMigration.getMigrationStatistics).mockReturnValue({
      ...mockStatistics,
      conflictCount: 1
    });

    render(
      <ProjectMigrationManager
        project={mockProject}
        onProjectUpdate={mockOnProjectUpdate}
        onMigrationComplete={mockOnMigrationComplete}
      />
    );

    const startButton = screen.getByText('Start Migration');
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(screen.getByText('Proceed with Migration')).toBeInTheDocument();
    });

    const proceedButton = screen.getByText('Proceed with Migration');
    fireEvent.click(proceedButton);

    await waitFor(() => {
      expect(screen.getByText('Resolve Migration Conflicts')).toBeInTheDocument();
    });
  });

  it('should handle migration failure', async () => {
    vi.mocked(trackMigration.migrateProjectToEducationalTracks).mockReturnValue({
      success: false,
      migratedItems: 0,
      conflicts: [],
      warnings: ['Migration failed due to invalid data']
    });

    render(
      <ProjectMigrationManager
        project={mockProject}
        onProjectUpdate={mockOnProjectUpdate}
        onMigrationComplete={mockOnMigrationComplete}
      />
    );

    const startButton = screen.getByText('Start Migration');
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(screen.getByText('Migration Preview')).toBeInTheDocument();
    });

    const proceedButton = screen.getByText('Migrate Project');
    fireEvent.click(proceedButton);

    await waitFor(() => {
      expect(screen.getByText('❌ Migration Failed')).toBeInTheDocument();
      expect(mockOnMigrationComplete).toHaveBeenCalledWith(
        false,
        'Migration failed: Migration failed due to invalid data'
      );
    });
  });
});

describe('useMigrationManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    vi.mocked(trackMigration.validateProjectForMigration).mockReturnValue({
      canMigrate: true,
      issues: []
    });
    vi.mocked(trackMigration.previewProjectMigration).mockReturnValue(mockPreview);
    vi.mocked(trackMigration.getMigrationStatistics).mockReturnValue(mockStatistics);
    vi.mocked(trackMigration.isProjectMigrated).mockReturnValue(false);
    vi.mocked(trackMigration.migrateProjectToEducationalTracks).mockReturnValue({
      success: true,
      migratedItems: 1,
      conflicts: [],
      warnings: []
    });
  });

  it('should provide migration utilities', () => {
    let hookResult: ReturnType<typeof useMigrationManager>;

    function TestComponent() {
      hookResult = useMigrationManager(mockProject);
      return null;
    }

    render(<TestComponent />);

    expect(hookResult!.isLoading).toBe(false);
    expect(hookResult!.error).toBe(null);
    expect(typeof hookResult!.validateProject).toBe('function');
    expect(typeof hookResult!.previewMigration).toBe('function');
    expect(typeof hookResult!.getStatistics).toBe('function');
    expect(typeof hookResult!.checkMigrationStatus).toBe('function');
    expect(typeof hookResult!.performMigration).toBe('function');
  });

  it('should validate project correctly', () => {
    let hookResult: ReturnType<typeof useMigrationManager>;

    function TestComponent() {
      hookResult = useMigrationManager(mockProject);
      return null;
    }

    render(<TestComponent />);

    const validation = hookResult!.validateProject();
    expect(validation.canMigrate).toBe(true);
    expect(trackMigration.validateProjectForMigration).toHaveBeenCalledWith(mockProject);
  });

  it('should preview migration correctly', () => {
    let hookResult: ReturnType<typeof useMigrationManager>;

    function TestComponent() {
      hookResult = useMigrationManager(mockProject);
      return null;
    }

    render(<TestComponent />);

    const preview = hookResult!.previewMigration();
    expect(preview).toEqual(mockPreview);
    expect(trackMigration.previewProjectMigration).toHaveBeenCalledWith(mockProject);
  });

  it('should get statistics correctly', () => {
    let hookResult: ReturnType<typeof useMigrationManager>;

    function TestComponent() {
      hookResult = useMigrationManager(mockProject);
      return null;
    }

    render(<TestComponent />);

    const statistics = hookResult!.getStatistics();
    expect(statistics).toEqual(mockStatistics);
    expect(trackMigration.getMigrationStatistics).toHaveBeenCalledWith(mockProject);
  });

  it('should check migration status correctly', () => {
    let hookResult: ReturnType<typeof useMigrationManager>;

    function TestComponent() {
      hookResult = useMigrationManager(mockProject);
      return null;
    }

    render(<TestComponent />);

    const isMigrated = hookResult!.checkMigrationStatus();
    expect(isMigrated).toBe(false);
    expect(trackMigration.isProjectMigrated).toHaveBeenCalledWith(mockProject);
  });

  it('should perform migration correctly', async () => {
    let hookResult: ReturnType<typeof useMigrationManager>;

    function TestComponent() {
      hookResult = useMigrationManager(mockProject);
      return null;
    }

    render(<TestComponent />);

    const result = await hookResult!.performMigration();
    
    expect(result.success).toBe(true);
    expect(result.migratedItems).toBe(1);
    expect(trackMigration.migrateProjectToEducationalTracks).toHaveBeenCalledWith(
      mockProject,
      { preserveOriginal: true },
      []
    );
  });

  it('should handle migration errors', async () => {
    vi.mocked(trackMigration.migrateProjectToEducationalTracks).mockImplementation(() => {
      throw new Error('Migration error');
    });

    let hookResult: ReturnType<typeof useMigrationManager>;

    function TestComponent() {
      hookResult = useMigrationManager(mockProject);
      return null;
    }

    render(<TestComponent />);

    const result = await hookResult!.performMigration();
    
    expect(result.success).toBe(false);
    expect(hookResult!.error).toBe('Migration error');
  });

  it('should manage loading state during migration', async () => {
    let hookResult: ReturnType<typeof useMigrationManager>;

    function TestComponent() {
      hookResult = useMigrationManager(mockProject);
      return null;
    }

    render(<TestComponent />);

    expect(hookResult!.isLoading).toBe(false);

    const result = await hookResult!.performMigration();
    
    // After migration completes, loading should be false
    expect(hookResult!.isLoading).toBe(false);
    expect(result.success).toBe(true);
  });
});