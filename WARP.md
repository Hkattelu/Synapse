# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Repository: Synapse Studio (React + Vite + TypeScript + Tailwind + Vitest) with optional Electron desktop shell.

Common commands (PowerShell-friendly)
- Install deps: npm install
- Dev server (web): npm run dev
- Build (web): npm run build
- Preview production build: npm run preview
- Lint: npm run lint
- Lint (fix): npm run lint:fix
- Format (check): npm run format:check
- Format (write): npm run format
- Type-check: npm run type-check
- Tests (all, headless): npm run test
- Tests (watch): npm run test:watch
- Tests (UI): npm run test:ui
- Run a single test file: npm run test -- src/<relative-path>/some.test.tsx
- Run tests matching a name: npm run test -- -t 'your test name here'
- Desktop (Electron) — dev (points to Vite dev server): npm run desktop:dev
- Desktop (Electron) — start (load built web bundle): npm run desktop:start
- Desktop (Electron) — package for current OS: npm run desktop:build
- Generate launch OG image assets: npm run generate:launch-og

Notes for Windows PowerShell
- You can override the Electron dev URL if needed: $env:SYNAPSE_ELECTRON_DEV_URL = 'http://localhost:5173'; npm run desktop:dev

High-level architecture
- Frontend (src/)
  - components/ and components/ui/: React presentation layer and reusable UI.
  - state/: App state via React Context + Zustand (e.g., projectStore, reducers, persistence). Central place for timelines, projects, notifications.
  - lib/: Core domain logic and utilities. Highlights:
    - exportManager(.ts)/exportManagerClient(.ts): export pipeline and client coordination.
    - backgrounds/, themes/, validation/: configuration, schema/validation, theme definitions, and background assets management.
    - api.ts, format.ts, keyframes.ts, utils.ts: cross-cutting helpers.
  - remotion/: Programmatic video compositions and sequences using Remotion (@remotion/*). Contains compositions (MainComposition, TitleSequence, VideoSequence, CodeSequence), helpers, and preset animations.
  - hooks/: Custom React hooks including keyboard shortcuts and state accessors.
  - test/: TestProviders and setup.ts for test environment wiring.
- Build and tooling
  - Vite (vite.config.ts):
    - Plugins: @vitejs/plugin-react, vite-plugin-prismjs (syntax highlighting).
    - Alias: '@' -> '/src'.
    - assetsInclude: ['**/*.node'] when needed.
    - Define: global -> globalThis to satisfy packages expecting Node globals.
    - Rollup external: excludes Node built-ins from the browser bundle.
    - Dev proxy: '/api' -> http://localhost:8787 (run any backend separately if used).
  - TypeScript: Project references (tsconfig.json) and separate Electron TS project (tsconfig.electron.json).
  - ESLint flat config (eslint.config.js): Recommended JS/TS + react-hooks rules, Prettier enforced as errors, React Refresh rule.
  - Tailwind + PostCSS: Tailwind configured with CSS-variable-driven design tokens; PostCSS loads @tailwindcss/postcss and autoprefixer.
  - Testing: Vitest with jsdom and Testing Library. Test configuration lives under vite.config.ts -> test, with setupFiles at src/test/setup.ts.
- Electron desktop shell (optional)
  - Overview: Electron wraps the existing web UI for desktop capabilities (filesystem dialogs, local file read/write) while keeping renderer sandboxed.
  - Main process (electron/main.ts): App lifecycle, BrowserWindow, IPC handlers.
  - Preload (electron/preload.ts): contextBridge.exposeInMainWorld('SynapseFS', ...); frozen API; IPC invoke to main.
  - Renderer: The same Vite/React app without Node integration; only accesses native features via window.SynapseFS.
  - Security posture: contextIsolation=true, nodeIntegration=false, sandbox=true; deny in-window http/https navigation; open external links in system browser.
  - Packaging: electron-builder (electron/packaging/electron-builder.yml) packages compiled Electron outputs (electron/dist) and web build (dist) into release/.
  - Dev and overrides: npm run desktop:dev uses Vite dev server (defaults to http://localhost:5173). Optional env vars: SYNAPSE_ELECTRON_DEV_URL and SYNAPSE_ELECTRON_DIST_DIR.

What to know from README and docs
- Tech stack highlights: React 19, Vite, Tailwind CSS, Remotion, ESLint + Prettier.
- Electron outline in docs/electron/outline.md documents the hardened security model, IPC allow-list, and filesystem API surface exposed as window.SynapseFS.

Conventions and tips specific to this repo
- Use the Vitest arguments passthrough after -- to target single files or test names.
- Keep to the alias import style (import ... from '@/lib/...').
- If working on Electron, build the electron TS once before launching: npm run electron:build (npx cross-env is used automatically by desktop:dev).
- The dev server proxies /api to http://localhost:8787. If an API is needed, run it separately on that port or adjust the Vite proxy in vite.config.ts.

