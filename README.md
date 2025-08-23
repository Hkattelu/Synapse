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

Initial Electron scaffolding is included to run Synapse as a desktop app with native filesystem access via a secure preload bridge. See the full outline/spec here: [docs/electron/outline.md](docs/electron/outline.md).

Available scripts:

- `desktop:dev` — Launches Electron pointing at the Vite dev server (expects it to be running at `http://localhost:5173`).
- `desktop:start` — Launches Electron loading the built web bundle from `dist/`.
- `desktop:build` — Placeholder; exits with guidance until a packager (electron-builder/forge) is selected.

## Requirements

This project addresses the following key requirements:

- Web-based video project management
- Timeline-based video editing interface
- Media asset management with drag-and-drop
- Real-time video preview with Remotion
- Animated code snippet integration
- Animation presets and effects
- Responsive design and performance optimization
