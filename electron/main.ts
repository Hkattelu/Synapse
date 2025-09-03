// Electron main process entry for Synapse desktop build (TypeScript)
// Creates a BrowserWindow, loads the dev server (dev) or built assets (prod),
// and wires IPC handlers for filesystem operations.

import {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  shell,
  Menu,
  safeStorage,
} from 'electron';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
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

// Desktop-only configuration for license validation and update metadata
// All are optional; the renderer UI will surface clear messaging when unset.
const LICENSE_API_URL = process.env.SYNAPSE_LICENSE_API_URL || '';
const LICENSE_API_HEADERS = parseHeaders(
  process.env.SYNAPSE_LICENSE_API_HEADERS_JSON
);
const LICENSE_REFRESH_INTERVAL_MS = Number(
  process.env.SYNAPSE_LICENSE_REFRESH_MS || 12 * 60 * 60 * 1000
); // default: 12h

const UPDATE_FEED_URL = process.env.SYNAPSE_UPDATE_FEED_URL || '';
const UPDATE_FEED_HEADERS = parseHeaders(
  process.env.SYNAPSE_UPDATE_FEED_HEADERS_JSON
);

function parseHeaders(raw?: string) {
  if (!raw) return {} as Record<string, string>;
  try {
    const obj = JSON.parse(raw);
    if (obj && typeof obj === 'object') return obj as Record<string, string>;
  } catch (e) {
    console.warn('Invalid *_HEADERS_JSON config; ignoring:', e);
  }
  return {} as Record<string, string>;
}

// License storage paths (created lazily after app ready)
let USER_DATA_DIR: string | null = null;
const LICENSE_BIN = () => join(USER_DATA_DIR!, 'license.bin');
const LICENSE_STATUS_JSON = () => join(USER_DATA_DIR!, 'license-status.json');

type LicenseState = 'valid' | 'invalid' | 'expired' | 'unknown';
type LicenseStatus = {
  state: LicenseState;
  message?: string;
  lastCheckedAt?: number; // epoch ms
  lastValidAt?: number; // epoch ms
  expiresAt?: string;
  user?: { email?: string; name?: string; plan?: string };
};

let lastLicenseStatus: LicenseStatus = { state: 'unknown' };
let licenseRefreshTimer: NodeJS.Timeout | null = null;

function platformKey(): string {
  const plat = process.platform; // 'darwin' | 'win32' | 'linux'
  const arch = process.arch; // 'arm64' | 'x64' | ...
  return `${plat}-${arch}`;
}

function appVersion(): string {
  try {
    return app.getVersion();
  } catch {
    return '0.0.0';
  }
}

async function readLicense(): Promise<string | null> {
  try {
    const buf = await fs.readFile(LICENSE_BIN());
    if (!buf || buf.length === 0) return null;
    if (safeStorage.isEncryptionAvailable()) {
      try {
        const decrypted = safeStorage.decryptString(buf);
        return decrypted || null;
      } catch (e: unknown) {
        console.warn('Failed to decrypt stored license:', e);
        return null;
      }
    }
    // Fallback: treat as utf-8 (not ideal, but supports older runtimes)
    return buf.toString('utf-8');
  } catch (e: unknown) {
    if (
      typeof e === 'object' &&
      e &&
      'code' in e &&
      (e as { code?: string }).code === 'ENOENT'
    )
      return null;
    console.warn('readLicense error:', e);
    return null;
  }
}

async function writeLicense(license: string): Promise<void> {
  const encrypted = safeStorage.isEncryptionAvailable();
  const data = encrypted
    ? safeStorage.encryptString(license)
    : Buffer.from(license, 'utf-8');
  // Restrict permissions when not encrypted
  const options: WriteFileOptions | BufferEncoding | undefined = encrypted
    ? undefined
    : { mode: 0o600 };
  await fs.writeFile(LICENSE_BIN(), data, options);
}

async function clearLicenseFiles(): Promise<void> {
  await Promise.allSettled([
    fs.rm(LICENSE_BIN()).catch(() => {}),
    fs.rm(LICENSE_STATUS_JSON()).catch(() => {}),
  ]);
}

function maskLicense(license: string | null): string | null {
  if (!license) return null;
  const len = license.length;
  if (len <= 4) return '*'.repeat(Math.max(0, len - 1)) + license.slice(-1);
  return `${license.slice(0, 2)}${'*'.repeat(Math.max(0, len - 6))}${license.slice(-4)}`;
}

function coerceLicenseStatus(input: unknown): LicenseStatus {
  // Accept a variety of backend payloads; map conservatively.
  try {
    const obj = (input ?? {}) as Record<string, unknown>;
    const lic = obj.license as Record<string, unknown> | undefined;
    const statusCandidate =
      (obj.status as string | undefined) ||
      (obj.state as string | undefined) ||
      (lic && (lic.status as string | undefined));
    const mapped: LicenseState =
      statusCandidate === 'valid'
        ? 'valid'
        : statusCandidate === 'invalid'
          ? 'invalid'
          : statusCandidate === 'expired'
            ? 'expired'
            : 'unknown';
    const expiresAt: string | undefined =
      (obj.expiresAt as string | undefined) ||
      (lic && (lic.expiresAt as string | undefined));
    const user =
      (obj.user as Record<string, unknown> | undefined) ||
      (obj.owner as Record<string, unknown> | undefined);
    const message: string | undefined =
      (obj.message as string | undefined) || (obj.error as string | undefined);
    const u =
      user && typeof user === 'object'
        ? (user as Record<string, unknown>)
        : undefined;
    const email =
      typeof u?.email === 'string' ? (u.email as string) : undefined;
    const name = typeof u?.name === 'string' ? (u.name as string) : undefined;
    const plan = typeof u?.plan === 'string' ? (u.plan as string) : undefined;
    return {
      state: mapped,
      message,
      expiresAt,
      user: u ? { email, name, plan } : undefined,
      lastCheckedAt: Date.now(),
    };
  } catch {
    return { state: 'unknown', lastCheckedAt: Date.now() };
  }
}

async function validateLicense(
  currentLicense: string | null
): Promise<LicenseStatus> {
  const base: LicenseStatus = {
    state: 'unknown',
    lastCheckedAt: Date.now(),
    lastValidAt: lastLicenseStatus?.lastValidAt,
  };
  if (!currentLicense) {
    const res: LicenseStatus = {
      ...base,
      state: 'invalid',
      message: 'No license present',
    };
    lastLicenseStatus = res;
    await persistLicenseStatus(res);
    broadcastToAll('license:status', res);
    console.info(
      '[licenseCheck]',
      JSON.stringify({ event: 'licenseCheck', result: res.state })
    );
    return res;
  }
  if (!LICENSE_API_URL) {
    const res: LicenseStatus = {
      ...base,
      state: 'unknown',
      message: 'License API not configured',
    };
    lastLicenseStatus = res;
    await persistLicenseStatus(res);
    broadcastToAll('license:status', res);
    console.info(
      '[licenseCheck]',
      JSON.stringify({ event: 'licenseCheck', result: res.state })
    );
    return res;
  }
  try {
    const body = JSON.stringify({
      license: currentLicense,
      appVersion: appVersion(),
      device: {
        platform: process.platform,
        arch: process.arch,
        hostname: os.hostname(),
      },
    });
    const res = await fetch(LICENSE_API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...LICENSE_API_HEADERS,
      },
      body,
      // Give up reasonably quickly; renderer can retry manually
      signal: AbortSignal.timeout?.(10_000),
    } as RequestInit);
    if (!res.ok) {
      const out: LicenseStatus = {
        ...base,
        state: res.status === 401 || res.status === 403 ? 'invalid' : 'unknown',
        message: `Server ${res.status}`,
      };
      lastLicenseStatus = out;
      await persistLicenseStatus(out);
      broadcastToAll('license:status', out);
      console.info(
        '[licenseCheck]',
        JSON.stringify({
          event: 'licenseCheck',
          http: res.status,
          result: out.state,
        })
      );
      return out;
    }
    const json = await res.json().catch(() => ({}));
    const mapped = coerceLicenseStatus(json);
    // If the mapped state is valid, stamp lastValidAt; otherwise preserve prior lastValidAt
    const withValidity: LicenseStatus =
      mapped.state === 'valid'
        ? { ...mapped, lastValidAt: Date.now() }
        : { ...mapped, lastValidAt: lastLicenseStatus?.lastValidAt };
    lastLicenseStatus = withValidity;
    await persistLicenseStatus(withValidity);
    broadcastToAll('license:status', withValidity);
    console.info(
      '[licenseCheck]',
      JSON.stringify({ event: 'licenseCheck', result: mapped.state })
    );
    return withValidity;
  } catch (e: unknown) {
    const out: LicenseStatus = {
      ...base,
      state: 'unknown',
      message:
        typeof e === 'object' &&
        e &&
        'name' in e &&
        (e as { name?: string }).name === 'TimeoutError'
          ? 'Network timeout'
          : 'Network error',
    };
    lastLicenseStatus = out;
    await persistLicenseStatus(out);
    broadcastToAll('license:status', out);
    console.warn(
      '[licenseCheck]',
      JSON.stringify({ event: 'licenseCheck', error: String(e) })
    );
    return out;
  }
}

async function persistLicenseStatus(status: LicenseStatus) {
  try {
    await fs.writeFile(
      LICENSE_STATUS_JSON(),
      JSON.stringify(status, null, 2),
      'utf-8'
    );
  } catch (e) {
    console.warn('Failed to persist license status:', e);
  }
}

async function loadLicenseStatusFromDisk(): Promise<LicenseStatus | null> {
  try {
    const raw = await fs.readFile(LICENSE_STATUS_JSON(), 'utf-8');
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (parsed && typeof parsed === 'object') {
      // Lightweight migration: map legacy lastChecked -> lastCheckedAt when needed
      const lastCheckedAt =
        (parsed.lastCheckedAt as number | undefined) ??
        (parsed.lastChecked as number | undefined);
      const migrated: LicenseStatus = {
        state: (parsed.state as LicenseState) ?? 'unknown',
        message: (parsed.message as string | undefined) ?? undefined,
        lastCheckedAt,
        lastValidAt: parsed.lastValidAt as number | undefined,
        expiresAt: parsed.expiresAt as string | undefined,
        user: (parsed.user as LicenseStatus['user']) ?? undefined,
      };
      return migrated;
    }
  } catch {
    // ignore
  }
  return null;
}

type UpdateStatus = {
  currentVersion: string;
  latestVersion?: string;
  updateAvailable: boolean;
  downloadUrl?: string;
  platform?: string;
  message?: string;
  lastChecked?: number;
};

let lastUpdateStatus: UpdateStatus | null = null;

function compareVersions(a: string, b: string): number {
  // Lightweight semver-ish compare: ignores pre-release/build metadata
  const pa = a
    .split(/[.-]/)
    .map((p) => parseInt(p.replace(/\D+/g, ''), 10) || 0);
  const pb = b
    .split(/[.-]/)
    .map((p) => parseInt(p.replace(/\D+/g, ''), 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const na = pa[i] ?? 0;
    const nb = pb[i] ?? 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}

function parseUpdatePayload(
  payload: unknown,
  platKey: string
): {
  latestVersion?: string;
  downloadUrl?: string;
} {
  if (!payload || typeof payload !== 'object') return {};
  const obj = payload as Record<string, unknown>;
  const latest = (obj.latestVersion || obj.version || obj.tag) as
    | string
    | undefined;
  // Accept either `downloads[platKey]` or a nested `platforms[platKey].url`
  let url: string | undefined;
  const downloads = obj.downloads as Record<string, unknown> | undefined;
  if (downloads && typeof downloads === 'object') {
    url =
      (downloads[platKey] as string | undefined) ||
      (downloads[process.platform] as string | undefined);
  }
  if (!url && obj.platforms && typeof obj.platforms === 'object') {
    const platforms = obj.platforms as Record<string, unknown>;
    const p =
      (platforms[platKey] as Record<string, unknown> | undefined) ||
      (platforms[process.platform] as Record<string, unknown> | undefined);
    if (p && typeof p === 'object')
      url =
        (p.url as string | undefined) || (p.downloadUrl as string | undefined);
  }
  // Common GitHub release-like shape: assets array with name hints
  const assets = obj.assets as Array<Record<string, unknown>> | undefined;
  if (!url && Array.isArray(assets)) {
    const candidates = assets
      .filter((a) => typeof a?.browser_download_url === 'string')
      .map((a) => ({
        name: String(a?.name || ''),
        url: a.browser_download_url as string,
      }));
    const prefer =
      candidates.find((c) => c.name.includes(platKey)) ||
      candidates.find((c) => c.name.toLowerCase().includes(process.platform));
    url = prefer?.url;
  }
  return { latestVersion: latest, downloadUrl: url };
}

async function checkForUpdates(): Promise<UpdateStatus> {
  const base: UpdateStatus = {
    currentVersion: appVersion(),
    updateAvailable: false,
    platform: platformKey(),
    lastChecked: Date.now(),
  };
  if (!UPDATE_FEED_URL) {
    const out = { ...base, message: 'Update feed not configured' };
    lastUpdateStatus = out;
    return out;
  }
  try {
    const res = await fetch(UPDATE_FEED_URL, {
      headers: { ...UPDATE_FEED_HEADERS },
      signal: AbortSignal.timeout?.(10_000),
    } as RequestInit);
    if (!res.ok) {
      const out = { ...base, message: `Server ${res.status}` };
      lastUpdateStatus = out;
      broadcastToAll('updates:status', out);
      return out;
    }
    const payload = await res.json().catch(() => ({}));
    const { latestVersion, downloadUrl } = parseUpdatePayload(
      payload,
      platformKey()
    );
    const updateAvailable =
      !!latestVersion &&
      compareVersions(latestVersion, base.currentVersion) > 0;
    const out: UpdateStatus = {
      ...base,
      latestVersion,
      updateAvailable,
      downloadUrl,
    };
    lastUpdateStatus = out;
    broadcastToAll('updates:status', out);
    console.info(
      '[updateCheck]',
      JSON.stringify({
        event: 'updateCheck',
        current: base.currentVersion,
        latest: latestVersion,
        available: updateAvailable,
      })
    );
    return out;
  } catch (e: unknown) {
    const out = { ...base, message: 'Network error' };
    lastUpdateStatus = out;
    broadcastToAll('updates:status', out);
    console.warn(
      '[updateCheck]',
      JSON.stringify({ event: 'updateCheck', error: String(e) })
    );
    return out;
  }
}

function broadcastToAll(channel: string, payload: unknown) {
  for (const win of BrowserWindow.getAllWindows()) {
    try {
      win.webContents.send(channel, payload);
    } catch {
      // ignore
    }
  }
}

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
  USER_DATA_DIR = app.getPath('userData');
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  // App menu with a basic Help menu containing "Check for Updates…"
  try {
    const helpSubmenu: Electron.MenuItemConstructorOptions[] = [
      {
        label: 'Check for Updates…',
        click: async () => {
          const status = await checkForUpdates();
          const win = BrowserWindow.getFocusedWindow();
          if (win) win.webContents.send('updates:status', status);
          if (status.updateAvailable && status.latestVersion) {
            const opts: Electron.MessageBoxOptions = {
              type: 'info',
              buttons: ['Get Update', 'Later'],
              defaultId: 0,
              cancelId: 1,
              title: 'Update Available',
              message: `Version ${status.latestVersion} is available (you have ${status.currentVersion}).`,
              detail: 'Open the download page to install the latest version.',
            };
            const choice = win
              ? await dialog.showMessageBox(win, opts)
              : await dialog.showMessageBox(opts);
            if (choice.response === 0 && status.downloadUrl) {
              void shell.openExternal(status.downloadUrl);
            }
          } else {
            const info = status.message;
            const opts: Electron.MessageBoxOptions = info
              ? {
                  type: 'warning',
                  buttons: ['OK'],
                  title: 'Update Check',
                  message: 'Could not determine updates.',
                  detail: info,
                }
              : {
                  type: 'info',
                  buttons: ['OK'],
                  title: 'Up to Date',
                  message: `You are on the latest version (${status.currentVersion}).`,
                };
            if (win) void dialog.showMessageBox(win, opts);
            else void dialog.showMessageBox(opts);
          }
        },
      },
    ];
    const macAppSubmenu: Electron.MenuItemConstructorOptions[] = [
      { role: 'about' },
      { type: 'separator' },
      { role: 'quit' },
    ];
    const template: Electron.MenuItemConstructorOptions[] = [
      ...(process.platform === 'darwin'
        ? [{ label: app.name, submenu: macAppSubmenu }]
        : []),
      { label: 'Help', submenu: helpSubmenu },
    ];
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  } catch (e) {
    console.warn('Failed to set application menu:', e);
  }

  // Kick off background license validation on startup and at intervals
  readLicense()
    .then((lic) => validateLicense(lic))
    .catch(() => validateLicense(null));
  if (licenseRefreshTimer) clearInterval(licenseRefreshTimer);
  licenseRefreshTimer = setInterval(
    async () => {
      const lic = await readLicense();
      await validateLicense(lic);
    },
    Math.max(5 * 60 * 1000, LICENSE_REFRESH_INTERVAL_MS)
  );

  // Perform an update check shortly after launch
  setTimeout(() => {
    void checkForUpdates();
  }, 5_000);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (licenseRefreshTimer) clearInterval(licenseRefreshTimer);
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

// IPC: License management
ipcMain.handle('ipc:license:get-status', async () => {
  // Load from disk on first call if we don't have it in memory
  if (!lastLicenseStatus?.lastCheckedAt) {
    const fromDisk = await loadLicenseStatusFromDisk();
    if (fromDisk) lastLicenseStatus = fromDisk;
  }
  const lic = await readLicense();
  return {
    ...lastLicenseStatus,
    licenseMasked: maskLicense(lic),
  } as LicenseStatus & { licenseMasked: string | null };
});

ipcMain.handle('ipc:license:set', async (_evt, license: string) => {
  if (typeof license !== 'string' || license.trim().length === 0) {
    throw new Error('Invalid license');
  }
  await writeLicense(license.trim());
  const status = await validateLicense(license.trim());
  return { ...status, licenseMasked: maskLicense(license.trim()) };
});

ipcMain.handle('ipc:license:validate', async () => {
  const lic = await readLicense();
  const status = await validateLicense(lic);
  return { ...status, licenseMasked: maskLicense(lic) };
});

ipcMain.handle('ipc:license:clear', async () => {
  await clearLicenseFiles();
  lastLicenseStatus = {
    state: 'invalid',
    message: 'No license present',
    lastCheckedAt: Date.now(),
    lastValidAt: lastLicenseStatus?.lastValidAt,
  };
  broadcastToAll('license:status', lastLicenseStatus);
  return { ...lastLicenseStatus, licenseMasked: null };
});

// IPC: Update checks
ipcMain.handle('ipc:update:check', async () => {
  const status = await checkForUpdates();
  return status;
});

ipcMain.handle('ipc:update:get-last', async () => {
  if (!lastUpdateStatus) return await checkForUpdates();
  return lastUpdateStatus;
});

ipcMain.handle('ipc:update:open-download', async (_evt, url?: string) => {
  const target = url || lastUpdateStatus?.downloadUrl;
  if (!target) return false as const;
  try {
    const u = new URL(target);
    if (!['https:', 'http:'].includes(u.protocol)) return false as const;
    await shell.openExternal(u.toString());
    return true as const;
  } catch {
    return false as const;
  }
});
