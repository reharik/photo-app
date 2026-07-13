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
    // The base config maps `@packages/media-core` (the main entry) to source, but the DI
    // composed manifest imports factories via the `/iocManifest` + `/iocTypes` subpaths,
    // whose package `exports` resolve to the built `dist`. Because `test-integration` has
    // no `dependsOn: build`, that left the container running a possibly-stale media-core
    // build (masking source bugs). Map the subpaths to source too so integration tests
    // always exercise current media-core source, consistent with the main-entry mapping.
    '^@packages/media-core/iocManifest$':
      '<rootDir>/../../packages/context/media-core/src/generated/ioc-manifest.ts',
    '^@packages/media-core/iocTypes$':
      '<rootDir>/../../packages/context/media-core/src/generated/ioc-registry.types.ts',
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
