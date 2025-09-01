import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { AppProvider } from './state/context';
import { AuthProvider } from './state/authContext';
import { DashboardView } from './components/DashboardView';
import { StudioView } from './components/StudioView';
import { LoadingOverlay } from './components/LoadingOverlay';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NotificationsProvider } from './state/notifications';
import { HistoryProvider } from './state/history';
import Landing from './components/Landing';
import DownloadsPage from './components/DownloadsPage';
import './App.css';
import { useProjectStore } from './state/projectStore';
import { LicenseProvider } from './state/license';
import { UpdateBanner } from './components/UpdateBanner';
import { LicenseGate } from './components/LicenseGate';

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
      <AppProvider>
        <LicenseProvider>
          <NotificationsProvider>
            <ErrorBoundary>
              <HistoryProvider>
                <GlobalShortcutsAndBridge />
                <UpdateBanner />
                <Router>
                  <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/projects" element={<DashboardView />} />
                    <Route path="/studio" element={<StudioView />} />
                    <Route path="/downloads" element={<DownloadsPage />} />
                  </Routes>
                </Router>
                <LoadingOverlay />
                <LicenseGate />
              </HistoryProvider>
            </ErrorBoundary>
          </NotificationsProvider>
        </LicenseProvider>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
