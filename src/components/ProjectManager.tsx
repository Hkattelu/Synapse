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
  ExternalLink,
  Plus,
  Clock,
  Gauge,
  Maximize,
} from 'lucide-react';

interface ProjectCardProps {
  project: any; // StoredProject type
  onOpen: (projectId: string) => void;
  onRename: (projectId: string, newName: string) => void;
  onDuplicate: (projectId: string) => void;
  onExport: (projectId: string) => void;
  onDelete: (projectId: string) => void;
}

const ProjectCard = React.forwardRef<HTMLDivElement, ProjectCardProps>(
  ({ project, onOpen, onRename, onDuplicate, onExport, onDelete }, ref) => {
    const [showMenu, setShowMenu] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showRename, setShowRename] = useState(false);
    const [newName, setNewName] = useState(project.project.name);
    const [thumbError, setThumbError] = useState(false);

    const handleRename = () => {
      if (newName.trim() && newName.trim() !== project.project.name) {
        onRename(project.project.id, newName.trim());
      }
      setShowRename(false);
      setNewName(project.project.name);
    };

    const projectStats = PM.getProjectStats(project.project);

    const handleOpen = () => onOpen(project.project.id);

    const handleRootKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleOpen();
      }
    };

    return (
      <motion.div
        ref={ref}
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        role="button"
        tabIndex={0}
        aria-label={`Open project ${project.project.name}`}
        onKeyDown={handleRootKeyDown}
        onClick={handleOpen}
        className="relative bg-synapse-surface border border-border-subtle rounded-xl p-6 hover:shadow-synapse-lg hover:border-synapse-border-hover ring-1 ring-transparent hover:ring-synapse-primary hover:ring-opacity-20 transition-all duration-200 group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-synapse-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-synapse-surface will-change-transform hover:-translate-y-0.5"
      >
        {/* Thumbnail / Content-forward preview */}
        {(() => {
          const proj = project.project;
          const firstImage = proj.mediaAssets?.find((a: any) => a.type === 'image' && a.url);
          const firstVideo = proj.mediaAssets?.find((a: any) => a.type === 'video' && (a.thumbnail || a.url));
          const thumbUrl = firstImage?.url || firstVideo?.thumbnail || firstVideo?.url || '';
          const initials = (proj.name || 'Project')
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((s: string) => s[0]?.toUpperCase())
            .join('');
          return (
            <div className="-mt-2 -mx-6 mb-4">
              <div className="relative w-full pt-[56.25%] overflow-hidden border-b border-border-subtle bg-synapse-surface">
                {thumbUrl && !thumbError ? (
                  <img
                    src={thumbUrl}
                    alt={`${proj.name} thumbnail`}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                    onError={() => setThumbError(true)}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-synapse-surface">
                    {/* Simple placeholder graphic */}
                    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-secondary">
                      <rect x="3" y="3" width="18" height="14" rx="2" ry="2" stroke="currentColor" />
                      <path d="M3 13l4-4 5 5 3-3 6 6" stroke="currentColor" />
                      <circle cx="8" cy="8" r="1.5" fill="currentColor" />
                    </svg>
                    <span className="sr-only">No thumbnail</span>
                  </div>
                )}
                {/* Overlay metadata (chips) */}
                <div className="absolute inset-x-2 bottom-2 flex flex-wrap items-center gap-2">
                  <div
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-border-subtle bg-synapse-surface text-text-secondary"
                    title={`Resolution: ${(proj.settings?.width || 1920)}×${(proj.settings?.height || 1080)}`}
                  >
                    <Maximize className="w-3.5 h-3.5" aria-hidden="true" />
                    <span className="text-[11px]">{proj.settings?.width || 1920}×{proj.settings?.height || 1080}</span>
                  </div>
                  <div
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-border-subtle bg-synapse-surface text-text-secondary"
                    title={`Frame rate: ${(proj.settings?.fps || 30)} fps`}
                  >
                    <Gauge className="w-3.5 h-3.5" aria-hidden="true" />
                    <span className="text-[11px]">{proj.settings?.fps || 30} fps</span>
                  </div>
                  <div
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-border-subtle bg-synapse-surface text-text-secondary"
                    title={`Duration: ${Math.round(proj.settings?.duration || 60)} seconds`}
                  >
                    <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                    <span className="text-[11px]">{Math.round(proj.settings?.duration || 60)}s</span>
                  </div>
                  {firstVideo && (
                    <div
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-border-subtle bg-synapse-surface text-text-secondary"
                      title="Contains video media"
                    >
                      <Video className="w-3.5 h-3.5" aria-hidden="true" />
                      <span className="text-[11px]">Video</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
        {/* Project Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="w-12 h-12 bg-synapse-primary/10 rounded-lg flex items-center justify-center group-hover:bg-synapse-primary/20 transition-colors">
              <FileText className="w-6 h-6 text-synapse-primary" />
            </div>
            <div className="flex-1 min-w-0">
              {showRename ? (
                <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
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
                    className="p-1 text-text-secondary hover:text-text-primary"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <h3
                    className="font-semibold text-text-primary line-clamp-2 group-hover:text-synapse-primary transition-colors"
                    title={project.project.name}
                  >
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
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              onMouseDown={(e) => e.stopPropagation()}
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
                  className="absolute right-0 top-full mt-2 w-48 bg-synapse-surface rounded-lg shadow-synapse-lg border border-border-subtle py-2 z-50 synapse-solid-menu"
                  onBlur={() => setShowMenu(false)}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
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

        {/* Project Stats (chips) */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-border-subtle bg-synapse-surface text-text-secondary"
            title={`${projectStats.totalClips} total clips`}
          >
            <Video className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="text-[11px]">{projectStats.totalClips} clips</span>
          </div>
          <div
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-border-subtle bg-synapse-surface text-text-secondary"
            title={`Last opened on ${project.lastOpened.toLocaleDateString()}`}
          >
            <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="text-[11px]">Opened {project.lastOpened.toLocaleDateString()}</span>
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
        {/* Subtle hover sheen (no text) */}
        <div className="pointer-events-none absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--synapse-contrast-chip)]/5 to-transparent" />
        </div>
      </motion.div>
    );
  }
);

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
    createProject,
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
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          Welcome to Synapse Studio
        </h3>
        <p className="text-text-secondary mb-6 max-w-md mx-auto">
          Design, preview, and export programmatic videos — fast. Start fresh or bring an existing project.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => {
              createProject('Untitled Project');
              navigate('/studio');
            }}
            className="inline-flex items-center px-4 py-2 bg-synapse-primary hover:bg-synapse-primary-hover text-synapse-text-inverse rounded-lg transition-colors space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
          <button
            onClick={handleImportProject}
            disabled={isImporting}
            className="inline-flex items-center px-4 py-2 bg-synapse-surface border border-border-subtle hover:border-synapse-border-hover text-synapse-primary rounded-lg transition-colors space-x-2 disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            <span>{isImporting ? 'Importing…' : 'Import Project'}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header actions (Import) */}
      <div className="flex justify-end items-center">
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
      <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
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

    </div>
  );
}
