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

declare global {
  interface Window {
    readonly SynapseFS: Readonly<SynapseFSApi>;
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
