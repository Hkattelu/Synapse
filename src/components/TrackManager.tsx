import React, { useState, useCallback } from 'react';
import { useTimeline, useProject } from '../state/hooks';
import type { TrackGroup } from '../lib/types';
import { generateId } from '../lib/utils';

interface TrackManagerProps {
  className?: string;
  onTrackGroupChange?: (groups: TrackGroup[]) => void;
}

export function TrackManager({
  className = '',
  onTrackGroupChange,
}: TrackManagerProps) {
  const { timeline, selectedItems, selectTimelineItems } = useTimeline();
  const { project: currentProject, updateProject } = useProject();

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [newGroupName, setNewGroupName] = useState('');
  const [showAddGroup, setShowAddGroup] = useState(false);

  // Get track groups from project or create default structure
  const trackGroups = currentProject?.trackGroups || [];

  // Calculate track usage statistics
  const trackStats = React.useMemo(() => {
    const stats: Record<
      number,
      { itemCount: number; duration: number; types: Set<string> }
    > = {};

    timeline.forEach((item) => {
      if (!stats[item.track]) {
        stats[item.track] = { itemCount: 0, duration: 0, types: new Set() };
      }
      stats[item.track].itemCount++;
      stats[item.track].duration += item.duration;
      stats[item.track].types.add(item.type);
    });

    return stats;
  }, [timeline]);

  const maxTrack = Math.max(
    ...timeline.map((item) => item.track),
    ...trackGroups.flatMap((g) => g.tracks),
    3
  );

  // Toggle group expansion
  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }, []);

  // Create new track group
  const createTrackGroup = useCallback(() => {
    if (!newGroupName.trim()) return;

    const newGroup: TrackGroup = {
      id: generateId(),
      name: newGroupName.trim(),
      tracks: [],
      color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      visible: true,
      locked: false,
      solo: false,
    };

    const updatedGroups = [...trackGroups, newGroup];

    if (currentProject) {
      updateProject({ trackGroups: updatedGroups });
    }

    onTrackGroupChange?.(updatedGroups);
    setNewGroupName('');
    setShowAddGroup(false);
  }, [
    newGroupName,
    trackGroups,
    currentProject,
    updateProject,
    onTrackGroupChange,
  ]);

  // Add track to group
  const addTrackToGroup = useCallback(
    (groupId: string, trackIndex: number) => {
      const updatedGroups = trackGroups.map((group) =>
        group.id === groupId
          ? { ...group, tracks: [...new Set([...group.tracks, trackIndex])] }
          : group
      );

      if (currentProject) {
        updateProject({ trackGroups: updatedGroups });
      }

      onTrackGroupChange?.(updatedGroups);
    },
    [trackGroups, currentProject, updateProject, onTrackGroupChange]
  );

  // Remove track from group
  const removeTrackFromGroup = useCallback(
    (groupId: string, trackIndex: number) => {
      const updatedGroups = trackGroups.map((group) =>
        group.id === groupId
          ? { ...group, tracks: group.tracks.filter((t) => t !== trackIndex) }
          : group
      );

      if (currentProject) {
        updateProject({ trackGroups: updatedGroups });
      }

      onTrackGroupChange?.(updatedGroups);
    },
    [trackGroups, currentProject, updateProject, onTrackGroupChange]
  );

  // Update group properties
  const updateTrackGroup = useCallback(
    (groupId: string, updates: Partial<TrackGroup>) => {
      const updatedGroups = trackGroups.map((group) =>
        group.id === groupId ? { ...group, ...updates } : group
      );

      if (currentProject) {
        updateProject({ trackGroups: updatedGroups });
      }

      onTrackGroupChange?.(updatedGroups);
    },
    [trackGroups, currentProject, updateProject, onTrackGroupChange]
  );

  // Delete group
  const deleteTrackGroup = useCallback(
    (groupId: string) => {
      const updatedGroups = trackGroups.filter((group) => group.id !== groupId);

      if (currentProject) {
        updateProject({ trackGroups: updatedGroups });
      }

      onTrackGroupChange?.(updatedGroups);
    },
    [trackGroups, currentProject, updateProject, onTrackGroupChange]
  );

  // Select all items in track
  const selectTrackItems = useCallback(
    (trackIndex: number) => {
      const trackItems = timeline
        .filter((item) => item.track === trackIndex)
        .map((item) => item.id);
      selectTimelineItems(trackItems);
    },
    [timeline, selectTimelineItems]
  );

  // Get items for a specific track
  const getTrackItems = useCallback(
    (trackIndex: number) => {
      return timeline.filter((item) => item.track === trackIndex);
    },
    [timeline]
  );

  // Check if track is in any group
  const getTrackGroup = useCallback(
    (trackIndex: number) => {
      return trackGroups.find((group) => group.tracks.includes(trackIndex));
    },
    [trackGroups]
  );

  // Get track type color
  const getTrackTypeColor = useCallback((types: Set<string>) => {
    if (types.has('video')) return 'bg-blue-500';
    if (types.has('audio')) return 'bg-green-500';
    if (types.has('code')) return 'bg-purple-500';
    if (types.has('title')) return 'bg-orange-500';
    return 'bg-gray-500';
  }, []);

  return (
    <div
      className={`track-manager bg-gray-900 border-r border-gray-700 ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-white">Track Manager</h3>
          <button
            onClick={() => setShowAddGroup(!showAddGroup)}
            className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
            title="Add Track Group"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>

        {/* Add Group Form */}
        {showAddGroup && (
          <div className="mt-3 p-3 bg-gray-800 rounded">
            <input
              type="text"
              placeholder="Group name..."
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createTrackGroup()}
              className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded text-white mb-2"
              autoFocus
            />
            <div className="flex space-x-2">
              <button
                onClick={createTrackGroup}
                className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowAddGroup(false);
                  setNewGroupName('');
                }}
                className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Track Groups */}
      <div className="flex-1 overflow-y-auto">
        {trackGroups.length > 0 && (
          <div className="p-4 border-b border-gray-700">
            <h4 className="text-sm font-medium text-gray-400 mb-3">
              Track Groups
            </h4>
            <div className="space-y-2">
              {trackGroups.map((group) => (
                <div key={group.id} className="bg-gray-800 rounded">
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleGroup(group.id)}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          <svg
                            className={`w-4 h-4 transition-transform ${
                              expandedGroups.has(group.id) ? 'rotate-90' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </button>

                        <div
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: group.color }}
                        />

                        <span className="text-sm font-medium text-white">
                          {group.name}
                        </span>
                        <span className="text-xs text-gray-400">
                          ({group.tracks.length} tracks)
                        </span>
                      </div>

                      <div className="flex items-center space-x-1">
                        {/* Visibility Toggle */}
                        <button
                          onClick={() =>
                            updateTrackGroup(group.id, {
                              visible: !group.visible,
                            })
                          }
                          className={`p-1 rounded transition-colors ${
                            group.visible
                              ? 'text-blue-400 hover:text-blue-300'
                              : 'text-gray-500 hover:text-gray-400'
                          }`}
                          title={group.visible ? 'Hide' : 'Show'}
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d={
                                group.visible
                                  ? 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                                  : 'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21'
                              }
                            />
                          </svg>
                        </button>

                        {/* Solo Toggle */}
                        <button
                          onClick={() =>
                            updateTrackGroup(group.id, { solo: !group.solo })
                          }
                          className={`p-1 rounded transition-colors ${
                            group.solo
                              ? 'text-yellow-400 hover:text-yellow-300'
                              : 'text-gray-500 hover:text-gray-400'
                          }`}
                          title={group.solo ? 'Unsolo' : 'Solo'}
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.536 11.293l-1.414-1.414a1 1 0 00-1.414 0l-2.828 2.828a1 1 0 000 1.414l1.414 1.414a1 1 0 001.414 0l2.828-2.828a1 1 0 000-1.414z"
                            />
                          </svg>
                        </button>

                        {/* Lock Toggle */}
                        <button
                          onClick={() =>
                            updateTrackGroup(group.id, {
                              locked: !group.locked,
                            })
                          }
                          className={`p-1 rounded transition-colors ${
                            group.locked
                              ? 'text-red-400 hover:text-red-300'
                              : 'text-gray-500 hover:text-gray-400'
                          }`}
                          title={group.locked ? 'Unlock' : 'Lock'}
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d={
                                group.locked
                                  ? 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                                  : 'M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z'
                              }
                            />
                          </svg>
                        </button>

                        {/* Delete Group */}
                        <button
                          onClick={() => deleteTrackGroup(group.id)}
                          className="p-1 text-red-500 hover:text-red-400 transition-colors"
                          title="Delete Group"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Group Tracks */}
                    {expandedGroups.has(group.id) && (
                      <div className="mt-3 pl-6 space-y-1">
                        {group.tracks.map((trackIndex) => {
                          const items = getTrackItems(trackIndex);
                          const stats = trackStats[trackIndex];

                          return (
                            <div
                              key={trackIndex}
                              className="flex items-center justify-between py-1 px-2 bg-gray-700 rounded text-xs"
                            >
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-300">
                                  Track {trackIndex + 1}
                                </span>
                                {stats && (
                                  <>
                                    <div
                                      className={`w-2 h-2 rounded ${getTrackTypeColor(stats.types)}`}
                                      title={Array.from(stats.types).join(', ')}
                                    />
                                    <span className="text-gray-400">
                                      {stats.itemCount} items •{' '}
                                      {Math.round(stats.duration * 10) / 10}s
                                    </span>
                                  </>
                                )}
                              </div>

                              <div className="flex space-x-1">
                                <button
                                  onClick={() => selectTrackItems(trackIndex)}
                                  className="text-gray-400 hover:text-blue-400 transition-colors"
                                  title="Select All Items"
                                >
                                  <svg
                                    className="w-3 h-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                </button>
                                <button
                                  onClick={() =>
                                    removeTrackFromGroup(group.id, trackIndex)
                                  }
                                  className="text-gray-400 hover:text-red-400 transition-colors"
                                  title="Remove from Group"
                                >
                                  <svg
                                    className="w-3 h-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M6 18L18 6M6 6l12 12"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {group.tracks.length === 0 && (
                          <div className="text-xs text-gray-500 text-center py-2">
                            No tracks in this group
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Individual Tracks */}
        <div className="p-4">
          <h4 className="text-sm font-medium text-gray-400 mb-3">All Tracks</h4>
          <div className="space-y-2">
            {Array.from({ length: maxTrack + 1 }).map((_, trackIndex) => {
              const items = getTrackItems(trackIndex);
              const stats = trackStats[trackIndex];
              const group = getTrackGroup(trackIndex);
              const isSelected = selectedItems.some(
                (id) =>
                  timeline.find((item) => item.id === id)?.track === trackIndex
              );

              return (
                <div
                  key={trackIndex}
                  className={`p-2 rounded border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-900 border-blue-600'
                      : 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                  }`}
                  onClick={() => selectTrackItems(trackIndex)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-white">
                        Track {trackIndex + 1}
                      </span>
                      {stats && (
                        <>
                          <div
                            className={`w-2 h-2 rounded ${getTrackTypeColor(stats.types)}`}
                            title={Array.from(stats.types).join(', ')}
                          />
                          <span className="text-xs text-gray-400">
                            {stats.itemCount} items •{' '}
                            {Math.round(stats.duration * 10) / 10}s
                          </span>
                        </>
                      )}
                      {group && (
                        <div className="flex items-center space-x-1">
                          <div
                            className="w-2 h-2 rounded"
                            style={{ backgroundColor: group.color }}
                          />
                          <span className="text-xs text-gray-400">
                            {group.name}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Track Actions */}
                    <div className="flex space-x-1">
                      {trackGroups.length > 0 && !group && (
                        <div className="relative group">
                          <button className="text-gray-400 hover:text-blue-400 transition-colors">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                              />
                            </svg>
                          </button>
                          <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                            <div className="py-1">
                              {trackGroups.map((g) => (
                                <button
                                  key={g.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addTrackToGroup(g.id, trackIndex);
                                  }}
                                  className="w-full px-3 py-1 text-left text-xs text-white hover:bg-gray-700 transition-colors whitespace-nowrap"
                                >
                                  Add to {g.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {items.length === 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      Empty track
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
