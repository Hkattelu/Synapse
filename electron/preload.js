// Preload script: exposes a minimal, namespaced filesystem API to the renderer
// Security: contextIsolation is enabled; Node integration is disabled.

import { contextBridge, ipcRenderer } from 'electron';

const SynapseFS = {
  openFile: (options) => ipcRenderer.invoke('ipc:fs:open-file', options),
  openFiles: (options) => ipcRenderer.invoke('ipc:fs:open-files', options),
  openDirectory: (options) => ipcRenderer.invoke('ipc:fs:open-directory', options),
  readFile: (path, encoding = 'utf-8') => ipcRenderer.invoke('ipc:fs:read-file', path, encoding),
  writeFile: (path, data, options) => ipcRenderer.invoke('ipc:fs:write-file', path, data, options),
  showSaveDialog: (options) => ipcRenderer.invoke('ipc:fs:show-save-dialog', options),
  getAppPath: () => ipcRenderer.invoke('ipc:app:get-path'),
};

contextBridge.exposeInMainWorld('SynapseFS', SynapseFS);
