import { useProject, useUI } from '../state/hooks';

export function DashboardView() {
  const { project, createProject } = useProject();
  const { setCurrentView } = useUI();

  const handleCreateProject = () => {
    const projectName = prompt('Enter project name:');
    if (projectName?.trim()) {
      createProject(projectName.trim());
      setCurrentView('studio');
    }
  };

  const handleOpenProject = () => {
    // For now, just switch to studio view with current project
    setCurrentView('studio');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Synapse Studio</h1>
            <p className="text-gray-400 text-sm">Video creation made simple</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Welcome to Synapse Studio</h2>
            <p className="text-xl text-gray-400 mb-8">
              Create professional videos with timeline editing and animated code snippets
            </p>
          </div>

          {/* Project Actions */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-semibold mb-4">Create New Project</h3>
              <p className="text-gray-400 mb-6">
                Start a new video project with an empty timeline and media bin
              </p>
              <button
                onClick={handleCreateProject}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Create Project
              </button>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-semibold mb-4">Open Existing Project</h3>
              <p className="text-gray-400 mb-6">
                Continue working on a previously saved project
              </p>
              <button
                onClick={handleOpenProject}
                disabled={!project}
                className="w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                {project ? `Open "${project.name}"` : 'No Project Available'}
              </button>
            </div>
          </div>

          {/* Current Project Info */}
          {project && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-semibold mb-4">Current Project</h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Name:</span>
                  <p className="font-medium">{project.name}</p>
                </div>
                <div>
                  <span className="text-gray-400">Created:</span>
                  <p className="font-medium">{project.createdAt.toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-gray-400">Timeline Items:</span>
                  <p className="font-medium">{project.timeline.length}</p>
                </div>
              </div>
            </div>
          )}

          {/* Features Overview */}
          <div className="mt-12">
            <h3 className="text-2xl font-semibold mb-6 text-center">Features</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-blue-600 w-12 h-12 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h4 className="font-semibold mb-2">Timeline Editor</h4>
                <p className="text-gray-400 text-sm">Drag and drop clips on a multi-track timeline</p>
              </div>
              <div className="text-center">
                <div className="bg-green-600 w-12 h-12 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <h4 className="font-semibold mb-2">Animated Code</h4>
                <p className="text-gray-400 text-sm">Create typing animations for code snippets</p>
              </div>
              <div className="text-center">
                <div className="bg-purple-600 w-12 h-12 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z" />
                  </svg>
                </div>
                <h4 className="font-semibold mb-2">Animation Presets</h4>
                <p className="text-gray-400 text-sm">Apply professional transitions and effects</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}