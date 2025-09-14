import { defineConfig } from 'vitest/config';
import { mergeConfig } from 'vite';
import viteConfig from './vite.config';

// Vitest configuration: merge with app Vite config, supporting function export
export default defineConfig((env) => {
  const base = typeof viteConfig === 'function' ? viteConfig(env) : (viteConfig as any);
  return mergeConfig(base, {
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
exclude: ['**/.worktrees/**', 'node_modules/**/?(*.)+(spec|test).[tj]s?(x)'],
    },
  });
});
