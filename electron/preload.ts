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

contextBridge.exposeInMainWorld('SynapseFS', SynapseFS);
