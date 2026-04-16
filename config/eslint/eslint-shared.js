import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

// Common TypeScript rules that all projects share
export const commonTypeScriptRules = {
  "@typescript-eslint/no-misused-promises": [
    "error",
    {
      checksVoidReturn: false,
    },
  ],
  // Middle ground: Keep type safety but disable only the most problematic unsafe rules
  "@typescript-eslint/no-unsafe-assignment": "warn",
  "@typescript-eslint/no-unsafe-call": "warn",
  "@typescript-eslint/no-unsafe-member-access": "warn",
  "@typescript-eslint/no-unsafe-return": "warn",
  "@typescript-eslint/no-unsafe-argument": "warn",
  "@typescript-eslint/require-await": "warn",
};

// Common Prettier rules
export const commonPrettierRules = {
  ...eslintConfigPrettier.rules,
  "prettier/prettier": "warn",
};

const defaultIgnores = [
  "**/dist/**",
  "**/build/**",
  "**/node_modules/**",
  "**/coverage/**",
];

// Base TypeScript configuration
export const createBaseTypeScriptConfig = async (options = {}) => {
  const jest = await import("eslint-plugin-jest");

  const {
    globals: customGlobals = globals.node,
    ecmaVersion = "latest",
    tsconfigRootDir = import.meta.dirname,
    ignores: extraIgnores = [],
    files = ["**/*.ts"],
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
          sourceType: "module",
          tsconfigRootDir,
          ...parserOptionsOverride,
        }
      : {
          ecmaVersion,
          sourceType: "module",
          projectService: true,
          tsconfigRootDir,
        };

  return defineConfig(
    { ignores: [...defaultIgnores, ...extraIgnores] },
    {
      files,
      extends: [
        js.configs.recommended,
        ...tseslint.configs.recommendedTypeChecked,
      ],
      languageOptions: {
        globals: customGlobals,
        parserOptions,
      },
      plugins: {
        prettier: prettierPlugin,
        jest: jest.default,
        ...additionalPlugins,
      },
      rules: {
        ...commonTypeScriptRules,
        ...commonPrettierRules,
        ...jest.default.configs.recommended.rules,
        ...additionalRules,
      },
    },
  );
};
