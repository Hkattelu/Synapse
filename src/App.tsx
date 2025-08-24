import { AppProvider } from './state/context';
import { useUI } from './state/hooks';
import { DashboardView } from './components/DashboardView';
import { StudioView } from './components/StudioView';
import './App.css';
import { LoadingOverlay } from './components/LoadingOverlay';

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

import { ErrorBoundary } from './components/ErrorBoundary';
import { NotificationsProvider } from './state/notifications';
import { HistoryProvider } from './state/history';
import { AuthProvider } from './state/authContext';

function App() {
  return (
    <AppProvider>
      <AuthProvider>
        <NotificationsProvider>
          <ErrorBoundary>
            <HistoryProvider>
              <AppContent />
              <LoadingOverlay />
            </HistoryProvider>
          </ErrorBoundary>
        </NotificationsProvider>
      </AuthProvider>
    </AppProvider>
  );
}

export default App;
