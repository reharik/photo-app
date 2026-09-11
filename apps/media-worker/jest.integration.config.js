import workerJestConfig from './jest.config.js';

/**
 * Integration tests cross process boundaries (real Postgres). Requires local env
 * (the worker's config self-loads apps/media-worker/.env; in CI the Integration
 * job's POSTGRES_* env vars are used instead) and a migrated schema
 * (`npm run db:migrate` — the api owns the migrations).
 */
export default {
  ...workerJestConfig,
  displayName: 'media-worker-integration',
  moduleNameMapper: {
    ...workerJestConfig.moduleNameMapper,
    // The base config maps `@packages/worker-core` (the main entry) to source, but the
    // worker's generated ioc-composed.ts imports factories via the `/iocManifest` +
    // `/iocTypes` subpaths, whose package `exports` resolve to the built `dist` under
    // jest. Because `test-integration` has no `dependsOn: build`, that would leave the
    // container running a possibly-stale worker-core build. Map the subpaths to source
    // too, same as apps/api/jest.integration.config.js.
    '^@packages/worker-core/iocManifest$':
      '<rootDir>/../../packages/context/worker-core/src/generated/ioc-manifest.ts',
    '^@packages/worker-core/iocTypes$':
      '<rootDir>/../../packages/context/worker-core/src/generated/ioc-registry.types.ts',
  },
  /**
   * One worker only (already in the base config, restated for clarity): integration
   * tests share a real Postgres DB and a per-file singleton container; parallel test
   * files race on TRUNCATE/inserts.
   */
  maxWorkers: 1,
  /** Integration tests leave the Knex pool open on failure paths; exit cleanly. */
  forceExit: true,
  testMatch: ['**/tests/**/*.integration.tests.ts'],
  testPathIgnorePatterns: ['/node_modules/'],
};
