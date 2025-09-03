import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTimeline, useMediaAssets } from '../state/hooks';
import { useNotifications } from '../state/notifications';
import { EDUCATIONAL_TRACKS, getEducationalTrackByName } from '../lib/educationalTypes';
import type { EducationalTrackName } from '../lib/educationalTypes';

interface ContentAdditionToolbarProps {
  className?: string;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
}

export function ContentAdditionToolbar({ className = '' }: ContentAdditionToolbarProps) {
  const { addTimelineItem } = useTimeline();
  const { addMediaAsset } = useMediaAssets();
  const { notify } = useNotifications();
  
  const [showVideoMenu, setShowVideoMenu] = useState(false);
  const [recentlyAdded, setRecentlyAdded] = useState<string | null>(null);
  const videoMenuRef = useRef<HTMLDivElement>(null);

  // Close video menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (videoMenuRef.current && !videoMenuRef.current.contains(event.target as Node)) {
        setShowVideoMenu(false);
      }
    };

    if (showVideoMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showVideoMenu]);

  // Visual feedback helper
  const showFeedback = useCallback((type: string) => {
    setRecentlyAdded(type);
    setTimeout(() => setRecentlyAdded(null), 1000);
  }, []);

  // Add Code content to Code track
  const addCodeContent = useCallback(() => {
    const codeTrack = getEducationalTrackByName('Code');
    if (!codeTrack) return;

    const codeAsset = {
      name: `Code Snippet ${Date.now()}`,
      type: 'code' as const,
      url: '',
      duration: 10,
      metadata: {
        fileSize: 0,
        mimeType: 'text/plain',
        codeContent: '// Welcome to your code editor!\n// Start typing your code here\nconsole.log("Hello, Educational World!");',
        language: 'javascript',
      },
    };

    const assetId = addMediaAsset(codeAsset);

    addTimelineItem({
      assetId,
      startTime: 0,
      duration: 10,
      track: codeTrack.trackNumber,
      type: 'code',
      properties: {
        ...codeTrack.defaultProperties,
        codeText: codeAsset.metadata.codeContent,
        text: codeAsset.metadata.codeContent,
        language: codeAsset.metadata.language,
      },
      animations: [],
      keyframes: [],
    });

    notify({
      type: 'success',
      title: 'Code Added',
      message: 'Code snippet added to Code track',
    });

    showFeedback('code');
  }, [addMediaAsset, addTimelineItem, notify, showFeedback]);

  // Add Video content with type selection
  const addVideoContent = useCallback((videoType: 'screen-recording' | 'talking-head') => {
    const targetTrack = videoType === 'talking-head' 
      ? getEducationalTrackByName('You')
      : getEducationalTrackByName('Visual');
    
    if (!targetTrack) return;

    // Trigger file input for video upload
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'video/*';
    fileInput.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files[0]) {
        const file = files[0];
        
        // Create video asset
        const videoAsset = {
          name: videoType === 'talking-head' ? `Personal Video ${Date.now()}` : `Screen Recording ${Date.now()}`,
          type: 'video' as const,
          url: URL.createObjectURL(file),
          duration: 30, // Default duration, will be updated when video loads
          metadata: {
            fileSize: file.size,
            mimeType: file.type,
            videoType,
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
            videoType,
          },
          animations: [],
          keyframes: [],
        });

        notify({
          type: 'success',
          title: 'Video Added',
          message: `${videoType === 'talking-head' ? 'Personal video' : 'Screen recording'} added to ${targetTrack.name} track`,
        });

        showFeedback('video');
      }
    };
    fileInput.click();
    setShowVideoMenu(false);
  }, [addMediaAsset, addTimelineItem, notify, showFeedback]);

  // Add Assets (images, graphics, etc.)
  const addAssets = useCallback(() => {
    const visualTrack = getEducationalTrackByName('Visual');
    if (!visualTrack) return;

    // Trigger file input for asset upload
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.accept = 'image/*,audio/*';
    fileInput.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        Array.from(files).forEach((file) => {
          const isAudio = file.type.startsWith('audio/');
          const targetTrack = isAudio 
            ? getEducationalTrackByName('Narration')
            : getEducationalTrackByName('Visual');
          
          if (!targetTrack) return;

          const asset = {
            name: file.name,
            type: isAudio ? 'audio' as const : 'image' as const,
            url: URL.createObjectURL(file),
            duration: isAudio ? 60 : 5, // Default durations
            metadata: {
              fileSize: file.size,
              mimeType: file.type,
            },
          };

          const assetId = addMediaAsset(asset);

          addTimelineItem({
            assetId,
            startTime: 0,
            duration: asset.duration,
            track: targetTrack.trackNumber,
            type: isAudio ? 'audio' : 'video', // Images become video clips
            properties: {
              ...targetTrack.defaultProperties,
            },
            animations: [],
            keyframes: [],
          });
        });

        notify({
          type: 'success',
          title: 'Assets Added',
          message: `${files.length} asset(s) added to timeline`,
        });

        showFeedback('assets');
      }
    };
    fileInput.click();
  }, [addMediaAsset, addTimelineItem, notify, showFeedback]);

  // Video quick actions
  const videoQuickActions: QuickAction[] = [
    {
      id: 'screen-recording',
      label: 'Screen Recording',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      action: () => addVideoContent('screen-recording'),
    },
    {
      id: 'talking-head',
      label: 'Talking Head',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      action: () => addVideoContent('talking-head'),
    },
  ];

  return (
    <div className={`bg-gradient-to-r from-gray-800 to-gray-700 border-b border-gray-600 px-6 py-4 ${className}`}>
      <div className="flex items-center justify-between">
        {/* Left side - Educational content buttons */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-gray-300">Quick Add:</span>
            <span className="text-xs text-gray-400 hidden lg:block">Create educational content instantly</span>
          </div>
          
          {/* Add Code Button */}
          <button
            onClick={addCodeContent}
            className={`content-addition-button flex items-center space-x-3 px-6 py-3 rounded-xl text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 ${
              recentlyAdded === 'code' 
                ? 'bg-purple-600 scale-105 shadow-purple-500/25' 
                : 'bg-purple-600 hover:bg-purple-700'
            }`}
            title="Add code snippet to Code track"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <span>Add Code</span>
          </button>

          {/* Add Video Button with Dropdown */}
          <div className="relative" ref={videoMenuRef}>
            <button
              onClick={() => setShowVideoMenu(!showVideoMenu)}
              className={`content-addition-button flex items-center space-x-3 px-6 py-3 rounded-xl text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 ${
                recentlyAdded === 'video' 
                  ? 'bg-green-600 scale-105 shadow-green-500/25' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
              title="Add video content"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Add Video</span>
              <svg className={`w-4 h-4 transition-transform duration-200 ${showVideoMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Video Type Menu */}
            {showVideoMenu && (
              <div className="absolute top-full left-0 mt-2 bg-gray-800 border border-gray-600 rounded-xl shadow-xl z-50 min-w-[200px] overflow-hidden">
                <div className="py-2">
                  {videoQuickActions.map((action) => (
                    <button
                      key={action.id}
                      onClick={action.action}
                      className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-gray-700 transition-colors flex items-center space-x-3 first:rounded-t-xl last:rounded-b-xl"
                    >
                      {action.icon}
                      <div>
                        <div className="font-medium">{action.label}</div>
                        <div className="text-xs text-gray-400">
                          {action.id === 'screen-recording' 
                            ? 'For demonstrations and tutorials' 
                            : 'For personal commentary and explanations'
                          }
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Add Assets Button */}
          <button
            onClick={addAssets}
            className={`content-addition-button flex items-center space-x-3 px-6 py-3 rounded-xl text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 ${
              recentlyAdded === 'assets' 
                ? 'bg-amber-600 scale-105 shadow-amber-500/25' 
                : 'bg-amber-600 hover:bg-amber-700'
            }`}
            title="Add images, graphics, and audio assets"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Add Assets</span>
          </button>
        </div>

        {/* Right side - Track indicators */}
        <div className="flex items-center space-x-4">
          <span className="text-xs text-gray-400">Educational Tracks:</span>
          <div className="flex items-center space-x-2">
            {EDUCATIONAL_TRACKS.map((track) => (
              <div
                key={track.id}
                className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-gray-700/50 border border-gray-600"
                title={`${track.name} Track`}
              >
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: track.color }}
                />
                <span className="text-xs text-gray-300 font-medium">{track.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Educational guidance hint */}
      <div className="mt-3 text-xs text-gray-400 bg-gray-800/50 rounded-lg px-3 py-2 border border-gray-700">
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            <strong>Educational Workflow:</strong> Code snippets → Code track, Screen recordings → Visual track, Personal videos → You track, Audio → Narration track
          </span>
        </div>
      </div>
    </div>
  );
}