import apiJestConfig from './jest.config.js';

/**
 * Integration tests cross process boundaries (e.g. real Postgres, GraphQL over HTTP).
 * Requires local env (see src/tests/setup.ts and graphqlIntegrationTestSetup).
 */
export default {
  ...apiJestConfig,
  displayName: 'api-integration',
  moduleNameMapper: {
    ...apiJestConfig.moduleNameMapper,
    '^@react-email/tailwind$': '<rootDir>/src/tests/__mocks__/reactEmailTailwind.js',
    '^koa$': '<rootDir>/src/tests/__mocks__/koa.js',
  },
  /**
   * One worker only: integration tests share a real Postgres DB and a singleton IoC container.
   * Parallel test files will race on TRUNCATE/inserts and produce flaky (3–6 random) failures.
   */
  maxWorkers: 1,
  /** Integration tests leave the Knex pool and sometimes an HTTP server open; exit cleanly. */
  forceExit: true,
  testPathIgnorePatterns: [],
  testMatch: [
    '<rootDir>/src/tests/**/*.integration.tests.ts',
    '<rootDir>/src/tests/**/*.integration.test.ts',
  ],
};
