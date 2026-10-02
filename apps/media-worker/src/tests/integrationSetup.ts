// Integration-only setupFile (see jest.integration.config.js).
//
// Assigned, not defaulted: dotenv never overrides an already-set var, so leaving the
// name to apps/media-worker/.env (or to POSTGRES_DB in the shell / CI job env) points
// the suite at the dev database, which `resetDb` then TRUNCATEs. setupFiles run before
// any test module is imported, so this lands before `createConfigFromEnv()` reads
// process.env.
import { INTEGRATION_TEST_DATABASE } from './integrationTestDatabase';

process.env.POSTGRES_DB = INTEGRATION_TEST_DATABASE;
