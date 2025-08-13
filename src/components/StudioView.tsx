import { useProject, useUI } from '../state/hooks';

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
          <div className="flex-1 bg-black flex items-center justify-center border-b border-gray-700">
            <div className="text-center text-gray-400">
              <div className="w-16 h-16 bg-gray-800 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-lg font-medium">Preview Area</p>
              <p className="text-sm">Video preview will appear here</p>
            </div>
          </div>

          {/* Timeline Area */}
          <div className="h-64 bg-gray-800 border-t border-gray-700">
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-700 rounded-lg mx-auto mb-3 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="font-medium">Timeline</p>
                <p className="text-sm">Drag clips here to build your video</p>
              </div>
            </div>
          </div>
        </main>

        {/* Media Bin */}
        {ui.mediaBinVisible && (
          <aside className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <h3 className="font-semibold text-sm text-gray-300 uppercase tracking-wide">Media Bin</h3>
            </div>
            <div className="flex-1 p-4">
              <div className="h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gray-700 rounded-lg mx-auto mb-3 flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="font-medium">No Media</p>
                  <p className="text-sm">Upload files to get started</p>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Inspector Panel */}
        {ui.inspectorVisible && (
          <aside className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <h3 className="font-semibold text-sm text-gray-300 uppercase tracking-wide">Inspector</h3>
            </div>
            <div className="flex-1 p-4">
              <div className="h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gray-700 rounded-lg mx-auto mb-3 flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <p className="font-medium">No Selection</p>
                  <p className="text-sm">Select a clip to edit properties</p>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}