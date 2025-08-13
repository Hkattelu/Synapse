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
    <div className="min-h-screen bg-synapse-background text-synapse-text-primary">
      {/* Header */}
      <header className="bg-synapse-surface border-b border-synapse-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold synapse-text-gradient">✦ Synapse Studio</h1>
            <p className="text-synapse-text-secondary text-sm">Video creation made simple for creators</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 synapse-text-gradient">Welcome to Synapse Studio</h2>
            <p className="text-xl text-synapse-text-secondary mb-8">
              Create professional videos with timeline editing and animated code snippets
            </p>
          </div>

          {/* Project Actions */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="bg-synapse-surface rounded-synapse-lg p-6 border border-synapse-border hover:border-synapse-border-hover transition-colors duration-synapse-normal group synapse-glass">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-synapse-primary rounded-synapse mr-4 group-hover:bg-synapse-primary-hover transition-colors duration-synapse-fast">
                  <svg className="w-6 h-6 text-synapse-text-inverse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold">Create New Project</h3>
              </div>
              <p className="text-synapse-text-secondary mb-6">
                Start a new video project with an empty timeline and media bin
              </p>
              <button
                onClick={handleCreateProject}
                className="w-full bg-synapse-primary hover:bg-synapse-primary-hover active:bg-synapse-primary-active text-synapse-text-inverse font-medium py-3 px-4 rounded-synapse transition-all duration-synapse-fast transform hover:scale-[1.02] active:scale-[0.98] synapse-glow"
              >
                Create Project
              </button>
            </div>

            <div className="bg-synapse-surface rounded-synapse-lg p-6 border border-synapse-border hover:border-synapse-border-hover transition-colors duration-synapse-normal group synapse-glass">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-synapse-green rounded-synapse mr-4 group-hover:bg-synapse-teal transition-colors duration-synapse-fast">
                  <svg className="w-6 h-6 text-synapse-text-inverse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold">Open Existing Project</h3>
              </div>
              <p className="text-synapse-text-secondary mb-6">
                Continue working on a previously saved project
              </p>
              <button
                onClick={handleOpenProject}
                disabled={!project}
                className="w-full bg-synapse-surface-hover hover:bg-synapse-surface-active disabled:bg-synapse-surface disabled:opacity-50 text-synapse-text-primary disabled:text-synapse-text-muted font-medium py-3 px-4 rounded-synapse transition-all duration-synapse-fast transform hover:scale-[1.02] active:scale-[0.98] border border-synapse-border disabled:border-synapse-border"
              >
                {project ? `Open "${project.name}"` : 'No Project Available'}
              </button>
            </div>
          </div>

          {/* Current Project Info */}
          {project && (
            <div className="bg-synapse-surface rounded-synapse-lg p-6 border border-synapse-border mb-12 synapse-glass">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <div className="p-2 bg-synapse-mauve rounded-synapse mr-3">
                  <svg className="w-5 h-5 text-synapse-text-inverse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                Current Project
              </h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="flex flex-col">
                  <span className="text-synapse-text-muted font-medium mb-1">Name:</span>
                  <p className="font-semibold text-synapse-text-primary">{project.name}</p>
                </div>
                <div className="flex flex-col">
                  <span className="text-synapse-text-muted font-medium mb-1">Created:</span>
                  <p className="font-semibold text-synapse-text-primary">{project.createdAt.toLocaleDateString()}</p>
                </div>
                <div className="flex flex-col">
                  <span className="text-synapse-text-muted font-medium mb-1">Timeline Items:</span>
                  <p className="font-semibold text-synapse-text-primary">{project.timeline.length}</p>
                </div>
              </div>
            </div>
          )}

          {/* Features Overview */}
          <div className="mt-12">
            <h3 className="text-2xl font-semibold mb-6 text-center">What You Can Create</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center group">
                <div className="bg-synapse-clip-video w-16 h-16 rounded-synapse-xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-synapse-normal">
                  <svg className="w-8 h-8 text-synapse-text-inverse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h4 className="font-semibold mb-2 text-synapse-text-primary">Timeline Editor</h4>
                <p className="text-synapse-text-secondary text-sm">Drag and drop clips on a multi-track timeline with precise control</p>
              </div>
              
              <div className="text-center group">
                <div className="bg-synapse-clip-code w-16 h-16 rounded-synapse-xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-synapse-normal">
                  <svg className="w-8 h-8 text-synapse-text-inverse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <h4 className="font-semibold mb-2 text-synapse-text-primary">Animated Code</h4>
                <p className="text-synapse-text-secondary text-sm">Create smooth typing animations for code snippets and tutorials</p>
              </div>
              
              <div className="text-center group">
                <div className="bg-synapse-peach w-16 h-16 rounded-synapse-xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-synapse-normal">
                  <svg className="w-8 h-8 text-synapse-text-inverse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z" />
                  </svg>
                </div>
                <h4 className="font-semibold mb-2 text-synapse-text-primary">Animation Presets</h4>
                <p className="text-synapse-text-secondary text-sm">Apply professional transitions and effects with one click</p>
              </div>
            </div>
          </div>

          {/* Brand Message */}
          <div className="mt-16 text-center">
            <div className="bg-synapse-surface rounded-synapse-lg p-8 border border-synapse-border synapse-glass">
              <div className="synapse-brand-gradient w-12 h-12 rounded-synapse-xl mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">✦</span>
              </div>
              <h4 className="text-lg font-semibold mb-2 text-synapse-text-primary">Built for Creators</h4>
              <p className="text-synapse-text-secondary max-w-2xl mx-auto">
                Synapse Studio is designed specifically for game developers and educational content creators who need 
                a lightweight, powerful tool for creating professional videos without the complexity of traditional video editors.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
