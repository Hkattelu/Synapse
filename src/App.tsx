import { AppProvider } from './state/context';
import { useUI } from './state/hooks';
import { DashboardView } from './components/DashboardView';
import { StudioView } from './components/StudioView';
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
      <AppContent />
    </AppProvider>
  );
}

export default App;
