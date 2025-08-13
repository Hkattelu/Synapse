import React, { useState } from 'react';
import { useProject, useUI } from '../state/hooks';
import { MediaBin } from './MediaBin';
import { Timeline } from './Timeline';
import { EnhancedTimelineView } from './EnhancedTimelineView';
import { Preview } from './Preview';
import { Inspector } from './Inspector';

export function StudioView() {
  const { project } = useProject();
  const { ui, setCurrentView, toggleSidebar, toggleInspector, toggleMediaBin } = useUI();
  const [timelineMode, setTimelineMode] = useState<'standard' | 'enhanced'>('enhanced');

  if (!project) {
    return (
      <div className="min-h-screen bg-synapse-background text-synapse-text-primary flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No Project Loaded</h2>
          <p className="text-synapse-text-secondary mb-6">Please create or load a project to start editing</p>
          <button
            onClick={() => setCurrentView('dashboard')}
            className="bg-synapse-primary hover:bg-synapse-primary-hover text-synapse-text-inverse font-medium py-2 px-4 rounded-synapse transition-colors duration-synapse-fast"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      {/* Simplified Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="text-gray-400 hover:text-gray-200 p-2 rounded-md hover:bg-gray-700 transition-colors"
              title="Back to Dashboard"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-semibold">{project.name}</h1>
              <p className="text-sm text-gray-400">
                {project.timeline.length} clips • {project.mediaAssets.length} assets
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Timeline Mode Toggle */}
            <div className="flex bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setTimelineMode('standard')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  timelineMode === 'standard' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
                title="Standard Timeline"
              >
                Standard
              </button>
              <button
                onClick={() => setTimelineMode('enhanced')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  timelineMode === 'enhanced' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
                title="Enhanced Timeline with Keyframes"
              >
                Enhanced
              </button>
            </div>

            {/* Panel Controls */}
            <div className="flex items-center space-x-1">
              <button
                onClick={toggleMediaBin}
                className={`p-2 rounded-md transition-colors ${
                  ui.mediaBinVisible 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                title="Toggle Media Bin"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </button>
              <button
                onClick={toggleInspector}
                className={`p-2 rounded-md transition-colors ${
                  ui.inspectorVisible 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                title="Toggle Properties Panel"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100-4m0 4v2m0-6V4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Editor Area */}
        <main className="flex-1 flex flex-col bg-gray-850">
          <div className="flex-1 flex">
            {/* Preview Area */}
            <div className="flex-1 bg-black border-r border-gray-700">
              <Preview className="h-full" />
            </div>
            
            {/* Timeline Area - Always visible */}
            <div className="w-96 border-r border-gray-700">
              {timelineMode === 'enhanced' ? (
                <EnhancedTimelineView className="h-full bg-gray-800" />
              ) : (
                <div className="h-full bg-gray-800">
                  <Timeline className="h-full" />
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Right Panels */}
        {(ui.mediaBinVisible || ui.inspectorVisible) && (
          <div className="w-80 flex flex-col border-l border-gray-700">
            {/* Media Bin */}
            {ui.mediaBinVisible && (
              <div className="flex-1 bg-gray-800 border-b border-gray-700">
                <MediaBin />
              </div>
            )}

            {/* Inspector Panel */}
            {ui.inspectorVisible && (
              <div className="flex-1 bg-gray-800">
                <Inspector />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}