// Project migration manager component - orchestrates the migration workflow

import React, { useState, useCallback } from 'react';
import type { Project } from '../lib/types';
import type {
  MigrationConflict,
  MigrationDecision,
} from '../lib/educationalTypes';
import {
  migrateProjectToEducationalTracks,
  rollbackProjectMigration,
  getProjectBackups,
  validateProjectForMigration,
  previewProjectMigration,
  isProjectMigrated,
  getMigrationStatistics,
} from '../lib/trackMigration';
import {
  MigrationConflictDialog,
  MigrationPreviewDialog,
} from './MigrationConflictDialog';

interface ProjectMigrationManagerProps {
  project: Project;
  onProjectUpdate: (project: Project) => void;
  onMigrationComplete: (success: boolean, message: string) => void;
}

type MigrationStep =
  | 'idle'
  | 'preview'
  | 'conflicts'
  | 'migrating'
  | 'complete'
  | 'error';

interface MigrationState {
  step: MigrationStep;
  conflicts: MigrationConflict[];
  statistics: ReturnType<typeof getMigrationStatistics> | null;
  errorMessage: string | null;
  migrationId: string | null;
}

export function ProjectMigrationManager({
  project,
  onProjectUpdate,
  onMigrationComplete,
}: ProjectMigrationManagerProps) {
  const [migrationState, setMigrationState] = useState<MigrationState>({
    step: 'idle',
    conflicts: [],
    statistics: null,
    errorMessage: null,
    migrationId: null,
  });

  const [showPreview, setShowPreview] = useState(false);
  const [showConflicts, setShowConflicts] = useState(false);

  // Check if project is already migrated
  const isMigrated = isProjectMigrated(project);

  // Start migration process
  const startMigration = useCallback(() => {
    // Validate project first
    const validation = validateProjectForMigration(project);
    if (!validation.canMigrate) {
      setMigrationState({
        step: 'error',
        conflicts: [],
        statistics: null,
        errorMessage: `Cannot migrate project: ${validation.issues.join(', ')}`,
        migrationId: null,
      });
      return;
    }

    // Generate preview and statistics
    const preview = previewProjectMigration(project);
    const statistics = getMigrationStatistics(project);

    setMigrationState({
      step: 'preview',
      conflicts: preview.conflicts,
      statistics,
      errorMessage: null,
      migrationId: null,
    });

    setShowPreview(true);
  }, [project]);

  // Proceed with migration after preview
  const proceedWithMigration = useCallback(() => {
    setShowPreview(false);

    // If there are conflicts, show conflict resolution dialog
    if (migrationState.conflicts.length > 0) {
      setMigrationState((prev) => ({ ...prev, step: 'conflicts' }));
      setShowConflicts(true);
      return;
    }

    // No conflicts, proceed directly with migration
    performMigration([]);
  }, [migrationState.conflicts]);

  // Perform the actual migration
  const performMigration = useCallback(
    (userDecisions: MigrationDecision[] = []) => {
      setShowConflicts(false);
      setMigrationState((prev) => ({ ...prev, step: 'migrating' }));

      try {
        // Create a copy of the project to migrate
        const projectCopy = JSON.parse(JSON.stringify(project));

        const result = migrateProjectToEducationalTracks(
          projectCopy,
          { preserveOriginal: true },
          userDecisions
        );

        if (result.success) {
          setMigrationState({
            step: 'complete',
            conflicts: [],
            statistics: migrationState.statistics,
            errorMessage: null,
            migrationId: null, // Would be returned from migration function in real implementation
          });

          // Update the project
          onProjectUpdate(projectCopy);
          onMigrationComplete(
            true,
            `Successfully migrated ${result.migratedItems} timeline items to educational tracks`
          );
        } else {
          setMigrationState({
            step: 'error',
            conflicts: result.conflicts,
            statistics: migrationState.statistics,
            errorMessage: result.warnings.join(', '),
            migrationId: null,
          });
          onMigrationComplete(
            false,
            `Migration failed: ${result.warnings.join(', ')}`
          );
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred';
        setMigrationState({
          step: 'error',
          conflicts: [],
          statistics: migrationState.statistics,
          errorMessage,
          migrationId: null,
        });
        onMigrationComplete(false, `Migration failed: ${errorMessage}`);
      }
    },
    [project, migrationState.statistics, onProjectUpdate, onMigrationComplete]
  );

  // Handle conflict resolution
  const handleConflictResolution = useCallback(
    (decisions: MigrationDecision[]) => {
      performMigration(decisions);
    },
    [performMigration]
  );

  // Cancel migration
  const cancelMigration = useCallback(() => {
    setShowPreview(false);
    setShowConflicts(false);
    setMigrationState({
      step: 'idle',
      conflicts: [],
      statistics: null,
      errorMessage: null,
      migrationId: null,
    });
  }, []);

  // Rollback migration
  const handleRollback = useCallback(() => {
    if (!migrationState.migrationId) return;

    try {
      const rolledBackProject = rollbackProjectMigration(
        migrationState.migrationId
      );
      if (rolledBackProject) {
        onProjectUpdate(rolledBackProject);
        onMigrationComplete(
          true,
          'Project successfully rolled back to pre-migration state'
        );
        setMigrationState({
          step: 'idle',
          conflicts: [],
          statistics: null,
          errorMessage: null,
          migrationId: null,
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Rollback failed';
      onMigrationComplete(false, errorMessage);
    }
  }, [migrationState.migrationId, onProjectUpdate, onMigrationComplete]);

  // Get available backups
  const getAvailableBackups = useCallback(() => {
    return getProjectBackups(project.id);
  }, [project.id]);

  if (isMigrated) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <span className="text-green-600">✅</span>
          <div className="text-sm font-medium text-green-800">
            Project Already Migrated
          </div>
        </div>
        <div className="text-sm text-green-700 mt-1">
          This project has already been migrated to use educational tracks.
        </div>

        {getAvailableBackups().length > 0 && (
          <div className="mt-3">
            <button
              onClick={handleRollback}
              className="text-sm text-green-700 hover:text-green-800 underline"
            >
              View Migration History
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Migration Status */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-blue-800">
                Educational Track Migration
              </div>
              <div className="text-sm text-blue-700 mt-1">
                Convert your project to use the new educational track system
              </div>
            </div>
            <div className="flex space-x-2">
              {migrationState.step === 'idle' && (
                <button
                  onClick={startMigration}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Start Migration
                </button>
              )}
              {migrationState.step === 'migrating' && (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-blue-700">Migrating...</span>
                </div>
              )}
              {migrationState.step === 'complete' && (
                <div className="text-sm text-green-700 font-medium">
                  ✅ Migration Complete
                </div>
              )}
              {migrationState.step === 'error' && (
                <div className="text-sm text-red-700 font-medium">
                  ❌ Migration Failed
                </div>
              )}
            </div>
          </div>

          {migrationState.errorMessage && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="text-sm text-red-800">
                <strong>Error:</strong> {migrationState.errorMessage}
              </div>
            </div>
          )}
        </div>

        {/* Migration Benefits */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            Benefits of Educational Tracks
          </h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>
              • <strong>Code Track:</strong> Optimized for programming content
              with syntax highlighting
            </li>
            <li>
              • <strong>Visual Track:</strong> Perfect for screen recordings and
              visual demonstrations
            </li>
            <li>
              • <strong>Narration Track:</strong> Dedicated audio track with
              waveform visualization
            </li>
            <li>
              • <strong>You Track:</strong> Personal video content with talking
              head features
            </li>
          </ul>
        </div>
      </div>

      {/* Migration Preview Dialog */}
      {migrationState.statistics && (
        <MigrationPreviewDialog
          isOpen={showPreview}
          projectName={project.name}
          statistics={migrationState.statistics}
          onProceed={proceedWithMigration}
          onCancel={cancelMigration}
        />
      )}

      {/* Migration Conflict Resolution Dialog */}
      <MigrationConflictDialog
        isOpen={showConflicts}
        conflicts={migrationState.conflicts}
        onResolve={handleConflictResolution}
        onCancel={cancelMigration}
      />
    </>
  );
}

// Hook for using migration functionality in other components
export function useMigrationManager(project: Project) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateProject = useCallback(() => {
    return validateProjectForMigration(project);
  }, [project]);

  const previewMigration = useCallback(() => {
    return previewProjectMigration(project);
  }, [project]);

  const getStatistics = useCallback(() => {
    return getMigrationStatistics(project);
  }, [project]);

  const checkMigrationStatus = useCallback(() => {
    return isProjectMigrated(project);
  }, [project]);

  const performMigration = useCallback(
    async (userDecisions: MigrationDecision[] = []) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = migrateProjectToEducationalTracks(
          project,
          { preserveOriginal: true },
          userDecisions
        );

        if (!result.success) {
          setError(result.warnings.join(', '));
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Migration failed';
        setError(errorMessage);
        return {
          success: false,
          migratedItems: 0,
          conflicts: [],
          warnings: [errorMessage],
        };
      } finally {
        setIsLoading(false);
      }
    },
    [project]
  );

  return {
    isLoading,
    error,
    validateProject,
    previewMigration,
    getStatistics,
    checkMigrationStatus,
    performMigration,
  };
}
