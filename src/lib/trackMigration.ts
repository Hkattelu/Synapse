// Project migration system for converting existing projects to educational tracks

import type {
  Project,
  TimelineItem,
  MediaAsset,
  TimelineItemType,
} from './types';
import type {
  EducationalTrack,
  MigrationConflict,
  MigrationResult,
  MigrationDecision,
  EducationalTimelineItem,
} from './educationalTypes';
import {
  EDUCATIONAL_TRACKS,
  getEducationalTrackByNumber,
} from './educationalTypes';
import { suggestTrackPlacement } from './educationalPlacement';

// Migration configuration
interface MigrationConfig {
  preserveOriginal: boolean;
  autoResolveConflicts: boolean;
  conflictResolutionStrategy: 'suggest' | 'preserve' | 'force';
}

// Default migration configuration
const DEFAULT_MIGRATION_CONFIG: MigrationConfig = {
  preserveOriginal: true,
  autoResolveConflicts: false,
  conflictResolutionStrategy: 'suggest',
};

// Backup data structure for rollback functionality
interface ProjectBackup {
  projectId: string;
  originalProject: Project;
  backupTimestamp: Date;
  migrationId: string;
}

// In-memory backup storage (in production, this would be persisted)
const projectBackups = new Map<string, ProjectBackup>();

/**
 * Analyzes a timeline item to determine the most appropriate educational track
 */
function analyzeTimelineItemForTrack(
  item: TimelineItem,
  mediaAssets: MediaAsset[]
): { suggestedTrack: EducationalTrack; confidence: number; reason: string } {
  const asset = mediaAssets.find((a) => a.id === item.assetId);

  if (!asset) {
    // Fallback based on item type
    const fallbackTrack = getFallbackTrackForItemType(item.type);
    return {
      suggestedTrack: fallbackTrack,
      confidence: 30,
      reason: `No asset found, using fallback for ${item.type} type`,
    };
  }

  // Use the existing placement suggestion system
  const suggestion = suggestTrackPlacement(asset, {
    existingItems: [],
    currentTime: item.startTime,
    selectedTrack: undefined,
  });

  return {
    suggestedTrack: suggestion.suggestedTrack,
    confidence: suggestion.confidence,
    reason: suggestion.reason,
  };
}

/**
 * Gets fallback track for item types when no asset is available
 */
function getFallbackTrackForItemType(
  itemType: TimelineItemType
): EducationalTrack {
  const fallbackMap: Record<TimelineItemType, string> = {
    code: 'code',
    video: 'visual',
    audio: 'narration',
    title: 'visual',
    'visual-asset': 'visual',
  };

  const trackId = fallbackMap[itemType] || 'visual';
  return (
    EDUCATIONAL_TRACKS.find((t) => t.id === trackId) || EDUCATIONAL_TRACKS[1]
  ); // Default to Visual
}

/**
 * Detects potential migration conflicts
 */
function detectMigrationConflicts(
  items: TimelineItem[],
  mediaAssets: MediaAsset[]
): MigrationConflict[] {
  const conflicts: MigrationConflict[] = [];

  // Group items by their current track
  const itemsByTrack = new Map<number, TimelineItem[]>();
  items.forEach((item) => {
    const trackItems = itemsByTrack.get(item.track) || [];
    trackItems.push(item);
    itemsByTrack.set(item.track, trackItems);
  });

  // Check each track for conflicts
  itemsByTrack.forEach((trackItems, trackNumber) => {
    if (trackItems.length <= 1) return; // No conflicts with single items

    // Analyze each item to see if they should be on different tracks
    const trackAnalysis = trackItems.map((item) => ({
      item,
      analysis: analyzeTimelineItemForTrack(item, mediaAssets),
    }));

    // Find items that should be on different tracks
    const suggestedTracks = new Set(
      trackAnalysis.map((ta) => ta.analysis.suggestedTrack.id)
    );

    if (suggestedTracks.size > 1) {
      // Multiple different tracks suggested for items on the same track
      trackAnalysis.forEach(({ item, analysis }) => {
        const currentEducationalTrack =
          getEducationalTrackByNumber(trackNumber);

        if (
          currentEducationalTrack &&
          analysis.suggestedTrack.id !== currentEducationalTrack.id
        ) {
          // Find alternative tracks
          const alternatives = EDUCATIONAL_TRACKS.filter(
            (t) =>
              t.id !== analysis.suggestedTrack.id &&
              t.allowedContentTypes.includes(item.type)
          );

          conflicts.push({
            itemId: item.id,
            currentTrack: trackNumber,
            suggestedTrack: analysis.suggestedTrack,
            reason: analysis.reason,
            alternatives,
          });
        }
      });
    }
  });

  return conflicts;
}

/**
 * Creates a backup of the project before migration
 */
function createProjectBackup(project: Project): string {
  const migrationId = `migration_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const backup: ProjectBackup = {
    projectId: project.id,
    originalProject: JSON.parse(JSON.stringify(project)), // Deep clone
    backupTimestamp: new Date(),
    migrationId,
  };

  projectBackups.set(migrationId, backup);

  // Clean up old backups (keep only last 10 per project)
  const projectBackupsList = Array.from(projectBackups.values())
    .filter((b) => b.projectId === project.id)
    .sort((a, b) => b.backupTimestamp.getTime() - a.backupTimestamp.getTime());

  if (projectBackupsList.length > 10) {
    projectBackupsList.slice(10).forEach((backup) => {
      projectBackups.delete(backup.migrationId);
    });
  }

  return migrationId;
}

/**
 * Applies educational track assignments to timeline items
 */
function applyTrackAssignments(
  items: TimelineItem[],
  mediaAssets: MediaAsset[],
  decisions: MigrationDecision[] = []
): { migratedItems: EducationalTimelineItem[]; warnings: string[] } {
  const warnings: string[] = [];
  const migratedItems: EducationalTimelineItem[] = [];

  items.forEach((item) => {
    // Check if there's a user decision for this item
    const decision = decisions.find((d) => d.conflictId === item.id);
    let targetTrack: EducationalTrack;
    let confidence: number;
    let reason: string;

    if (decision) {
      targetTrack = decision.selectedTrack;
      confidence = decision.userOverride ? 100 : 80;
      reason = decision.userOverride ? 'User override' : 'User decision';
    } else {
      // Use automatic analysis
      const analysis = analyzeTimelineItemForTrack(item, mediaAssets);
      targetTrack = analysis.suggestedTrack;
      confidence = analysis.confidence;
      reason = analysis.reason;
    }

    // Validate content type compatibility
    if (!targetTrack.allowedContentTypes.includes(item.type)) {
      warnings.push(
        `Item ${item.id} (${item.type}) may not be compatible with ${targetTrack.name} track`
      );
    }

    // Create migrated item
    const migratedItem: EducationalTimelineItem = {
      ...item,
      track: targetTrack.trackNumber,
      educationalTrack: targetTrack.id,
      educationalMetadata: {
        contentPurpose: getContentPurpose(item.type, targetTrack),
        difficulty: 'beginner', // Default difficulty
        tags: [],
      },
      // Apply track-specific default properties
      properties: {
        ...targetTrack.defaultProperties,
        ...item.properties, // Preserve existing properties
      },
    };

    // Add suggested track for items with low confidence
    if (confidence < 70) {
      migratedItem.suggestedTrack = targetTrack.id;
      warnings.push(
        `Low confidence (${confidence}%) for item ${item.id} placement on ${targetTrack.name} track: ${reason}`
      );
    }

    migratedItems.push(migratedItem);
  });

  return { migratedItems, warnings };
}

/**
 * Determines content purpose based on item type and target track
 */
function getContentPurpose(
  itemType: TimelineItemType,
  track: EducationalTrack
): 'demonstration' | 'explanation' | 'narration' | 'personal' {
  const purposeMap: Record<
    string,
    Record<
      TimelineItemType,
      'demonstration' | 'explanation' | 'narration' | 'personal'
    >
  > = {
    code: {
      code: 'demonstration',
      video: 'demonstration',
      audio: 'explanation',
      title: 'explanation',
      'visual-asset': 'explanation',
    },
    visual: {
      code: 'demonstration',
      video: 'demonstration',
      audio: 'explanation',
      title: 'explanation',
      'visual-asset': 'demonstration',
    },
    narration: {
      code: 'narration',
      video: 'narration',
      audio: 'narration',
      title: 'narration',
      'visual-asset': 'narration',
    },
    you: {
      code: 'personal',
      video: 'personal',
      audio: 'personal',
      title: 'personal',
      'visual-asset': 'personal',
    },
  };

  return purposeMap[track.id]?.[itemType] || 'explanation';
}

/**
 * Main migration function - converts existing project to educational tracks
 */
export function migrateProjectToEducationalTracks(
  project: Project,
  config: Partial<MigrationConfig> = {},
  userDecisions: MigrationDecision[] = []
): MigrationResult {
  const migrationConfig = { ...DEFAULT_MIGRATION_CONFIG, ...config };

  try {
    // Create backup if preserveOriginal is enabled
    let backupId: string | undefined;
    if (migrationConfig.preserveOriginal) {
      backupId = createProjectBackup(project);
    }

    // Detect conflicts
    const conflicts = detectMigrationConflicts(
      project.timeline,
      project.mediaAssets
    );

    // If there are conflicts and auto-resolution is disabled, return conflicts for user resolution
    if (
      conflicts.length > 0 &&
      !migrationConfig.autoResolveConflicts &&
      userDecisions.length === 0
    ) {
      return {
        success: false,
        migratedItems: 0,
        conflicts,
        warnings: [
          `Found ${conflicts.length} migration conflicts that require user resolution`,
        ],
      };
    }

    // Apply track assignments
    const { migratedItems, warnings } = applyTrackAssignments(
      project.timeline,
      project.mediaAssets,
      userDecisions
    );

    // Update project timeline
    project.timeline = migratedItems;
    project.updatedAt = new Date();

    // Add migration metadata to project
    if (!project.version.includes('educational')) {
      project.version = `${project.version}-educational`;
    }

    return {
      success: true,
      migratedItems: migratedItems.length,
      conflicts: [], // Conflicts were resolved
      warnings,
    };
  } catch (error) {
    return {
      success: false,
      migratedItems: 0,
      conflicts: [],
      warnings: [
        `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ],
    };
  }
}

/**
 * Rolls back a project to its pre-migration state
 */
export function rollbackProjectMigration(migrationId: string): Project | null {
  const backup = projectBackups.get(migrationId);

  if (!backup) {
    throw new Error(`No backup found for migration ID: ${migrationId}`);
  }

  // Return a deep clone of the original project
  return JSON.parse(JSON.stringify(backup.originalProject));
}

/**
 * Gets available backups for a project
 */
export function getProjectBackups(
  projectId: string
): Array<{ migrationId: string; timestamp: Date }> {
  return Array.from(projectBackups.values())
    .filter((backup) => backup.projectId === projectId)
    .map((backup) => ({
      migrationId: backup.migrationId,
      timestamp: backup.backupTimestamp,
    }))
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

/**
 * Cleans up old backups for a project
 */
export function cleanupProjectBackups(
  projectId: string,
  keepCount: number = 5
): void {
  const projectBackupsList = Array.from(projectBackups.values())
    .filter((backup) => backup.projectId === projectId)
    .sort((a, b) => b.backupTimestamp.getTime() - a.backupTimestamp.getTime());

  if (projectBackupsList.length > keepCount) {
    projectBackupsList.slice(keepCount).forEach((backup) => {
      projectBackups.delete(backup.migrationId);
    });
  }
}

/**
 * Clears all backups (for testing purposes)
 */
export function clearAllBackups(): void {
  projectBackups.clear();
}

/**
 * Validates that a project can be migrated
 */
export function validateProjectForMigration(project: Project): {
  canMigrate: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check if project has timeline items
  if (!project.timeline || project.timeline.length === 0) {
    issues.push('Project has no timeline items to migrate');
  }

  // Check if project has media assets
  if (!project.mediaAssets || project.mediaAssets.length === 0) {
    issues.push('Project has no media assets');
  }

  // Check for orphaned timeline items (items without corresponding assets)
  const assetIds = new Set(project.mediaAssets.map((asset) => asset.id));
  const orphanedItems = project.timeline.filter(
    (item) => !assetIds.has(item.assetId)
  );

  if (orphanedItems.length > 0) {
    issues.push(
      `Found ${orphanedItems.length} timeline items without corresponding media assets`
    );
  }

  // Check for unsupported item types
  const supportedTypes = new Set(
    EDUCATIONAL_TRACKS.flatMap((track) => track.allowedContentTypes)
  );
  const unsupportedItems = project.timeline.filter(
    (item) => !supportedTypes.has(item.type)
  );

  if (unsupportedItems.length > 0) {
    issues.push(
      `Found ${unsupportedItems.length} timeline items with unsupported types`
    );
  }

  return {
    canMigrate: issues.length === 0,
    issues,
  };
}

/**
 * Generates a migration preview without actually modifying the project
 */
export function previewProjectMigration(project: Project): {
  conflicts: MigrationConflict[];
  trackAssignments: Array<{
    itemId: string;
    currentTrack: number;
    suggestedTrack: EducationalTrack;
    confidence: number;
    reason: string;
  }>;
  warnings: string[];
} {
  const conflicts = detectMigrationConflicts(
    project.timeline,
    project.mediaAssets
  );
  const trackAssignments: Array<{
    itemId: string;
    currentTrack: number;
    suggestedTrack: EducationalTrack;
    confidence: number;
    reason: string;
  }> = [];
  const warnings: string[] = [];

  project.timeline.forEach((item) => {
    const analysis = analyzeTimelineItemForTrack(item, project.mediaAssets);

    trackAssignments.push({
      itemId: item.id,
      currentTrack: item.track,
      suggestedTrack: analysis.suggestedTrack,
      confidence: analysis.confidence,
      reason: analysis.reason,
    });

    if (analysis.confidence < 70) {
      warnings.push(
        `Low confidence (${analysis.confidence}%) for item ${item.id}: ${analysis.reason}`
      );
    }
  });

  return {
    conflicts,
    trackAssignments,
    warnings,
  };
}

/**
 * Checks if a project has already been migrated to educational tracks
 */
export function isProjectMigrated(project: Project): boolean {
  // Check if project version indicates migration
  if (project.version.includes('educational')) {
    return true;
  }

  // Check if timeline items have educational metadata
  const hasEducationalMetadata = project.timeline.some(
    (item) => 'educationalTrack' in item || 'educationalMetadata' in item
  );

  return hasEducationalMetadata;
}

/**
 * Gets migration statistics for a project
 */
export function getMigrationStatistics(project: Project): {
  totalItems: number;
  itemsByTrack: Record<string, number>;
  itemsByType: Record<TimelineItemType, number>;
  averageConfidence: number;
  conflictCount: number;
} {
  const conflicts = detectMigrationConflicts(
    project.timeline,
    project.mediaAssets
  );
  const itemsByTrack: Record<string, number> = {};
  const itemsByType: Record<TimelineItemType, number> = {
    video: 0,
    code: 0,
    title: 0,
    audio: 0,
    'visual-asset': 0,
  };
  let totalConfidence = 0;

  // Initialize counters
  EDUCATIONAL_TRACKS.forEach((track) => {
    itemsByTrack[track.name] = 0;
  });

  project.timeline.forEach((item) => {
    // Count by type
    itemsByType[item.type] = (itemsByType[item.type] || 0) + 1;

    // Analyze for track assignment
    const analysis = analyzeTimelineItemForTrack(item, project.mediaAssets);
    itemsByTrack[analysis.suggestedTrack.name]++;
    totalConfidence += analysis.confidence;
  });

  return {
    totalItems: project.timeline.length,
    itemsByTrack,
    itemsByType,
    averageConfidence:
      project.timeline.length > 0
        ? totalConfidence / project.timeline.length
        : 0,
    conflictCount: conflicts.length,
  };
}
