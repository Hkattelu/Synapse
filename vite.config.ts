import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import prismjsPlugin from 'vite-plugin-prismjs';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    prismjsPlugin({
      languages: [
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
      ],
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
    // Prebundle frequently used, heavy deps for faster cold starts in dev
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      'lucide-react',
      'zustand',
      'zundo',
      'prismjs',
      'remotion',
      '@remotion/player'
    ],
    // Avoid trying to prebundle Node/Electron-side packages
    exclude: ['@remotion/bundler', '@remotion/renderer', '@remotion/cli'],
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
    },
  },
  assetsInclude: ['**/*.node'],
});
