# Synapse Studio

A web-based video creation tool for content creators to stitch video clips, integrate animated code snippets, and apply animation presets.

## Tech Stack

- **React 19** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Remotion** for programmatic video generation
- **ESLint + Prettier** for code quality

## Project Structure

```
src/
├── components/     # React components
│   └── ui/        # Reusable UI components
├── hooks/         # Custom React hooks
├── lib/           # Utility functions and libraries
├── remotion/      # Remotion compositions and sequences
├── state/         # State management (Context API/Zustand)
└── assets/        # Static assets
```

## Development

```bash
# Install dependencies
npm install

# Start development server (frontend)
npm run dev

# Start backend API (Express on http://localhost:8787)
npm run server

# Build for production (frontend)
npm run build

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Type checking
npm run type-check
```

### Backend API quickstart
- Dev server: http://localhost:8787
- Health: GET /api/health
- Auth: POST /api/auth/signup, /api/auth/login, /api/auth/logout, GET /api/auth/session
- Licensing: POST /api/license/activate, GET /api/license/status
- Rendering: POST /api/render (start job), GET /api/render/:id/status, GET /api/render/:id/download
- AI Repo generator: POST /api/ai/generate-from-repo { repoUrl, branch? }
- Contact: POST /api/contact { name, email, message }

Environment (optional for dev)
- JWT_SECRET, CORS_ORIGIN (defaults include http://localhost:5173)
- SMTP_* and EMAIL_* to enable outbound emails; otherwise server logs contact messages.

### New Project from Repo (AI-assisted)
- In Projects (Dashboard), click “New from Repo”. Enter a public Git repository URL and optional branch.
- We clone shallowly (depth 1), scan for representative files (code/docs), and propose a short timeline (titles and code segments) you can fully edit afterward.
- Toggle “Open Studio after generation” if you want to immediately edit the new project.

### Staging deployment (server)
A Docker Compose setup is included for staging the backend API.

- Files (in the repository root on the server branch):
  - Dockerfile
  - docker-compose.staging.yml
  - .env.staging.example
  - docs/server/STAGING.md

Quick start (PowerShell)
```powershell
# In repo root (staging host)
# Copy env template and fill values
cp .env.staging.example .env.staging

# Bring up API on :8787
docker compose -f docker-compose.staging.yml --env-file .env.staging up -d --build

# Health check
Invoke-RestMethod http://localhost:8787/api/health
```

Notes
- Rendered artifacts are persisted in a named volume mounted at /app/server/output.
- Configure CORS_ORIGIN in .env.staging to the frontend origin (e.g., http://localhost:5173 or your staging host).
- SMTP variables are optional; without them, the server logs contact payloads and returns success.

## Desktop (Electron)

Electron support lets you run Synapse as a desktop app with native filesystem access via a minimal, secure preload bridge. See the full outline/spec: [docs/electron/outline.md](docs/electron/outline.md).

Scripts:

- `desktop:dev` — Launches Electron pointing at the Vite dev server. Cross‑platform via `cross-env` with default `http://localhost:5173`.
- `desktop:start` — Launches Electron loading the built web bundle from `dist/`.
- `desktop:build` — Packages the app using electron-builder with the config at `electron/packaging/electron-builder.yml` (builds for your current OS).

Security posture:

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`.
- Only a frozen, namespaced API is exposed to the renderer: `window.SynapseFS`.
- External links open in the system browser, and in‑window navigations to http/https are blocked.
- Remote dev URLs are used only in development (`!app.isPackaged`); packaged apps load local files.

License & updates (desktop only):

- Configure endpoints via environment variables. See [docs/electron/licenses-and-updates.md](docs/electron/licenses-and-updates.md).
- The app shows a license entry modal on first launch. Updates are checked at startup and via Help → Check for Updates…

## Requirements

This project addresses the following key requirements:

- Web-based video project management
- Timeline-based video editing interface
- Media asset management with drag-and-drop
- Real-time video preview with Remotion
- Animated code snippet integration
- Animation presets and effects
- Responsive design and performance optimization

### Backgrounds & Themes

See docs/BACKGROUNDS.md for details on code themes, wallpapers (including subtle animated GIFs), and the Reduce Motion toggle.

## Production launch documentation

The following docs describe how to take the app live (hosting, auth, CI/CD) and how we’ll collect feedback from first clients:

- [docs/production/overview.md](docs/production/overview.md) — High‑level launch plan and environment inventory
- [docs/production/hosting.md](docs/production/hosting.md) — Hosting options and configuration checklists
- [docs/production/auth.md](docs/production/auth.md) — Authentication options and required configuration
- [docs/ci-cd/overview.md](docs/ci-cd/overview.md) — CI/CD stages, triggers, and promotion model
- [docs/feedback/continuous-feedback.md](docs/feedback/continuous-feedback.md) — Feedback intake, triage, and close‑the‑loop
- [docs/owner-actions-and-gaps.md](docs/owner-actions-and-gaps.md) — Owner checklist and open questions
