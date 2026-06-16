export default {
  displayName: 'notifications',
  preset: '../../../infra/config/jest/jest.preset.cjs',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transform: {
    '^.+\\.(ts|tsx|js|mjs)$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'mjs'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@packages/notifications$': '<rootDir>/src/index.ts',
    '^@packages/contracts$': '<rootDir>/../../foundation/contracts/src/index.ts',
    '^@packages/infrastructure$': '<rootDir>/../../foundation/infrastructure/src/index.ts',
  },
  coverageDirectory: '<rootDir>/coverage',
  setupFiles: [],
  testMatch: ['**/src/tests/**/*.tests.ts', '**/src/tests/**/*.test.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!(@reharik/smart-enum|@reharik/smart-enum-knex|case-anything)/)',
  ],
};
