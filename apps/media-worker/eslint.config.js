import { createRepoEslintConfig } from '../../eslint.repo.config.js';

export default await createRepoEslintConfig({
  tsconfigRootDir: import.meta.dirname,
  ignores: ['**/di/generated/**'],
});
