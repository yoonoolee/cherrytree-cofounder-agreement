import { defineConfig } from 'vitest/config';

// Firestore rules tests need the emulator, which `firebase emulators:exec` advertises through
// FIRESTORE_EMULATOR_HOST; the project only exists while that is set (npm run test:rules).
const rulesProject = process.env.FIRESTORE_EMULATOR_HOST
  ? [
      {
        test: {
          name: 'rules',
          environment: 'node',
          globals: true,
          include: ['functions/test/rules/**/*.test.ts'],
          fileParallelism: false,
        },
      },
    ]
  : [];

// Each workspace/package defines its own vitest config; the root just runs them all.
export default defineConfig({
  test: {
    projects: ['web', 'shared', 'functions', ...rulesProject],
  },
});
