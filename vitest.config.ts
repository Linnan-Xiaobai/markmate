import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts'],
    include: [
      'packages/*/src/**/*.test.ts',
      'packages/*/src/**/*.test.tsx',
      'apps/desktop/src/**/*.test.ts',
      'apps/desktop/src/**/*.test.tsx',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['packages/*/src/**/*.ts', 'packages/*/src/**/*.tsx'],
      exclude: ['**/*.test.ts', '**/*.test.tsx', '**/*.d.ts', '**/index.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@markmate/logger/node': resolve(__dirname, 'packages/logger/src/node.ts'),
      '@markmate/logger': resolve(__dirname, 'packages/logger/src'),
      '@markmate/test-utils': resolve(__dirname, 'packages/test-utils/src'),
      '@markmate/core': resolve(__dirname, 'packages/core/src'),
      '@markmate/editor': resolve(__dirname, 'packages/editor/src'),
      '@markmate/renderer': resolve(__dirname, 'packages/renderer/src'),
      '@markmate/ui': resolve(__dirname, 'packages/ui/src'),
    },
  },
});
