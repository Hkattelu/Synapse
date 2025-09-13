import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../lib/api';
import { useProject } from '../../state/hooks';
import { Download, Trash2, X, Play } from 'lucide-react';

interface RenderItem {
  id: string;
  filename: string;
  publicUrl: string;
  size: number;
  createdAt: string; // ISO
}

const formatBytes = (bytes: number) => {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let u = 0;
  while (size >= 1024 && u < units.length - 1) {
    size /= 1024;
    u++;
  }
  return `${size.toFixed(1)} ${units[u]}`;
};

const timeAgo = (iso: string) => {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const RendersDialog: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { project } = useProject();
  const [items, setItems] = useState<RenderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  const projectId = project?.id || '';

  const refresh = async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.listRenders(projectId);
      setItems(res.items || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load renders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, projectId]);

  const onDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await api.deleteRender(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (e) {
      // TODO: show toast
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.96, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 6 }}
        transition={{ duration: 0.2 }}
        className="bg-synapse-surface rounded-2xl shadow-synapse-lg border border-synapse-border w-full max-w-3xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-synapse-border">
          <h3 className="text-lg font-semibold text-text-primary">Project Renders</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-synapse-surface-hover text-text-secondary" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {!projectId ? (
            <div className="text-text-secondary">No active project.</div>
          ) : loading ? (
            <div className="text-text-secondary">Loading renders…</div>
          ) : error ? (
            <div className="text-status-error">{error}</div>
          ) : items.length === 0 ? (
            <div className="text-text-secondary">No renders yet for this project.</div>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-auto pr-1">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between bg-synapse-surface/60 border border-synapse-border rounded-xl px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-text-primary truncate">{item.filename}</div>
                    <div className="text-xs text-text-secondary flex items-center space-x-3">
                      <span>{formatBytes(item.size)}</span>
                      <span>•</span>
                      <span>{timeAgo(item.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setPreviewSrc(item.publicUrl)}
                      className="px-3 py-2 rounded-lg bg-synapse-surface hover:bg-synapse-surface-hover border border-synapse-border text-text-primary flex items-center space-x-2"
                      title="Preview"
                    >
                      <Play className="w-4 h-4" />
                      <span className="hidden sm:inline">Preview</span>
                    </button>
                    <a
                      href={item.publicUrl}
                      download
                      className="px-3 py-2 rounded-lg bg-synapse-primary text-synapse-text-inverse hover:bg-synapse-primary-hover flex items-center space-x-2"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">Download</span>
                    </a>
                    <button
                      onClick={() => onDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="px-3 py-2 rounded-lg bg-status-error/10 text-status-error hover:bg-status-error/20 border border-status-error/30 disabled:opacity-50 flex items-center space-x-2"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <AnimatePresence>
          {previewSrc && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
              onClick={() => setPreviewSrc(null)}
            >
              <motion.div
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="bg-black rounded-2xl shadow-synapse-lg border border-synapse-border w-full max-w-4xl overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-synapse-border bg-synapse-surface">
                  <div className="text-sm text-text-primary truncate pr-2">Preview</div>
                  <button onClick={() => setPreviewSrc(null)} className="p-2 rounded-lg hover:bg-synapse-surface-hover text-text-secondary" aria-label="Close preview">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="bg-black">
                  {/* Use video tag for local files served via /downloads */}
                  <video src={previewSrc} controls className="w-full h-[60vh] bg-black" />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default RendersDialog;
