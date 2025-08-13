import { AppProvider } from './state/context';
import { useUI } from './state/hooks';
import { StateDemo } from './components/StateDemo';
import './App.css';

// Main app component that switches between views
function AppContent() {
  const { ui } = useUI();

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <h1 className="text-xl font-bold">Synapse Studio</h1>
        <p className="text-gray-400 text-sm">
          Current view: {ui.currentView} | State management system active
        </p>
      </header>
      
      <main className="p-4">
        <StateDemo />
        
        <div className="mt-8 text-center">
          {ui.currentView === 'dashboard' ? (
            <div>
              <h2 className="text-2xl mb-4">Dashboard View</h2>
              <p className="text-gray-400">Project management interface will be implemented here</p>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl mb-4">Studio View</h2>
              <p className="text-gray-400">Video editor interface will be implemented here</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
