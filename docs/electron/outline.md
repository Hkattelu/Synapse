Synapse Desktop (Electron) — Outline & Specification

Last updated: 2025-08-23

Goals and scope

- Deliver a first-party desktop app (Electron) that wraps the existing web UI.
- Enable native OS capabilities to improve UX:
  - Offline-capable shell for loading the UI bundle locally.
  - Native file dialogs and direct filesystem read/write for larger codebases.
  - Path and app metadata access as needed by export/render features.
- Maintain feature parity with the web build; no desktop-only product logic yet.
- Keep the desktop build additive. The existing web build remains unchanged.

High-level architecture

- Main process (electron/main.ts)
  - Owns the app lifecycle and `BrowserWindow`.
  - Loads the renderer from either the Vite dev server (dev) or the built web assets (prod).
  - Implements IPC handlers for the filesystem surface (see below).
- Preload (electron/preload.ts)
  - Runs in an isolated, privileged context.
  - Uses `contextBridge.exposeInMainWorld` to publish a small, namespaced API: `window.SynapseFS` (the API object is frozen at runtime).
  - Calls `ipcRenderer.invoke` to reach main-process handlers; no Node globals are exposed to the page.
- Renderer
  - The existing Vite/React app. No Node integration; it can only access native capabilities via `window.SynapseFS`.

Security model

- `contextIsolation: true` (enabled)
- `nodeIntegration: false` (disabled)
- `sandbox: true` (enabled for renderer process isolation)
- Preload is the only bridge; it exposes a frozen, namespaced API: `window.SynapseFS`.
- IPC channel allow-list: restricted to the channels enumerated below.
- External content hardening:
  - `setWindowOpenHandler` denies new windows and opens external `http(s)` links in the system browser.
  - `will-navigate` blocks in-window navigations to `http(s)` URLs and opens them externally instead.
- Dev/prod gating: the remote dev URL is used only when the app is not packaged (`!app.isPackaged`), otherwise the app always loads the local built `dist/index.html` via a file URL.
- Content Security Policy (CSP): keep current web CSP; tighten in packaging pass if needed.

Renderer-facing API surface (preload)

Namespace: `window.SynapseFS` (global)

Methods (all return Promises):

- `openFile(options?) -> string | null`
  - Shows a native open-file dialog; returns a single absolute path or `null` if canceled.
- `openFiles(options?) -> string[]`
  - Multi-select open-file dialog; returns absolute paths (empty array if canceled).
- `openDirectory(options?) -> string | null`
  - Directory picker; returns selected directory path or `null`.
- `readFile(path, encoding = 'utf-8') -> string | Uint8Array`
  - Reads a file from disk. If `encoding` is a string (e.g., `'utf-8'`), resolves to a string; if `null`, resolves to a `Uint8Array`.
- `writeFile(path, data, options?) -> boolean`
  - Writes data to disk (string or `Uint8Array`). Returns `true` when complete.
- `showSaveDialog(options?) -> string | null`
  - Shows a save dialog; resolves with the chosen absolute path or `null`.
- `getAppPath() -> string`
  - Returns Electron `app.getAppPath()`.

IPC channel names (main <-> preload <-> renderer)

- `ipc:fs:open-file`
- `ipc:fs:open-files`
- `ipc:fs:open-directory`
- `ipc:fs:read-file`
- `ipc:fs:write-file`
- `ipc:fs:show-save-dialog`
- `ipc:app:get-path`

Allowed operations and constraints

- Default file-type filters are applied when the renderer does not supply filters:
  - Video (`.mp4`), Audio (`.mp3`), Code (`.ts`).
- Renderer-supplied filters take precedence over defaults.
- The renderer may pass standard Electron dialog options (filters, default paths) as the `options` argument.

Build workflows

Development

- Start the web app dev server (Vite) in one terminal: `npm run dev` (serves at `http://localhost:5173` by default).
- In another terminal, run the desktop shell pointing at the dev server:
  - `npm run desktop:dev` — launches Electron with `VITE_DEV_SERVER_URL`/`SYNAPSE_ELECTRON_DEV_URL`.
- Env knobs:
  - `SYNAPSE_ELECTRON_DEV_URL` — explicitly set the dev URL (overrides the default and Vite’s value).

Production / packaging

- Build the web assets: `npm run build` (outputs to `dist/`).
- Validate locally: `npm run desktop:start`.
- Packager: `electron-builder` (per maintainer decision).
  - Script: `npm run desktop:build` (runs web build, compiles Electron TS, and invokes electron-builder with `electron/packaging/electron-builder.yml`).

Asset loading rules

- Dev: `BrowserWindow` loads `SYNAPSE_ELECTRON_DEV_URL` or `VITE_DEV_SERVER_URL` when `!app.isPackaged`.
- Prod: always loads `file://${PROJECT_ROOT}/dist/index.html` (constructed with `pathToFileURL(...)`). Override base directory with `SYNAPSE_ELECTRON_DIST_DIR` if needed.

Target platforms (maintainer decisions)

- macOS (arm64 and x64), Windows (x64), Linux (x64). We start with Windows while keeping macOS and Linux configured.

Packaging strategy

- Tooling: `electron-builder` with `electron/packaging/electron-builder.yml`.
- Targets configured for macOS (arm64/x64), Windows (x64), Linux (x64). Start with Windows builds.

Repository layout and typing

- Desktop sources live under `electron/`:
  - `electron/main.ts` — main process entry (compiled to `electron/dist/main.js`)
  - `electron/preload.ts` — preload script exposing `window.SynapseFS` (compiled to `electron/dist/preload.js`)
  - `electron/packaging/*` — electron-builder config and resources
- Dedicated TS config: `tsconfig.electron.json` (includes Node/Electron types). Electron sources are not referenced by the app’s tsconfigs, so the web typecheck remains unchanged.
- Renderer globals: `src/types/preload.d.ts` declares `readonly window.SynapseFS` with a `Readonly<...>` API surface matching the frozen runtime object.

Security hardening TODOs for later passes

- Consider a stricter CSP for the packaged app.
- Consider permission prompts and sandboxing strategy for future native integrations.

Update strategy (what is committed vs generated)

- Committed:
  - `electron/*` sources and placeholder packaging config
  - `docs/electron/*`
  - `src/types/preload.d.ts`
- Generated (not committed):
  - Packager outputs (e.g., `release/`, `out/`, `dist-electron/`, `make/`)
  - Temporary build artifacts

.gitignore additions

- See repo root `.gitignore` updates: ignore typical packager output directories (`/release/`, `/dist-electron/`, `/out/`, `/make/`).

Environment variables (desktop-only; optional)

- `SYNAPSE_ELECTRON_DEV_URL` — dev server URL (overrides `VITE_DEV_SERVER_URL`)
- `SYNAPSE_ELECTRON_DIST_DIR` — absolute or relative path to the built web assets directory (defaults to `dist/`)

Open Questions (maintainer decisions)

1. Packager: prefer `electron-builder` or `electron-forge` (or other)?
2. Targets for the initial release (OS/arch matrix).
3. Confirm the web build output directory (`dist/` is assumed from Vite defaults) and dev server URL.
4. Keep Electron files in `.js` or move to `.ts` with a new `tsconfig.electron.json`?
5. Initial file type filters and any size limits for `openFile(s)` and `readFile`.
