import { defineConfig } from 'vitest/config';

// Each workspace/package defines its own vitest config; the root just runs them all.
export default defineConfig({
  test: {
    projects: ['web', 'shared', 'functions'],
  },
});
