import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <NotificationsProvider>
          <ErrorBoundary>
            <HistoryProvider>
              <Router>
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/projects" element={<DashboardView />} />
                  <Route path="/studio" element={<StudioView />} />
                  <Route path="/downloads" element={<DownloadsPage />} />
                </Routes>
              </Router>
              <LoadingOverlay />
            </HistoryProvider>
          </ErrorBoundary>
        </NotificationsProvider>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
