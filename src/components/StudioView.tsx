import { useProject, useUI } from '../state/hooks';
import { MediaBin } from './MediaBin';
import { Timeline } from './Timeline';
import { Preview } from './Preview';
import { Inspector } from './Inspector';

export function StudioView() {
  const { project } = useProject();
  const { ui, setCurrentView, toggleSidebar, toggleInspector, toggleMediaBin } = useUI();

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No Project Loaded</h2>
          <p className="text-gray-400 mb-6">Please create or load a project to start editing</p>
          <button
            onClick={() => setCurrentView('dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentView('dashboard')}
            className="text-gray-400 hover:text-white transition-colors"
            title="Back to Dashboard"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-semibold">{project.name}</h1>
            <p className="text-xs text-gray-400">
              {project.timeline.length} clips • {project.mediaAssets.length} assets
            </p>
          </div>
        </div>

        {/* View Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleSidebar}
            className={`p-2 rounded ${ui.sidebarVisible ? 'bg-blue-600' : 'bg-gray-700'} hover:bg-blue-700 transition-colors`}
            title="Toggle Sidebar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button
            onClick={toggleMediaBin}
            className={`p-2 rounded ${ui.mediaBinVisible ? 'bg-blue-600' : 'bg-gray-700'} hover:bg-blue-700 transition-colors`}
            title="Toggle Media Bin"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </button>
          <button
            onClick={toggleInspector}
            className={`p-2 rounded ${ui.inspectorVisible ? 'bg-blue-600' : 'bg-gray-700'} hover:bg-blue-700 transition-colors`}
            title="Toggle Inspector"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {ui.sidebarVisible && (
          <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <h3 className="font-semibold text-sm text-gray-300 uppercase tracking-wide">Navigation</h3>
            </div>
            <nav className="flex-1 p-4">
              <ul className="space-y-2">
                <li>
                  <button className="w-full text-left px-3 py-2 rounded bg-gray-700 text-white">
                    Timeline
                  </button>
                </li>
                <li>
                  <button className="w-full text-left px-3 py-2 rounded text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
                    Media Assets
                  </button>
                </li>
                <li>
                  <button className="w-full text-left px-3 py-2 rounded text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
                    Export
                  </button>
                </li>
              </ul>
            </nav>
          </aside>
        )}

        {/* Main Editor Area */}
        <main className="flex-1 flex flex-col">
          {/* Preview Area */}
          <Preview className="flex-1 border-b border-gray-700" />

          {/* Timeline Area */}
          <Timeline className="h-64" />
        </main>

        {/* Media Bin */}
        {ui.mediaBinVisible && (
          <aside className="w-80 bg-gray-800 border-l border-gray-700">
            <MediaBin />
          </aside>
        )}

        {/* Inspector Panel */}
        {ui.inspectorVisible && (
          <aside className="w-80 bg-gray-800 border-l border-gray-700">
            <Inspector />
          </aside>
        )}
      </div>
    </div>
  );
}