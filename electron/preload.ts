// Preload script: exposes a minimal, namespaced filesystem API to the renderer (TypeScript)
// Security: contextIsolation is enabled; Node integration is disabled; API object is frozen.

import { contextBridge, ipcRenderer } from 'electron';
import type { OpenDialogOptions, SaveDialogOptions } from 'electron';

type ReadEncoding = string | null;

const SynapseFS = Object.freeze({
  openFile: (options?: OpenDialogOptions) =>
    ipcRenderer.invoke('ipc:fs:open-file', options),
  openFiles: (options?: OpenDialogOptions) =>
    ipcRenderer.invoke('ipc:fs:open-files', options),
  openDirectory: (options?: OpenDialogOptions) =>
    ipcRenderer.invoke('ipc:fs:open-directory', options),
  readFile: (path: string, encoding: ReadEncoding = 'utf-8') =>
    ipcRenderer.invoke('ipc:fs:read-file', path, encoding),
  writeFile: (
    path: string,
    data: string | Uint8Array,
    options?: { encoding?: string | null }
  ) => ipcRenderer.invoke('ipc:fs:write-file', path, data, options),
  showSaveDialog: (options?: SaveDialogOptions) =>
    ipcRenderer.invoke('ipc:fs:show-save-dialog', options),
  getAppPath: () => ipcRenderer.invoke('ipc:app:get-path'),
});

const SynapseLicense = Object.freeze({
  getStatus: () => ipcRenderer.invoke('ipc:license:get-status'),
  set: (license: string) => ipcRenderer.invoke('ipc:license:set', license),
  validateNow: () => ipcRenderer.invoke('ipc:license:validate'),
  clear: () => ipcRenderer.invoke('ipc:license:clear'),
  onStatus: (handler: (status: unknown) => void) => {
    const listener = (_e: unknown, payload: unknown) => handler(payload);
    ipcRenderer.on('license:status', listener);
    return () => ipcRenderer.removeListener('license:status', listener);
  },
});

const SynapseUpdates = Object.freeze({
  checkNow: () => ipcRenderer.invoke('ipc:update:check'),
  getLast: () => ipcRenderer.invoke('ipc:update:get-last'),
  openDownload: (url?: string) =>
    ipcRenderer.invoke('ipc:update:open-download', url),
  onStatus: (handler: (status: unknown) => void) => {
    const listener = (_e: unknown, payload: unknown) => handler(payload);
    ipcRenderer.on('updates:status', listener);
    return () => ipcRenderer.removeListener('updates:status', listener);
  },
});

contextBridge.exposeInMainWorld('SynapseFS', SynapseFS);
contextBridge.exposeInMainWorld('SynapseLicense', SynapseLicense);
contextBridge.exposeInMainWorld('SynapseUpdates', SynapseUpdates);
