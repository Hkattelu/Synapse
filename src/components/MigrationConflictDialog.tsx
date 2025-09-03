// Migration conflict resolution dialog component

import React, { useState } from 'react';
import type { MigrationConflict, MigrationDecision, EducationalTrack } from '../lib/educationalTypes';
import { EDUCATIONAL_TRACKS } from '../lib/educationalTypes';

interface MigrationConflictDialogProps {
  conflicts: MigrationConflict[];
  onResolve: (decisions: MigrationDecision[]) => void;
  onCancel: () => void;
  isOpen: boolean;
}

interface ConflictResolution {
  conflictId: string;
  selectedTrack: EducationalTrack;
  userOverride: boolean;
}

export function MigrationConflictDialog({
  conflicts,
  onResolve,
  onCancel,
  isOpen
}: MigrationConflictDialogProps) {
  const [resolutions, setResolutions] = useState<ConflictResolution[]>(() =>
    conflicts.map(conflict => ({
      conflictId: conflict.itemId,
      selectedTrack: conflict.suggestedTrack,
      userOverride: false
    }))
  );

  const handleTrackSelection = (conflictId: string, track: EducationalTrack, isOverride: boolean = false) => {
    setResolutions(prev =>
      prev.map(resolution =>
        resolution.conflictId === conflictId
          ? { ...resolution, selectedTrack: track, userOverride: isOverride }
          : resolution
      )
    );
  };

  const handleResolve = () => {
    const decisions: MigrationDecision[] = resolutions.map(resolution => ({
      conflictId: resolution.conflictId,
      selectedTrack: resolution.selectedTrack,
      userOverride: resolution.userOverride
    }));
    onResolve(decisions);
  };

  const getTrackIcon = (trackId: string) => {
    const iconMap: Record<string, string> = {
      code: '💻',
      visual: '🎥',
      narration: '🎤',
      you: '👤'
    };
    return iconMap[trackId] || '📁';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Resolve Migration Conflicts
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Some timeline items need manual track assignment. Please review and select the appropriate track for each item.
          </p>
        </div>

        <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
          <div className="space-y-6">
            {conflicts.map((conflict, index) => {
              const resolution = resolutions.find(r => r.conflictId === conflict.itemId);
              if (!resolution) return null;

              return (
                <div key={conflict.itemId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        Timeline Item #{index + 1}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Currently on Track {conflict.currentTrack + 1}
                      </p>
                    </div>
                    <div className="text-sm text-gray-500">
                      ID: {conflict.itemId}
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Reason:</strong> {conflict.reason}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{getTrackIcon(conflict.suggestedTrack.id)}</span>
                        <div>
                          <div className="font-medium text-blue-900">
                            {conflict.suggestedTrack.name} Track (Recommended)
                          </div>
                          <div className="text-sm text-blue-700">
                            Track {conflict.suggestedTrack.trackNumber + 1}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleTrackSelection(conflict.itemId, conflict.suggestedTrack, false)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          resolution.selectedTrack.id === conflict.suggestedTrack.id && !resolution.userOverride
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        Select
                      </button>
                    </div>

                    {conflict.alternatives.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Alternative Options:</h4>
                        <div className="space-y-2">
                          {conflict.alternatives.map(alternative => (
                            <div
                              key={alternative.id}
                              className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
                            >
                              <div className="flex items-center space-x-3">
                                <span className="text-lg">{getTrackIcon(alternative.id)}</span>
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {alternative.name} Track
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    Track {alternative.trackNumber + 1}
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => handleTrackSelection(conflict.itemId, alternative, true)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                  resolution.selectedTrack.id === alternative.id && resolution.userOverride
                                    ? 'bg-gray-600 text-white'
                                    : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                Override
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">All Available Tracks:</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {EDUCATIONAL_TRACKS.map(track => (
                          <button
                            key={track.id}
                            onClick={() => handleTrackSelection(conflict.itemId, track, true)}
                            className={`flex items-center space-x-2 p-2 rounded-md text-sm transition-colors ${
                              resolution.selectedTrack.id === track.id
                                ? 'bg-gray-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            <span>{getTrackIcon(track.id)}</span>
                            <span>{track.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} to resolve
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleResolve}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              Apply Resolutions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Migration preview component
interface MigrationPreviewProps {
  projectName: string;
  statistics: {
    totalItems: number;
    itemsByTrack: Record<string, number>;
    conflictCount: number;
    averageConfidence: number;
  };
  onProceed: () => void;
  onCancel: () => void;
  isOpen: boolean;
}

export function MigrationPreviewDialog({
  projectName,
  statistics,
  onProceed,
  onCancel,
  isOpen
}: MigrationPreviewProps) {
  const getTrackIcon = (trackName: string) => {
    const iconMap: Record<string, string> = {
      Code: '💻',
      Visual: '🎥',
      Narration: '🎤',
      You: '👤'
    };
    return iconMap[trackName] || '📁';
  };

  const getTrackColor = (trackName: string) => {
    const colorMap: Record<string, string> = {
      Code: '#8B5CF6',
      Visual: '#10B981',
      Narration: '#F59E0B',
      You: '#EF4444'
    };
    return colorMap[trackName] || '#6B7280';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Migration Preview
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Preview how "{projectName}" will be migrated to educational tracks
          </p>
        </div>

        <div className="px-6 py-4">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {statistics.totalItems}
                </div>
                <div className="text-sm text-gray-600">Total Items</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {Math.round(statistics.averageConfidence)}%
                </div>
                <div className="text-sm text-gray-600">Avg. Confidence</div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Items by Educational Track
              </h3>
              <div className="space-y-3">
                {Object.entries(statistics.itemsByTrack).map(([trackName, count]) => (
                  <div key={trackName} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{getTrackIcon(trackName)}</span>
                      <div>
                        <div className="font-medium text-gray-900">{trackName} Track</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-sm font-medium text-gray-900">{count} items</div>
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getTrackColor(trackName) }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {statistics.conflictCount > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <span className="text-yellow-600">⚠️</span>
                  <div className="text-sm font-medium text-yellow-800">
                    {statistics.conflictCount} conflict{statistics.conflictCount !== 1 ? 's' : ''} detected
                  </div>
                </div>
                <div className="text-sm text-yellow-700 mt-1">
                  Some items require manual track assignment and will need your review.
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-blue-800">
                <strong>What happens during migration:</strong>
              </div>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>• Timeline items will be automatically assigned to appropriate educational tracks</li>
                <li>• Track-specific default properties will be applied</li>
                <li>• Your existing properties and animations will be preserved</li>
                <li>• A backup will be created for rollback if needed</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onProceed}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            {statistics.conflictCount > 0 ? 'Proceed with Migration' : 'Migrate Project'}
          </button>
        </div>
      </div>
    </div>
  );
}