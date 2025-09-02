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

# Start development server
npm run dev

# Build for production
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
