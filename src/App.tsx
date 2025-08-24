import { AppProvider } from './state/context';
import { useUI } from './state/hooks';
import { DashboardView } from './components/DashboardView';
import { StudioView } from './components/StudioView';
import { LoadingOverlay } from './components/LoadingOverlay';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NotificationsProvider } from './state/notifications';
import { HistoryProvider } from './state/history';
import './App.css';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NotificationsProvider } from './state/notifications';
import { HistoryProvider } from './state/history';
import './App.css';

// Main app component that switches between views
function AppContent() {
  const { ui } = useUI();

  // Render the appropriate view based on current state
  switch (ui.currentView) {
    case 'dashboard':
      return <DashboardView />;
    case 'studio':
      return <StudioView />;
    default:
      return <DashboardView />;
  }
}

function App() {
  return (
    <AppProvider>
      <NotificationsProvider>
        <ErrorBoundary>
          <HistoryProvider>
            <AppContent />
            <LoadingOverlay />
          </HistoryProvider>
        </ErrorBoundary>
      </NotificationsProvider>
    </AppProvider>
  );
}

export default App;
