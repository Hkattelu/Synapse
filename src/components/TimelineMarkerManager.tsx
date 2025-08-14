import React, { useState, useCallback } from 'react';
import { useProject, useTimeline } from '../state/hooks';
import type { TimelineMarker, TimelineRegion } from '../lib/types';
import { generateId } from '../lib/utils';

interface TimelineMarkerManagerProps {
  className?: string;
  currentTime?: number;
  onMarkerSelect?: (marker: TimelineMarker) => void;
  onRegionSelect?: (region: TimelineRegion) => void;
}

const MARKER_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
];

export function TimelineMarkerManager({
  className = '',
  currentTime = 0,
  onMarkerSelect,
  onRegionSelect,
}: TimelineMarkerManagerProps) {
  const { project: currentProject, updateProject } = useProject();
  const { timelineDuration } = useTimeline();

  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['markers'])
  );
  const [newMarkerName, setNewMarkerName] = useState('');
  const [newRegionName, setNewRegionName] = useState('');
  const [newRegionStart, setNewRegionStart] = useState(0);
  const [newRegionEnd, setNewRegionEnd] = useState(5);
  const [showAddMarker, setShowAddMarker] = useState(false);
  const [showAddRegion, setShowAddRegion] = useState(false);

  // Get markers and regions from project
  const markers = currentProject?.markers || [];
  const regions = currentProject?.regions || [];

  const toggleSection = useCallback((section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  }, []);

  // Create new marker
  const createMarker = useCallback(() => {
    if (!newMarkerName.trim() || !currentProject) return;

    const newMarker: TimelineMarker = {
      id: generateId(),
      name: newMarkerName.trim(),
      time: currentTime,
      color: MARKER_COLORS[markers.length % MARKER_COLORS.length],
      description: '',
    };

    const updatedMarkers = [...markers, newMarker].sort(
      (a, b) => a.time - b.time
    );
    updateProject({ markers: updatedMarkers });

    setNewMarkerName('');
    setShowAddMarker(false);
  }, [newMarkerName, currentTime, currentProject, markers, updateProject]);

  // Create new region
  const createRegion = useCallback(() => {
    if (!newRegionName.trim() || !currentProject) return;

    const startTime = Math.min(newRegionStart, newRegionEnd);
    const endTime = Math.max(newRegionStart, newRegionEnd);

    const newRegion: TimelineRegion = {
      id: generateId(),
      name: newRegionName.trim(),
      startTime: Math.max(0, startTime),
      endTime: Math.min(timelineDuration, endTime),
      color: MARKER_COLORS[regions.length % MARKER_COLORS.length],
      description: '',
    };

    const updatedRegions = [...regions, newRegion].sort(
      (a, b) => a.startTime - b.startTime
    );
    updateProject({ regions: updatedRegions });

    setNewRegionName('');
    setNewRegionStart(0);
    setNewRegionEnd(5);
    setShowAddRegion(false);
  }, [
    newRegionName,
    newRegionStart,
    newRegionEnd,
    currentProject,
    regions,
    timelineDuration,
    updateProject,
  ]);

  // Update marker
  const updateMarker = useCallback(
    (markerId: string, updates: Partial<TimelineMarker>) => {
      if (!currentProject) return;

      const updatedMarkers = markers
        .map((marker) =>
          marker.id === markerId ? { ...marker, ...updates } : marker
        )
        .sort((a, b) => a.time - b.time);

      updateProject({ markers: updatedMarkers });
    },
    [markers, currentProject, updateProject]
  );

  // Update region
  const updateRegion = useCallback(
    (regionId: string, updates: Partial<TimelineRegion>) => {
      if (!currentProject) return;

      const updatedRegions = regions
        .map((region) =>
          region.id === regionId ? { ...region, ...updates } : region
        )
        .sort((a, b) => a.startTime - b.startTime);

      updateProject({ regions: updatedRegions });
    },
    [regions, currentProject, updateProject]
  );

  // Delete marker
  const deleteMarker = useCallback(
    (markerId: string) => {
      if (!currentProject) return;

      const updatedMarkers = markers.filter((marker) => marker.id !== markerId);
      updateProject({ markers: updatedMarkers });
    },
    [markers, currentProject, updateProject]
  );

  // Delete region
  const deleteRegion = useCallback(
    (regionId: string) => {
      if (!currentProject) return;

      const updatedRegions = regions.filter((region) => region.id !== regionId);
      updateProject({ regions: updatedRegions });
    },
    [regions, currentProject, updateProject]
  );

  // Jump to marker/region
  const jumpToMarker = useCallback(
    (marker: TimelineMarker) => {
      onMarkerSelect?.(marker);
    },
    [onMarkerSelect]
  );

  const jumpToRegion = useCallback(
    (region: TimelineRegion) => {
      onRegionSelect?.(region);
    },
    [onRegionSelect]
  );

  // Format time for display
  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = (time % 60).toFixed(1);
    return `${minutes}:${seconds.padStart(4, '0')}`;
  }, []);

  return (
    <div
      className={`timeline-marker-manager bg-gray-900 border-l border-gray-700 ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white">Timeline Markers</h3>
        <div className="text-sm text-gray-400">
          {markers.length} markers • {regions.length} regions
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Markers Section */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => toggleSection('markers')}
              className="flex items-center text-left text-sm font-medium text-white hover:text-gray-300"
            >
              <svg
                className={`w-4 h-4 mr-2 transition-transform ${
                  expandedSections.has('markers') ? 'rotate-90' : ''
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
              Markers ({markers.length})
            </button>

            <button
              onClick={() => setShowAddMarker(!showAddMarker)}
              className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
              title="Add Marker"
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

          {/* Add Marker Form */}
          {showAddMarker && (
            <div className="mb-4 p-3 bg-gray-800 rounded">
              <input
                type="text"
                placeholder="Marker name..."
                value={newMarkerName}
                onChange={(e) => setNewMarkerName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && createMarker()}
                className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded text-white mb-2"
                autoFocus
              />
              <div className="text-xs text-gray-400 mb-2">
                Will be created at current time: {formatTime(currentTime)}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={createMarker}
                  className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowAddMarker(false);
                    setNewMarkerName('');
                  }}
                  className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Markers List */}
          {expandedSections.has('markers') && (
            <div className="space-y-2">
              {markers.map((marker) => (
                <MarkerItem
                  key={marker.id}
                  marker={marker}
                  isActive={Math.abs(currentTime - marker.time) < 0.1}
                  onUpdate={(updates) => updateMarker(marker.id, updates)}
                  onDelete={() => deleteMarker(marker.id)}
                  onJump={() => jumpToMarker(marker)}
                  formatTime={formatTime}
                />
              ))}

              {markers.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  <p>No markers yet</p>
                  <p className="text-xs">
                    Add markers to mark important timeline positions
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Regions Section */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => toggleSection('regions')}
              className="flex items-center text-left text-sm font-medium text-white hover:text-gray-300"
            >
              <svg
                className={`w-4 h-4 mr-2 transition-transform ${
                  expandedSections.has('regions') ? 'rotate-90' : ''
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
              Regions ({regions.length})
            </button>

            <button
              onClick={() => setShowAddRegion(!showAddRegion)}
              className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
              title="Add Region"
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

          {/* Add Region Form */}
          {showAddRegion && (
            <div className="mb-4 p-3 bg-gray-800 rounded">
              <input
                type="text"
                placeholder="Region name..."
                value={newRegionName}
                onChange={(e) => setNewRegionName(e.target.value)}
                className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded text-white mb-2"
              />

              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Start Time
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={timelineDuration}
                    step="0.1"
                    value={newRegionStart}
                    onChange={(e) =>
                      setNewRegionStart(parseFloat(e.target.value))
                    }
                    className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    End Time
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={timelineDuration}
                    step="0.1"
                    value={newRegionEnd}
                    onChange={(e) =>
                      setNewRegionEnd(parseFloat(e.target.value))
                    }
                    className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
                  />
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={createRegion}
                  className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowAddRegion(false);
                    setNewRegionName('');
                    setNewRegionStart(0);
                    setNewRegionEnd(5);
                  }}
                  className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Regions List */}
          {expandedSections.has('regions') && (
            <div className="space-y-2">
              {regions.map((region) => (
                <RegionItem
                  key={region.id}
                  region={region}
                  isActive={
                    currentTime >= region.startTime &&
                    currentTime <= region.endTime
                  }
                  onUpdate={(updates) => updateRegion(region.id, updates)}
                  onDelete={() => deleteRegion(region.id)}
                  onJump={() => jumpToRegion(region)}
                  formatTime={formatTime}
                  maxTime={timelineDuration}
                />
              ))}

              {regions.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  <p>No regions yet</p>
                  <p className="text-xs">
                    Add regions to mark sections of your timeline
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Marker Item Component
interface MarkerItemProps {
  marker: TimelineMarker;
  isActive: boolean;
  onUpdate: (updates: Partial<TimelineMarker>) => void;
  onDelete: () => void;
  onJump: () => void;
  formatTime: (time: number) => string;
}

function MarkerItem({
  marker,
  isActive,
  onUpdate,
  onDelete,
  onJump,
  formatTime,
}: MarkerItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(marker.name);

  const handleSave = useCallback(() => {
    if (editName.trim()) {
      onUpdate({ name: editName.trim() });
    }
    setIsEditing(false);
  }, [editName, onUpdate]);

  const handleCancel = useCallback(() => {
    setEditName(marker.name);
    setIsEditing(false);
  }, [marker.name]);

  return (
    <div
      className={`p-2 rounded border transition-all ${
        isActive ? 'bg-blue-900 border-blue-600' : 'bg-gray-800 border-gray-700'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 flex-1">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: marker.color }}
          />

          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') handleCancel();
              }}
              onBlur={handleSave}
              className="flex-1 px-1 py-0 text-sm bg-gray-700 border border-gray-600 rounded text-white"
              autoFocus
            />
          ) : (
            <span
              className="text-sm text-white cursor-pointer flex-1"
              onClick={() => setIsEditing(true)}
            >
              {marker.name}
            </span>
          )}

          <span className="text-xs text-gray-400">
            {formatTime(marker.time)}
          </span>
        </div>

        <div className="flex space-x-1">
          <button
            onClick={onJump}
            className="p-1 text-gray-400 hover:text-blue-400 transition-colors"
            title="Jump to Marker"
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
                d="M13 9l3 3-3 3m-6-3h9"
              />
            </svg>
          </button>

          <button
            onClick={onDelete}
            className="p-1 text-red-400 hover:text-red-300 transition-colors"
            title="Delete Marker"
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
    </div>
  );
}

// Region Item Component
interface RegionItemProps {
  region: TimelineRegion;
  isActive: boolean;
  onUpdate: (updates: Partial<TimelineRegion>) => void;
  onDelete: () => void;
  onJump: () => void;
  formatTime: (time: number) => string;
  maxTime: number;
}

function RegionItem({
  region,
  isActive,
  onUpdate,
  onDelete,
  onJump,
  formatTime,
  maxTime,
}: RegionItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(region.name);
  const [editStart, setEditStart] = useState(region.startTime);
  const [editEnd, setEditEnd] = useState(region.endTime);

  const handleSave = useCallback(() => {
    if (editName.trim()) {
      const startTime = Math.min(editStart, editEnd);
      const endTime = Math.max(editStart, editEnd);

      onUpdate({
        name: editName.trim(),
        startTime: Math.max(0, startTime),
        endTime: Math.min(maxTime, endTime),
      });
    }
    setIsEditing(false);
  }, [editName, editStart, editEnd, maxTime, onUpdate]);

  const handleCancel = useCallback(() => {
    setEditName(region.name);
    setEditStart(region.startTime);
    setEditEnd(region.endTime);
    setIsEditing(false);
  }, [region]);

  return (
    <div
      className={`p-2 rounded border transition-all ${
        isActive
          ? 'bg-green-900 border-green-600'
          : 'bg-gray-800 border-gray-700'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center space-x-2 flex-1">
          <div
            className="w-3 h-3 rounded"
            style={{ backgroundColor: region.color }}
          />

          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') handleCancel();
              }}
              className="flex-1 px-1 py-0 text-sm bg-gray-700 border border-gray-600 rounded text-white"
            />
          ) : (
            <span
              className="text-sm text-white cursor-pointer flex-1"
              onClick={() => setIsEditing(true)}
            >
              {region.name}
            </span>
          )}
        </div>

        <div className="flex space-x-1">
          <button
            onClick={onJump}
            className="p-1 text-gray-400 hover:text-green-400 transition-colors"
            title="Jump to Region"
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
                d="M13 9l3 3-3 3m-6-3h9"
              />
            </svg>
          </button>

          <button
            onClick={onDelete}
            className="p-1 text-red-400 hover:text-red-300 transition-colors"
            title="Delete Region"
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

      {isEditing ? (
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Start</label>
            <input
              type="number"
              min="0"
              max={maxTime}
              step="0.1"
              value={editStart}
              onChange={(e) => setEditStart(parseFloat(e.target.value))}
              className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">End</label>
            <input
              type="number"
              min="0"
              max={maxTime}
              step="0.1"
              value={editEnd}
              onChange={(e) => setEditEnd(parseFloat(e.target.value))}
              className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
            />
          </div>
        </div>
      ) : (
        <div className="text-xs text-gray-400">
          {formatTime(region.startTime)} - {formatTime(region.endTime)}
          <span className="ml-2">
            ({formatTime(region.endTime - region.startTime)} duration)
          </span>
        </div>
      )}
    </div>
  );
}
