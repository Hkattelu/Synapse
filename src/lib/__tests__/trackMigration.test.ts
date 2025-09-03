// Unit tests for track migration system

import { describe, it, expect, beforeEach } from 'vitest';
import type { Project, TimelineItem, MediaAsset } from '../types';
import type { MigrationDecision } from '../educationalTypes';
import {
  migrateProjectToEducationalTracks,
  rollbackProjectMigration,
  getProjectBackups,
  cleanupProjectBackups,
  validateProjectForMigration,
  previewProjectMigration,
  isProjectMigrated,
  getMigrationStatistics,
  clearAllBackups
} from '../trackMigration';

// Test data helpers
function createMockProject(): Project {
  return {
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
    timeline: [],
    mediaAssets: []
  };
}

function createMockMediaAsset(type: 'video' | 'audio' | 'code' | 'image', id: string = 'asset-1'): MediaAsset {
  return {
    id,
    name: `Test ${type} asset`,
    type,
    url: `https://example.com/${id}`,
    duration: type === 'image' ? undefined : 30,
    metadata: {
      fileSize: 1024,
      mimeType: type === 'video' ? 'video/mp4' : 
                type === 'audio' ? 'audio/mp3' :
                type === 'code' ? 'text/plain' : 'image/jpeg',
      codeContent: type === 'code' ? 'console.log("Hello World");' : undefined,
      language: type === 'code' ? 'javascript' : undefined
    },
    createdAt: new Date('2024-01-01')
  };
}

function createMockTimelineItem(
  assetId: string, 
  type: 'video' | 'code' | 'audio' | 'title' | 'visual-asset',
  track: number = 0,
  id: string = 'item-1'
): TimelineItem {
  return {
    id,
    assetId,
    startTime: 0,
    duration: 10,
    track,
    type,
    properties: {},
    animations: [],
    keyframes: []
  };
}

describe('trackMigration', () => {
  let mockProject: Project;

  beforeEach(() => {
    mockProject = createMockProject();
    // Clear all backups to ensure test isolation
    clearAllBackups();
  });

  describe('validateProjectForMigration', () => {
    it('should validate a project with timeline items and assets', () => {
      const asset = createMockMediaAsset('code');
      const item = createMockTimelineItem(asset.id, 'code');
      
      mockProject.mediaAssets = [asset];
      mockProject.timeline = [item];

      const result = validateProjectForMigration(mockProject);
      
      expect(result.canMigrate).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should detect project with no timeline items', () => {
      const result = validateProjectForMigration(mockProject);
      
      expect(result.canMigrate).toBe(false);
      expect(result.issues).toContain('Project has no timeline items to migrate');
    });

    it('should detect project with no media assets', () => {
      const item = createMockTimelineItem('asset-1', 'code');
      mockProject.timeline = [item];

      const result = validateProjectForMigration(mockProject);
      
      expect(result.canMigrate).toBe(false);
      expect(result.issues).toContain('Project has no media assets');
    });

    it('should detect orphaned timeline items', () => {
      const asset = createMockMediaAsset('code', 'asset-1');
      const item1 = createMockTimelineItem('asset-1', 'code', 0, 'item-1');
      const item2 = createMockTimelineItem('asset-2', 'code', 0, 'item-2'); // Orphaned
      
      mockProject.mediaAssets = [asset];
      mockProject.timeline = [item1, item2];

      const result = validateProjectForMigration(mockProject);
      
      expect(result.canMigrate).toBe(false);
      expect(result.issues).toContain('Found 1 timeline items without corresponding media assets');
    });
  });

  describe('previewProjectMigration', () => {
    it('should generate migration preview with track assignments', () => {
      const codeAsset = createMockMediaAsset('code', 'code-asset');
      const videoAsset = createMockMediaAsset('video', 'video-asset');
      
      const codeItem = createMockTimelineItem('code-asset', 'code', 0, 'code-item');
      const videoItem = createMockTimelineItem('video-asset', 'video', 0, 'video-item');
      
      mockProject.mediaAssets = [codeAsset, videoAsset];
      mockProject.timeline = [codeItem, videoItem];

      const preview = previewProjectMigration(mockProject);
      
      expect(preview.trackAssignments).toHaveLength(2);
      expect(preview.trackAssignments[0].suggestedTrack.name).toBe('Code');
      expect(preview.trackAssignments[1].suggestedTrack.name).toBe('Visual');
    });

    it('should detect conflicts when multiple content types are on same track', () => {
      const codeAsset = createMockMediaAsset('code', 'code-asset');
      const audioAsset = createMockMediaAsset('audio', 'audio-asset');
      
      // Both items on track 0, but should be on different educational tracks
      const codeItem = createMockTimelineItem('code-asset', 'code', 0, 'code-item');
      const audioItem = createMockTimelineItem('audio-asset', 'audio', 0, 'audio-item');
      
      mockProject.mediaAssets = [codeAsset, audioAsset];
      mockProject.timeline = [codeItem, audioItem];

      const preview = previewProjectMigration(mockProject);
      
      expect(preview.conflicts.length).toBeGreaterThan(0);
    });
  });

  describe('migrateProjectToEducationalTracks', () => {
    it('should successfully migrate a simple project', () => {
      const codeAsset = createMockMediaAsset('code', 'code-asset');
      const codeItem = createMockTimelineItem('code-asset', 'code', 0, 'code-item');
      
      mockProject.mediaAssets = [codeAsset];
      mockProject.timeline = [codeItem];

      const result = migrateProjectToEducationalTracks(mockProject);
      
      expect(result.success).toBe(true);
      expect(result.migratedItems).toBe(1);
      expect(result.conflicts).toHaveLength(0);
      expect(mockProject.timeline[0].track).toBe(0); // Code track
      expect(mockProject.timeline[0]).toHaveProperty('educationalTrack', 'code');
    });

    it('should apply track-specific default properties', () => {
      const codeAsset = createMockMediaAsset('code', 'code-asset');
      const codeItem = createMockTimelineItem('code-asset', 'code', 0, 'code-item');
      
      mockProject.mediaAssets = [codeAsset];
      mockProject.timeline = [codeItem];

      const result = migrateProjectToEducationalTracks(mockProject);
      
      expect(result.success).toBe(true);
      const migratedItem = mockProject.timeline[0];
      expect(migratedItem.properties.theme).toBe('vscode-dark-plus');
      expect(migratedItem.properties.fontSize).toBe(16);
      expect(migratedItem.properties.showLineNumbers).toBe(true);
    });

    it('should preserve existing properties while applying defaults', () => {
      const codeAsset = createMockMediaAsset('code', 'code-asset');
      const codeItem = createMockTimelineItem('code-asset', 'code', 0, 'code-item');
      codeItem.properties = { fontSize: 20, opacity: 0.8 }; // Custom properties
      
      mockProject.mediaAssets = [codeAsset];
      mockProject.timeline = [codeItem];

      const result = migrateProjectToEducationalTracks(mockProject);
      
      expect(result.success).toBe(true);
      const migratedItem = mockProject.timeline[0];
      expect(migratedItem.properties.fontSize).toBe(20); // Preserved custom value
      expect(migratedItem.properties.opacity).toBe(0.8); // Preserved custom value
      expect(migratedItem.properties.theme).toBe('vscode-dark-plus'); // Applied default
    });

    it('should handle conflicts when auto-resolution is disabled', () => {
      const codeAsset = createMockMediaAsset('code', 'code-asset');
      const audioAsset = createMockMediaAsset('audio', 'audio-asset');
      
      // Both items on same track but should be on different educational tracks
      const codeItem = createMockTimelineItem('code-asset', 'code', 0, 'code-item');
      const audioItem = createMockTimelineItem('audio-asset', 'audio', 0, 'audio-item');
      
      mockProject.mediaAssets = [codeAsset, audioAsset];
      mockProject.timeline = [codeItem, audioItem];

      const result = migrateProjectToEducationalTracks(mockProject, {
        autoResolveConflicts: false
      });
      
      expect(result.success).toBe(false);
      expect(result.conflicts.length).toBeGreaterThan(0);
    });

    it('should apply user decisions for conflict resolution', () => {
      const codeAsset = createMockMediaAsset('code', 'code-asset');
      const audioAsset = createMockMediaAsset('audio', 'audio-asset');
      
      const codeItem = createMockTimelineItem('code-asset', 'code', 0, 'code-item');
      const audioItem = createMockTimelineItem('audio-asset', 'audio', 0, 'audio-item');
      
      mockProject.mediaAssets = [codeAsset, audioAsset];
      mockProject.timeline = [codeItem, audioItem];

      // User decisions to resolve conflicts
      const userDecisions: MigrationDecision[] = [
        {
          conflictId: 'audio-item',
          selectedTrack: { id: 'narration', name: 'Narration', trackNumber: 2, color: '#F59E0B', icon: 'mic', defaultProperties: {}, allowedContentTypes: ['audio'], suggestedAnimations: [] },
          userOverride: false
        }
      ];

      const result = migrateProjectToEducationalTracks(mockProject, {}, userDecisions);
      
      expect(result.success).toBe(true);
      expect(result.migratedItems).toBe(2);
      
      const audioTimelineItem = mockProject.timeline.find(item => item.id === 'audio-item');
      expect(audioTimelineItem?.track).toBe(2); // Narration track
    });

    it('should update project version to indicate migration', () => {
      const codeAsset = createMockMediaAsset('code', 'code-asset');
      const codeItem = createMockTimelineItem('code-asset', 'code', 0, 'code-item');
      
      mockProject.mediaAssets = [codeAsset];
      mockProject.timeline = [codeItem];

      migrateProjectToEducationalTracks(mockProject);
      
      expect(mockProject.version).toContain('educational');
    });
  });

  describe('rollbackProjectMigration', () => {
    it('should rollback project to original state', () => {
      const codeAsset = createMockMediaAsset('code', 'code-asset');
      const codeItem = createMockTimelineItem('code-asset', 'code', 0, 'code-item');
      
      mockProject.mediaAssets = [codeAsset];
      mockProject.timeline = [codeItem];

      const originalVersion = mockProject.version;
      
      // Migrate project (creates backup)
      const result = migrateProjectToEducationalTracks(mockProject, { preserveOriginal: true });
      expect(result.success).toBe(true);
      expect(mockProject.version).toContain('educational');

      // Get backup ID
      const backups = getProjectBackups(mockProject.id);
      expect(backups).toHaveLength(1);
      
      // Rollback
      const rolledBackProject = rollbackProjectMigration(backups[0].migrationId);
      
      expect(rolledBackProject).not.toBeNull();
      expect(rolledBackProject!.version).toBe(originalVersion);
      expect(rolledBackProject!.timeline[0]).not.toHaveProperty('educationalTrack');
    });

    it('should throw error for invalid migration ID', () => {
      expect(() => rollbackProjectMigration('invalid-id')).toThrow('No backup found for migration ID: invalid-id');
    });
  });

  describe('isProjectMigrated', () => {
    it('should detect migrated project by version', () => {
      mockProject.version = '1.0.0-educational';
      
      expect(isProjectMigrated(mockProject)).toBe(true);
    });

    it('should detect migrated project by educational metadata', () => {
      const codeAsset = createMockMediaAsset('code', 'code-asset');
      const codeItem = createMockTimelineItem('code-asset', 'code', 0, 'code-item');
      (codeItem as any).educationalTrack = 'code';
      
      mockProject.mediaAssets = [codeAsset];
      mockProject.timeline = [codeItem];
      
      expect(isProjectMigrated(mockProject)).toBe(true);
    });

    it('should return false for non-migrated project', () => {
      const codeAsset = createMockMediaAsset('code', 'code-asset');
      const codeItem = createMockTimelineItem('code-asset', 'code', 0, 'code-item');
      
      mockProject.mediaAssets = [codeAsset];
      mockProject.timeline = [codeItem];
      
      expect(isProjectMigrated(mockProject)).toBe(false);
    });
  });

  describe('getMigrationStatistics', () => {
    it('should generate accurate migration statistics', () => {
      const codeAsset = createMockMediaAsset('code', 'code-asset');
      const videoAsset = createMockMediaAsset('video', 'video-asset');
      const audioAsset = createMockMediaAsset('audio', 'audio-asset');
      
      const codeItem = createMockTimelineItem('code-asset', 'code', 0, 'code-item');
      const videoItem = createMockTimelineItem('video-asset', 'video', 1, 'video-item');
      const audioItem = createMockTimelineItem('audio-asset', 'audio', 2, 'audio-item');
      
      mockProject.mediaAssets = [codeAsset, videoAsset, audioAsset];
      mockProject.timeline = [codeItem, videoItem, audioItem];

      const stats = getMigrationStatistics(mockProject);
      
      expect(stats.totalItems).toBe(3);
      expect(stats.itemsByTrack.Code).toBe(1);
      expect(stats.itemsByTrack.Visual).toBe(1);
      expect(stats.itemsByTrack.Narration).toBe(1);
      expect(stats.itemsByType.code).toBe(1);
      expect(stats.itemsByType.video).toBe(1);
      expect(stats.itemsByType.audio).toBe(1);
      expect(stats.averageConfidence).toBeGreaterThan(0);
    });

    it('should handle empty project', () => {
      const stats = getMigrationStatistics(mockProject);
      
      expect(stats.totalItems).toBe(0);
      expect(stats.averageConfidence).toBe(0);
      expect(stats.conflictCount).toBe(0);
    });
  });

  describe('backup management', () => {
    it('should manage project backups correctly', () => {
      const codeAsset = createMockMediaAsset('code', 'code-asset');
      const codeItem = createMockTimelineItem('code-asset', 'code', 0, 'code-item');
      
      mockProject.mediaAssets = [codeAsset];
      mockProject.timeline = [codeItem];

      // Create multiple migrations to test backup management
      migrateProjectToEducationalTracks(mockProject, { preserveOriginal: true });
      migrateProjectToEducationalTracks(mockProject, { preserveOriginal: true });
      
      let backups = getProjectBackups(mockProject.id);
      expect(backups.length).toBe(2);
      
      // Test cleanup
      cleanupProjectBackups(mockProject.id, 1);
      backups = getProjectBackups(mockProject.id);
      expect(backups.length).toBe(1);
    });
  });

  describe('error handling', () => {
    it('should handle migration errors gracefully', () => {
      // Create a project that will cause an error during migration
      const invalidProject = {
        ...mockProject,
        timeline: null as any // Invalid timeline
      };

      const result = migrateProjectToEducationalTracks(invalidProject);
      
      expect(result.success).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Migration failed');
    });

    it('should handle missing assets gracefully', () => {
      const codeItem = createMockTimelineItem('missing-asset', 'code', 0, 'code-item');
      mockProject.timeline = [codeItem];
      mockProject.mediaAssets = []; // No assets

      const result = migrateProjectToEducationalTracks(mockProject);
      
      expect(result.success).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });
});