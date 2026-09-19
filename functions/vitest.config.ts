import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'functions',
    environment: 'node',
    globals: true,
    include: ['test/**/*.test.ts', 'src/**/*.test.ts'],
    // Rules tests need the emulator; the root config runs them as their own project.
    exclude: [...configDefaults.exclude, 'test/rules/**'],
  },
});
