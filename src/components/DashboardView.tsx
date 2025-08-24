import React, { Fragment, useState } from 'react';
import { motion } from 'framer-motion';
import { useProject, useUI } from '../state/hooks';
import { ProjectManager } from './ProjectManager';
import {
  Play,
  Video,
  Sparkles,
  Users,
  Heart,
  Plus,
  ArrowRight,
} from 'lucide-react';

export function DashboardView() {
  const { project, projects, createProject } = useProject();
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

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-indigo-50 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 1220 810"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          <g clipPath="url(#clip0_hero)">
            {[...Array(35)].map((_, i) => (
              <Fragment key={`row-${i}`}>
                {[...Array(23)].map((_, j) => (
                  <rect
                    key={`${i}-${j}`}
                    x={-20.0891 + i * 36}
                    y={9.2 + j * 36}
                    width="35.6"
                    height="35.6"
                    stroke="rgb(147 51 234)"
                    strokeOpacity="0.1"
                    strokeWidth="0.4"
                    strokeDasharray="2 2"
                    className="transition-all duration-300 hover:stroke-opacity-30"
                  />
                ))}
              </Fragment>
            ))}

            <circle
              cx={mousePosition.x}
              cy={mousePosition.y}
              r="120"
              fill="url(#mouseGradient)"
              opacity="0.05"
              className="pointer-events-none transition-opacity duration-300"
            />
          </g>

          <defs>
            <radialGradient id="mouseGradient" cx="0" cy="0" r="1">
              <stop offset="0%" stopColor="rgb(147 51 234)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <clipPath id="clip0_hero">
              <rect width="1220" height="810" rx="16" fill="white" />
            </clipPath>
          </defs>
        </svg>
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              Welcome to Synapse Studio
            </h1>
          </div>
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-purple-100 border border-purple-200 text-sm font-medium text-purple-700 mb-4">
            <Heart className="w-4 h-4 mr-2" />
            Made with ❤️ for creators, by creators
          </div>

          <div className="mt-4">
            <a
              href="/launch"
              className="inline-flex items-center px-4 py-2 rounded-full bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
              title="See our Product Hunt launch page"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="mr-2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 7h-2v10h2a5 5 0 000-10z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 7h6a5 5 0 010 10H7V7z"
                />
              </svg>
              Launch Page
            </a>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            The human-friendly video creation tool for educational content and
            game devlogs. No AI fluff, just pure creative power in your hands.
          </p>
        </motion.div>

        {/* Project Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-4xl mx-auto mb-16"
        >
          {showCreateForm ? (
            <div className="bg-white/80 backdrop-blur-sm border border-purple-200 rounded-2xl p-8 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Create New Project
                </h3>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setProjectName('');
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
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
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateProject()}
                  placeholder="Enter your project name..."
                  className="flex-1 px-6 py-4 bg-white border border-purple-200 rounded-full text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-lg"
                  autoFocus
                />
                <button
                  onClick={handleCreateProject}
                  disabled={!projectName.trim()}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:text-gray-500 text-white font-semibold px-8 py-4 rounded-full transition-all duration-200 hover:scale-105 hover:shadow-lg disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center space-x-2 text-lg"
                >
                  <Play className="w-5 h-5" />
                  <span>Create Project</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <button
                onClick={() => setShowCreateForm(true)}
                className="group bg-purple-600 hover:bg-purple-700 text-white p-6 rounded-2xl transition-all duration-200 hover:scale-105 hover:shadow-xl shadow-lg"
              >
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <Plus className="w-5 h-5" />
                  </div>
                  <span className="font-semibold text-lg">
                    Create New Project
                  </span>
                </div>
              </button>

              {project && (
                <button
                  onClick={handleOpenProject}
                  className="group bg-white/80 backdrop-blur-sm hover:bg-white border border-purple-200 hover:border-purple-300 text-gray-900 p-6 rounded-2xl transition-all duration-200 hover:scale-105 hover:shadow-xl shadow-lg"
                >
                  <div className="flex items-center justify-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 group-hover:bg-purple-200 flex items-center justify-center transition-colors">
                      <ArrowRight className="w-5 h-5 text-purple-600" />
                    </div>
                    <span className="font-semibold text-lg">
                      Continue "{project.name}"
                    </span>
                  </div>
                </button>
              )}
            </div>
          )}
        </motion.div>

        {/* Project Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-6xl mx-auto mb-16"
        >
          <div className="bg-white/60 backdrop-blur-sm border border-purple-200 rounded-3xl p-8 shadow-xl">
            <ProjectManager />
          </div>
        </motion.div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="max-w-6xl mx-auto"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
            Why Creators Choose Synapse Studio
          </h2>
          <p className="text-lg text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Built by a creator who understands the struggle of making authentic,
            engaging content in a world full of generic AI-generated videos.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-white/80 backdrop-blur-sm border border-purple-200 rounded-xl p-6 text-center hover:shadow-lg transition-shadow"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                <Video className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Intuitive Video Editor
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Drag-and-drop simplicity meets professional power. Create
                stunning educational content without the learning curve.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-white/80 backdrop-blur-sm border border-purple-200 rounded-xl p-6 text-center hover:shadow-lg transition-shadow"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Built for Creators
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Designed specifically for YouTubers, educators, and game
                developers who want to tell their story authentically.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white/80 backdrop-blur-sm border border-purple-200 rounded-xl p-6 text-center hover:shadow-lg transition-shadow"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                <Heart className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Human-Centered
              </h3>
              <p className="text-gray-600 leading-relaxed">
                No AI shortcuts or automated content. Just pure creative tools
                that amplify your unique voice and vision.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-white/80 backdrop-blur-sm border border-purple-200 rounded-xl p-6 text-center hover:shadow-lg transition-shadow"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                <Sparkles className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Devlog Ready
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Perfect templates and tools for game developers to showcase
                their progress and connect with their community.
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Current Project Status (if exists) */}
        {project && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="max-w-4xl mx-auto mt-16 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl p-8 shadow-xl"
          >
            <div className="text-center mb-6">
              <div className="inline-flex items-center space-x-2 mb-4">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <h3 className="text-xl font-bold">Active Project</h3>
              </div>
              <h4 className="text-2xl font-bold mb-2">{project.name}</h4>
            </div>
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold mb-1">
                  {project.timeline.length}
                </div>
                <div className="text-purple-200 text-sm">Timeline Clips</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-1">
                  {project.mediaAssets.length}
                </div>
                <div className="text-purple-200 text-sm">Media Assets</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-1">
                  {project.createdAt.toLocaleDateString()}
                </div>
                <div className="text-purple-200 text-sm">Created</div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
