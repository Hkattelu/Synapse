import React, { useState, useCallback } from 'react';
import { useTimeline, useMediaAssets } from '../state/hooks';
import { validateItemProperties } from '../lib/validation';
import type { TimelineItem, ItemProperties, AnimationPreset } from '../lib/types';

interface InspectorProps {
  className?: string;
}

export function Inspector({ className = '' }: InspectorProps) {
  const { selectedTimelineItems, updateTimelineItem } = useTimeline();
  const { getMediaAssetById } = useMediaAssets();

  // Get the first selected item (for now, we'll handle single selection)
  const selectedItem = selectedTimelineItems[0];
  const selectedAsset = selectedItem ? getMediaAssetById(selectedItem.assetId) : undefined;

  if (!selectedItem) {
    return (
      <div className={`inspector bg-gray-800 ${className}`}>
        <div className="p-4 border-b border-gray-700">
          <h3 className="font-semibold text-sm text-gray-300 uppercase tracking-wide">Inspector</h3>
        </div>
        <div className="flex-1 p-4">
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-700 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="font-medium">No Selection</p>
              <p className="text-sm">Select a clip to edit properties</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`inspector bg-gray-800 flex flex-col ${className}`}>
      <div className="p-4 border-b border-gray-700">
        <h3 className="font-semibold text-sm text-gray-300 uppercase tracking-wide">Inspector</h3>
        <p className="text-xs text-gray-500 mt-1">
          {selectedTimelineItems.length} item{selectedTimelineItems.length !== 1 ? 's' : ''} selected
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <ClipMetadata item={selectedItem} asset={selectedAsset} />
        <ClipProperties 
          item={selectedItem} 
          onUpdateProperties={(properties) => 
            updateTimelineItem(selectedItem.id, { properties })
          }
        />
        <AnimationSettings 
          item={selectedItem}
          onUpdateAnimations={(animations) =>
            updateTimelineItem(selectedItem.id, { animations })
          }
        />
      </div>
    </div>
  );
}

interface ClipMetadataProps {
  item: TimelineItem;
  asset: any; // MediaAsset | undefined
}

function ClipMetadata({ item, asset }: ClipMetadataProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round((seconds % 60) * 10) / 10;
    return `${mins}:${secs.toString().padStart(4, '0')}`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
      case 'audio':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        );
      case 'code':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        );
      case 'title':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  return (
    <div className="p-4 border-b border-gray-700">
      <h4 className="font-medium text-white mb-3">Clip Information</h4>
      
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <div className="text-gray-400">
            {getTypeIcon(item.type)}
          </div>
          <div>
            <p className="text-sm font-medium text-white">{asset?.name || 'Unknown Asset'}</p>
            <p className="text-xs text-gray-400 capitalize">{item.type} clip</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-400">Duration</p>
            <p className="text-white font-mono">{formatDuration(item.duration)}</p>
          </div>
          <div>
            <p className="text-gray-400">Start Time</p>
            <p className="text-white font-mono">{formatDuration(item.startTime)}</p>
          </div>
          <div>
            <p className="text-gray-400">Track</p>
            <p className="text-white">Track {item.track + 1}</p>
          </div>
          <div>
            <p className="text-gray-400">End Time</p>
            <p className="text-white font-mono">{formatDuration(item.startTime + item.duration)}</p>
          </div>
        </div>

        {asset && (
          <div className="pt-2 border-t border-gray-700">
            <p className="text-xs text-gray-400 mb-2">Source File</p>
            <div className="text-xs text-gray-300">
              <p>Size: {(asset.metadata.fileSize / 1024 / 1024).toFixed(1)} MB</p>
              <p>Type: {asset.metadata.mimeType}</p>
              {asset.metadata.width && asset.metadata.height && (
                <p>Resolution: {asset.metadata.width} × {asset.metadata.height}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface ClipPropertiesProps {
  item: TimelineItem;
  onUpdateProperties: (properties: ItemProperties) => void;
}

function ClipProperties({ item, onUpdateProperties }: ClipPropertiesProps) {
  const [localProperties, setLocalProperties] = useState<ItemProperties>(item.properties);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Update local state when item changes
  React.useEffect(() => {
    setLocalProperties(item.properties);
    setValidationErrors({});
  }, [item.properties]);

  const validateAndUpdate = useCallback((newProperties: ItemProperties) => {
    const validation = validateItemProperties(newProperties);
    
    if (validation.isValid) {
      setValidationErrors({});
      onUpdateProperties(newProperties);
    } else {
      const errorMap: Record<string, string> = {};
      validation.errors.forEach(error => {
        errorMap[error.field] = error.message;
      });
      setValidationErrors(errorMap);
    }
  }, [onUpdateProperties]);

  const updateProperty = useCallback((key: keyof ItemProperties, value: any) => {
    const newProperties = { ...localProperties, [key]: value };
    setLocalProperties(newProperties);
    
    // Immediate validation for testing, debounced for production
    if (process.env.NODE_ENV === 'test') {
      validateAndUpdate(newProperties);
    } else {
      // Debounced validation and update
      const timeoutId = setTimeout(() => {
        validateAndUpdate(newProperties);
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [localProperties, validateAndUpdate]);

  const renderTransformProperties = () => (
    <div className="space-y-3">
      <NumberInput
        label="X Position"
        value={localProperties.x ?? 0}
        onChange={(value) => updateProperty('x', value)}
        error={validationErrors.x}
        step={1}
      />
      <NumberInput
        label="Y Position"
        value={localProperties.y ?? 0}
        onChange={(value) => updateProperty('y', value)}
        error={validationErrors.y}
        step={1}
      />
      <NumberInput
        label="Scale"
        value={localProperties.scale ?? 1}
        onChange={(value) => updateProperty('scale', value)}
        error={validationErrors.scale}
        min={0.1}
        max={5}
        step={0.1}
      />
      <NumberInput
        label="Rotation"
        value={localProperties.rotation ?? 0}
        onChange={(value) => updateProperty('rotation', value)}
        error={validationErrors.rotation}
        min={-360}
        max={360}
        step={1}
        suffix="°"
      />
      <NumberInput
        label="Opacity"
        value={localProperties.opacity ?? 1}
        onChange={(value) => updateProperty('opacity', value)}
        error={validationErrors.opacity}
        min={0}
        max={1}
        step={0.01}
      />
    </div>
  );

  const renderVideoProperties = () => (
    <div className="space-y-3">
      <NumberInput
        label="Volume"
        value={localProperties.volume ?? 1}
        onChange={(value) => updateProperty('volume', value)}
        error={validationErrors.volume}
        min={0}
        max={1}
        step={0.01}
      />
      <NumberInput
        label="Playback Rate"
        value={localProperties.playbackRate ?? 1}
        onChange={(value) => updateProperty('playbackRate', value)}
        error={validationErrors.playbackRate}
        min={0.1}
        max={3}
        step={0.1}
        suffix="×"
      />
    </div>
  );

  const renderCodeProperties = () => (
    <div className="space-y-3">
      <TextInput
        label="Code Content"
        value={localProperties.text ?? ''}
        onChange={(value) => updateProperty('text', value)}
        error={validationErrors.text}
        multiline
      />
      <SelectInput
        label="Language"
        value={localProperties.language ?? 'javascript'}
        onChange={(value) => updateProperty('language', value)}
        options={[
          { value: 'javascript', label: 'JavaScript' },
          { value: 'typescript', label: 'TypeScript' },
          { value: 'python', label: 'Python' },
          { value: 'java', label: 'Java' },
          { value: 'cpp', label: 'C++' },
          { value: 'html', label: 'HTML' },
          { value: 'css', label: 'CSS' },
          { value: 'json', label: 'JSON' },
        ]}
      />
      <SelectInput
        label="Theme"
        value={localProperties.theme ?? 'dark'}
        onChange={(value) => updateProperty('theme', value)}
        options={[
          { value: 'dark', label: 'Dark' },
          { value: 'light', label: 'Light' },
          { value: 'monokai', label: 'Monokai' },
          { value: 'github', label: 'GitHub' },
          { value: 'dracula', label: 'Dracula' },
        ]}
      />
      <NumberInput
        label="Font Size"
        value={localProperties.fontSize ?? 14}
        onChange={(value) => updateProperty('fontSize', value)}
        error={validationErrors.fontSize}
        min={8}
        max={48}
        step={1}
        suffix="px"
      />
    </div>
  );

  const renderTitleProperties = () => (
    <div className="space-y-3">
      <TextInput
        label="Text"
        value={localProperties.text ?? ''}
        onChange={(value) => updateProperty('text', value)}
        error={validationErrors.text}
        multiline
      />
      <TextInput
        label="Font Family"
        value={localProperties.fontFamily ?? 'Inter'}
        onChange={(value) => updateProperty('fontFamily', value)}
        error={validationErrors.fontFamily}
      />
      <ColorInput
        label="Text Color"
        value={localProperties.color ?? '#ffffff'}
        onChange={(value) => updateProperty('color', value)}
        error={validationErrors.color}
      />
      <ColorInput
        label="Background Color"
        value={localProperties.backgroundColor ?? 'transparent'}
        onChange={(value) => updateProperty('backgroundColor', value)}
        error={validationErrors.backgroundColor}
      />
    </div>
  );

  return (
    <div className="border-b border-gray-700">
      <div className="p-4">
        <h4 className="font-medium text-white mb-3">Properties</h4>
        
        {/* Transform Properties - Always shown */}
        <div className="mb-4">
          <h5 className="text-sm font-medium text-gray-300 mb-2">Transform</h5>
          {renderTransformProperties()}
        </div>

        {/* Type-specific Properties */}
        {(item.type === 'video' || item.type === 'audio') && (
          <div className="mb-4">
            <h5 className="text-sm font-medium text-gray-300 mb-2">Media</h5>
            {renderVideoProperties()}
          </div>
        )}

        {item.type === 'code' && (
          <div className="mb-4">
            <h5 className="text-sm font-medium text-gray-300 mb-2">Code</h5>
            {renderCodeProperties()}
          </div>
        )}

        {item.type === 'title' && (
          <div className="mb-4">
            <h5 className="text-sm font-medium text-gray-300 mb-2">Text</h5>
            {renderTitleProperties()}
          </div>
        )}
      </div>
    </div>
  );
}

interface AnimationSettingsProps {
  item: TimelineItem;
  onUpdateAnimations: (animations: AnimationPreset[]) => void;
}

function AnimationSettings({ item, onUpdateAnimations }: AnimationSettingsProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>('');

  // Mock animation presets - in a real app, these would come from a service
  const availablePresets: AnimationPreset[] = [
    {
      id: 'fade-in',
      name: 'Fade In',
      type: 'entrance',
      parameters: { opacity: { from: 0, to: 1 } },
      duration: 0.5,
    },
    {
      id: 'slide-in-left',
      name: 'Slide In Left',
      type: 'entrance',
      parameters: { x: { from: -100, to: 0 } },
      duration: 0.8,
    },
    {
      id: 'scale-in',
      name: 'Scale In',
      type: 'entrance',
      parameters: { scale: { from: 0, to: 1 } },
      duration: 0.6,
    },
    {
      id: 'fade-out',
      name: 'Fade Out',
      type: 'exit',
      parameters: { opacity: { from: 1, to: 0 } },
      duration: 0.5,
    },
  ];

  const addAnimation = useCallback(() => {
    if (!selectedPreset) return;
    
    const preset = availablePresets.find(p => p.id === selectedPreset);
    if (!preset) return;

    const newAnimations = [...item.animations, preset];
    onUpdateAnimations(newAnimations);
    setSelectedPreset('');
  }, [selectedPreset, item.animations, onUpdateAnimations, availablePresets]);

  const removeAnimation = useCallback((index: number) => {
    const newAnimations = item.animations.filter((_, i) => i !== index);
    onUpdateAnimations(newAnimations);
  }, [item.animations, onUpdateAnimations]);

  return (
    <div className="p-4">
      <h4 className="font-medium text-white mb-3">Animations</h4>
      
      {/* Current Animations */}
      {item.animations.length > 0 && (
        <div className="mb-4">
          <h5 className="text-sm font-medium text-gray-300 mb-2">Applied Animations</h5>
          <div className="space-y-2">
            {item.animations.map((animation, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-700 rounded p-2">
                <div>
                  <p className="text-sm font-medium text-white">{animation.name}</p>
                  <p className="text-xs text-gray-400 capitalize">{animation.type} • {animation.duration}s</p>
                </div>
                <button
                  onClick={() => removeAnimation(index)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                  title="Remove Animation"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Animation */}
      <div>
        <h5 className="text-sm font-medium text-gray-300 mb-2">Add Animation</h5>
        <div className="flex space-x-2">
          <select
            value={selectedPreset}
            onChange={(e) => setSelectedPreset(e.target.value)}
            className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="">Select animation...</option>
            {availablePresets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name} ({preset.type})
              </option>
            ))}
          </select>
          <button
            onClick={addAnimation}
            disabled={!selectedPreset}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-2 rounded text-sm transition-colors"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

// Input Components

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  error?: string;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}

function NumberInput({ label, value, onChange, error, min, max, step = 1, suffix }: NumberInputProps) {
  const [localValue, setLocalValue] = useState(value.toString());
  const inputId = React.useId();

  React.useEffect(() => {
    setLocalValue(value.toString());
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    const numValue = parseFloat(newValue);
    if (!isNaN(numValue)) {
      let clampedValue = numValue;
      if (min !== undefined) clampedValue = Math.max(min, clampedValue);
      if (max !== undefined) clampedValue = Math.min(max, clampedValue);
      onChange(clampedValue);
    }
  };

  const handleBlur = () => {
    const numValue = parseFloat(localValue);
    if (isNaN(numValue)) {
      setLocalValue(value.toString());
    }
  };

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-300 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type="number"
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          min={min}
          max={max}
          step={step}
          className={`w-full bg-gray-700 border rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 ${
            error ? 'border-red-500' : 'border-gray-600'
          }`}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : undefined}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
            {suffix}
          </span>
        )}
      </div>
      {error && (
        <p id={`${inputId}-error`} className="text-red-400 text-xs mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

interface TextInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  multiline?: boolean;
}

function TextInput({ label, value, onChange, error, multiline = false }: TextInputProps) {
  const inputId = React.useId();
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const inputClasses = `w-full bg-gray-700 border rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 ${
    error ? 'border-red-500' : 'border-gray-600'
  }`;

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-300 mb-1">
        {label}
      </label>
      {multiline ? (
        <textarea
          id={inputId}
          value={value}
          onChange={handleChange}
          rows={label === 'Code Content' ? 8 : 3}
          className={inputClasses}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : undefined}
          style={label === 'Code Content' ? { fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace' } : undefined}
        />
      ) : (
        <input
          id={inputId}
          type="text"
          value={value}
          onChange={handleChange}
          className={inputClasses}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : undefined}
        />
      )}
      {error && (
        <p id={`${inputId}-error`} className="text-red-400 text-xs mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

interface SelectInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  error?: string;
}

function SelectInput({ label, value, onChange, options, error }: SelectInputProps) {
  const inputId = React.useId();
  
  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-300 mb-1">
        {label}
      </label>
      <select
        id={inputId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-gray-700 border rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 ${
          error ? 'border-red-500' : 'border-gray-600'
        }`}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${inputId}-error` : undefined}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={`${inputId}-error`} className="text-red-400 text-xs mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

function ColorInput({ label, value, onChange, error }: ColorInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const inputId = React.useId();
  const colorId = React.useId();

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    
    // Validate color format (hex, rgb, rgba, named colors, etc.)
    const isValidColor = /^(#[0-9A-Fa-f]{3,8}|rgb\(|rgba\(|hsl\(|hsla\(|[a-zA-Z]+|transparent)/.test(newValue);
    if (isValidColor || newValue === '') {
      onChange(newValue);
    }
  };

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-300 mb-1">
        {label}
      </label>
      <div className="flex space-x-2">
        <input
          id={colorId}
          type="color"
          value={localValue.startsWith('#') ? localValue : '#ffffff'}
          onChange={handleColorChange}
          className="w-12 h-10 bg-gray-700 border border-gray-600 rounded cursor-pointer"
          aria-label={`${label} color picker`}
        />
        <input
          id={inputId}
          type="text"
          value={localValue}
          onChange={handleTextChange}
          placeholder="#ffffff"
          className={`flex-1 bg-gray-700 border rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 ${
            error ? 'border-red-500' : 'border-gray-600'
          }`}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : undefined}
        />
      </div>
      {error && (
        <p id={`${inputId}-error`} className="text-red-400 text-xs mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}