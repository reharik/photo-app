import { createRepoTestEslintConfig } from '../../../eslint.repo.config.js';

export default await createRepoTestEslintConfig({
  tsconfigRootDir: import.meta.dirname,
});
