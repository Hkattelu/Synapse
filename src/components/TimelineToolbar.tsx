import React, { useState, useCallback } from 'react';
import { useTimeline, useMediaAssets } from '../state/hooks';
import { useNotifications } from '../state/notifications';
import type { VisualAssetType } from '../lib/types';

interface TimelineToolbarProps {
  className?: string;
}

export function TimelineToolbar({ className = '' }: TimelineToolbarProps) {
  const { addTimelineItem } = useTimeline();
  const { addMediaAsset } = useMediaAssets();
  const { notify } = useNotifications();
  const [showVisualAssets, setShowVisualAssets] = useState(false);
  const [showHint, setShowHint] = useState(() => {
    // Show hint if user hasn't seen it before
    return !localStorage.getItem('timelineToolbarHintSeen');
  });
  const [recentlyAdded, setRecentlyAdded] = useState<string | null>(null);

  // Add code clip directly to timeline
  const addCodeClip = useCallback(() => {
    // Create the media asset first
    const codeAsset = {
      name: `Code Clip ${Date.now()}`,
      type: 'code' as const,
      url: '',
      duration: 10,
      metadata: {
        fileSize: 0,
        mimeType: 'text/plain',
        codeContent: '// Your code here\nconsole.log("Hello, World!");',
        language: 'javascript',
      },
    };

    const assetId = addMediaAsset(codeAsset);

    // Add to timeline
    addTimelineItem({
      assetId,
      startTime: 0,
      duration: 10,
      track: 0,
      type: 'code',
      properties: {
        codeText: codeAsset.metadata.codeContent,
        text: codeAsset.metadata.codeContent, // Also set text for compatibility
        language: codeAsset.metadata.language,
        theme: 'dark',
        fontSize: 16,
        showLineNumbers: true,
        x: 0,
        y: 0,
        scale: 1,
        opacity: 1,
      },
      animations: [],
      keyframes: [],
    });

    notify({
      type: 'success',
      title: 'Added',
      message: 'Code clip added to timeline',
    });

    // Show visual feedback
    setRecentlyAdded('code');
    setTimeout(() => setRecentlyAdded(null), 1000);
  }, [addMediaAsset, addTimelineItem, notify]);

  // Add title clip directly to timeline
  const addTitleClip = useCallback(() => {
    const titleAsset = {
      name: `Title ${Date.now()}`,
      type: 'code' as const, // Using 'code' type for titles
      url: '',
      duration: 5,
      metadata: {
        fileSize: 0,
        mimeType: 'text/title',
        codeContent: 'Your Title Text',
        language: 'title',
      },
    };

    const assetId = addMediaAsset(titleAsset);

    addTimelineItem({
      assetId,
      startTime: 0,
      duration: 5,
      track: 0,
      type: 'title',
      properties: {
        text: 'Your Title Text',
        color: '#ffffff',
        backgroundColor: 'transparent',
        fontSize: 48,
        fontFamily: 'Inter',
        x: 0,
        y: 0,
        scale: 1,
        opacity: 1,
      },
      animations: [],
      keyframes: [],
    });

    notify({
      type: 'success',
      title: 'Added',
      message: 'Title added to timeline',
    });

    // Show visual feedback
    setRecentlyAdded('title');
    setTimeout(() => setRecentlyAdded(null), 1000);
  }, [addMediaAsset, addTimelineItem, notify]);

  // Add visual asset directly to timeline
  const addVisualAsset = useCallback((assetType: VisualAssetType) => {
    const assetNames = {
      'arrow': 'Arrow',
      'box': 'Box',
      'finger-pointer': 'Finger Pointer',
      'circle': 'Circle',
      'line': 'Line'
    };

    const defaultProperties = {
      'arrow': { arrowDirection: 'right' as const, strokeColor: '#ff0000', strokeWidth: 3 },
      'box': { strokeColor: '#ff0000', strokeWidth: 3, fillColor: 'transparent' },
      'finger-pointer': { fingerDirection: 'down' as const, strokeColor: '#ff0000', fillColor: '#ff0000' },
      'circle': { strokeColor: '#ff0000', strokeWidth: 3, fillColor: 'transparent' },
      'line': { strokeColor: '#ff0000', strokeWidth: 3, lineEndX: 100, lineEndY: 0 }
    };

    const visualAsset = {
      name: `${assetNames[assetType]} ${Date.now()}`,
      type: 'visual-asset' as const,
      url: '',
      duration: 3,
      metadata: {
        fileSize: 0,
        mimeType: 'application/visual-asset',
        visualAssetType: assetType,
        defaultProperties: defaultProperties[assetType],
      },
    };

    const assetId = addMediaAsset(visualAsset);

    addTimelineItem({
      assetId,
      startTime: 0,
      duration: 3,
      track: 1, // Place on overlay track
      type: 'visual-asset',
      properties: {
        visualAssetType: assetType,
        x: 200, // Center-ish position
        y: 150,
        scale: 1,
        opacity: 1,
        ...defaultProperties[assetType],
      },
      animations: [],
      keyframes: [],
    });

    notify({
      type: 'success',
      title: 'Added',
      message: `${assetNames[assetType]} added to timeline`,
    });

    // Show visual feedback
    setRecentlyAdded('visual-asset');
    setTimeout(() => setRecentlyAdded(null), 1000);

    setShowVisualAssets(false);
  }, [addMediaAsset, addTimelineItem, notify]);

  // Keyboard shortcuts and escape handling
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Close dropdown on Escape
      if (e.key === 'Escape' && showVisualAssets) {
        setShowVisualAssets(false);
        return;
      }

      // Only trigger shortcuts if not typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const isCtrl = e.ctrlKey || e.metaKey;
      
      if (isCtrl && e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case 'c':
            e.preventDefault();
            addCodeClip();
            break;
          case 't':
            e.preventDefault();
            addTitleClip();
            break;
          case 'a':
            e.preventDefault();
            setShowVisualAssets(!showVisualAssets);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showVisualAssets, addCodeClip, addTitleClip]);

  // Dismiss hint
  const dismissHint = useCallback(() => {
    setShowHint(false);
    localStorage.setItem('timelineToolbarHintSeen', 'true');
  }, []);

  // Auto-dismiss hint after 8 seconds
  React.useEffect(() => {
    if (showHint) {
      const timer = setTimeout(dismissHint, 8000);
      return () => clearTimeout(timer);
    }
  }, [showHint, dismissHint]);

  return (
    <div className={`bg-background-tertiary border-b border-border-subtle px-4 py-3 relative ${className}`}>
      {/* Onboarding Hint */}
      {showHint && (
        <div className="absolute top-full left-4 mt-2 bg-synapse-primary text-synapse-text-inverse px-3 py-2 rounded-lg shadow-synapse-md z-50 text-sm max-w-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-start space-x-2">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="font-medium mb-1">Quick Add to Timeline</p>
              <p className="text-xs opacity-90">Instantly add code, titles, and visual assets directly to your timeline!</p>
            </div>
            <button
              onClick={dismissHint}
              className="text-synapse-text-inverse/80 hover:text-synapse-text-inverse ml-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Arrow pointing up */}
          <div className="absolute bottom-full left-6 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent" style={{ borderBottomColor: 'var(--synapse-primary)' }}></div>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-text-secondary">Add to Timeline:</span>
            <span className="text-xs text-text-tertiary hidden lg:block">Use Ctrl+Shift+C/T/A for quick access</span>
          </div>
          
          {/* Code Button */}
          <button
            onClick={addCodeClip}
            className={`flex items-center space-x-2 text-synapse-text-inverse px-3 py-2 rounded-lg text-sm font-medium transition-all shadow-synapse-sm ${
              recentlyAdded === 'code' 
                ? 'bg-synapse-clip-code scale-105 shadow-synapse-md' 
                : 'bg-synapse-clip-code hover:opacity-90'
            }`}
            title="Add code clip to timeline (Ctrl+Shift+C)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <span>Code</span>
          </button>

          {/* Title Button */}
          <button
            onClick={addTitleClip}
            className={`flex items-center space-x-2 text-synapse-text-inverse px-3 py-2 rounded-lg text-sm font-medium transition-all shadow-synapse-sm ${
              recentlyAdded === 'title' 
                ? 'bg-synapse-clip-text scale-105 shadow-synapse-md' 
                : 'bg-synapse-clip-text hover:opacity-90'
            }`}
            title="Add title to timeline (Ctrl+Shift+T)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            <span>Title</span>
          </button>

          {/* Visual Assets Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowVisualAssets(!showVisualAssets)}
            className={`flex items-center space-x-2 text-synapse-text-inverse px-3 py-2 rounded-lg text-sm font-medium transition-all shadow-synapse-sm ${
                recentlyAdded === 'visual-asset' 
                  ? 'bg-synapse-clip-video scale-105 shadow-synapse-md' 
                  : 'bg-synapse-clip-video hover:opacity-90'
              }`}
              title="Add visual assets to timeline (Ctrl+Shift+A)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4z" />
              </svg>
              <span>Assets</span>
              <svg className={`w-3 h-3 transition-transform ${showVisualAssets ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showVisualAssets && (
              <div className="absolute top-full left-0 mt-1 bg-background-tertiary border border-border-subtle rounded-lg shadow-synapse-lg z-50 min-w-[160px]">
                <button
                  onClick={() => addVisualAsset('arrow')}
                  className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-synapse-surface-hover transition-colors flex items-center space-x-2 rounded-t-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                  <span>Arrow</span>
                </button>
                <button
                  onClick={() => addVisualAsset('box')}
                  className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-synapse-surface-hover transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16v12H4z" />
                  </svg>
                  <span>Box</span>
                </button>
                <button
                  onClick={() => addVisualAsset('finger-pointer')}
                  className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-synapse-surface-hover transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 13l3 3 7-7" />
                  </svg>
                  <span>Finger Pointer</span>
                </button>
                <button
                  onClick={() => addVisualAsset('circle')}
                  className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-synapse-surface-hover transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" strokeWidth={2} />
                  </svg>
                  <span>Circle</span>
                </button>
                <button
                  onClick={() => addVisualAsset('line')}
                  className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-synapse-surface-hover transition-colors flex items-center space-x-2 rounded-b-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                  </svg>
                  <span>Line</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right side - Upload Media Button */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <button
            onClick={() => {
              // Trigger file input click
              const fileInput = document.createElement('input');
              fileInput.type = 'file';
              fileInput.multiple = true;
              fileInput.accept = 'video/*,image/*,audio/*';
              fileInput.onchange = (e) => {
                const files = (e.target as HTMLInputElement).files;
                if (files) {
                  // Dispatch custom event to MediaBin to handle file upload
                  window.dispatchEvent(new CustomEvent('uploadFiles', { detail: files }));
                }
              };
              fileInput.click();
            }}
            className="flex items-center space-x-2 bg-synapse-primary hover:bg-synapse-primary-hover text-synapse-text-inverse px-3 py-2 rounded-lg text-sm font-medium transition-colors shadow-synapse-sm"
            title="Upload media files"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span>Upload Media</span>
          </button>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {showVisualAssets && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowVisualAssets(false)}
        />
      )}
    </div>
  );
}