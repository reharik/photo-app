import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import { createRepoEslintConfig } from '../../eslint.repo.config.js';

export default await createRepoEslintConfig({
  tsconfigRootDir: import.meta.dirname,
  ignores: ['**/generated/**', '**/*.generated.*', '**/vendor/videojs/**'],
  globals: globals.browser,
  ecmaVersion: 2020,
  files: ['**/*.{ts,tsx}'],
  additionalPlugins: {
    'react-hooks': reactHooks,
    'react-refresh': reactRefresh,
  },
  additionalRules: {
    ...reactHooks.configs.recommended.rules,
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
  },
});
