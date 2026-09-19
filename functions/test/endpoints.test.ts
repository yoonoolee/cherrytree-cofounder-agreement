/**
 * Deployment-contract tests for the functions bundle.
 *
 * 1. The export set and every function's `__endpoint` manifest (memory, region, secrets,
 *    service account, trigger type) must equal `endpoints.golden.json`. The golden is the
 *    Phase 0 baseline minus `deleteAccount`; a commit that intentionally changes a contract
 *    (e.g. drops a secret a function no longer reads) updates the golden in the same commit.
 * 2. `invoker`, `enforceAppCheck` and `consumeAppCheckToken` are not part of the manifest in
 *    firebase-functions 6.x, so they are guarded at the source level instead: every `onCall`
 *    and `onRequest` in `src/` must spread the shared options from `config.ts`.
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

import { CALLABLE_OPTIONS, WEBHOOK_OPTIONS } from '../src/config.ts';

const functionsDir = path.resolve(import.meta.dirname, '..');
const srcDir = path.join(functionsDir, 'src');

type Endpoint = Record<string, unknown> & {
  secretEnvironmentVariables?: { key: string }[];
};
type Golden = Record<string, { __endpoint: Endpoint }>;

const golden: Golden = JSON.parse(
  readFileSync(path.join(import.meta.dirname, 'endpoints.golden.json'), 'utf8'),
);

/** JSON round-trip (unset options are `ResetValue` objects that serialize to `null`), secrets sorted. */
function normalize(endpoint: Endpoint): Endpoint {
  const plain: Endpoint = JSON.parse(JSON.stringify(endpoint));
  return {
    ...plain,
    secretEnvironmentVariables: [...(plain.secretEnvironmentVariables ?? [])].sort((a, b) =>
      a.key.localeCompare(b.key),
    ),
  };
}

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const file = path.join(dir, name);
    if (statSync(file).isDirectory()) return listSourceFiles(file);
    return file.endsWith('.ts') && !file.endsWith('.test.ts') ? [file] : [];
  });
}

describe('functions bundle', () => {
  let bundle: Record<string, { __endpoint?: Endpoint }>;

  beforeAll(() => {
    // The bundle is what the emulator and `firebase deploy` load; build it fresh so the
    // test never reads a stale lib/index.js. The service-account email embeds the project id.
    execFileSync('node', ['esbuild.config.mjs'], { cwd: functionsDir, stdio: 'pipe' });
    process.env.GCLOUD_PROJECT = 'test-project';
    bundle = createRequire(import.meta.url)(path.join(functionsDir, 'lib/index.js'));
  });

  it('exports exactly the functions in the golden', () => {
    expect(Object.keys(bundle).sort()).toEqual(Object.keys(golden).sort());
  });

  it.each(Object.keys(golden))('%s has the golden __endpoint', (name) => {
    const endpoint = bundle[name]?.__endpoint;
    expect(endpoint).toBeDefined();
    expect(normalize(endpoint!)).toEqual(normalize(golden[name]!.__endpoint));
  });
});

describe('shared trigger options', () => {
  it('CALLABLE_OPTIONS are public, App Check-enforced and replay-protected', () => {
    expect(CALLABLE_OPTIONS).toMatchObject({
      invoker: 'public',
      enforceAppCheck: true,
      consumeAppCheckToken: true,
    });
  });

  it('WEBHOOK_OPTIONS disable CORS', () => {
    expect(WEBHOOK_OPTIONS).toMatchObject({ cors: false });
  });

  it('every onCall / onRequest in src/ spreads the shared options first', () => {
    const offenders: string[] = [];
    for (const file of listSourceFiles(srcDir)) {
      const source = readFileSync(file, 'utf8');
      const relative = path.relative(functionsDir, file);
      for (const match of source.matchAll(/\bonCall\(\s*\{\s*([^\s,}]*)/g)) {
        if (match[1] !== '...CALLABLE_OPTIONS') offenders.push(`${relative}: onCall`);
      }
      for (const match of source.matchAll(/\bonRequest\(\s*\{\s*([^\s,}]*)/g)) {
        if (match[1] !== '...WEBHOOK_OPTIONS') offenders.push(`${relative}: onRequest`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
