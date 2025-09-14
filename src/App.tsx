import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import React, { useEffect } from 'react';
import { AppProvider } from './state/context';
import { AuthProvider } from './state/authContext';
import { BootProgressProvider } from './state/bootProgress';
import { LoadingOverlay } from './components/LoadingOverlay';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NotificationsProvider } from './state/notifications';
import { HistoryProvider } from './state/history';
const Landing = React.lazy(() => import('./components/Landing'));
const DownloadsPage = React.lazy(() => import('./components/DownloadsPage'));
const DashboardView = React.lazy(() => import('./components/DashboardView').then(m => ({ default: m.DashboardView })));
const StudioView = React.lazy(() => import('./components/StudioView').then(m => ({ default: m.StudioView })));
import './App.css';
import './styles/responsive-educational.css';
import { useProjectStore } from './state/projectStore';
import { LicenseProvider } from './state/license';
import { UpdateBanner } from './components/UpdateBanner';
import { LicenseGate } from './components/LicenseGate';
import { PerformanceMonitor } from './components/PerformanceMonitor';
import { FLAGS } from './lib/flags';
import { StudioLoader } from './components/ui/StudioLoader';
import { StudioBootLoader } from './components/ui/StudioBootLoader';
import { BootProgressMarker } from './components/BootProgressMarker';

function GlobalShortcutsAndBridge() {
  // Global shortcuts only; no store subscription needed here

  // Global keyboard shortcuts for undo/redo wired to Zustand temporal store
  useEffect(() => {
    const isInEditableContext = (el: EventTarget | null): boolean => {
      let node = (el as HTMLElement | null) ?? null;
      while (node && node !== document.body) {
        const tag = node.tagName?.toLowerCase();
        const role = node.getAttribute?.('role');
        // Native inputs/textarea/select
        if (tag === 'input' || tag === 'textarea' || tag === 'select') {
          return true;
        }
        // contenteditable (direct or ancestor)
        if (
          node.isContentEditable ||
          node.getAttribute?.('contenteditable') === 'true'
        )
          return true;
        // ARIA textbox role (covers custom editors)
        if (role === 'textbox') return true;
        node = node.parentElement;
      }
      return false;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      // Don't hijack typing anywhere inside an editable context
      if (isInEditableContext(event.target)) return;

      const key = event.key.toLowerCase();
      const isMeta = event.metaKey || event.ctrlKey;
      if (!isMeta) return;

      try {
        if (useProjectStore && typeof useProjectStore.temporal === 'function') {
          const temporal = useProjectStore.temporal();
          if (!temporal) return;

          if (key === 'z') {
            event.preventDefault();
            if (event.shiftKey) temporal.redo?.();
            else temporal.undo?.();
          } else if (key === 'y') {
            event.preventDefault();
            temporal.redo?.();
          }
        }
      } catch (error) {
        console.warn('Failed to access temporal store:', error);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Component renders nothing; attaches global keyboard handlers above

  return null;
}

function App() {
  return (
    <AuthProvider>
      <BootProgressProvider>
        <AppProvider>
          <LicenseProvider>
            <NotificationsProvider>
              <ErrorBoundary>
                <HistoryProvider>
                  <GlobalShortcutsAndBridge />
                  <React.Suspense fallback={<StudioBootLoader />}> 
                    <Router>
                      <UpdateBanner />
                      <Routes>
                        <Route path="/" element={<Landing />} />
                        <Route path="/projects" element={<DashboardView />} />
                        <Route path="/studio" element={<StudioView />} />
                        <Route path="/downloads" element={<DownloadsPage />} />
                      </Routes>
                      {/* License gate must be inside Router to scope by route */}
                      <LicenseGate />
                      {/* When the routed content mounts, finish the boot progress */}
                      <BootProgressMarker />
                    </Router>
                  </React.Suspense>
                  <LoadingOverlay />
                  {FLAGS.SHOW_FPS && <PerformanceMonitor enabled />}
                </HistoryProvider>
              </ErrorBoundary>
            </NotificationsProvider>
          </LicenseProvider>
        </AppProvider>
      </BootProgressProvider>
    </AuthProvider>
  );
}

export default App;
