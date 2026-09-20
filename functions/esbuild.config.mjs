import { build } from 'esbuild';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { dependencies } = require('./package.json');

// Bundles src/index.ts (and everything it reaches, including @cherrytree/shared) into a
// single CommonJS file. Runtime dependencies stay external: Firebase installs them from
// package.json at deploy time.
await build({
  absWorkingDir: import.meta.dirname,
  entryPoints: ['src/index.ts'],
  outfile: 'lib/index.js',
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'cjs',
  external: Object.keys(dependencies),
  alias: { '@cherrytree/shared': '../shared/src/index.ts' },
  logLevel: 'info',
});
