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
    // Static mocks for process-global npm packages: applied uniformly so a real
    // import in one suite can't shadow the mock in another under worker sharing
    // (RAI-76). The real localstack SES path lives in emailLocalstack.tests.ts,
    // which is excluded from this unit run below.
    '^@aws-sdk/client-ses$': '<rootDir>/src/tests/__mocks__/awsSdkClientSes.js',
    '^@react-email/components$': '<rootDir>/src/tests/__mocks__/reactEmailComponents.js',
  },
  coverageDirectory: '<rootDir>/coverage',
  setupFiles: [],
  testMatch: ['**/src/tests/**/*.tests.ts', '**/src/tests/**/*.test.ts'],
  // emailLocalstack is a real-SES integration test (needs LocalStack, and is
  // perturbed by the running worker's sweeps); it also needs the REAL @aws-sdk that
  // this config mocks. Keep it out of the default unit run — run it explicitly.
  testPathIgnorePatterns: ['/node_modules/', 'emailLocalstack'],
  transformIgnorePatterns: [
    'node_modules/(?!(@reharik/smart-enum|@reharik/smart-enum-knex|case-anything)/)',
  ],
};
