import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// React Compiler-derived rules from eslint-plugin-react-hooks v7. They are kept
// as warnings until the codebase is verified compiler-safe (see docs/REFACTOR_PLAN.md).
const compilerRulesAsWarnings = Object.fromEntries(
  [
    'static-components',
    'use-memo',
    'void-use-memo',
    'preserve-manual-memoization',
    'immutability',
    'globals',
    'refs',
    'set-state-in-effect',
    'error-boundaries',
    'purity',
    'set-state-in-render',
    'config',
    'gating',
  ].map((rule) => [`react-hooks/${rule}`, 'warn']),
);

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/',
      'web/dist/',
      'functions/lib/',
      'coverage/',
      '.firebase/',
      'cherrytree-cofounder-agreement-v1/',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    rules: {
      // Downgraded to warnings during the TS migration; flipped back to errors in the
      // structural-cleanup phase once the existing offenders are removed.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      'no-case-declarations': 'warn',
    },
  },

  // Browser app
  {
    files: ['web/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...compilerRulesAsWarnings,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },

  // Cloud Functions (Node)
  {
    files: ['functions/**/*.{js,ts}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: globals.node,
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  // Tests (Vitest globals)
  {
    files: ['**/*.test.{js,jsx,ts,tsx}', 'web/src/test/**'],
    languageOptions: { globals: { ...globals.vitest } },
  },

  // Config files at the repo root / package roots
  {
    files: ['*.{js,ts,mjs}', 'web/*.{js,ts}', 'shared/*.ts', 'functions/*.{js,mjs,ts}'],
    languageOptions: { globals: globals.node },
  },

  prettier,
);
