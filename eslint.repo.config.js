import nxEslintPlugin from '@nx/eslint-plugin';
import { createBaseTypeScriptConfig } from './infra/config/eslint/eslint-shared.js';

const nxDepConstraints = [
  {
    sourceTag: 'type:app',
    onlyDependOnLibsWithTags: ['layer:foundation', 'layer:context'],
  },
  {
    sourceTag: 'layer:context',
    onlyDependOnLibsWithTags: ['layer:foundation'],
  },
  {
    sourceTag: 'layer:foundation',
    onlyDependOnLibsWithTags: ['layer:foundation'],
  },
];

const repoIgnores = ['**/_typia/**', '**/dist/**', '**/graphqlSmartEnums.ts'];

/**
 * Test-only file globs. Kept in sync: main config ignores these; `eslint.test.config.js` lints them.
 * Include `src/tests` paths so helpers like `testViewerIds.ts` are test-linted without `*.tests.*` in the name.
 *
 * Playwright e2e tests use `*.spec.ts` but have no `eslint.test.config.js`; un-ignore them here so
 * `@typescript-eslint/no-floating-promises` catches un-awaited `expect(...)` matchers.
 */
export const testFileIgnorePatterns = [
  '**/*.tests.ts',
  '**/*.tests.tsx',
  '**/*.test.ts',
  '**/*.test.tsx',
  '**/*.spec.ts',
  '**/*.spec.tsx',
  '**/src/tests/**',
  '!packages/e2e/**/*.spec.ts',
  '!packages/e2e/**/*.spec.tsx',
];

export const testFileLintPatterns = [
  '**/*.tests.ts',
  '**/*.tests.tsx',
  '**/*.test.ts',
  '**/*.test.tsx',
  '**/*.spec.ts',
  '**/*.spec.tsx',
  '**/src/tests/**/*.ts',
  '**/src/tests/**/*.tsx',
];

/**
 * Monorepo ESLint layer: infra base rules + Nx module boundaries + shared ignores.
 * Import from apps/packages via `eslint.repo.config.js` (not `eslint.config.js`) so the root
 * default export is not evaluated.
 */
const nxModuleBoundaryBlock = {
  files: ['**/*.{ts,tsx,js,mjs,cjs}'],
  plugins: {
    '@nx': nxEslintPlugin,
  },
  rules: {
    '@nx/enforce-module-boundaries': [
      'error',
      {
        depConstraints: nxDepConstraints,
      },
    ],
  },
};

/** ESLint entrypoints must use relative paths to the repo root; Nx would otherwise flag those imports. */
const nxModuleBoundaryOffForEslintConfigFiles = {
  files: [
    '**/eslint.config.js',
    '**/eslint.test.config.js',
    '**/eslint.config.mjs',
    '**/eslint.config.cjs',
    '**/eslint.repo.config.js',
  ],
  rules: {
    '@nx/enforce-module-boundaries': 'off',
  },
};

export const createRepoEslintConfig = async (options = {}) => {
  const { ignores: extraIgnores = [], lintTestsInMain = false, ...rest } = options;
  const testIgnores = lintTestsInMain ? [] : testFileIgnorePatterns;
  return [
    nxModuleBoundaryBlock,
    nxModuleBoundaryOffForEslintConfigFiles,
    ...(await createBaseTypeScriptConfig({
      tsconfigRootDir: import.meta.dirname,
      ignores: [...repoIgnores, ...testIgnores, ...extraIgnores],
      ...rest,
    })),
  ];
};

/**
 * ESLint config for test files only (use via `eslint.test.config.js` per project).
 * Run with `--quiet` so only errors are reported (warnings hidden).
 */
export const createRepoTestEslintConfig = async (options = {}) => {
  const {
    ignores: extraIgnores = [],
    files = testFileLintPatterns,
    typeAwareProject,
    additionalRules = {},
    ...rest
  } = options;

  const parserOptionsOverride =
    typeAwareProject !== undefined
      ? { project: [typeAwareProject], projectService: false }
      : undefined;

  return [
    nxModuleBoundaryBlock,
    nxModuleBoundaryOffForEslintConfigFiles,
    ...(await createBaseTypeScriptConfig({
      tsconfigRootDir: import.meta.dirname,
      ignores: [...repoIgnores, ...extraIgnores],
      files,
      parserOptionsOverride,
      additionalRules: {
        '@typescript-eslint/no-unused-vars': [
          'error',
          { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
        ],
        ...additionalRules,
      },
      ...rest,
    })),
    {
      files: testFileLintPatterns,
      rules: {
        '@nx/enforce-module-boundaries': 'off',
      },
    },
  ];
};
