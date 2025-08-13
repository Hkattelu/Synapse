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

## Requirements

This project addresses the following key requirements:
- Web-based video project management
- Timeline-based video editing interface
- Media asset management with drag-and-drop
- Real-time video preview with Remotion
- Animated code snippet integration
- Animation presets and effects
- Responsive design and performance optimization