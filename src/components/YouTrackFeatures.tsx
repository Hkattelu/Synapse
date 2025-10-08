import React, { useState, useRef, useEffect } from 'react';
import {
  detectTalkingHead,
  optimizeTalkingHeadSettings,
  getPiPPositionCoordinates,
  getPiPSizeDimensions,
  PRESENTATION_TEMPLATES,
  applyPresentationTemplate,
  validateYouTrackContent,
  type TalkingHeadDetectionResult,
  type PiPConfiguration,
  type BackgroundOptions,
  type PresentationTemplate,
} from '../lib/youTrackFeatures';
import type { TimelineItem, ItemProperties } from '../lib/types';

interface YouTrackFeaturesProps {
  item: TimelineItem;
  onUpdateProperties: (properties: Partial<ItemProperties>) => void;
  containerSize?: { width: number; height: number };
}

export function YouTrackFeatures({
  item,
  onUpdateProperties,
  containerSize = { width: 1920, height: 1080 },
}: YouTrackFeaturesProps) {
  const [detectionResult, setDetectionResult] =
    useState<TalkingHeadDetectionResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [pipConfig, setPipConfig] = useState<PiPConfiguration>({
    position: 'bottom-right',
    size: 'medium',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ffffff',
    shadow: true,
    opacity: 1,
  });
  const [backgroundOptions, setBackgroundOptions] = useState<BackgroundOptions>(
    {
      type: 'none',
    }
  );

  const videoRef = useRef<HTMLVideoElement>(null);

  // Initialize from item properties
  useEffect(() => {
    if (item.properties) {
      const props = item.properties;

      // Update PiP configuration from properties
      setPipConfig((prev) => ({
        ...prev,
        position:
          (props as any).talkingHeadPosition ||
          (props.talkingHeadCorner === 'bottom-left'
            ? 'bottom-left'
            : props.talkingHeadCorner === 'top-right'
              ? 'top-right'
              : props.talkingHeadCorner === 'top-left'
                ? 'top-left'
                : 'bottom-right'),
        size:
          props.talkingHeadSize === 'sm'
            ? 'small'
            : props.talkingHeadSize === 'lg'
              ? 'large'
              : 'medium',
      }));

      // Update background options
      if (props.backgroundRemoval) {
        setBackgroundOptions({ type: 'remove' });
      } else if (props.backgroundBlur && props.backgroundBlur > 0) {
        setBackgroundOptions({
          type: 'blur',
          blurAmount: props.backgroundBlur,
        });
      }

      // Set selected template if available
      if (props.presentationTemplate) {
        setSelectedTemplate(props.presentationTemplate);
      }
    }
  }, [item.properties]);

  // Analyze talking head when video is loaded
  const handleVideoLoaded = async () => {
    if (!videoRef.current) return;

    setIsAnalyzing(true);
    try {
      const result = await detectTalkingHead(videoRef.current);
      setDetectionResult(result);

      // Auto-optimize if face is detected
      if (result.hasFace && result.isOptimal) {
        const optimizedProps = optimizeTalkingHeadSettings(
          result,
          item.properties || {}
        );
        onUpdateProperties(optimizedProps);
      }
    } catch (error) {
      console.error('Failed to analyze talking head:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Update PiP configuration
  const updatePipConfig = (updates: Partial<PiPConfiguration>) => {
    const newConfig = { ...pipConfig, ...updates };
    setPipConfig(newConfig);

    // Convert to item properties
    const properties: Partial<ItemProperties> = {
      talkingHeadEnabled: true,
      // New unified position value
      talkingHeadPosition: newConfig.position as any,
      // Preserve corner value for backward compatibility when applicable
      talkingHeadCorner:
        newConfig.position === 'bottom-left'
          ? 'bottom-left'
          : newConfig.position === 'top-right'
            ? 'top-right'
            : newConfig.position === 'top-left'
              ? 'top-left'
              : newConfig.position === 'bottom-right'
                ? 'bottom-right'
                : (undefined as any),
      talkingHeadSize:
        newConfig.size === 'small'
          ? 'sm'
          : newConfig.size === 'large'
            ? 'lg'
            : 'md',
      borderRadius: newConfig.borderRadius,
      borderWidth: newConfig.borderWidth,
      borderColor: newConfig.borderColor,
      shadow: newConfig.shadow,
      opacity: newConfig.opacity,
    };

    onUpdateProperties(properties);
  };

  // Update background options
  const updateBackgroundOptions = (options: BackgroundOptions) => {
    setBackgroundOptions(options);

    const properties: Partial<ItemProperties> = {
      backgroundRemoval: options.type === 'remove',
      backgroundBlur: options.type === 'blur' ? options.blurAmount || 0.5 : 0,
      chromaKeyEnabled: options.type === 'greenscreen',
      chromaKeyColor: options.chromaKeyColor,
      chromaKeyTolerance: options.chromaKeyTolerance,
    };

    onUpdateProperties(properties);
  };

  // Apply presentation template
  const applyTemplate = (templateId: string) => {
    const template = PRESENTATION_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;

    setSelectedTemplate(templateId);

    const templateProperties = applyPresentationTemplate(template, item);
    onUpdateProperties(templateProperties);

    // Update local state to match template
    setPipConfig(template.pipConfig);
    setBackgroundOptions(template.backgroundOptions);
  };

  // Get validation results
  const validation = validateYouTrackContent(item);

  // Calculate PiP preview position
  const pipSize = getPiPSizeDimensions(pipConfig.size, containerSize);
  const pipPosition = getPiPPositionCoordinates(
    pipConfig.position,
    containerSize,
    pipSize
  );

  return (
    <div className="you-track-features space-y-6">
      {/* Talking Head Detection */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <span className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
            <svg
              className="w-3 h-3 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                clipRule="evenodd"
              />
            </svg>
          </span>
          Talking Head Detection
        </h3>

        {item.type === 'video' && (
          <div className="space-y-3">
            <video
              ref={videoRef}
              className="w-full max-w-sm rounded border"
              onLoadedData={handleVideoLoaded}
              controls
              muted
            >
              <source src={item.src} />
            </video>

            {isAnalyzing && (
              <div className="flex items-center gap-2 text-blue-600">
                <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                Analyzing video...
              </div>
            )}

            {detectionResult && (
              <div className="space-y-2">
                <div
                  className={`p-3 rounded ${detectionResult.hasFace ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`w-2 h-2 rounded-full ${detectionResult.hasFace ? 'bg-green-500' : 'bg-yellow-500'}`}
                    ></span>
                    <span className="font-medium">
                      {detectionResult.hasFace
                        ? 'Face Detected'
                        : 'No Face Detected'}
                    </span>
                    {detectionResult.hasFace && (
                      <span className="text-sm text-gray-600">
                        ({Math.round(detectionResult.faceConfidence)}%
                        confidence)
                      </span>
                    )}
                  </div>

                  {detectionResult.suggestions.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Suggestions:</p>
                      <ul className="text-sm space-y-1">
                        {detectionResult.suggestions.map(
                          (suggestion, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-blue-500 mt-1">•</span>
                              {suggestion}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
                </div>

                {detectionResult.hasFace && (
                  <button
                    onClick={() => {
                      const optimized = optimizeTalkingHeadSettings(
                        detectionResult,
                        item.properties || {}
                      );
                      onUpdateProperties(optimized);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Apply Optimizations
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Picture-in-Picture Controls */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="text-lg font-semibold mb-3">Picture-in-Picture</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Position Control */}
          <div>
            <label className="block text-sm font-medium mb-2">Position</label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  'top-left',
                  'top-center',
                  'top-right',
                  'left-center',
                  'center',
                  'right-center',
                  'bottom-left',
                  'bottom-center',
                  'bottom-right',
                ] as const
              ).map((position) => (
                <button
                  key={position}
                  onClick={() => updatePipConfig({ position })}
                  className={`p-2 text-xs border rounded transition-colors ${
                    pipConfig.position === position
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {position.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Size Control */}
          <div>
            <label className="block text-sm font-medium mb-2">Size</label>
            <div className="grid grid-cols-3 gap-2">
              {(['small', 'medium', 'large'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => updatePipConfig({ size })}
                  className={`p-2 text-xs border rounded transition-colors ${
                    pipConfig.size === size
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Visual Styling */}
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Border Radius
              </label>
              <input
                type="range"
                min="0"
                max="20"
                value={pipConfig.borderRadius}
                onChange={(e) =>
                  updatePipConfig({ borderRadius: parseInt(e.target.value) })
                }
                className="w-full"
              />
              <span className="text-xs text-gray-500">
                {pipConfig.borderRadius}px
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Opacity</label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={pipConfig.opacity}
                onChange={(e) =>
                  updatePipConfig({ opacity: parseFloat(e.target.value) })
                }
                className="w-full"
              />
              <span className="text-xs text-gray-500">
                {Math.round(pipConfig.opacity * 100)}%
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={pipConfig.shadow}
                onChange={(e) => updatePipConfig({ shadow: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Drop Shadow</span>
            </label>

            <div className="flex items-center gap-2">
              <label className="text-sm">Border Color:</label>
              <input
                type="color"
                value={pipConfig.borderColor}
                onChange={(e) =>
                  updatePipConfig({ borderColor: e.target.value })
                }
                className="w-8 h-8 rounded border"
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div
          className="mt-4 p-4 bg-gray-100 rounded relative"
          style={{ aspectRatio: '16/9' }}
        >
          <div className="text-xs text-gray-500 mb-2">Preview</div>
          <div
            className="absolute bg-red-500 rounded border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-medium"
            style={{
              left: `${(pipPosition.x / containerSize.width) * 100}%`,
              top: `${(pipPosition.y / containerSize.height) * 100}%`,
              width: `${(pipSize.width / containerSize.width) * 100}%`,
              height: `${(pipSize.height / containerSize.height) * 100}%`,
              borderRadius: `${pipConfig.borderRadius}px`,
              borderColor: pipConfig.borderColor,
              borderWidth: `${pipConfig.borderWidth}px`,
              opacity: pipConfig.opacity,
              boxShadow: pipConfig.shadow
                ? '0 4px 8px rgba(0,0,0,0.3)'
                : 'none',
            }}
          >
            You
          </div>
        </div>
      </div>

      {/* Background Options */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="text-lg font-semibold mb-3">Background</h3>

        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {(
              [
                { type: 'none', label: 'None' },
                { type: 'blur', label: 'Blur' },
                { type: 'remove', label: 'Remove' },
                { type: 'replace', label: 'Replace' },
                { type: 'greenscreen', label: 'Green Screen' },
              ] as const
            ).map(({ type, label }) => (
              <button
                key={type}
                onClick={() => updateBackgroundOptions({ type })}
                className={`p-2 text-sm border rounded transition-colors ${
                  backgroundOptions.type === type
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {backgroundOptions.type === 'blur' && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Blur Amount
              </label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={backgroundOptions.blurAmount || 0.5}
                onChange={(e) =>
                  updateBackgroundOptions({
                    ...backgroundOptions,
                    blurAmount: parseFloat(e.target.value),
                  })
                }
                className="w-full"
              />
              <span className="text-xs text-gray-500">
                {Math.round((backgroundOptions.blurAmount || 0.5) * 100)}%
              </span>
            </div>
          )}

          {backgroundOptions.type === 'greenscreen' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Chroma Key Color
                </label>
                <input
                  type="color"
                  value={backgroundOptions.chromaKeyColor || '#00ff00'}
                  onChange={(e) =>
                    updateBackgroundOptions({
                      ...backgroundOptions,
                      chromaKeyColor: e.target.value,
                    })
                  }
                  className="w-full h-10 rounded border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Tolerance
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={backgroundOptions.chromaKeyTolerance || 0.3}
                  onChange={(e) =>
                    updateBackgroundOptions({
                      ...backgroundOptions,
                      chromaKeyTolerance: parseFloat(e.target.value),
                    })
                  }
                  className="w-full"
                />
                <span className="text-xs text-gray-500">
                  {Math.round(
                    (backgroundOptions.chromaKeyTolerance || 0.3) * 100
                  )}
                  %
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Professional Templates */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="text-lg font-semibold mb-3">Professional Templates</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PRESENTATION_TEMPLATES.map((template) => (
            <div
              key={template.id}
              className={`border rounded-lg p-3 cursor-pointer transition-all ${
                selectedTemplate === template.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => applyTemplate(template.id)}
            >
              <div className="flex items-start gap-3">
                <div className="w-16 h-12 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                  Preview
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{template.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {template.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <span>PiP: {template.pipConfig.position}</span>
                    <span>•</span>
                    <span>BG: {template.backgroundOptions.type}</span>
                    <span>•</span>
                    <span>{template.overlays.length} overlays</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Validation Messages */}
      {(!validation.isValid || validation.suggestions.length > 0) && (
        <div className="bg-white rounded-lg border p-4">
          <h3 className="text-lg font-semibold mb-3">Recommendations</h3>

          {validation.warnings.length > 0 && (
            <div className="mb-3">
              <h4 className="text-sm font-medium text-yellow-700 mb-2">
                Warnings:
              </h4>
              <ul className="space-y-1">
                {validation.warnings.map((warning, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-yellow-700"
                  >
                    <span className="text-yellow-500 mt-1">⚠</span>
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {validation.suggestions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-blue-700 mb-2">
                Suggestions:
              </h4>
              <ul className="space-y-1">
                {validation.suggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-blue-700"
                  >
                    <span className="text-blue-500 mt-1">💡</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default YouTrackFeatures;
