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
import { StudioLoader } from './ui/StudioLoader';
import { ResizablePanel } from './ResizablePanel';
import { ArrowLeft, Sparkles, Settings, Archive, PanelRight } from 'lucide-react';
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
import { FLAGS } from '../lib/flags';

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
  const [rightPanelWidth, setRightPanelWidth] = useState<number>(() => {
    try {
      const saved = parseInt(localStorage.getItem('ui:rightPanelWidth') || '', 10);
      return Number.isNaN(saved) ? 320 : saved;
    } catch {
      return 320;
    }
  });

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

  // Loader hooks must be defined unconditionally before any return path
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showLoader, setShowLoader] = useState(true);

  // Simulate staged loading until the main editor mounts
  useEffect(() => {
    let p = 0;
    const tick = () => {
      p = Math.min(90, p + Math.random() * 8 + 4);
      setLoadingProgress(p);
    };
    const id = setInterval(tick, 180);
    // When content mounts, complete and hide
    const done = setTimeout(() => {
      setLoadingProgress(100);
      setTimeout(() => setShowLoader(false), 250);
    }, 1200);
    return () => {
      clearInterval(id);
      clearTimeout(done);
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
    <div className="min-h-screen bg-synapse-background flex flex-col">
      {/* Elegant Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-synapse-surface/90 backdrop-blur-sm border-b border-synapse-border px-6 py-4 shadow-synapse-sm"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/projects')}
              className="text-text-secondary hover:text-synapse-primary p-2 rounded-full hover:bg-synapse-primary/10 transition-all duration-200 hover:scale-105"
              title="Back to Projects"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-synapse-primary rounded-xl flex items-center justify-center shadow-synapse-md">
                <Sparkles className="w-5 h-5 text-synapse-text-inverse" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-text-primary">
                  {project.name}
                </h1>
                <p className="text-sm text-text-secondary">
                  {project.timeline.length} clips • {project.mediaAssets.length}{' '}
                  assets
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* UI Mode Toggle (gated) */}
            {FLAGS.ADVANCED_UI && (
              <div data-tutorial="mode-toggle">
                <UIModeToggle />
              </div>
            )}
            
            {/* Help Controls + Settings */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowTips((v) => !v)}
                className="p-3 rounded-xl transition-all duration-200 hover:scale-105 bg-synapse-surface border border-synapse-border text-synapse-primary hover:bg-synapse-primary/10 hover:border-synapse-border-hover"
                title="Show contextual tips"
                aria-pressed={showTips}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <button
                onClick={() => setShowGuide(true)}
                className="px-3 py-2 rounded-lg bg-synapse-surface border border-synapse-border text-text-primary hover:bg-synapse-surface-hover hover:border-synapse-border-hover text-sm"
                title="Open best practices guide"
              >
                Guide
              </button>
              {/* Settings gear */}
              <HeaderSettingsMenu />
            </div>
            
            {/* Panel Controls */}
            <div className="flex items-center space-x-2">
              {/* Undo/Redo Buttons - Show in both modes but more prominent in advanced */}
              <ModeAwareComponent mode="both">
                <UndoButton
                  className={`p-3 rounded-xl transition-all duration-200 hover:scale-105 bg-synapse-surface border border-synapse-border text-text-primary hover:bg-synapse-surface-hover hover:border-synapse-border-hover disabled:border-synapse-border disabled:text-text-tertiary disabled:cursor-not-allowed disabled:hover:scale-100 disabled:bg-synapse-surface`}
                  title="Undo (Ctrl+Z)"
                />
                <RedoButton
                  className={`p-3 rounded-xl transition-all duration-200 hover:scale-105 bg-synapse-surface border border-synapse-border text-text-primary hover:bg-synapse-surface-hover hover:border-synapse-border-hover disabled:border-synapse-border disabled:text-text-tertiary disabled:cursor-not-allowed disabled:hover:scale-100 disabled:bg-synapse-surface`}
                  title="Redo (Ctrl+Y / Shift+Ctrl+Z)"
                />
              </ModeAwareComponent>
              <button
                onClick={() => {
                  // Open Media Bin; ensure Inspector is closed to avoid overlap
                  if (!ui.mediaBinVisible && ui.inspectorVisible) {
                    toggleInspector();
                  }
                  toggleMediaBin();
                }}
                className={`p-3 rounded-xl transition-all duration-200 hover:scale-105 ${
                  ui.mediaBinVisible
                    ? 'bg-synapse-primary text-synapse-text-inverse shadow-synapse-md'
                    : 'bg-synapse-surface border border-synapse-border text-synapse-primary hover:bg-synapse-primary/10 hover:border-synapse-border-hover'
                }`}
                title="Toggle Media Bin"
              >
                <Archive className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  // Open Inspector; ensure Media Bin is closed to avoid overlap
                  if (!ui.inspectorVisible && ui.mediaBinVisible) {
                    toggleMediaBin();
                  }
                  toggleInspector();
                }}
                className={`p-3 rounded-xl transition-all duration-200 hover:scale-105 ${
                  ui.inspectorVisible
                    ? 'bg-synapse-primary text-synapse-text-inverse shadow-synapse-md'
                    : 'bg-synapse-surface border border-synapse-border text-synapse-primary hover:bg-synapse-primary/10 hover:border-synapse-border-hover'
                }`}
                title="Toggle Properties Panel"
              >
                <PanelRight className="w-4 h-4" />
              </button>
              
              {/* Shortcuts Button - Advanced mode only */}
              <ModeAwareComponent mode="advanced">
                <button
                  onClick={() => setIsShortcutsDialogOpen(true)}
                  className="p-3 rounded-xl transition-all duration-200 hover:scale-105 bg-synapse-surface border border-synapse-border text-text-primary hover:bg-synapse-surface-hover hover:border-synapse-border-hover"
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
        className="flex-1 flex overflow-hidden bg-synapse-surface/40 backdrop-blur-sm m-4 rounded-2xl border border-synapse-border shadow-synapse-lg"
      >
        {/* Main Editor Area */}
        <main className="flex-1 flex flex-col bg-synapse-crust rounded-l-2xl overflow-hidden min-w-0">
          {/* Preview Area */}
          <div className="flex-1 bg-synapse-crust border-r border-synapse-surface2 rounded-tl-2xl overflow-hidden" data-tutorial="preview-area">
            <Preview className="h-full w-full" />
          </div>

          {/* Timeline Area - Resizable */}
          <ResizablePanel
            direction="vertical"
            initialSize={300}
            minSize={250}
            maxSize={500}
            className="border-r border-synapse-surface2 bg-synapse-mantle flex-shrink-0 flex flex-col"
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
            
            {/** Advanced timeline gated by feature flag */}
            {FLAGS.ADVANCED_UI ? (
              <ModeAwareComponent mode="advanced">
                <EnhancedTimelineView className="flex-1" />
              </ModeAwareComponent>
            ) : null}
          </ResizablePanel>
        </main>

        {/* Right Panels */}
        <div
          className="right-panels-container relative transition-all duration-200 ease-in-out overflow-hidden"
          style={{ width: isRightPanelOpen ? rightPanelWidth : 0, pointerEvents: isRightPanelOpen ? 'auto' as const : 'none' as const }}
          aria-hidden={!isRightPanelOpen}
        >
          <ResizablePanel
            direction="horizontal"
            initialSize={rightPanelWidth}
            minSize={250}
            maxSize={600}
            storageKey="ui:rightPanelWidth"
            onSizeChange={(s) => setRightPanelWidth(s)}
            className="flex flex-col bg-synapse-surface/95 backdrop-blur-sm border-l border-synapse-border rounded-r-2xl overflow-hidden shadow-inner h-full"
          >
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: isRightPanelOpen ? 1 : 0, x: isRightPanelOpen ? 0 : 20 }}
              transition={{ duration: 0.2 }}
              className="h-full flex flex-col"
            >
              {/* Media Bin */}
              {/* Right panel content: show one at a time to avoid overlap */}
              {ui.mediaBinVisible && !ui.inspectorVisible ? (
                <ResizablePanel
                  direction="vertical"
                  initialSize={600}
                  minSize={200}
                  maxSize={800}
                  className={`h-full border-b border-synapse-border bg-synapse-surface`}
                >
                  <div data-tutorial="media-bin">
                    <MediaBin />
                  </div>
                </ResizablePanel>
              ) : null}

              {ui.inspectorVisible && !ui.mediaBinVisible ? (
                <div className={`h-full bg-synapse-surface`}>
                  <Inspector />
                </div>
              ) : null}
            </motion.div>
          </ResizablePanel>
        </div>
      </motion.div>

      {showLoader && <StudioLoader progress={loadingProgress} />}

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
function HeaderSettingsMenu() {
  const [open, setOpen] = React.useState(false);
  const btnRef = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (btnRef.current && !btnRef.current.parentElement?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const toggleTheme = () => {
    try {
      const root = document.documentElement;
      const current = root.getAttribute('data-theme');
      const next = current === 'light' ? null : 'light';
      if (next) root.setAttribute('data-theme', next);
      else root.removeAttribute('data-theme');
      localStorage.setItem('ui:theme', next || 'dark');
    } catch {}
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        className="p-3 rounded-xl transition-all duration-200 hover:scale-105 bg-synapse-surface border border-synapse-border text-text-primary hover:bg-synapse-surface-hover hover:border-synapse-border-hover"
        title="Settings"
      >
        <Settings className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-white border border-purple-200 rounded shadow-lg z-50">
          <button
            className="w-full text-left px-3 py-2 text-sm hover:bg-purple-50"
            onClick={toggleTheme}
          >
            Toggle light/dark mode
          </button>
        </div>
      )}
    </div>
  );
}

export function StudioView() {
  // Initialize theme from localStorage on first mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('ui:theme');
      const root = document.documentElement;
      if (saved === 'light') root.setAttribute('data-theme', 'light');
      else root.removeAttribute('data-theme');
    } catch {}
  }, []);

  return (
    <ExportProvider>
      <StudioViewContent />
    </ExportProvider>
  );
}
