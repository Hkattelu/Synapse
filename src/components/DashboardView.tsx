import React, { useState } from 'react';
import { useProject, useUI } from '../state/hooks';

export function DashboardView() {
  const { project, createProject } = useProject();
  const { setCurrentView } = useUI();
  const [projectName, setProjectName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCreateProject = () => {
    if (projectName.trim()) {
      createProject(projectName.trim());
      setCurrentView('studio');
      setProjectName('');
      setShowCreateForm(false);
    }
  };

  const handleOpenProject = () => {
    setCurrentView('studio');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Simple Header */}
      <header className="border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold">Synapse Studio</h1>
              <p className="text-sm text-gray-400">Video creation made simple</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Get started with your project</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Create professional videos with timeline editing and animated code snippets
          </p>
        </div>

        {/* Main Actions */}
        <div className="max-w-2xl mx-auto">
          {/* Create Project Form */}
          {showCreateForm ? (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
              <h3 className="text-lg font-semibold mb-4">Create New Project</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateProject()}
                    placeholder="My Awesome Project"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleCreateProject}
                    disabled={!projectName.trim()}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    Create Project
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setProjectName('');
                    }}
                    className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Create New Project Button */}
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Create New Project</span>
              </button>

              {/* Open Existing Project */}
              {project && (
                <button
                  onClick={handleOpenProject}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium py-4 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                  </svg>
                  <span>Continue with "{project.name}"</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Current Project Info */}
        {project && (
          <div className="max-w-2xl mx-auto mt-8">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Current Project</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-400 block">Name</span>
                  <span className="font-medium">{project.name}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Created</span>
                  <span className="font-medium">{project.createdAt.toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Items</span>
                  <span className="font-medium">{project.timeline.length} clips</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Features */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h3 className="text-xl font-semibold mb-8 text-center">What you can create</h3>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="w-12 h-12 bg-purple-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="font-semibold mb-2">Timeline Editor</h4>
              <p className="text-gray-400 text-sm">Drag and drop clips with precision</p>
            </div>
            
            <div>
              <div className="w-12 h-12 bg-green-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h4 className="font-semibold mb-2">Animated Code</h4>
              <p className="text-gray-400 text-sm">Smooth typing animations for tutorials</p>
            </div>
            
            <div>
              <div className="w-12 h-12 bg-orange-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="font-semibold mb-2">Quick Effects</h4>
              <p className="text-gray-400 text-sm">Professional transitions with one click</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
