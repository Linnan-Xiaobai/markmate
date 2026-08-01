import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import path from 'node:path';

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@markmate/logger': path.resolve(__dirname, '../../packages/logger/src/index.ts'),
    },
  },
  plugins: [
    react(),
    electron([
      {
        entry: 'electron/main.ts',
        onstart(options) {
          options.startup();
        },
        vite: {
          resolve: {
            alias: {
              '@markmate/logger/node': path.resolve(__dirname, '../../packages/logger/src/node.ts'),
              '@markmate/logger': path.resolve(__dirname, '../../packages/logger/src/index.ts'),
            },
          },
          build: {
            outDir: 'dist-electron',
            sourcemap: true,
            minify: false,
          },
        },
      },
      {
        entry: 'electron/preload.ts',
        onstart(options) {
          options.reload();
        },
        vite: {
          resolve: {
            alias: {
              '@markmate/logger/node': path.resolve(__dirname, '../../packages/logger/src/node.ts'),
              '@markmate/logger': path.resolve(__dirname, '../../packages/logger/src/index.ts'),
            },
          },
          build: {
            outDir: 'dist-electron',
            sourcemap: true,
            minify: false,
          },
        },
      },
    ]),
    renderer(),
  ],
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    minify: 'esbuild',
    target: 'chrome114',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'codemirror-core': [
            '@codemirror/state',
            '@codemirror/view',
            '@codemirror/commands',
            '@codemirror/language',
          ],
          'codemirror-md': [
            '@codemirror/lang-markdown',
            '@codemirror/theme-one-dark',
          ],
          'markdown-render': ['marked', 'dompurify'],
          'zustand': ['zustand'],
        },
      },
    },
  },
});
