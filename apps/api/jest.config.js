export default {
  displayName: 'api',
  preset: '../../tooling/jest/jest.preset.cjs',
  testEnvironment: 'node',
  /**
   * Unit tests only: no process boundaries (no real DB, HTTP to other services, etc.).
   * Files named `*.integration.test.ts` or `*.integration.tests.ts` are integration tests;
   * run them with `nx run api:test-integration` (see jest.integration.config.js).
   */
  testPathIgnorePatterns: ['\\.integration\\.tests\\.ts$', '\\.integration\\.test\\.ts$'],
  extensionsToTreatAsEsm: ['.ts'],
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
    '^./knexfile$': '<rootDir>/src/tests/__mocks__/knexfile.js',
    '^@packages/contracts$': '<rootDir>/../../packages/foundation/contracts/src/index.ts',
    '^@packages/infrastructure$': '<rootDir>/../../packages/foundation/infrastructure/src/index.ts',
    '^@packages/media-core$': '<rootDir>/../../packages/context/media-core/src/index.ts',
  },
  coverageDirectory: '<rootDir>/coverage',
  globalTeardown: '<rootDir>/src/tests/jestGlobalTeardown.ts',
  setupFiles: ['<rootDir>/src/tests/setup.ts'],
  testMatch: ['**/tests/**/*.tests.ts', '**/?(*.)+(spec|test).?([mc])[jt]s?(x)'],
  transformIgnorePatterns: [
    'node_modules/(?!(@reharik/smart-enum|@reharik/smart-enum-knex|case-anything|@network|koa|@koa|only|http-errors|statuses|graphql-yoga|@graphql-tools)/)',
  ],
};
