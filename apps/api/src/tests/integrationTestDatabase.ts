/**
 * The database the api integration suite runs against — never the dev database.
 *
 * Separate from the worker's (`homeroll_worker_test`): `nx run-many` can run both
 * integration suites at once, and each TRUNCATEs in `afterEach`.
 *
 * Must end in `_test`: `resetDb` refuses to TRUNCATE anything else.
 *
 * Kept free of imports and `import.meta` so both the ESM setup file and the
 * CJS-transpiled jest globalSetup can load it.
 */
export const INTEGRATION_TEST_DATABASE = 'homeroll_api_test';
