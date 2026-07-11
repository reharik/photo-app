// Test environment setup (env vars, global mocks).
//
// RAI-76: load apps/api/.env into process.env so integration tests reach the
// same Postgres the running api uses. `createConfigFromEnv()` reads process.env
// directly and does NOT load a .env file itself (its `ensureEnvLoaded` helper is
// unused — see REVIEW.md "Possible source bugs"); in the app that's fine because
// docker-compose injects POSTGRES_* into the container, but host-run Jest gets
// nothing and defaults to 127.0.0.1:5432. dotenv does not override already-set
// vars, so an explicit `POSTGRES_*` / `NODE_ENV=test` in the environment still
// wins. Harmless for unit tests (they mock the knexfile and never connect).
import { config as loadDotEnv } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
loadDotEnv({ path: path.resolve(here, '../../.env') });
