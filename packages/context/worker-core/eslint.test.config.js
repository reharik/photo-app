import { createRepoTestEslintConfig } from '../../../eslint.repo.config.js';

export default await createRepoTestEslintConfig({
  tsconfigRootDir: import.meta.dirname,
  typeAwareProject: './tsconfig.spec.json',
});
