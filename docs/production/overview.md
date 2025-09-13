# Production overview

Scope: initial production launch for a low‑traffic application using managed hosting. This document describes what must exist and be configured to bring Synapse live in a minimal-yet-safe way, without prescribing provider-specific commands.

## Components in this repository

- Webapp (single-page application)
  - Path: `src/` (+ Vite config at `vite.config.ts`)
  - Entrypoints:
    - HTML: `index.html`
    - App bootstrap: `src/main.tsx` (mounts `<App />`)
  - Build output directory: `dist/`

- Server/API (Express)
  - Path: `server/`
  - Runtime entry: `server/index.mjs`
  - Router index: `server/routes.mjs` (mounts per‑feature routers under `/api`)
  - Containerization: `Dockerfile` (runs `node server/index.mjs`)
  - Staging compose (optional): `docker-compose.staging.yml`

> Out of scope: Desktop (Electron) code under `electron/` and related environment variables; this launch focuses on web + API.

## Required environment variables and secrets

Do not commit secrets. Supply values via provider dashboards or GitHub environment secrets.

### Webapp (Vite)

- `VITE_ALLOW_WEB_NO_LICENSE` (string: 'true'|'false')
  - Purpose: Allows the browser build to operate without the Electron license bridge. For public web production, set to 'true' only if you explicitly want to disable license enforcement in the web build. Defaults to dev‑only allowance.
  - Example: `false` for production if licensing is required; `true` for an open beta.

### Server/API (Express)

- Core
  - `NODE_ENV` — should be `production` in production environments.
  - `PORT` — HTTP port the process listens on. Default: `8787`.
  - `JWT_SECRET` — REQUIRED. Secret used to sign/verify auth tokens.
  - `CORS_ORIGIN` — Comma‑separated list of allowed origins for browser calls (e.g., `https://app.example.com,https://staging.example.com`).

- Email (optional; enables `/api/email` contact flow)
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` ('true'|'false'), `SMTP_USER`, `SMTP_PASS` — SMTP transport for outbound mail.
  - `EMAIL_FROM`, `EMAIL_TO` — From and destination addresses for contact messages.

- Rendering (Remotion)
  - `REMOTION_COMPOSITION_ID` — Composition id to render. Default: `MainComposition`.
  - `REMOTION_ENTRY` — Absolute path to Remotion root entry (defaults inside the repo).
  - `RENDER_CONCURRENCY` — Number of parallel render jobs (recommend `1` for low‑traffic MVP).
  - `RENDER_OUTPUT_DIR` — Filesystem directory where rendered files are saved. Must be writable and persisted if you want downloads to survive restarts.

### If choosing Firebase Authentication (optional alternative)

Client (webapp):

- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID` — standard Firebase web config values.

Server (token verification):

- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` — used by Firebase Admin SDK to verify ID tokens.

> These Firebase variables are listed for planning. No Firebase SDK is wired in yet; see `docs/production/auth.md` for options and required decisions.

## High‑level production architecture and data flows

```
[Browser SPA]
    |
    | 1. Load static assets (HTML/CSS/JS) from Web hosting (CDN)
    v
[Web hosting/CDN]
    |
    | 2. XHR/Fetch to /api/* (credentials: include)
    v
[API (Express)]  -- 3a. Optional email via SMTP --> [Mail provider]
    |
    | 3b. Render jobs (Remotion) write files to output dir
    v
[Local/attached storage]  -- exposed at -->  GET /downloads/:file
```

Key flows:

- Auth: Browser POSTs to API auth endpoints; API replies and (in current code) sets a `token` cookie. For cross‑origin deployments, secure/sameSite cookie attributes and/or bearer tokens must be decided. See `docs/production/auth.md`.
- CORS: API allows only origins listed in `CORS_ORIGIN`.
- Rendering: Jobs are queued in‑process and write to `RENDER_OUTPUT_DIR`; downloads are served from `/downloads/*`.

## Assumptions and constraints

- Low traffic and minimal persistence. The API uses local JSON files for some entities and in‑memory state for others. There is no production database yet.
- Render outputs are on local/container storage. If the process restarts or the container is re‑scheduled, files may be lost. For a beta, this may be acceptable; otherwise plan object storage (e.g., GCS/S3) later.
- Authentication is basic username/password with JWT cookies today; swapping to Firebase Auth is an option but requires app and server changes.
- The Remotion renderer may require system dependencies not present in slim containers; provider images and regions must be chosen accordingly. See hosting doc for notes.
