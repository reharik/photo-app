import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import fs from 'node:fs';
import path from 'node:path';
import tseslint from 'typescript-eslint';
import { photoappPlugin } from './plugin-photoapp/index.js';

/**
 * Repo root, found by walking up from this file to the nearest directory holding
 * `nx.json` (the workspace root marker).
 *
 * Depth-independent ON PURPOSE. This used to be a bare `import.meta.dirname`,
 * which was the repo root only by accident of where the file happened to live;
 * the move from `infra/config/eslint/` to `tooling/eslint/` left it pointing a
 * level off. Every current call site passes `tsconfigRootDir` explicitly, so the
 * stale default was dead code rather than a live bug — this exists so call site
 * 21 does not inherit the trap.
 */
const findRepoRoot = (startDir) => {
  let dir = startDir;
  for (;;) {
    if (fs.existsSync(path.join(dir, 'nx.json'))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      // Hit the filesystem root without finding a marker; the caller's own
      // directory is a saner fallback than "/".
      return startDir;
    }
    dir = parent;
  }
};

const REPO_ROOT = findRepoRoot(import.meta.dirname);

// Common TypeScript rules that all projects share
export const commonTypeScriptRules = {
  '@typescript-eslint/no-misused-promises': [
    'error',
    {
      checksVoidReturn: false,
    },
  ],
  // Middle ground: Keep type safety but disable only the most problematic unsafe rules
  '@typescript-eslint/no-unsafe-assignment': 'warn',
  '@typescript-eslint/no-unsafe-call': 'warn',
  '@typescript-eslint/no-unsafe-member-access': 'warn',
  '@typescript-eslint/no-unsafe-return': 'warn',
  '@typescript-eslint/no-unsafe-argument': 'warn',
  '@typescript-eslint/require-await': 'off',
};

// Common Prettier rules
export const commonPrettierRules = {
  ...eslintConfigPrettier.rules,
  'prettier/prettier': 'warn',
};

const defaultIgnores = ['**/dist/**', '**/build/**', '**/node_modules/**', '**/coverage/**'];

// Base TypeScript configuration
export const createBaseTypeScriptConfig = async (options = {}) => {
  const jest = await import('eslint-plugin-jest');

  const {
    globals: customGlobals = globals.node,
    ecmaVersion = 'latest',
    tsconfigRootDir = REPO_ROOT,
    ignores: extraIgnores = [],
    files = ['**/*.{ts,tsx}'],
    additionalRules = {},
    additionalPlugins = {},
    /**
     * When set, use classic `project` mode instead of `projectService` (e.g. for `tsconfig.spec.json`
     * so test files excluded from the main tsconfig stay type-aware under ESLint).
     */
    parserOptionsOverride,
  } = options;

  const parserOptions =
    parserOptionsOverride !== undefined
      ? {
          ecmaVersion,
          sourceType: 'module',
          tsconfigRootDir,
          ...parserOptionsOverride,
        }
      : {
          ecmaVersion,
          sourceType: 'module',
          projectService: true,
          tsconfigRootDir,
        };

  return defineConfig(
    { ignores: [...defaultIgnores, ...extraIgnores] },
    {
      files,
      extends: [js.configs.recommended, ...tseslint.configs.recommendedTypeChecked],
      languageOptions: {
        globals: customGlobals,
        parserOptions,
      },
      plugins: {
        prettier: prettierPlugin,
        jest: jest.default,
        '@photoapp': photoappPlugin,
        ...additionalPlugins,
      },
      rules: {
        ...commonTypeScriptRules,
        ...commonPrettierRules,
        ...jest.default.configs.recommended.rules,
        '@photoapp/no-smart-enum-reference-equality': 'error',
        ...additionalRules,
      },
    },
  );
};
