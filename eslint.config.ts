import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// React Compiler-derived rules from eslint-plugin-react-hooks v7. They are kept
// as warnings until the codebase is verified compiler-safe.
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
  ].map((rule) => [`react-hooks/${rule}`, 'warn'] as const),
);

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/',
      'apps/web/dist/',
      'apps/functions/lib/',
      'coverage/',
      '.firebase/',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,

  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      // An async handler on a JSX attribute (onClick, onSubmit) is idiomatic React.
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
      // `_`-prefixed names are deliberately unused (destructuring rests, ignored args).
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },

  // Browser app
  {
    files: ['apps/web/src/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
    },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...compilerRulesAsWarnings,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },

  // Cloud Functions (Node; TypeScript source, bundled to CommonJS by esbuild)
  {
    files: ['apps/functions/**/*.ts'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
  },

  // Tests (Vitest globals). Mocks and fixtures are `any`-typed by design; React 19's `act`
  // returns a thenable even for a synchronous callback; `expr as T` is how a generic query
  // or a hoisted mock object gets its type; `expect(obj.method)` is the spy idiom. The
  // type-aware rules that would flag those stay off here.
  {
    files: ['**/*.test.{ts,tsx}', 'apps/web/src/test/**', 'apps/functions/test/**'],
    languageOptions: { globals: { ...globals.vitest } },
    rules: {
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },

  // Config files at the repo root / package roots
  {
    files: ['*.ts', 'apps/*/*.ts', 'packages/*/*.ts'],
    languageOptions: { globals: globals.node },
  },
  // …of which these belong to no tsconfig: syntax-only rules.
  {
    files: ['eslint.config.ts', 'vitest.config.ts'],
    ...tseslint.configs.disableTypeChecked,
  },

  prettier,
);
