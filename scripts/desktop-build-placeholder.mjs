// Placeholder desktop packaging script
// Intentionally exits with guidance until a packager is chosen.

const message = `\nSynapse desktop packaging is not configured yet.\n\nNext steps:\n  1. Choose a packager: electron-builder or electron-forge.\n  2. Install devDependencies and wire the build script.\n  3. Replace electron/packaging/electron-builder.yml with a finalized config (or remove it if using Forge).\n\nSee docs/electron/outline.md (Packaging strategy & Open Questions).\n`;

console.error(message);
process.exit(1);
