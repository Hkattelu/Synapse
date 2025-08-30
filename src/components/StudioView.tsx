import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useProject, useUI } from '../state/hooks';
import { MediaBin } from './MediaBin';
import { EnhancedTimelineView } from './EnhancedTimelineView';
import { Preview } from './Preview';
import { Inspector } from './Inspector';
import { ExportDialog } from './ExportDialog';
import { RecorderDialog } from './RecorderDialog';
import { ExportProvider } from '../state/exportContext';
import { ResizablePanel } from './ResizablePanel';
import { TimelineToolbar } from './TimelineToolbar';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left.js';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles.js';
import Settings from 'lucide-react/dist/esm/icons/settings.js';
import Archive from 'lucide-react/dist/esm/icons/archive.js';
import { UndoButton } from './UndoButton';
import { RedoButton } from './RedoButton';

function StudioViewContent() {
  const { project } = useProject();
  const { ui, toggleInspector, toggleMediaBin } = useUI();
  const navigate = useNavigate();
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isRecorderDialogOpen, setIsRecorderDialogOpen] = useState(false);
  // Global undo/redo keyboard shortcuts live in App.tsx

  // Listen for export dialog open event from Preview component
  useEffect(() => {
    const handleOpenExportDialog = () => {
      setIsExportDialogOpen(true);
    };

    const handleOpenRecorderDialog = () => {
      setIsRecorderDialogOpen(true);
    };

    window.addEventListener('openExportDialog', handleOpenExportDialog);
    window.addEventListener('openRecorderDialog', handleOpenRecorderDialog);

    return () => {
      window.removeEventListener('openExportDialog', handleOpenExportDialog);
      window.removeEventListener('openRecorderDialog', handleOpenRecorderDialog);
    };
  }, []);

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center bg-white/80 backdrop-blur-sm border border-purple-200 rounded-2xl p-12 shadow-xl max-w-md"
        >
          <div className="w-16 h-16 bg-purple-600 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            No Project Loaded
          </h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Please create or load a project to start your creative journey with
            Synapse Studio
          </p>
          <button
            onClick={() => navigate('/projects')}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-full transition-all duration-200 hover:scale-105 hover:shadow-lg flex items-center space-x-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Projects</span>
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-purple-50 flex flex-col">
      {/* Elegant Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white/90 backdrop-blur-sm border-b border-purple-200 px-6 py-4 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/projects')}
              className="text-gray-500 hover:text-purple-600 p-2 rounded-full hover:bg-purple-100 transition-all duration-200 hover:scale-105"
              title="Back to Projects"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {project.name}
                </h1>
                <p className="text-sm text-gray-600">
                  {project.timeline.length} clips • {project.mediaAssets.length}{' '}
                  assets
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Panel Controls */}
            <div className="flex items-center space-x-2">
              {/* Undo/Redo Buttons */}
              <UndoButton
                className={`p-3 rounded-xl transition-all duration-200 hover:scale-105 bg-white border text-purple-600 hover:bg-purple-50 hover:border-purple-300 disabled:border-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:bg-gray-50`}
                title="Undo (Ctrl+Z)"
              />
              <RedoButton
                className={`p-3 rounded-xl transition-all duration-200 hover:scale-105 bg-white border text-purple-600 hover:bg-purple-50 hover:border-purple-300 disabled:border-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:bg-gray-50`}
                title="Redo (Ctrl+Y / Shift+Ctrl+Z)"
              />
              <button
                onClick={toggleMediaBin}
                className={`p-3 rounded-xl transition-all duration-200 hover:scale-105 ${
                  ui.mediaBinVisible
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-white border border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300'
                }`}
                title="Toggle Media Bin"
              >
                <Archive className="w-4 h-4" />
              </button>
              <button
                onClick={toggleInspector}
                className={`p-3 rounded-xl transition-all duration-200 hover:scale-105 ${
                  ui.inspectorVisible
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-white border border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300'
                }`}
                title="Toggle Properties Panel"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex-1 flex overflow-hidden bg-white/50 backdrop-blur-sm m-4 rounded-2xl border border-purple-200/50 shadow-xl"
      >
        {/* Main Editor Area */}
        <main className="flex-1 flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-l-2xl overflow-hidden min-w-0">
          {/* Preview Area */}
          <div className="flex-1 bg-black border-r border-gray-700/50 rounded-tl-2xl overflow-hidden">
            <Preview className="h-full w-full" />
          </div>

          {/* Timeline Area - Resizable */}
          <ResizablePanel
            direction="vertical"
            initialSize={300}
            minSize={250}
            maxSize={500}
            className="border-r border-gray-700/50 bg-gradient-to-b from-gray-800 to-gray-900 flex-shrink-0 flex flex-col"
          >
            <TimelineToolbar />
            <EnhancedTimelineView className="flex-1" />
          </ResizablePanel>
        </main>

        {/* Right Panels */}
        {(ui.mediaBinVisible || ui.inspectorVisible) && (
          <ResizablePanel
            direction="horizontal"
            initialSize={320}
            minSize={250}
            maxSize={600}
            className="flex flex-col bg-white/95 backdrop-blur-sm border-l border-purple-200 rounded-r-2xl overflow-hidden shadow-inner"
          >
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="h-full flex flex-col"
            >
              {/* Media Bin */}
              {ui.mediaBinVisible && (
                <ResizablePanel
                  direction="vertical"
                  initialSize={ui.inspectorVisible ? 300 : 600}
                  minSize={200}
                  maxSize={800}
                  className={`${ui.inspectorVisible ? '' : 'h-full'} border-b border-purple-200/50 bg-gradient-to-b from-white to-purple-50/30`}
                >
                  <MediaBin />
                </ResizablePanel>
              )}

              {/* Inspector Panel */}
              {ui.inspectorVisible && (
                <div
                  className={`${ui.mediaBinVisible ? 'flex-1' : 'h-full'} bg-gradient-to-b from-purple-50/30 to-white`}
                >
                  <Inspector />
                </div>
              )}
            </motion.div>
          </ResizablePanel>
        )}
      </motion.div>

      {/* Export Dialog */}
      <ExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
      />

      {/* Recorder Dialog */}
      <RecorderDialog
        isOpen={isRecorderDialogOpen}
        onClose={() => setIsRecorderDialogOpen(false)}
      />
    </div>
  );
}

// Wrapper component with ExportProvider
export function StudioView() {
  return (
    <ExportProvider>
      <StudioViewContent />
    </ExportProvider>
  );
}
