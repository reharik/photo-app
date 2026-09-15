import { createRepoEslintConfig } from './eslint.repo.config.js';

/** Re-export infra so tooling can import from the repo root only. */
export {
  commonPrettierRules,
  commonTypeScriptRules,
  createBaseTypeScriptConfig,
} from './tooling/eslint/eslint-shared.js';

export {
  createRepoEslintConfig,
  createRepoTestEslintConfig,
  testFileIgnorePatterns,
  testFileLintPatterns,
} from './eslint.repo.config.js';

export default await createRepoEslintConfig();
