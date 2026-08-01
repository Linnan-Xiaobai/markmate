const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const outDir = path.resolve(__dirname, 'dist-electron');

// Monorepo workspace 包别名，直接指向源码以便打包进 CJS 产物
const workspaceAlias = {
  '@markmate/logger/node': path.resolve(__dirname, '../../packages/logger/src/node.ts'),
  '@markmate/logger': path.resolve(__dirname, '../../packages/logger/src/index.ts'),
};

// Ensure output directory exists
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

console.log('[build-electron] Building main.ts to CJS...');
esbuild.buildSync({
  entryPoints: [path.resolve(__dirname, 'electron/main.ts')],
  bundle: true,
  outfile: path.join(outDir, 'main.js'),
  format: 'cjs',
  platform: 'node',
  target: 'node18',
  external: ['electron'],
  alias: workspaceAlias,
  minify: true,
});

console.log('[build-electron] Building preload.ts to CJS...');
esbuild.buildSync({
  entryPoints: [path.resolve(__dirname, 'electron/preload.ts')],
  bundle: true,
  outfile: path.join(outDir, 'preload.js'),
  format: 'cjs',
  platform: 'node',
  target: 'node18',
  external: ['electron'],
  minify: true,
});

// Write package.json to force CommonJS resolution
fs.writeFileSync(
  path.join(outDir, 'package.json'),
  JSON.stringify({ type: 'commonjs', main: 'main.js' }, null, 2)
);

console.log('[build-electron] Done! Output:');
console.log('  - dist-electron/main.js');
console.log('  - dist-electron/preload.js');
console.log('  - dist-electron/package.json');
