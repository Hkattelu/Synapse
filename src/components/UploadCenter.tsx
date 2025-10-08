import React from 'react';
import { useUploadManager } from '../state/uploadManager';

export default function UploadCenter() {
  const {
    tasks,
    counts,
    panelVisible,
    showPanel,
    cancel,
    retry,
    remove,
    autoExportWhenReady,
    setAutoExportWhenReady,
  } = useUploadManager();

  if (!panelVisible && counts.inProgress === 0 && counts.failed === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-w-[95vw]">
      <div className="bg-background-primary border border-border-subtle rounded-lg shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border-subtle">
          <div className="text-sm font-medium text-text-primary">
            Uploads
            <span className="ml-2 text-xs text-text-secondary">
              {counts.inProgress > 0 ? `${counts.inProgress} in progress` : counts.failed > 0 ? `${counts.failed} failed` : `${counts.completed} completed`}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1 text-xs text-text-secondary cursor-pointer" title="Automatically start export when all uploads finish">
              <input
                type="checkbox"
                checked={autoExportWhenReady}
                onChange={(e) => setAutoExportWhenReady(e.target.checked)}
              />
              Auto‑export when done
            </label>
            <button
              onClick={() => showPanel(false)}
              className="text-text-secondary hover:text-text-primary"
              title="Hide"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {tasks.length === 0 ? (
            <div className="p-4 text-xs text-text-secondary">No uploads</div>
          ) : (
            tasks.map((t) => (
              <div key={t.id} className="px-4 py-3 border-b last:border-b-0 border-border-subtle">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-text-primary truncate" title={t.name}>{t.name}</div>
                    <div className="text-xxs text-text-tertiary">{t.mime} • {Math.round((t.size || 0) / 1024)} KB</div>
                  </div>
                  <div className="text-xs">
                    {t.status === 'uploaded' && <span className="text-green-400">Uploaded</span>}
                    {t.status === 'uploading' && <span className="text-blue-300">Uploading…</span>}
                    {t.status === 'queued' && <span className="text-text-secondary">Queued</span>}
                    {t.status === 'failed' && <span className="text-red-400">Failed</span>}
                    {t.status === 'cancelled' && <span className="text-text-secondary">Cancelled</span>}
                  </div>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-neutral-700 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${t.status === 'failed' ? 'bg-red-500' : t.status === 'uploaded' ? 'bg-green-500' : 'bg-primary-600'}`}
                      style={{ width: `${Math.max(0, Math.min(100, t.progress || (t.status === 'uploaded' ? 100 : 0)))}%` }}
                    />
                  </div>
                  {t.status === 'failed' && t.error && (
                    <div className="text-xxs text-red-300 mt-1">{t.error}</div>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-2 justify-end">
                  {(t.status === 'uploading' || t.status === 'queued') && (
                    <button
                      onClick={() => cancel(t.id)}
                      className="text-xs px-2 py-1 border border-border-subtle rounded text-text-secondary hover:text-text-primary hover:bg-background-secondary"
                    >
                      Cancel
                    </button>
                  )}
                  {t.status === 'failed' && (
                    <>
                      <button
                        onClick={() => retry(t.id)}
                        className="text-xs px-2 py-1 border border-border-subtle rounded text-text-secondary hover:text-text-primary hover:bg-background-secondary"
                      >
                        Retry
                      </button>
                      <button
                        onClick={() => remove(t.id)}
                        className="text-xs px-2 py-1 border border-border-subtle rounded text-text-secondary hover:text-text-primary hover:bg-background-secondary"
                      >
                        Dismiss
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}