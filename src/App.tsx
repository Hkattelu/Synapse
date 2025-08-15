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

function App() {
  return (
    cAppProvidere
      cNotificationsProvidere
        cErrorBoundarye
          cHistoryProvidere
            cAppContent /e
            cLoadingOverlay /e
          c/HistoryProvidere
        c/ErrorBoundarye
      c/NotificationsProvidere
    c/AppProvidere
  );
}

export default App;
