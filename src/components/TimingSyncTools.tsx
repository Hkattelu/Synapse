import React, { useState, useCallback, useRef } from 'react';
import type { TimingSyncPoint } from '../lib/audioUtils';
import { generateAutoSyncPoints } from '../lib/audioUtils';
import { Clock } from 'lucide-react';
import { Plus, Trash2, Zap, Play, Pause } from 'lucide-react';

interface TimingSyncToolsProps {
  syncPoints: TimingSyncPoint[];
  onSyncPointsChange: (syncPoints: TimingSyncPoint[]) => void;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onSeek: (time: number) => void;
  onPlayPause: () => void;
  audioBuffer?: AudioBuffer;
  className?: string;
}

export function TimingSyncTools({
  syncPoints,
  onSyncPointsChange,
  currentTime,
  duration,
  isPlaying,
  onSeek,
  onPlayPause,
  audioBuffer,
  className = '',
}: TimingSyncToolsProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSyncPoint, setSelectedSyncPoint] = useState<string | null>(null);
  const [newSyncPointLabel, setNewSyncPointLabel] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const addSyncPoint = useCallback(() => {
    const newSyncPoint: TimingSyncPoint = {
      id: `sync-${Date.now()}`,
      time: currentTime,
      label: newSyncPointLabel || `Sync Point ${syncPoints.length + 1}`,
      type: 'marker',
    };

    const updatedSyncPoints = [...syncPoints, newSyncPoint]
      .sort((a, b) => a.time - b.time);

    onSyncPointsChange(updatedSyncPoints);
    setNewSyncPointLabel('');
    setShowAddForm(false);
  }, [currentTime, newSyncPointLabel, syncPoints, onSyncPointsChange]);

  const removeSyncPoint = useCallback((id: string) => {
    const updatedSyncPoints = syncPoints.filter(point => point.id !== id);
    onSyncPointsChange(updatedSyncPoints);
    if (selectedSyncPoint === id) {
      setSelectedSyncPoint(null);
    }
  }, [syncPoints, onSyncPointsChange, selectedSyncPoint]);

  const updateSyncPoint = useCallback((id: string, updates: Partial<TimingSyncPoint>) => {
    const updatedSyncPoints = syncPoints.map(point =>
      point.id === id ? { ...point, ...updates } : point
    ).sort((a, b) => a.time - b.time);

    onSyncPointsChange(updatedSyncPoints);
  }, [syncPoints, onSyncPointsChange]);

  const generateAutoSync = useCallback(async () => {
    if (!audioBuffer) return;

    setIsGenerating(true);
    try {
      const autoSyncPoints = await generateAutoSyncPoints(audioBuffer, 0.5);
      const allSyncPoints = [...syncPoints, ...autoSyncPoints]
        .sort((a, b) => a.time - b.time);
      
      onSyncPointsChange(allSyncPoints);
    } catch (error) {
      console.error('Failed to generate auto sync points:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [audioBuffer, syncPoints, onSyncPointsChange]);

  const jumpToSyncPoint = useCallback((syncPoint: TimingSyncPoint) => {
    onSeek(syncPoint.time);
    setSelectedSyncPoint(syncPoint.id);
  }, [onSeek]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const milliseconds = Math.floor((time % 1) * 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  };

  return (
    <div className={`timing-sync-tools bg-background-subtle rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-accent-blue" />
          <h3 className="font-medium text-text-primary">Timing Synchronization</h3>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1 px-2 py-1 text-sm bg-accent-blue text-white rounded hover:bg-accent-blue-hover transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add Point
          </button>
          
          {audioBuffer && (
            <button
              onClick={generateAutoSync}
              disabled={isGenerating}
              className="flex items-center gap-1 px-2 py-1 text-sm bg-accent-yellow text-black rounded hover:bg-accent-yellow-hover transition-colors disabled:opacity-50"
            >
              <Zap className="w-3 h-3" />
              {isGenerating ? 'Generating...' : 'Auto Sync'}
            </button>
          )}
        </div>
      </div>

      {/* Add Sync Point Form */}
      {showAddForm && (
        <div className="mb-4 p-3 bg-background-hover rounded border border-border-subtle">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-text-secondary">Current Time:</span>
            <span className="text-sm font-mono text-text-primary">{formatTime(currentTime)}</span>
            <button
              onClick={onPlayPause}
              className="p-1 rounded hover:bg-background-subtle transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-3 h-3 text-text-secondary" />
              ) : (
                <Play className="w-3 h-3 text-text-secondary" />
              )}
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newSyncPointLabel}
              onChange={(e) => setNewSyncPointLabel(e.target.value)}
              placeholder="Sync point label"
              className="flex-1 px-2 py-1 text-sm bg-background-subtle border border-border-subtle rounded focus:outline-none focus:ring-1 focus:ring-accent-blue"
            />
            <button
              onClick={addSyncPoint}
              className="px-3 py-1 text-sm bg-accent-blue text-white rounded hover:bg-accent-blue-hover transition-colors"
            >
              Add
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Sync Points List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {syncPoints.length === 0 ? (
          <div className="text-center py-8 text-text-secondary">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No sync points yet</p>
            <p className="text-xs mt-1">Add sync points to align narration with other content</p>
          </div>
        ) : (
          syncPoints.map((syncPoint) => (
            <SyncPointItem
              key={syncPoint.id}
              syncPoint={syncPoint}
              isSelected={selectedSyncPoint === syncPoint.id}
              onSelect={() => jumpToSyncPoint(syncPoint)}
              onUpdate={(updates) => updateSyncPoint(syncPoint.id, updates)}
              onRemove={() => removeSyncPoint(syncPoint.id)}
            />
          ))
        )}
      </div>

      {/* Quick Actions */}
      {syncPoints.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border-subtle">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">
              {syncPoints.length} sync point{syncPoints.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => onSyncPointsChange([])}
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-4 p-3 bg-background-hover rounded text-sm text-text-secondary">
        <p>
          Sync points help align narration with visual content. Use "Add Point" to mark important moments,
          or "Auto Sync" to automatically detect pauses in your narration.
        </p>
      </div>
    </div>
  );
}

// Individual sync point item component
interface SyncPointItemProps {
  syncPoint: TimingSyncPoint;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<TimingSyncPoint>) => void;
  onRemove: () => void;
}

function SyncPointItem({
  syncPoint,
  isSelected,
  onSelect,
  onUpdate,
  onRemove,
}: SyncPointItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(syncPoint.label);
  const [editTime, setEditTime] = useState(syncPoint.time);

  const handleSave = useCallback(() => {
    onUpdate({
      label: editLabel,
      time: editTime,
    });
    setIsEditing(false);
  }, [editLabel, editTime, onUpdate]);

  const handleCancel = useCallback(() => {
    setEditLabel(syncPoint.label);
    setEditTime(syncPoint.time);
    setIsEditing(false);
  }, [syncPoint.label, syncPoint.time]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const milliseconds = Math.floor((time % 1) * 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  };

  const getTypeIcon = (type: TimingSyncPoint['type']) => {
    switch (type) {
      case 'word':
        return '📝';
      case 'sentence':
        return '📄';
      case 'paragraph':
        return '📋';
      default:
        return '📍';
    }
  };

  const getTypeColor = (type: TimingSyncPoint['type']) => {
    switch (type) {
      case 'word':
        return 'text-blue-400';
      case 'sentence':
        return 'text-green-400';
      case 'paragraph':
        return 'text-purple-400';
      default:
        return 'text-yellow-400';
    }
  };

  if (isEditing) {
    return (
      <div className="p-3 bg-background-hover rounded border border-border-subtle">
        <div className="space-y-2">
          <input
            type="text"
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
            className="w-full px-2 py-1 text-sm bg-background-subtle border border-border-subtle rounded focus:outline-none focus:ring-1 focus:ring-accent-blue"
          />
          
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={editTime}
              onChange={(e) => setEditTime(parseFloat(e.target.value))}
              step="0.1"
              min="0"
              className="flex-1 px-2 py-1 text-sm bg-background-subtle border border-border-subtle rounded focus:outline-none focus:ring-1 focus:ring-accent-blue"
            />
            <span className="text-xs text-text-secondary">seconds</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="px-2 py-1 text-xs bg-accent-blue text-white rounded hover:bg-accent-blue-hover transition-colors"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-2 py-1 text-xs text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-3 rounded border transition-all cursor-pointer ${
        isSelected
          ? 'bg-accent-blue bg-opacity-10 border-accent-blue'
          : 'bg-background-hover border-border-subtle hover:border-border-hover'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-lg">{getTypeIcon(syncPoint.type)}</span>
          <div className="flex-1">
            <div className="font-medium text-text-primary text-sm">{syncPoint.label}</div>
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <span className="font-mono">{formatTime(syncPoint.time)}</span>
              <span className={`capitalize ${getTypeColor(syncPoint.type)}`}>
                {syncPoint.type}
              </span>
              {syncPoint.confidence && (
                <span className="text-text-tertiary">
                  {Math.round(syncPoint.confidence * 100)}% confidence
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            className="p-1 text-text-secondary hover:text-text-primary transition-colors"
            title="Edit sync point"
          >
            ✏️
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-1 text-text-secondary hover:text-red-400 transition-colors"
            title="Remove sync point"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}