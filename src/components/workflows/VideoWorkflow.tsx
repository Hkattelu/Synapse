import React, { useState, useCallback, useRef } from 'react';
import { useTimeline, useMediaAssets } from '../../state/hooks';
import { useNotifications } from '../../state/notifications';
import { getEducationalTrackByName } from '../../lib/educationalTypes';
import { ContextualHelp } from './ContextualHelp';

interface VideoWorkflowProps {
  isOpen: boolean;
  onClose: () => void;
  onVideoAdded: () => void;
}

interface VideoOption {
  id: 'screen-recording' | 'talking-head' | 'presentation' | 'demo';
  name: string;
  description: string;
  icon: React.ReactNode;
  targetTrack: 'Visual' | 'You';
  tips: string[];
}

const VIDEO_OPTIONS: VideoOption[] = [
  {
    id: 'screen-recording',
    name: 'Screen Recording',
    description:
      'Capture your screen for software demonstrations and tutorials',
    targetTrack: 'Visual',
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
    tips: [
      'Use high resolution (1080p or higher) for clarity',
      'Keep cursor movements smooth and deliberate',
      'Highlight important areas with cursor or annotations',
      'Record in segments for easier editing',
    ],
  },
  {
    id: 'talking-head',
    name: 'Talking Head',
    description:
      'Personal video for introductions, explanations, and commentary',
    targetTrack: 'You',
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
    tips: [
      'Ensure good lighting on your face',
      'Position camera at eye level',
      'Use a clean, professional background',
      'Speak clearly and maintain eye contact with camera',
    ],
  },
  {
    id: 'presentation',
    name: 'Presentation Recording',
    description: 'Record slides or presentation materials',
    targetTrack: 'Visual',
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 011 1v14a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1h4zM9 12l2 2 4-4"
        />
      </svg>
    ),
    tips: [
      'Use presenter mode for better control',
      'Include slide transitions in recording',
      'Point out key information with cursor',
      'Maintain consistent pacing between slides',
    ],
  },
  {
    id: 'demo',
    name: 'Live Demo',
    description: 'Real-time demonstration of processes or workflows',
    targetTrack: 'Visual',
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M13 16h3a2 2 0 002-2V6a2 2 0 00-2-2H8a2 2 0 00-2 2v8a2 2 0 002 2h3"
        />
      </svg>
    ),
    tips: [
      'Practice the demo beforehand',
      'Have a backup plan for technical issues',
      'Explain each step as you perform it',
      'Keep demo focused and concise',
    ],
  },
];

export function VideoWorkflow({
  isOpen,
  onClose,
  onVideoAdded,
}: VideoWorkflowProps) {
  const { addTimelineItem } = useTimeline();
  const { addMediaAsset } = useMediaAssets();
  const { notify } = useNotifications();

  const [selectedOption, setSelectedOption] = useState<VideoOption | null>(
    null
  );
  const [videoTitle, setVideoTitle] = useState('');
  const [showTips, setShowTips] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle video file selection
  const handleVideoUpload = useCallback(
    (option: VideoOption) => {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'video/*';
      fileInput.onchange = (e) => {
        const files = (e.target as HTMLInputElement).files;
        if (files && files[0]) {
          const file = files[0];
          const targetTrack = getEducationalTrackByName(option.targetTrack);

          if (!targetTrack) return;

          const title = videoTitle.trim() || `${option.name} ${Date.now()}`;

          // Create video asset
          const videoAsset = {
            name: title,
            type: 'video' as const,
            url: URL.createObjectURL(file),
            duration: 30, // Default duration, will be updated when video loads
            metadata: {
              fileSize: file.size,
              mimeType: file.type,
              videoType: option.id,
              originalFileName: file.name,
            },
          };

          const assetId = addMediaAsset(videoAsset);

          addTimelineItem({
            assetId,
            startTime: 0,
            duration: 30,
            track: targetTrack.trackNumber,
            type: 'video',
            properties: {
              ...targetTrack.defaultProperties,
              videoType: option.id,
              title,
            },
            animations: [],
            keyframes: [],
          });

          notify({
            type: 'success',
            title: 'Video Added',
            message: `${title} added to ${targetTrack.name} track`,
          });

          onVideoAdded();
          onClose();

          // Reset form
          setVideoTitle('');
          setSelectedOption(null);
        }
      };
      fileInput.click();
    },
    [videoTitle, addMediaAsset, addTimelineItem, notify, onVideoAdded, onClose]
  );

  // Start screen recording (placeholder for future implementation)
  const startScreenRecording = useCallback(() => {
    notify({
      type: 'info',
      title: 'Screen Recording',
      message:
        'Screen recording feature coming soon! For now, please upload a pre-recorded video.',
    });
  }, [notify]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-green-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <h2 className="text-xl font-bold text-white">
              Add Video to Timeline
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <svg
              className="w-6 h-6"
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

        <div className="p-6">
          {!selectedOption ? (
            /* Video Type Selection */
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">
                Choose Video Type
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {VIDEO_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedOption(option)}
                    className="p-6 bg-gray-700 border border-gray-600 rounded-xl hover:bg-gray-600 hover:border-gray-500 transition-all text-left group"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="text-green-400 group-hover:text-green-300 transition-colors">
                        {option.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-semibold mb-2">
                          {option.name}
                        </h4>
                        <p className="text-gray-300 text-sm mb-3">
                          {option.description}
                        </p>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs px-2 py-1 bg-gray-600 text-gray-300 rounded">
                            → {option.targetTrack} Track
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Video Upload and Configuration */
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <button
                  onClick={() => setSelectedOption(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <div className="text-green-400">{selectedOption.icon}</div>
                <h3 className="text-lg font-semibold text-white">
                  {selectedOption.name}
                </h3>
              </div>

              {/* Video Title Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Video Title
                </label>
                <input
                  type="text"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder={`Enter title for your ${selectedOption.name.toLowerCase()}`}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Tips Section */}
              <div className="mb-6">
                <button
                  onClick={() => setShowTips(!showTips)}
                  className="flex items-center space-x-2 text-sm font-medium text-gray-300 hover:text-white transition-colors mb-3"
                >
                  <svg
                    className={`w-4 h-4 transition-transform ${showTips ? 'rotate-90' : ''}`}
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
                  <span>Recording Tips for {selectedOption.name}</span>
                </button>

                {showTips && (
                  <div className="bg-gray-700 rounded-lg p-4">
                    <ul className="space-y-2">
                      {selectedOption.tips.map((tip, index) => (
                        <li
                          key={index}
                          className="flex items-start space-x-2 text-sm text-gray-300"
                        >
                          <svg
                            className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                {selectedOption.id === 'screen-recording' && (
                  <button
                    onClick={startScreenRecording}
                    className="flex-1 flex items-center justify-center space-x-3 px-6 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    <span>Start Recording</span>
                  </button>
                )}

                <button
                  onClick={() => handleVideoUpload(selectedOption)}
                  className="flex-1 flex items-center justify-center space-x-3 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <span>Upload Video File</span>
                </button>
              </div>

              {/* Track Information */}
              <div className="mt-6 p-4 bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-2 text-sm text-gray-300">
                  <svg
                    className="w-4 h-4 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>
                    This video will be added to the{' '}
                    <strong>{selectedOption.targetTrack} track</strong> with
                    optimized settings for {selectedOption.name.toLowerCase()}.
                  </span>
                </div>
              </div>

              {/* Contextual Help */}
              <div className="mt-6">
                <ContextualHelp type="video" />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-700 px-6 py-4 border-t border-gray-600 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Educational video workflow • Optimized for learning content
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
