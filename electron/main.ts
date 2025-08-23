// Electron main process entry for Synapse desktop build (TypeScript)
// Creates a BrowserWindow, loads the dev server (dev) or built assets (prod),
// and wires IPC handlers for filesystem operations.

import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import fs from 'node:fs/promises';
import type {
  OpenDialogOptions,
  SaveDialogOptions,
  FileFilter,
} from 'electron';
import type { WriteFileOptions } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Env knobs (documented in docs/electron/outline.md)
const DEV_URL =
  process.env.SYNAPSE_ELECTRON_DEV_URL || process.env.VITE_DEV_SERVER_URL;
const DIST_DIR =
  process.env.SYNAPSE_ELECTRON_DIST_DIR || join(process.cwd(), 'dist');

/**
 * Create the main application window
 */
const createWindow = (): void => {
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
  const isDev = !app.isPackaged;
  if (isDev && DEV_URL) {
    void win.loadURL(DEV_URL);
  } else {
    const indexHtml = pathToFileURL(join(DIST_DIR, 'index.html'));
    void win.loadURL(indexHtml.toString());
  }

  // Open external links in default browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      void shell.openExternal(url);
      return { action: 'deny' as const };
    }
    return { action: 'deny' as const };
  });

  // Block in-window navigations to external content
  win.webContents.on('will-navigate', (e, url) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      e.preventDefault();
      void shell.openExternal(url);
    }
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

// Defaults for dialog file filters
const defaultFilters: FileFilter[] = [
  { name: 'Video', extensions: ['mp4'] },
  { name: 'Audio', extensions: ['mp3'] },
  { name: 'Code', extensions: ['ts'] },
];

// IPC: Filesystem surface
// Channel names documented in docs/electron/outline.md

ipcMain.handle(
  'ipc:fs:open-file',
  async (evt, options: OpenDialogOptions = {}) => {
    const parent = BrowserWindow.fromWebContents(evt.sender) ?? null;
    const merged: OpenDialogOptions = {
      properties: ['openFile'],
      // Renderer-provided filters should take precedence over defaults
      filters: defaultFilters,
      ...options,
    };
    const res = parent
      ? await dialog.showOpenDialog(parent, merged)
      : await dialog.showOpenDialog(merged);
    if (res.canceled || res.filePaths.length === 0) return null;
    return res.filePaths[0] ?? null;
  }
);

ipcMain.handle(
  'ipc:fs:open-files',
  async (evt, options: OpenDialogOptions = {}) => {
    const parent = BrowserWindow.fromWebContents(evt.sender) ?? null;
    const merged: OpenDialogOptions = {
      properties: ['openFile', 'multiSelections'],
      filters: defaultFilters,
      ...options,
    };
    const res = parent
      ? await dialog.showOpenDialog(parent, merged)
      : await dialog.showOpenDialog(merged);
    if (res.canceled || res.filePaths.length === 0) return [];
    return res.filePaths;
  }
);

ipcMain.handle(
  'ipc:fs:open-directory',
  async (evt, options: OpenDialogOptions = {}) => {
    const parent = BrowserWindow.fromWebContents(evt.sender) ?? null;
    const merged: OpenDialogOptions = {
      properties: ['openDirectory'],
      ...options,
    };
    const res = parent
      ? await dialog.showOpenDialog(parent, merged)
      : await dialog.showOpenDialog(merged);
    if (res.canceled || res.filePaths.length === 0) return null;
    return res.filePaths[0] ?? null;
  }
);

ipcMain.handle(
  'ipc:fs:read-file',
  async (_evt, path: string, encoding: string | null = 'utf-8') => {
    if (!path || typeof path !== 'string') throw new Error('Invalid path');
    if (encoding) {
      const data = await fs.readFile(path, {
        encoding: encoding as BufferEncoding,
      });
      return data as string;
    }
    const data = await fs.readFile(path);
    return data as Buffer;
  }
);

ipcMain.handle(
  'ipc:fs:write-file',
  async (
    _evt,
    path: string,
    data: string | Uint8Array,
    options: WriteFileOptions | BufferEncoding | null = {}
  ) => {
    if (!path || typeof path !== 'string') throw new Error('Invalid path');
    await fs.writeFile(path, data, options ?? undefined);
    return true as const;
  }
);

ipcMain.handle(
  'ipc:fs:show-save-dialog',
  async (evt, options: SaveDialogOptions = {}) => {
    const parent = BrowserWindow.fromWebContents(evt.sender) ?? null;
    const merged: SaveDialogOptions = {
      filters: defaultFilters,
      ...options,
    };
    const res = parent
      ? await dialog.showSaveDialog(parent, merged)
      : await dialog.showSaveDialog(merged);
    if (res.canceled || !res.filePath) return null;
    return res.filePath;
  }
);

ipcMain.handle('ipc:app:get-path', async () => {
  return app.getAppPath();
});

// Placeholders for future app lifecycle/deep link handling can be added here.
