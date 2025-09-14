import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import prismjsPlugin from 'vite-plugin-prismjs';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';
  const prismLanguages = isDev
    ? [
        'javascript',
        'typescript',
        'jsx',
        'tsx',
        'css',
        'json',
        'markdown',
      ]
    : [
        'javascript',
        'typescript',
        'jsx',
        'tsx',
        'css',
        'html',
        'json',
        'markdown',
        'bash',
        'python',
        'java',
        'go',
        'rust',
        'sql',
        'xml',
        'yaml',
        'glsl',
        'gdscript',
      ];

  return {
    plugins: [
      react(),
      prismjsPlugin({
        languages: prismLanguages,
        plugins: ['line-numbers', 'show-language', 'copy-to-clipboard'],
        theme: 'tomorrow',
        css: true,
      }),
    ],
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:8787',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    optimizeDeps: {
      // Keep only the essentials in dev to avoid massive prebundles on Windows
      include: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-router-dom',
        'framer-motion',
        'lucide-react',
        'zustand',
        'zundo',
        'prismjs',
      ],
      // Exclude super heavy or server-side packages from pre-bundle in dev
      exclude: ['remotion', '@remotion/player', '@remotion/bundler', '@remotion/renderer', '@remotion/cli'],
    },
    build: {
      rollupOptions: {
        external: [
          // Node.js built-ins (not used in browser)
          'fs',
          'path',
          'os',
          'child_process',
          'worker_threads',
          'crypto',
          'http',
          'https',
          'url',
          'stream',
          'buffer',
          'util',
          'zlib',
          'tty',
          'net',
        ],
      },
    },
    define: {
      global: 'globalThis',
    },
    resolve: {
      alias: {
        '@': '/src',
        // Some dependencies (or SWC output) may reference the CJS shim explicitly.
        // Alias it to the ESM-friendly entry so Vite can optimize and provide named exports.
        'react/jsx-runtime.js': 'react/jsx-runtime',
        'react/jsx-dev-runtime.js': 'react/jsx-dev-runtime',
      },
    },
    assetsInclude: ['**/*.node'],
  };
});
