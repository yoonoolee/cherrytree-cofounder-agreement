import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'functions',
    environment: 'node',
    globals: true,
    include: ['test/**/*.test.ts', 'src/**/*.test.ts'],
  },
});
