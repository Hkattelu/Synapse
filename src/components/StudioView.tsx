import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useProject, useUI } from '../state/hooks';
import { MediaBin } from './MediaBin';
import { Timeline } from './Timeline';
import { EnhancedTimelineView } from './EnhancedTimelineView';
import { Preview } from './Preview';
import { Inspector } from './Inspector';
import { ExportDialog } from './ExportDialog';
import { ExportProvider } from '../state/exportContext';
import { AuthProvider } from '../state/authContext';
import { AccountStatus } from './AccountStatus';
import { ArrowLeft, Sparkles, Settings, Archive, Eye } from 'lucide-react';
import { useHistory } from '../state/history';

function StudioViewContent() {
  const { project } = useProject();
  const { ui, setCurrentView, toggleSidebar, toggleInspector, toggleMediaBin } =
    useUI();
  const [timelineMode, setTimelineMode] = useState<'standard' | 'enhanced'>(
    'enhanced'
  );
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const { undo, redo, canUndo, canRedo } = useHistory();

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      if (isCtrl && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if (isCtrl && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  // Listen for export dialog open event from Preview component
  useEffect(() => {
    const handleOpenExportDialog = () => {
      setIsExportDialogOpen(true);
    };

    window.addEventListener('openExportDialog', handleOpenExportDialog);

    return () => {
      window.removeEventListener('openExportDialog', handleOpenExportDialog);
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
            onClick={() => setCurrentView('dashboard')}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-full transition-all duration-200 hover:scale-105 hover:shadow-lg flex items-center space-x-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
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
              onClick={() => setCurrentView('dashboard')}
              className="text-gray-500 hover:text-purple-600 p-2 rounded-full hover:bg-purple-100 transition-all duration-200 hover:scale-105"
              title="Back to Dashboard"
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
            <a
              href="/launch"
              className="px-3 py-2 text-sm font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors"
              title="Open Launch Page"
            >
              Launch
            </a>
            <AccountStatus />
            {/* Timeline Mode Toggle */}
            <div className="flex bg-purple-100 rounded-xl p-1">
              <button
                onClick={() => setTimelineMode('standard')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  timelineMode === 'standard'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-purple-700 hover:text-purple-900 hover:bg-purple-200'
                }`}
                title="Standard Timeline"
              >
                Standard
              </button>
              <button
                onClick={() => setTimelineMode('enhanced')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  timelineMode === 'enhanced'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-purple-700 hover:text-purple-900 hover:bg-purple-200'
                }`}
                title="Enhanced Timeline with Keyframes"
              >
                Enhanced
              </button>
            </div>

            {/* Panel Controls */}
            cdiv className="flex items-center space-x-2"e
              {/* Undo/Redo Buttons */}
              cbutton
                onClick={undo}
                disabled={!canUndo}
                className={`p-3 rounded-xl transition-all duration-200 hover:scale-105 ${
                  canUndo
                    ? 'bg-white border border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300'
                    : 'bg-white border border-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                title="Undo (Ctrl+Z)"
              e
                csvg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"e
                  cpath strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l-7-7 7-7"ec/pathe
                  cpath strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 19V5"ec/pathe
                c/svge
              c/buttone
              cbutton
                onClick={redo}
                disabled={!canRedo}
                className={`p-3 rounded-xl transition-all duration-200 hover:scale-105 ${
                  canRedo
                    ? 'bg-white border border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300'
                    : 'bg-white border border-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                title="Redo (Ctrl+Y / Shift+Ctrl+Z)"
              e
                csvg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"e
                  cpath strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5l7 7-7 7"ec/pathe
                  cpath strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5v14"ec/pathe
                c/svge
              c/buttone
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
        <main className="flex-1 flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-l-2xl overflow-hidden">
          <div className="flex-1 flex">
            {/* Preview Area */}
            <div className="flex-1 bg-black border-r border-gray-700/50 rounded-tl-2xl overflow-hidden">
              <Preview className="h-full" />
            </div>

            {/* Timeline Area - Always visible */}
            <div className="w-96 border-r border-gray-700/50 bg-gradient-to-b from-gray-800 to-gray-900">
              {timelineMode === 'enhanced' ? (
                <EnhancedTimelineView className="h-full" />
              ) : (
                <div className="h-full">
                  <Timeline className="h-full" />
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Right Panels */}
        {(ui.mediaBinVisible || ui.inspectorVisible) && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="w-80 flex flex-col bg-white/95 backdrop-blur-sm border-l border-purple-200 rounded-r-2xl overflow-hidden shadow-inner"
          >
            {/* Media Bin */}
            {ui.mediaBinVisible && (
              <div
                className={`${ui.inspectorVisible ? 'flex-1' : 'h-full'} border-b border-purple-200/50 bg-gradient-to-b from-white to-purple-50/30`}
              >
                <MediaBin />
              </div>
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
        )}
      </motion.div>

      {/* Export Dialog */}
      <ExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
      />
    </div>
  );
}

// Wrapper component with ExportProvider
export function StudioView() {
  return (
    <AuthProvider>
      <ExportProvider>
        <StudioViewContent />
      </ExportProvider>
    </AuthProvider>
  );
}
