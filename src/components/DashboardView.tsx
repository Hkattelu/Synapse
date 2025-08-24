import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../state/hooks';
import { ProjectManager } from './ProjectManager';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles.js';
import Plus from 'lucide-react/dist/esm/icons/plus.js';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right.js';

export function DashboardView() {
  const { project, createProject } = useProject();
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCreateProject = () => {
    if (projectName.trim()) {
      createProject(projectName.trim());
      navigate('/studio');
      setProjectName('');
      setShowCreateForm(false);
    }
  };

  const handleOpenProject = () => {
    navigate('/studio');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">
                Synapse Studio
              </h1>
            </div>
            <button
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-purple-600 transition-colors"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Your Projects
            </h2>
            <p className="text-gray-600">
              Create and manage your video projects
            </p>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            {showCreateForm ? (
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Create New Project
                  </h3>
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setProjectName('');
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && handleCreateProject()
                    }
                    placeholder="Enter project name..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    autoFocus
                  />
                  <button
                    onClick={handleCreateProject}
                    disabled={!projectName.trim()}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white font-medium px-6 py-2 rounded-lg transition-colors disabled:cursor-not-allowed"
                  >
                    Create
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-4">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>New Project</span>
                </button>

                {project && (
                  <button
                    onClick={handleOpenProject}
                    className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-medium px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <ArrowRight className="w-5 h-5" />
                    <span>Continue "{project.name}"</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Project Management */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="p-6">
              <ProjectManager />
            </div>
          </div>

          {/* Current Project Status */}
          {project && (
            <div className="mt-8 bg-purple-50 border border-purple-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Active Project
                  </h3>
                </div>
                <button
                  onClick={handleOpenProject}
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  Open Studio →
                </button>
              </div>

              <h4 className="text-xl font-bold text-gray-900 mb-4">
                {project.name}
              </h4>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-white rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {project.timeline.length}
                  </div>
                  <div className="text-sm text-gray-600">Timeline Items</div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {project.mediaAssets.length}
                  </div>
                  <div className="text-sm text-gray-600">Media Assets</div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {project.createdAt.toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-600">Created</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
