import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../state/hooks';
import { ProjectManager } from './ProjectManager';
import { Sparkles, Plus, GitBranch, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';
import { generateId } from '../lib/utils';
import type { MediaAsset, Project, TimelineItem } from '../lib/types';

export function DashboardView() {
  const { project, createProject, switchProject, importProject } = useProject();
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // New from Repo modal state
  const [showRepoModal, setShowRepoModal] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [repoLoading, setRepoLoading] = useState(false);
  const [repoError, setRepoError] = useState<string | null>(null);
  const [openAfterGen, setOpenAfterGen] = useState(true);

  const handleCreateProject = () => {
    if (projectName.trim()) {
      createProject(projectName.trim());
      navigate('/studio');
      setProjectName('');
      setShowCreateForm(false);
    }
  };

  const handleOpenProject = (projectId?: string) => {
    if (projectId) {
      switchProject(projectId);
    }
    navigate('/studio');
  };

  // Convert AI response into a local Project structure
  const buildProjectFromProposal = (name: string, proposal: any): Project => {
    const now = new Date();

    // Build media assets from timeline entries (code/title become code assets)
    const mediaAssets: MediaAsset[] = [];
    const makeCodeAsset = (
      displayName: string,
      code: string,
      language?: string
    ): MediaAsset => {
      const asset: MediaAsset = {
        id: generateId(),
        name: displayName,
        type: 'code',
        url: '',
        metadata: {
          fileSize: code.length,
          mimeType: 'text/plain',
          codeContent: code,
          language: language || 'plaintext',
        },
        createdAt: now,
      };
      mediaAssets.push(asset);
      return asset;
    };

    const timeline: TimelineItem[] = (proposal.timeline || []).map(
      (item: any, idx: number) => {
        if (item.type === 'code') {
          const codeText = String(item.properties?.code || '');
          const lang = item.properties?.language || 'plaintext';
          const asset = makeCodeAsset(
            item.properties?.codePath
              ? `Code: ${item.properties.codePath}`
              : `Code Snippet ${idx + 1}`,
            codeText,
            lang
          );
          return {
            id: generateId(),
            assetId: asset.id,
            startTime: Number(item.startTime || 0),
            duration: Number(item.duration || 10),
            track: 0,
            type: 'code',
            properties: {
              language: lang,
              codeText: codeText,
              text: codeText,
            },
            animations: [],
            keyframes: [],
          };
        }
        if (item.type === 'title') {
          const text = String(item.properties?.text || 'Title');
          const asset = makeCodeAsset('Title', text, 'text');
          return {
            id: generateId(),
            assetId: asset.id,
            startTime: Number(item.startTime || 0),
            duration: Number(item.duration || 4),
            track: 1,
            type: 'title',
            properties: {
              text,
              color: '#ffffff',
            },
            animations: [],
            keyframes: [],
          };
        }
        // Fallback: treat unknown as title text
        const text = `Segment ${idx + 1}`;
        const asset = makeCodeAsset('Segment', text, 'text');
        return {
          id: generateId(),
          assetId: asset.id,
          startTime: Number(item.startTime || 0),
          duration: Number(item.duration || 5),
          track: 2,
          type: 'title',
          properties: { text },
          animations: [],
          keyframes: [],
        };
      }
    );

    const project: Project = {
      id: generateId(),
      name,
      createdAt: now,
      updatedAt: now,
      timeline,
      mediaAssets,
      settings: {
        width: Number(proposal.settings?.width || 1920),
        height: Number(proposal.settings?.height || 1080),
        fps: Number(proposal.settings?.fps || 30),
        duration: Number(proposal.settings?.duration || 60),
        backgroundColor: String(
          proposal.settings?.backgroundColor || '#000000'
        ),
        audioSampleRate: 48000,
      },
      version: '1.0.0',
    };

    return project;
  };

  const handleNewFromRepo = async () => {
    setRepoError(null);
    if (!repoUrl || !/^https?:\/\//.test(repoUrl)) {
      setRepoError('Please enter a valid Git repository URL (https://...)');
      return;
    }
    setRepoLoading(true);
    try {
      const proposal = await api.aiGenerateFromRepo({
        repoUrl,
        branch: branch || 'main',
      });
      const projectName =
        proposal?.projectName ||
        `Repo Video - ${new URL(repoUrl).pathname.split('/').slice(-1)[0]}`;
      const project: Project = buildProjectFromProposal(projectName, proposal);
      // Import into state
      importProject(project);
      if (openAfterGen) {
        navigate('/studio');
      }
      setShowRepoModal(false);
      setRepoUrl('');
      setBranch('main');
    } catch (e: any) {
      setRepoError(e?.message || 'Failed to generate from repo');
    } finally {
      setRepoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-synapse-background">
      {/* Navigation Header */}
<nav className="bg-[color:var(--synapse-contrast-chip)] border-b border-synapse-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <img
                src="/branding/logo.svg"
                alt="Synapse Studio"
                className="h-8 w-auto"
              />
              <span className="sr-only">Synapse Studio</span>
            </button>
            <div></div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-text-primary mb-2">
              Your Projects
            </h2>
            <p className="text-text-secondary">
              Create and manage your video projects
            </p>
          </div>

          {/* Quick Actions */}
          <div className="mb-8 space-y-4">
            {showCreateForm ? (
              <div className="bg-synapse-surface border border-border-subtle rounded-xl p-6 shadow-synapse-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-text-primary">
                    Create New Project
                  </h3>
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setProjectName('');
                    }}
                    className="text-text-secondary hover:text-text-primary transition-colors"
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
                    className="flex-1 px-4 py-2 border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-synapse-border-focus focus:border-transparent"
                    autoFocus
                  />
                  <button
                    onClick={handleCreateProject}
                    disabled={!projectName.trim()}
                    className="bg-synapse-primary hover:bg-synapse-primary-hover disabled:bg-synapse-surface-active text-synapse-text-inverse font-medium px-6 py-2 rounded-lg transition-colors disabled:cursor-not-allowed"
                  >
                    Create
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-synapse-primary hover:bg-synapse-primary-hover text-synapse-text-inverse font-medium px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>New Project</span>
                </button>

                <button
                  onClick={() => setShowRepoModal(true)}
                  title="Generate a starter video project from a Git repository. We clone shallowly and extract a handful of representative files to create an editable timeline."
                  className="bg-synapse-surface border border-border-subtle hover:border-synapse-border-hover text-synapse-primary font-medium px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <GitBranch className="w-5 h-5" />
                  <span>New from Repo</span>
                </button>
                <p className="text-sm text-text-tertiary max-w-2xl">
                  Tip: We clone the repo (depth 1), scan for code and docs, and
                  propose a short timeline (titles and code segments). You can
                  edit everything afterward.
                </p>
              </div>
            )}
          </div>

          {/* Project Management */}
          <div className="bg-synapse-surface border border-border-subtle rounded-xl shadow-synapse-sm">
            <div className="p-6">
              <ProjectManager />
            </div>
          </div>

          {/* Current Project Status */}
          {project && (
            <div className="mt-8 bg-synapse-primary/10 border border-synapse-primary rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-synapse-success rounded-full"></div>
                  <h3 className="text-lg font-semibold text-text-primary">
                    Active Project
                  </h3>
                </div>
                <button
                  onClick={() => handleOpenProject()}
                  className="text-synapse-primary hover:opacity-80 font-medium"
                >
                  Open Studio →
                </button>
              </div>

              <h4 className="text-xl font-bold text-text-primary mb-4">
                {project.name}
              </h4>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-synapse-surface rounded-lg p-4">
                  <div className="text-2xl font-bold text-text-primary mb-1">
                    {project.timeline.length}
                  </div>
                  <div className="text-sm text-text-secondary">
                    Timeline Items
                  </div>
                </div>
                <div className="bg-synapse-surface rounded-lg p-4">
                  <div className="text-2xl font-bold text-text-primary mb-1">
                    {project.mediaAssets.length}
                  </div>
                  <div className="text-sm text-text-secondary">
                    Media Assets
                  </div>
                </div>
                <div className="bg-synapse-surface rounded-lg p-4">
                  <div className="text-2xl font-bold text-text-primary mb-1">
                    {project.createdAt.toLocaleDateString()}
                  </div>
                  <div className="text-sm text-text-secondary">Created</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New from Repo Modal */}
      {showRepoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !repoLoading && setShowRepoModal(false)}
        >
          <div
            className="bg-synapse-surface rounded-xl shadow-synapse-lg w-full max-w-lg p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">
                New Project from Git Repo
              </h3>
              <button
                className="text-text-secondary hover:text-text-primary"
                onClick={() => !repoLoading && setShowRepoModal(false)}
                aria-label="Close"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 10-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-sm text-text-secondary">
                Generate a starter project from a public Git repository. We
                don’t execute code; we only read files to assemble an initial
                timeline you can refine.
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary">
                  Repository URL
                </label>
                <input
                  type="url"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/owner/repo.git (or https URL)"
                  className="mt-1 w-full px-3 py-2 border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-synapse-border-focus"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary">
                  Branch (optional)
                </label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="main"
                  className="mt-1 w-full px-3 py-2 border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-synapse-border-focus"
                />
              </div>

              {repoError && (
                <div className="text-sm text-red-600">{repoError}</div>
              )}

              <div className="flex items-center justify-between pt-2">
                <label className="inline-flex items-center text-sm text-text-secondary">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={openAfterGen}
                    onChange={(e) => setOpenAfterGen(e.target.checked)}
                  />
                  Open Studio after generation
                </label>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowRepoModal(false)}
                    disabled={repoLoading}
                    className="px-4 py-2 border border-border-subtle rounded-lg text-text-primary hover:bg-synapse-surface-hover disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleNewFromRepo}
                    disabled={repoLoading || !repoUrl}
                    className="px-4 py-2 bg-synapse-primary hover:bg-synapse-primary-hover text-synapse-text-inverse rounded-lg disabled:opacity-50"
                  >
                    {repoLoading ? 'Generating…' : 'Generate'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
