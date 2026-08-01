import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'MarkMateCore',
      formats: ['es'],
      fileName: 'index',
    },
    sourcemap: true,
    rollupOptions: {
      external: [
        '@markmate/logger',
        'unified',
        'remark-parse',
        'remark-stringify',
        'remark-gfm',
        'remark-math',
        'remark-rehype',
        'rehype-katex',
        'rehype-stringify',
        'rehype-sanitize',
        'rehype-raw',
        'dompurify',
        'mdast-util-to-string',
        'github-slugger',
        'flexsearch',
        'nanoid',
      ],
    },
  },
  plugins: [
    dts({
      outDir: 'dist',
      include: ['src'],
    }),
  ],
});
