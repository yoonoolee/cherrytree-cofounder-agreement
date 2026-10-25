import { build } from 'esbuild';

import packageJson from './package.json' with { type: 'json' };

// Bundles src/index.ts (and everything it reaches, including @cherrytree/shared) into a
// single CommonJS file. Runtime dependencies stay external: Firebase installs them from
// package.json at deploy time.
await build({
  absWorkingDir: import.meta.dirname,
  entryPoints: ['src/index.ts'],
  outfile: 'lib/index.cjs',
  bundle: true,
  platform: 'node',
  target: 'node24',
  format: 'cjs',
  external: Object.keys(packageJson.dependencies),
  alias: { '@cherrytree/shared': '../../packages/shared/src/index.ts' },
  logLevel: 'info',
});
