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

- Main process (electron/main.js)
  - Owns the app lifecycle and `BrowserWindow`.
  - Loads the renderer from either the Vite dev server (dev) or the built web assets (prod).
  - Implements IPC handlers for the filesystem surface (see below).
- Preload (electron/preload.js)
  - Runs in an isolated, privileged context.
  - Uses `contextBridge.exposeInMainWorld` to publish a small, namespaced API: `window.SynapseFS`.
  - Calls `ipcRenderer.invoke` to reach main-process handlers; no Node globals are exposed to the page.
- Renderer
  - The existing Vite/React app. No Node integration; it can only access native capabilities via `window.SynapseFS`.

Security model

- `contextIsolation: true` and `nodeIntegration: false`.
- `sandbox: true` for renderer processes.
- Preload is the only bridge; keep it minimal and namespaced: `window.SynapseFS`.
- IPC channel allow-list: restrict to the channels enumerated below.
- Do not use the deprecated `remote` module.
- External content handling:
  - `setWindowOpenHandler` denies new windows and opens `http/https` links in the system browser.
  - `will-navigate` blocks in-window navigations to `http/https` and opens them externally. This prevents untrusted pages from gaining access to the preload API within the current window.
- Content Security Policy (CSP): keep current web CSP; tighten in a packaging pass if needed.

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

- File dialogs apply initial default filters when none are provided by the renderer:
  - Video: `.mp4`
  - Audio: `.mp3`
  - Code: `.ts`
    These defaults apply to `openFile`, `openFiles`, and `showSaveDialog`. The renderer's `options.filters` takes precedence if supplied. `openDirectory` is unaffected. More types can be added later.
- The renderer may pass standard Electron dialog options (filters, default paths) as the `options` argument.

Build workflows

Development

- Start the web app dev server (Vite) in one terminal: `npm run dev` (serves at `http://localhost:5173` by default).
- In another terminal, run the desktop shell pointing at the dev server:
  - `npm run desktop:dev` — launches Electron with `VITE_DEV_SERVER_URL`/`SYNAPSE_ELECTRON_DEV_URL`.
- Env knobs:
  - `SYNAPSE_ELECTRON_DEV_URL` — explicitly set the dev URL (overrides the default and Vite’s value).

Production / local packaging (first pass)

- Build the web assets: `npm run build` (outputs to `dist/` by default; see `vite.config.ts`).
- Start Electron against the built bundle for manual validation: `npm run desktop:start`.
- Packaging is intentionally not finalized in this PR. A placeholder config file is included under `electron/packaging/` and the `desktop:build` script currently exits with an instructional message. See Open Questions to select a packager.

Asset loading rules

- Development: When the app is not packaged (`!app.isPackaged`) and a dev URL is defined (`SYNAPSE_ELECTRON_DEV_URL` or `VITE_DEV_SERVER_URL`), the window loads that remote URL.
- Packaged builds: The app always loads local assets from `DIST_DIR` (defaults to `dist/`) using a safe file URL constructed via Node's `pathToFileURL`. Remote content is not allowed when packaged.

Target platforms (proposal)

- Initial focus: macOS (arm64, x64), Windows (x64), Linux (x64). Finalize in Open Questions.

Packaging strategy (pending maintainer choice)

- Options considered:
  - electron-builder (simple one-command packaging, rich target matrix).
  - electron-forge (batteries-included dev + make flows, good for long-term scaffolding).
- Placeholder file provided: `electron/packaging/electron-builder.yml` to show expected fields (appId, productName, files, directories, targets). Remove or replace once a tool is chosen.

Repository layout and typing

- Desktop sources live under `electron/`:
  - `electron/main.js` — main process entry
  - `electron/preload.js` — preload script exposing `window.SynapseFS`
  - `electron/packaging/*` — placeholder config(s)
- Renderer type declarations: `src/types/preload.d.ts` defines the global `window.SynapseFS` surface for TypeScript consumers.
- We’re using plain `.js` for Electron initially to keep the web typecheck untouched. If we switch to TypeScript for Electron in the future:
  - Add `tsconfig.electron.json` (Node/Electron libs; `moduleResolution: node` or `bundler`, `types: ['electron']`).
  - Exclude `electron/*` from the app’s `tsconfig.app.json` so the web typecheck remains fast.

Security hardening TODOs for later passes

- Add explicit dialog filters for supported file types, if desired.
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
