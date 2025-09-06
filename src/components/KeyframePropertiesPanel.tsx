import { useState, useCallback } from 'react';
import { useTimeline } from '../state/hooks';
import type { TimelineItem, Keyframe } from '../lib/types';
import { KeyframeManager } from '../lib/keyframes';

interface KeyframePropertiesPanelProps {
  selectedItem: TimelineItem | null;
  selectedKeyframes: string[];
  className?: string;
  onKeyframeUpdate?: (itemId: string, keyframes: Keyframe[]) => void;
}

const EASING_OPTIONS = [
  { value: 'linear', label: 'Linear' },
  { value: 'easeIn', label: 'Ease In' },
  { value: 'easeOut', label: 'Ease Out' },
  { value: 'easeInOut', label: 'Ease In Out' },
  { value: 'bounce', label: 'Bounce' },
  { value: 'elastic', label: 'Elastic' },
  { value: 'back', label: 'Back' },
];

const PROPERTY_TYPES = [
  {
    key: 'opacity',
    label: 'Opacity',
    type: 'range',
    min: 0,
    max: 1,
    step: 0.01,
    default: 1,
  },
  {
    key: 'scale',
    label: 'Scale',
    type: 'range',
    min: 0.1,
    max: 5,
    step: 0.01,
    default: 1,
  },
  {
    key: 'x',
    label: 'Position X',
    type: 'range',
    min: -1000,
    max: 1000,
    step: 1,
    default: 0,
  },
  {
    key: 'y',
    label: 'Position Y',
    type: 'range',
    min: -1000,
    max: 1000,
    step: 1,
    default: 0,
  },
  {
    key: 'rotation',
    label: 'Rotation',
    type: 'range',
    min: -360,
    max: 360,
    step: 1,
    default: 0,
  },
];

export function KeyframePropertiesPanel({
  selectedItem,
  selectedKeyframes,
  className = '',
  onKeyframeUpdate,
}: KeyframePropertiesPanelProps) {
  const { updateTimelineItem } = useTimeline();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['properties'])
  );

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

  const handleKeyframeUpdate = useCallback(
    (updatedItem: TimelineItem) => {
      if (onKeyframeUpdate) {
        onKeyframeUpdate(updatedItem.id, updatedItem.keyframes ?? []);
      } else {
        updateTimelineItem(updatedItem.id, {
          keyframes: updatedItem.keyframes,
        });
      }
    },
    [onKeyframeUpdate, updateTimelineItem]
  );

  const addKeyframeForProperty = useCallback(
    (property: string) => {
      if (!selectedItem) return;

      const currentValue =
        selectedItem.properties[
          property as keyof typeof selectedItem.properties
        ];
      const propertyDef = PROPERTY_TYPES.find((p) => p.key === property);
      const value = currentValue ?? propertyDef?.default ?? 0;

      const keyframe: Omit<Keyframe, 'id'> = {
        time: 0,
        properties: { [property]: value },
        easing: 'linear' as const,
      };

      const updatedItem = KeyframeManager.addKeyframe(
        selectedItem,
        keyframe as Keyframe
      );
      handleKeyframeUpdate(updatedItem);
    },
    [selectedItem, handleKeyframeUpdate]
  );

  const updateKeyframeProperty = useCallback(
    (keyframeId: string, property: string, value: any) => {
      if (!selectedItem) return;

      const keyframe = (selectedItem.keyframes ?? []).find((k) => k.id === keyframeId);
      if (!keyframe) return;

      const updatedKeyframe = {
        ...keyframe,
        properties: {
          ...keyframe.properties,
          [property]: value,
        },
      };

      const updatedItem = KeyframeManager.updateKeyframe(
        selectedItem,
        keyframeId,
        updatedKeyframe
      );
      handleKeyframeUpdate(updatedItem);
    },
    [selectedItem, handleKeyframeUpdate]
  );

  const updateKeyframeTime = useCallback(
    (keyframeId: string, time: number) => {
      if (!selectedItem) return;

      const clampedTime = Math.max(0, Math.min(time, selectedItem.duration));
      const updatedItem = KeyframeManager.updateKeyframe(
        selectedItem,
        keyframeId,
        { time: clampedTime }
      );
      handleKeyframeUpdate(updatedItem);
    },
    [selectedItem, handleKeyframeUpdate]
  );

  const updateKeyframeEasing = useCallback(
    (keyframeId: string, easing: string) => {
      if (!selectedItem) return;

      const updatedItem = KeyframeManager.updateKeyframe(
        selectedItem,
        keyframeId,
        {
          easing: easing as Keyframe['easing'],
        }
      );
      handleKeyframeUpdate(updatedItem);
    },
    [selectedItem, handleKeyframeUpdate]
  );

  const deleteKeyframe = useCallback(
    (keyframeId: string) => {
      if (!selectedItem) return;

      const updatedItem = KeyframeManager.removeKeyframe(
        selectedItem,
        keyframeId
      );
      handleKeyframeUpdate(updatedItem);
    },
    [selectedItem, handleKeyframeUpdate]
  );

  const duplicateKeyframe = useCallback(
    (keyframeId: string) => {
      if (!selectedItem) return;

      const keyframe = (selectedItem.keyframes ?? []).find((k) => k.id === keyframeId);
      if (!keyframe) return;

      const newKeyframe: Omit<Keyframe, 'id'> = {
        ...keyframe,
        time: Math.min(keyframe.time + 1, selectedItem.duration),
      };

      const updatedItem = KeyframeManager.addKeyframe(
        selectedItem,
        newKeyframe as Keyframe
      );
      handleKeyframeUpdate(updatedItem);
    },
    [selectedItem, handleKeyframeUpdate]
  );

  const renderPropertyInput = useCallback(
    (property: any, value: any, onChange: (value: any) => void) => {
      switch (property.type) {
        case 'range':
          return (
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min={property.min}
                max={property.max}
                step={property.step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="flex-1 h-2 bg-synapse-surface-hover rounded-lg appearance-none cursor-pointer slider"
              />
              <input
                type="number"
                min={property.min}
                max={property.max}
                step={property.step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-16 px-2 py-1 text-xs bg-background-secondary border border-border-subtle rounded text-text-primary"
              />
            </div>
          );
        default:
          return (
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full px-2 py-1 text-xs bg-background-secondary border border-border-subtle rounded text-text-primary"
            />
          );
      }
    },
    []
  );

  if (!selectedItem) {
    return (
      <div
        className={`keyframe-properties-panel bg-background-secondary border-l border-border-subtle p-4 ${className}`}
      >
        <div className="text-center text-text-secondary">
          <p>Select a timeline item to edit keyframes</p>
        </div>
      </div>
    );
  }

  const selectedKeyframeObjects = (selectedItem.keyframes ?? []).filter((k) =>
    selectedKeyframes.includes(k.id)
  );

  return (
    <div
      className={`keyframe-properties-panel bg-background-secondary border-l border-border-subtle ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-border-subtle">
        <h3 className="text-lg font-semibold text-text-primary">
          Keyframe Properties
        </h3>
        <div className="text-sm text-text-secondary">
          {(selectedItem.keyframes?.length ?? 0)} keyframe
          {(selectedItem.keyframes?.length ?? 0) !== 1 ? 's' : ''} total
          {selectedKeyframes.length > 0 && (
            <span className="ml-2">• {selectedKeyframes.length} selected</span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Add New Keyframes Section */}
        <div className="p-4 border-b border-border-subtle">
          <button
            onClick={() => toggleSection('add-keyframes')}
            className="flex items-center justify-between w-full text-left text-sm font-medium text-text-primary hover:text-text-secondary"
          >
            <span>Add Keyframes</span>
            <svg
              className={`w-4 h-4 transition-transform ${
                expandedSections.has('add-keyframes') ? 'rotate-90' : ''
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

          {expandedSections.has('add-keyframes') && (
            <div className="mt-3 space-y-2">
              {PROPERTY_TYPES.map((property) => (
                <button
                  key={property.key}
                  onClick={() => addKeyframeForProperty(property.key)}
                  className="w-full px-3 py-2 text-left text-sm bg-synapse-surface hover:bg-synapse-surface-hover rounded transition-colors text-text-primary"
                >
                  Add {property.label} Keyframe
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Keyframes Section */}
        {selectedKeyframeObjects.length > 0 && (
          <div className="p-4 border-b border-border-subtle">
            <button
              onClick={() => toggleSection('selected-keyframes')}
              className="flex items-center justify-between w-full text-left text-sm font-medium text-text-primary hover:text-text-secondary"
            >
              <span>Selected Keyframes ({selectedKeyframeObjects.length})</span>
              <svg
                className={`w-4 h-4 transition-transform ${
                  expandedSections.has('selected-keyframes') ? 'rotate-90' : ''
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

            {expandedSections.has('selected-keyframes') && (
              <div className="mt-3 space-y-4">
                {selectedKeyframeObjects.map((keyframe) => (
                  <div key={keyframe.id} className="p-3 bg-background-tertiary rounded">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-text-primary">
                        Keyframe @ {keyframe.time.toFixed(2)}s
                      </span>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => duplicateKeyframe(keyframe.id)}
                          className="p-1 text-text-secondary hover:text-text-primary transition-colors"
                          title="Duplicate"
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
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => deleteKeyframe(keyframe.id)}
                          className="p-1 text-status-error hover:text-status-error/80 transition-colors"
                          title="Delete"
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

                    {/* Time */}
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-text-secondary mb-1">
                        Time (s)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={selectedItem.duration}
                        step="0.01"
                        value={keyframe.time}
                        onChange={(e) =>
                          updateKeyframeTime(
                            keyframe.id,
                            parseFloat(e.target.value)
                          )
                        }
                        className="w-full px-2 py-1 text-xs bg-background-secondary border border-border-subtle rounded text-text-primary"
                      />
                    </div>

                    {/* Easing */}
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-text-secondary mb-1">
                        Easing
                      </label>
                      <select
                        value={keyframe.easing}
                        onChange={(e) =>
                          updateKeyframeEasing(keyframe.id, e.target.value)
                        }
                        className="w-full px-2 py-1 text-xs bg-background-secondary border border-border-subtle rounded text-text-primary"
                      >
                        {EASING_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Properties */}
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-text-secondary">
                        Properties
                      </label>
                      {Object.entries(keyframe.properties).map(
                        ([propKey, propValue]) => {
                          const propertyDef = PROPERTY_TYPES.find(
                            (p) => p.key === propKey
                          );
                          if (!propertyDef) return null;

                          return (
                            <div key={propKey}>
                              <label className="block text-xs text-text-tertiary mb-1">
                                {propertyDef.label}
                              </label>
                              {renderPropertyInput(
                                propertyDef,
                                propValue,
                                (value) =>
                                  updateKeyframeProperty(
                                    keyframe.id,
                                    propKey,
                                    value
                                  )
                              )}
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* All Keyframes List */}
        <div className="p-4">
          <button
            onClick={() => toggleSection('all-keyframes')}
            className="flex items-center justify-between w-full text-left text-sm font-medium text-text-primary hover:text-text-secondary"
          >
            <span>All Keyframes</span>
            <svg
              className={`w-4 h-4 transition-transform ${
                expandedSections.has('all-keyframes') ? 'rotate-90' : ''
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

          {expandedSections.has('all-keyframes') && (
            <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
              {(selectedItem.keyframes ?? [])
                .sort((a, b) => a.time - b.time)
                .map((keyframe) => (
                  <div
                    key={keyframe.id}
                    className={`p-2 rounded cursor-pointer transition-colors ${
                      selectedKeyframes.includes(keyframe.id)
                        ? 'bg-synapse-primary/20 border border-synapse-primary'
                        : 'bg-synapse-surface hover:bg-synapse-surface-hover'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-text-primary">
                          {keyframe.time.toFixed(2)}s
                        </div>
                        <div className="text-xs text-text-secondary">
                          {Object.keys(keyframe.properties).join(', ')} •{' '}
                          {keyframe.easing}
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => duplicateKeyframe(keyframe.id)}
                          className="p-1 text-text-secondary hover:text-text-primary transition-colors"
                          title="Duplicate"
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
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => deleteKeyframe(keyframe.id)}
                          className="p-1 text-status-error hover:text-status-error/80 transition-colors"
                          title="Delete"
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

              {(selectedItem.keyframes?.length ?? 0) === 0 && (
                <div className="text-center text-text-secondary py-8">
                  <p>No keyframes yet</p>
                  <p className="text-xs">
                    Use the controls above to add keyframes
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
