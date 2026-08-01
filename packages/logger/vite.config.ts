import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        node: resolve(__dirname, 'src/node.ts'),
      },
      formats: ['es'],
      fileName: (_format, name) => `${name}.js`,
    },
    sourcemap: true,
    rollupOptions: {
      external: ['node:fs', 'node:path', 'node:os'],
    },
  },
  plugins: [
    dts({
      outDir: 'dist',
      include: ['src'],
    }),
  ],
});
