// Global type declarations for the preload-exposed API
// These types are intentionally minimal and do not import Electron types
// so that the web build remains independent of Electron.

export type SynapseFSApi = {
  openFile: (options?: OpenDialogOptions) => Promise<string | null>;
  openFiles: (options?: OpenDialogOptions) => Promise<string[]>;
  openDirectory: (options?: OpenDialogOptions) => Promise<string | null>;
  readFile: (
    path: string,
    encoding?: string | null
  ) => Promise<string | Uint8Array>;
  writeFile: (
    path: string,
    data: string | Uint8Array,
    options?: { encoding?: string | null }
  ) => Promise<boolean>;
  showSaveDialog: (options?: SaveDialogOptions) => Promise<string | null>;
  getAppPath: () => Promise<string>;
};

export type LicenseStatus = {
  state: 'valid' | 'invalid' | 'expired' | 'unknown';
  message?: string;
  // Timestamps per finalized integration contract (epoch ms)
  lastCheckedAt?: number;
  lastValidAt?: number;
  expiresAt?: string;
  user?: { email?: string; name?: string; plan?: string };
  licenseMasked?: string | null;
};

export type UpdateStatus = {
  currentVersion: string;
  latestVersion?: string;
  updateAvailable: boolean;
  downloadUrl?: string;
  platform?: string;
  message?: string;
  lastChecked?: number;
};

export type SynapseLicenseApi = {
  getStatus: () => Promise<LicenseStatus>;
  set: (license: string) => Promise<LicenseStatus>;
  validateNow: () => Promise<LicenseStatus>;
  clear: () => Promise<LicenseStatus>;
  onStatus: (handler: (status: LicenseStatus) => void) => () => void;
};

export type SynapseUpdatesApi = {
  checkNow: () => Promise<UpdateStatus>;
  getLast: () => Promise<UpdateStatus>;
  openDownload: (url?: string) => Promise<true>;
  onStatus: (handler: (status: UpdateStatus) => void) => () => void;
};

declare global {
  interface Window {
    readonly SynapseFS: Readonly<SynapseFSApi>;
    readonly SynapseLicense?: Readonly<SynapseLicenseApi>;
    readonly SynapseUpdates?: Readonly<SynapseUpdatesApi>;
  }
}

export type FileFilter = { name: string; extensions: string[] };
export type OpenDialogOptions = {
  title?: string;
  defaultPath?: string;
  filters?: FileFilter[];
  properties?: string[]; // maps to Electron's open dialog properties
};

export type SaveDialogOptions = {
  title?: string;
  defaultPath?: string;
  filters?: FileFilter[];
};

export {};
