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
import { ArrowLeft, Sparkles, Settings, Archive } from 'lucide-react';
import { UndoButton } from './UndoButton';
import { RedoButton } from './RedoButton';
import { ShortcutsDialog } from './ShortcutsDialog';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { UIModeToggle } from './UIModeToggle';
import { ModeAwareComponent, useFeatureVisibility } from './ModeAwareComponent';
import { EducationalTimeline } from './EducationalTimeline';
import { OnboardingDialog } from './educational/OnboardingDialog';
import { HelpTipsOverlay } from './educational/HelpTipsOverlay';
import { EducationalBestPractices } from './educational/EducationalBestPractices';
import { InteractiveTutorial } from './educational/InteractiveTutorial';

function StudioViewContent() {
  const { project } = useProject();
  const { ui, toggleInspector, toggleMediaBin } = useUI();
  const navigate = useNavigate();
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isRecorderDialogOpen, setIsRecorderDialogOpen] = useState(false);
  const [isShortcutsDialogOpen, setIsShortcutsDialogOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  
  const isRightPanelOpen = ui.mediaBinVisible || ui.inspectorVisible;

  useEffect(() => {
    try {
      const flag = localStorage.getItem('seui_onboarded_v1');
      if (!flag) setShowOnboarding(true);
    } catch {}
  }, []);
  
  // Get selected item for keyboard shortcuts
  const selectedItemId = project?.timeline.find(item => 
    // This is a simplified way to get selected item - you might need to adjust based on your selection logic
    false // Replace with actual selection logic
  )?.id || null;

  // Setup keyboard shortcuts
  useKeyboardShortcuts({
    selectedItemId,
    onToggleFullscreen: () => setIsFullscreen(!isFullscreen),
    onShowShortcuts: () => setIsShortcutsDialogOpen(true),
  });

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
            {/* UI Mode Toggle */}
            <div data-tutorial="mode-toggle">
              <UIModeToggle />
            </div>
            
            {/* Help Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowTips((v) => !v)}
                className="p-3 rounded-xl transition-all duration-200 hover:scale-105 bg-white border border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300"
                title="Show contextual tips"
                aria-pressed={showTips}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <button
                onClick={() => setShowGuide(true)}
                className="px-3 py-2 rounded-lg bg-white border border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 text-sm"
                title="Open best practices guide"
              >
                Guide
              </button>
            </div>
            
            {/* Panel Controls */}
            <div className="flex items-center space-x-2">
              {/* Undo/Redo Buttons - Show in both modes but more prominent in advanced */}
              <ModeAwareComponent mode="both">
                <UndoButton
                  className={`p-3 rounded-xl transition-all duration-200 hover:scale-105 bg-white border text-purple-600 hover:bg-purple-50 hover:border-purple-300 disabled:border-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:bg-gray-50`}
                  title="Undo (Ctrl+Z)"
                />
                <RedoButton
                  className={`p-3 rounded-xl transition-all duration-200 hover:scale-105 bg-white border text-purple-600 hover:bg-purple-50 hover:border-purple-300 disabled:border-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:bg-gray-50`}
                  title="Redo (Ctrl+Y / Shift+Ctrl+Z)"
                />
              </ModeAwareComponent>
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
              
              {/* Shortcuts Button - Advanced mode only */}
              <ModeAwareComponent mode="advanced">
                <button
                  onClick={() => setIsShortcutsDialogOpen(true)}
                  className="p-3 rounded-xl transition-all duration-200 hover:scale-105 bg-white border border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300"
                  title="Keyboard Shortcuts (?)"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </ModeAwareComponent>
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
          <div className="flex-1 bg-black border-r border-gray-700/50 rounded-tl-2xl overflow-hidden" data-tutorial="preview-area">
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
            {/* Mode-aware timeline rendering */}
            <ModeAwareComponent mode="simplified">
              <div data-tutorial="educational-timeline">
                <EducationalTimeline 
                  className="flex-1" 
                  mode="simplified"
                  onModeChange={(mode) => {
                    // Update UI mode when timeline mode changes
                    if (mode === 'advanced') {
                      // Switch to advanced mode globally
                      window.dispatchEvent(new CustomEvent('switchToAdvancedMode'));
                    }
                  }}
                />
              </div>
            </ModeAwareComponent>
            
            <ModeAwareComponent mode="advanced">
              <EnhancedTimelineView className="flex-1" />
            </ModeAwareComponent>
          </ResizablePanel>
        </main>

        {/* Right Panels */}
        <div
          className="right-panels-container relative transition-all duration-200 ease-in-out overflow-hidden"
          style={{ width: isRightPanelOpen ? 320 : 0, pointerEvents: isRightPanelOpen ? 'auto' as const : 'none' as const }}
          aria-hidden={!isRightPanelOpen}
        >
          <ResizablePanel
            direction="horizontal"
            initialSize={320}
            minSize={250}
            maxSize={600}
            className="flex flex-col bg-white/95 backdrop-blur-sm border-l border-purple-200 rounded-r-2xl overflow-hidden shadow-inner h-full"
          >
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: isRightPanelOpen ? 1 : 0, x: isRightPanelOpen ? 0 : 20 }}
              transition={{ duration: 0.2 }}
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
                  <div data-tutorial="media-bin">
                    <MediaBin />
                  </div>
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
        </div>
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

      {/* Shortcuts Dialog */}
      <ShortcutsDialog
        isOpen={isShortcutsDialogOpen}
        onClose={() => setIsShortcutsDialogOpen(false)}
      />

      {/* Onboarding */}
      <OnboardingDialog
        isOpen={showOnboarding}
        onClose={() => {
          setShowOnboarding(false);
          try { localStorage.setItem('seui_onboarded_v1', 'true'); } catch {}
        }}
        onStartTutorial={() => {
          setShowOnboarding(false);
          setShowTips(false);
          setShowTutorial(true);
          try { localStorage.setItem('seui_onboarded_v1', 'true'); } catch {}
        }}
        onOpenGuide={() => {
          setShowGuide(true);
        }}
      />

      {/* Contextual Tips */}
      <HelpTipsOverlay active={showTips} onClose={() => setShowTips(false)} />

      {/* Best Practices Guide */}
      <EducationalBestPractices isOpen={showGuide} onClose={() => setShowGuide(false)} />

      {/* Interactive Tutorial */}
      <InteractiveTutorial
        isActive={showTutorial}
        onComplete={() => setShowTutorial(false)}
        onClose={() => setShowTutorial(false)}
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
