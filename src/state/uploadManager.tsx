import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';

// Upload status for each task
export type UploadStatus =
  | 'queued'
  | 'uploading'
  | 'verifying'
  | 'uploaded'
  | 'failed'
  | 'cancelled';

export interface UploadTask {
  id: string;
  assetId: string;
  name: string;
  size: number;
  mime: string;
  status: UploadStatus;
  progress: number; // 0-100
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

interface InternalTask extends UploadTask {
  // Keep xhr reference for cancellation and progress updates
  _xhr?: XMLHttpRequest | null;
  _source: 'file' | 'blob';
  _payload: File | Blob; // original payload
  _onComplete?: (url: string) => void;
  _onFinally?: () => void;
  _fallbackTried?: boolean;
}

interface UploadState {
  tasks: Record<string, InternalTask>;
  order: string[]; // preserve ordering for UI
  // UI/automation flags
  showPanel: boolean;
  autoExportWhenReady: boolean;
  // Optional callback to run once uploads finish (used by ExportDialog)
  onAllComplete?: (() => void) | null;
}

const initialState: UploadState = {
  tasks: {},
  order: [],
  showPanel: false,
  autoExportWhenReady: false,
  onAllComplete: null,
};

// Actions
type Action =
  | { type: 'ENQUEUE'; task: InternalTask }
  | { type: 'START'; id: string }
  | { type: 'PROGRESS'; id: string; progress: number }
  | { type: 'SUCCESS'; id: string }
  | { type: 'FAIL'; id: string; error: string }
  | { type: 'CANCEL'; id: string }
  | { type: 'REMOVE'; id: string }
  | { type: 'SHOW_PANEL'; show: boolean }
  | { type: 'SET_AUTO_EXPORT'; enabled: boolean }
  | { type: 'SET_ON_ALL_COMPLETE'; cb: (() => void) | null };

function reducer(state: UploadState, action: Action): UploadState {
  switch (action.type) {
    case 'ENQUEUE': {
      const t = action.task;
      return {
        ...state,
        tasks: { ...state.tasks, [t.id]: t },
        order: state.order.includes(t.id) ? state.order : [t.id, ...state.order],
        showPanel: true,
      };
    }
    case 'START': {
      const t = state.tasks[action.id];
      if (!t) return state;
      return {
        ...state,
        tasks: {
          ...state.tasks,
          [action.id]: { ...t, status: 'uploading', startedAt: t.startedAt || new Date() },
        },
      };
    }
    case 'PROGRESS': {
      const t = state.tasks[action.id];
      if (!t) return state;
      return { ...state, tasks: { ...state.tasks, [action.id]: { ...t, progress: action.progress } } };
    }
    case 'SUCCESS': {
      const t = state.tasks[action.id];
      if (!t) return state;
      return {
        ...state,
        tasks: { ...state.tasks, [action.id]: { ...t, status: 'uploaded', progress: 100, completedAt: new Date() } },
      };
    }
    case 'FAIL': {
      const t = state.tasks[action.id];
      if (!t) return state;
      return {
        ...state,
        tasks: { ...state.tasks, [action.id]: { ...t, status: 'failed', error: action.error } },
        showPanel: true,
      };
    }
    case 'CANCEL': {
      const t = state.tasks[action.id];
      if (!t) return state;
      // Abort xhr if present
      try { t._xhr?.abort(); } catch {}
      return {
        ...state,
        tasks: { ...state.tasks, [action.id]: { ...t, status: 'cancelled' } },
        showPanel: true,
      };
    }
    case 'REMOVE': {
      const newTasks = { ...state.tasks };
      delete newTasks[action.id];
      return { ...state, tasks: newTasks, order: state.order.filter((i) => i !== action.id) };
    }
    case 'SHOW_PANEL':
      return { ...state, showPanel: action.show };
    case 'SET_AUTO_EXPORT':
      return { ...state, autoExportWhenReady: action.enabled };
    case 'SET_ON_ALL_COMPLETE':
      return { ...state, onAllComplete: action.cb };
    default:
      return state;
  }
}

const UploadContext = createContext<{
  state: UploadState;
  enqueueFile: (
    file: File,
    opts: { assetId: string; name?: string; onComplete?: (url: string) => void; onFinally?: () => void }
  ) => string;
  enqueueBlob: (
    blob: Blob,
    opts: { assetId: string; name: string; mime?: string; onComplete?: (url: string) => void; onFinally?: () => void }
  ) => string;
  cancel: (id: string) => void;
  retry: (id: string) => void;
  remove: (id: string) => void;
  showPanel: (show: boolean) => void;
  setAutoExportWhenReady: (enabled: boolean, cb?: (() => void)) => void;
} | null>(null);

export const UploadManagerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Keep latest tasks in a ref to avoid stale closures when starting uploads on next tick
  const tasksRef = useRef<UploadState['tasks']>({});
  const log = (...args: any[]) => {
    try {
      if (localStorage.getItem('debug:uploads') === '1') {
        // eslint-disable-next-line no-console
        console.log('[uploads]', ...args);
      }
    } catch {}
  };
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    tasksRef.current = state.tasks;
  }, [state.tasks]);

  const startInternal = useCallback((taskId: string) => {
    const t0 = Date.now();
    const task = tasksRef.current[taskId];
    if (!task) {
      log('startInternal: task not found (will retry)', { id: taskId });
      // In rare cases, state might not have updated yet; retry shortly
      setTimeout(() => startInternal(taskId), 10);
      return;
    }
    log('startInternal: starting', { id: taskId, name: task.name, size: task.size, mime: task.mime, source: task._source });
    // Build XHR request for progress and cancellation
    const xhr = new XMLHttpRequest();
    task._xhr = xhr;

    xhr.upload.onprogress = (e: ProgressEvent) => {
      log('progress', { id: taskId, lengthComputable: e.lengthComputable, loaded: (e as any).loaded, total: (e as any).total });
      if (!e.lengthComputable) return;
      const pct = Math.min(100, Math.max(0, Math.round((e.loaded / e.total) * 100)));
      dispatch({ type: 'PROGRESS', id: taskId, progress: pct });
    };

    xhr.onload = () => {
      log('onload', { id: taskId, status: xhr.status, statusText: xhr.statusText, responseBytes: (xhr.responseText || '').length, dtMs: Date.now() - t0 });
      try {
        if (xhr.status >= 200 && xhr.status < 300) {
          const body = JSON.parse(xhr.responseText || '{}');
          const url = body?.url as string | undefined;
          log('success', { id: taskId, url });
          dispatch({ type: 'SUCCESS', id: taskId });
          if (url && typeof task._onComplete === 'function') task._onComplete(url);
          else if (!url) log('warning: response missing url field', { id: taskId, body });
        } else if (xhr.status === 0) {
          // Aborted
          dispatch({ type: 'CANCEL', id: taskId });
        } else {
          dispatch({ type: 'FAIL', id: taskId, error: `${xhr.status} ${xhr.statusText}` });
        }
      } catch (e: any) {
        log('parse-fail', { id: taskId, error: String(e?.message || e), response: xhr.responseText });
        dispatch({ type: 'FAIL', id: taskId, error: String(e?.message || e) });
      } finally {
        try { task._onFinally?.(); } catch {}
        // Check auto-export condition after any task completion
        maybeAutoExport();
      }
    };

    const tryFetchFallback = async () => {
      if (task._fallbackTried) {
        log('fallback: already tried', { id: taskId });
        return false;
      }
      task._fallbackTried = true;
      try {
        // Choose API base: allow override via localStorage, else dev default to 8787, else same-origin
        let apiBase = '';
        try {
          apiBase = localStorage.getItem('debug:apiBase') || '';
        } catch {}
        if (!apiBase) {
          try {
            const loc = window.location;
            const devPorts = new Set(['5173', '5174']);
            if (devPorts.has(String(loc.port))) apiBase = 'http://localhost:8787';
          } catch {}
        }
        const endpoint = `${apiBase}/api/uploads`;
        log('fallback: fetch begin', { id: taskId, endpoint });
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'x-filename': task.name || 'upload.bin',
            'content-type': task.mime || 'application/octet-stream',
          },
          body: task._payload as any,
          credentials: 'include',
          mode: apiBase ? 'cors' : 'same-origin',
        });
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`${res.status} ${res.statusText} ${text}`);
        }
        const body = await res.json().catch(() => ({} as any));
        const url = body?.url as string | undefined;
        log('fallback: success', { id: taskId, url });
        dispatch({ type: 'SUCCESS', id: taskId });
        if (url && typeof task._onComplete === 'function') task._onComplete(url);
        try { task._onFinally?.(); } catch {}
        maybeAutoExport();
        return true;
      } catch (e: any) {
        log('fallback: fail', { id: taskId, error: String(e?.message || e) });
        dispatch({ type: 'FAIL', id: taskId, error: String(e?.message || e) });
        try { task._onFinally?.(); } catch {}
        maybeAutoExport();
        return false;
      }
    };

    xhr.onerror = () => {
      log('onerror', { id: taskId, status: xhr.status, statusText: xhr.statusText });
      // Try fetch-based fallback (bypasses Vite proxy) for dev
      void tryFetchFallback();
    };

    // Start
    dispatch({ type: 'START', id: taskId });
    const endpoint = '/api/uploads';
    log('open', { id: taskId, endpoint });
    try {
      xhr.open('POST', endpoint, true);
    } catch (e) {
      log('open-failed', { id: taskId, error: String((e as any)?.message || e) });
      // Fallback immediately if open fails
      void tryFetchFallback();
      return;
    }

    const name = task.name || 'upload.bin';
    const contentType = task.mime || 'application/octet-stream';
    try {
      xhr.setRequestHeader('x-filename', name);
      xhr.setRequestHeader('content-type', contentType);
    } catch {}

    log('send', { id: taskId, bytes: (task._payload as any)?.size || 0 });
    xhr.send(task._payload);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  type EnqueueFileFn = (
    file: File,
    opts: { assetId: string; name?: string; onComplete?: (url: string) => void; onFinally?: () => void }
  ) => string;

  const enqueueFile = useCallback<EnqueueFileFn>((file, opts) => {
    log('enqueueFile', { name: file.name, size: file.size, type: file.type, assetId: opts.assetId });
    const id = `up_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const t: InternalTask = {
      id,
      assetId: opts.assetId,
      name: opts.name || file.name || 'upload.bin',
      size: file.size,
      mime: file.type || 'application/octet-stream',
      status: 'queued',
      progress: 0,
      _source: 'file',
      _payload: file,
      _onComplete: opts.onComplete,
      _onFinally: opts.onFinally,
    };
    dispatch({ type: 'ENQUEUE', task: t });
    log('enqueued', { id, name: t.name, size: t.size });
    // Autostart
    setTimeout(() => startInternal(id), 0);
    return id;
  }, [startInternal]);

  type EnqueueBlobFn = (
    blob: Blob,
    opts: { assetId: string; name: string; mime?: string; onComplete?: (url: string) => void; onFinally?: () => void }
  ) => string;

  const enqueueBlob = useCallback<EnqueueBlobFn>((blob, opts) => {
    log('enqueueBlob', { name: opts.name, size: (blob as any)?.size || 0, mime: opts.mime || (blob as any)?.type, assetId: opts.assetId });
    const id = `up_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const t: InternalTask = {
      id,
      assetId: opts.assetId,
      name: opts.name,
      size: (blob as any).size || 0,
      mime: opts.mime || (blob as any).type || 'application/octet-stream',
      status: 'queued',
      progress: 0,
      _source: 'blob',
      _payload: blob,
      _onComplete: opts.onComplete,
      _onFinally: opts.onFinally,
    };
    dispatch({ type: 'ENQUEUE', task: t });
    log('enqueued', { id, name: t.name, size: t.size });
    setTimeout(() => startInternal(id), 0);
    return id;
  }, [startInternal]);

  const cancel = useCallback((id: string) => {
    log('cancel', { id });
    const t = state.tasks[id];
    if (t?._xhr && (t.status === 'uploading' || t.status === 'queued')) {
      try { t._xhr.abort(); } catch {}
    }
    dispatch({ type: 'CANCEL', id });
  }, [state.tasks]);

  const retry = useCallback((id: string) => {
    log('retry', { id });
    const t = state.tasks[id];
    if (!t) return;
    // Reset minimal fields
    dispatch({ type: 'ENQUEUE', task: { ...t, status: 'queued', progress: 0, error: undefined, startedAt: undefined, completedAt: undefined } });
    setTimeout(() => startInternal(id), 0);
  }, [state.tasks, startInternal]);

  const remove = useCallback((id: string) => {
    log('remove', { id });
    dispatch({ type: 'REMOVE', id });
  }, []);

  const showPanel = useCallback((show: boolean) => {
    log('showPanel', { show });
    dispatch({ type: 'SHOW_PANEL', show });
  }, []);

  const maybeAutoExport = useCallback(() => {
    log('maybeAutoExport', {
      total: Object.keys(state.tasks).length,
      allDone: Object.values(state.tasks).every((t) => t.status === 'uploaded' || t.status === 'cancelled'),
      autoExportWhenReady: state.autoExportWhenReady,
      hasCallback: typeof state.onAllComplete === 'function',
    });
    const allDone = Object.values(state.tasks).every((t) => t.status === 'uploaded' || t.status === 'cancelled');
    if (allDone && state.autoExportWhenReady && typeof state.onAllComplete === 'function') {
      // Clear the flag before invoking to avoid re-entry
      dispatch({ type: 'SET_AUTO_EXPORT', enabled: false });
      const cb = state.onAllComplete;
      dispatch({ type: 'SET_ON_ALL_COMPLETE', cb: null });
      try { cb(); } catch {}
    }
  }, [state.tasks, state.autoExportWhenReady, state.onAllComplete]);

  const setAutoExportWhenReady = useCallback(
    (enabled: boolean, cb?: (() => void)) => {
      dispatch({ type: 'SET_AUTO_EXPORT', enabled });
      if (typeof cb === 'function') dispatch({ type: 'SET_ON_ALL_COMPLETE', cb });
      if (enabled) {
        // In case nothing is pending, trigger immediately
        setTimeout(() => maybeAutoExport(), 0);
      }
    },
    [maybeAutoExport]
  );

  const value = useMemo(() => ({
    state,
    enqueueFile,
    enqueueBlob,
    cancel,
    retry,
    remove,
    showPanel,
    setAutoExportWhenReady,
  }), [state, enqueueFile, enqueueBlob, cancel, retry, remove, showPanel, setAutoExportWhenReady]);

  return <UploadContext.Provider value={value}>{children}</UploadContext.Provider>;
};

export function useUploadManager() {
  const ctx = useContext(UploadContext);
  if (!ctx) throw new Error('useUploadManager must be used within UploadManagerProvider');

  const { state } = ctx;
  const tasks = state.order.map((id) => state.tasks[id]).filter(Boolean);
  const inProgress = tasks.filter((t) => t.status === 'queued' || t.status === 'uploading' || t.status === 'verifying');
  const failed = tasks.filter((t) => t.status === 'failed');
  const completed = tasks.filter((t) => t.status === 'uploaded');

  const allUploaded = tasks.length === 0 || tasks.every((t) => t.status === 'uploaded' || t.status === 'cancelled');

  return {
    // raw
    ...ctx,
    // derived
    tasks,
    inProgress,
    failed,
    completed,
    counts: {
      total: tasks.length,
      inProgress: inProgress.length,
      failed: failed.length,
      completed: completed.length,
    },
    allUploaded,
    panelVisible: state.showPanel,
    autoExportWhenReady: state.autoExportWhenReady,
  } as const;
}