// Electron main process entry for Synapse desktop build
// Minimal scaffold: creates a BrowserWindow, loads the dev server or built assets,
// and wires IPC handlers for filesystem operations.

import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import fs from 'node:fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Env knobs (documented in docs/electron/outline.md)
const DEV_URL = process.env.SYNAPSE_ELECTRON_DEV_URL || process.env.VITE_DEV_SERVER_URL;
const DIST_DIR = process.env.SYNAPSE_ELECTRON_DIST_DIR || join(process.cwd(), 'dist');

/**
* Create the main application window
*/
const createWindow = () => {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'Synapse',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    show: false,
  });

  win.on('ready-to-show', () => win.show());

  // In dev, point to Vite dev server; in prod, load built index.html
  if (DEV_URL) {
    win.loadURL(DEV_URL);
  } else {
    const indexHtml = new URL('file://' + join(DIST_DIR, 'index.html'));
    win.loadURL(indexHtml.toString());
  }

  // Optional: Open external links in default browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'deny' };
  });
};

// App lifecycle
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC: Filesystem surface
// Channel names documented in docs/electron/outline.md

ipcMain.handle('ipc:fs:open-file', async (_evt, options = {}) => {
  const res = await dialog.showOpenDialog({
    properties: ['openFile'],
    ...options,
  });
  if (res.canceled || res.filePaths.length === 0) return null;
  return res.filePaths[0];
});

ipcMain.handle('ipc:fs:open-files', async (_evt, options = {}) => {
  const res = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    ...options,
  });
  if (res.canceled || res.filePaths.length === 0) return [];
  return res.filePaths;
});

ipcMain.handle('ipc:fs:open-directory', async (_evt, options = {}) => {
  const res = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    ...options,
  });
  if (res.canceled || res.filePaths.length === 0) return null;
  return res.filePaths[0];
});

ipcMain.handle('ipc:fs:read-file', async (_evt, path, encoding = 'utf-8') => {
  if (!path || typeof path !== 'string') throw new Error('Invalid path');
  const data = await fs.readFile(path, encoding ? { encoding } : undefined);
  return data; // string when encoding provided; Buffer when null
});

ipcMain.handle('ipc:fs:write-file', async (_evt, path, data, options = {}) => {
  if (!path || typeof path !== 'string') throw new Error('Invalid path');
  await fs.writeFile(path, data, options);
  return true;
});

ipcMain.handle('ipc:fs:show-save-dialog', async (_evt, options = {}) => {
  const res = await dialog.showSaveDialog({
    ...options,
  });
  if (res.canceled || !res.filePath) return null;
  return res.filePath;
});

ipcMain.handle('ipc:app:get-path', async () => {
  return app.getAppPath();
});

// Placeholders for future app lifecycle/deep link handling can be added here.
