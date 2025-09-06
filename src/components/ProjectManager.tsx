import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../state/hooks';
import {
  ProjectManager as PM,
  uploadProjectFile,
  downloadProjectFile,
} from '../lib/projectManager';
import { 
  MoreVertical, 
  Download, 
  Upload, 
  Copy, 
  Trash2, 
  Edit3, 
  FileText, 
  Calendar, 
  Video, 
  AlertTriangle, 
  Check, 
  X, 
  ExternalLink 
} from 'lucide-react';

interface ProjectCardProps {
  project: any; // StoredProject type
  onOpen: (projectId: string) => void;
  onRename: (projectId: string, newName: string) => void;
  onDuplicate: (projectId: string) => void;
  onExport: (projectId: string) => void;
  onDelete: (projectId: string) => void;
}

const ProjectCard = React.forwardRef<HTMLDivElement, ProjectCardProps>(({
  project,
  onOpen,
  onRename,
  onDuplicate,
  onExport,
  onDelete,
}, ref) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [newName, setNewName] = useState(project.project.name);

  const handleRename = () => {
    if (newName.trim() && newName.trim() !== project.project.name) {
      onRename(project.project.id, newName.trim());
    }
    setShowRename(false);
    setNewName(project.project.name);
  };

  const projectStats = PM.getProjectStats(project.project);

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="relative bg-synapse-surface/80 backdrop-blur-sm border border-border-subtle rounded-xl p-6 hover:shadow-synapse-md transition-all duration-200 group"
    >
      {/* Project Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="w-12 h-12 bg-synapse-primary/10 rounded-lg flex items-center justify-center group-hover:bg-synapse-primary/20 transition-colors">
            <FileText className="w-6 h-6 text-synapse-primary" />
          </div>
          <div className="flex-1 min-w-0">
            {showRename ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleRename();
                    if (e.key === 'Escape') {
                      setShowRename(false);
                      setNewName(project.project.name);
                    }
                  }}
                  onBlur={handleRename}
                  className="flex-1 px-2 py-1 border border-border-subtle rounded text-sm focus:outline-none focus:ring-2 focus:ring-synapse-border-focus"
                  autoFocus
                />
                <button
                  onClick={handleRename}
                  className="p-1 text-green-600 hover:text-green-700"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setShowRename(false);
                    setNewName(project.project.name);
                  }}
                  className="p-1 text-gray-500 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <h3 className="font-semibold text-text-primary truncate group-hover:text-synapse-primary transition-colors">
                  {project.project.name}
                </h3>
                <p className="text-sm text-text-secondary truncate">
                  v{project.project.version}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Menu Button */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-text-secondary hover:text-text-primary transition-colors rounded-full hover:bg-synapse-surface-hover"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                className="absolute right-0 top-full mt-2 w-48 bg-synapse-surface rounded-lg shadow-synapse-lg border border-border-subtle py-2 z-50"
                onBlur={() => setShowMenu(false)}
              >
                <button
                  onClick={() => {
                    onOpen(project.project.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-synapse-surface-hover flex items-center space-x-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open Project</span>
                </button>

                <button
                  onClick={() => {
                    setShowRename(true);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-synapse-surface-hover flex items-center space-x-2"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Rename</span>
                </button>

                <button
                  onClick={() => {
                    onDuplicate(project.project.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-synapse-surface-hover flex items-center space-x-2"
                >
                  <Copy className="w-4 h-4" />
                  <span>Duplicate</span>
                </button>

                <button
                  onClick={() => {
                    onExport(project.project.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-synapse-surface-hover flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>

                <hr className="my-2 border-border-subtle" />

                <button
                  onClick={() => {
                    setShowDeleteConfirm(true);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-status-error hover:bg-status-error/10 flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center text-sm text-text-secondary">
          <Video className="w-4 h-4 mr-2" />
          {projectStats.totalClips} clips
        </div>
        <div className="flex items-center text-sm text-text-secondary">
          <Calendar className="w-4 h-4 mr-2" />
          {project.lastOpened.toLocaleDateString()}
        </div>
      </div>

      {/* Duration Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs text-text-secondary">
          <span>Duration</span>
          <span>{projectStats.totalDuration}s</span>
        </div>
        <div className="w-full bg-synapse-surface-active rounded-full h-2">
          <div
            className="bg-synapse-primary h-2 rounded-full transition-all duration-300"
            style={{
              width: `${Math.min((projectStats.totalDuration / 60) * 100, 100)}%`,
            }}
          />
        </div>
      </div>

      {/* Open Button */}
      <button
        onClick={() => onOpen(project.project.id)}
        className="w-full mt-4 bg-synapse-primary hover:bg-synapse-primary-hover text-synapse-text-inverse py-2 px-4 rounded-lg transition-colors font-medium"
      >
        Open Project
      </button>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-synapse-surface rounded-xl p-6 max-w-md w-full"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-status-error/10 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-status-error" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">
                    Delete Project
                  </h3>
                  <p className="text-sm text-text-secondary">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <p className="text-text-secondary mb-6">
                Are you sure you want to delete "{project.project.name}"? This
                will permanently remove the project and all its data.
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border border-border-subtle rounded-lg text-text-primary hover:bg-synapse-surface-hover transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onDelete(project.project.id);
                    setShowDeleteConfirm(false);
                  }}
                  className="flex-1 px-4 py-2 bg-status-error hover:bg-status-error/80 text-synapse-text-inverse rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

export function ProjectManager() {
  const navigate = useNavigate();
  const {
    projects,
    switchProject,
    deleteProject,
    duplicateProject,
    renameProject,
    exportProject,
    importProject,
  } = useProject();

  const [isImporting, setIsImporting] = useState(false);

  const handleOpenProject = (projectId: string) => {
    switchProject(projectId);
    navigate('/studio');
  };

  const handleImportProject = async () => {
    try {
      setIsImporting(true);
      const project = await uploadProjectFile();
      importProject(project);
      console.log('✅ Project imported successfully');
    } catch (error) {
      console.error('Failed to import project:', error);
      // TODO: Show error notification to user
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportProject = async (projectId: string) => {
    try {
      const project = projects.find((p) => p.project.id === projectId)?.project;
      if (project) {
        downloadProjectFile(project);
        console.log('✅ Project exported successfully');
      }
    } catch (error) {
      console.error('Failed to export project:', error);
      // TODO: Show error notification to user
    }
  };

  const handleDuplicateProject = async (projectId: string) => {
    try {
      duplicateProject(projectId);
      console.log('✅ Project duplicated successfully');
    } catch (error) {
      console.error('Failed to duplicate project:', error);
      // TODO: Show error notification to user
    }
  };

  if (!projects || projects.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
        <h3 className="text-lg font-medium text-text-primary mb-2">
          No projects yet
        </h3>
        <p className="text-text-secondary mb-6">
          Create your first project to get started
        </p>
        <button
          onClick={handleImportProject}
          disabled={isImporting}
          className="inline-flex items-center px-4 py-2 bg-synapse-primary hover:bg-synapse-primary-hover text-synapse-text-inverse rounded-lg transition-colors space-x-2 disabled:opacity-50"
        >
          <Upload className="w-4 h-4" />
          <span>{isImporting ? 'Importing...' : 'Import Project'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Import Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-text-primary">Your Projects</h2>
        <button
          onClick={handleImportProject}
          disabled={isImporting}
          className="inline-flex items-center px-4 py-2 bg-synapse-surface border border-border-subtle hover:border-synapse-border-hover text-synapse-primary rounded-lg transition-colors space-x-2 disabled:opacity-50"
        >
          <Upload className="w-4 h-4" />
          <span>{isImporting ? 'Importing...' : 'Import Project'}</span>
        </button>
      </div>

      {/* Projects Grid */}
      <motion.div layout className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {projects.map((project) => (
            <ProjectCard
              key={project.project.id}
              project={project}
              onOpen={handleOpenProject}
              onRename={renameProject}
              onDuplicate={handleDuplicateProject}
              onExport={handleExportProject}
              onDelete={deleteProject}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-border-subtle">
        <div className="text-center">
          <div className="text-2xl font-bold text-synapse-primary">
            {projects.length}
          </div>
          <div className="text-sm text-text-secondary">Total Projects</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-synapse-primary">
            {projects.reduce((sum, p) => sum + p.project.timeline.length, 0)}
          </div>
          <div className="text-sm text-text-secondary">Total Clips</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-synapse-primary">
            {projects.reduce((sum, p) => sum + p.project.mediaAssets.length, 0)}
          </div>
          <div className="text-sm text-text-secondary">Total Assets</div>
        </div>
      </div>
    </div>
  );
}
