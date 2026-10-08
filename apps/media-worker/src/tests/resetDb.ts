import type { Knex } from 'knex';

import { ensureTestViewerUsers } from './ensureTestViewerUsers';

/**
 * Asks the live connection which database it is on — not the env, which is exactly
 * what went wrong when this used to wipe the dev database. Duplicated in
 * apps/api/src/tests/resetDb.ts along with the TRUNCATE below.
 */
const assertTestDatabase = async (db: Knex): Promise<void> => {
  const result = await db.raw<{ rows: { name?: string }[] }>('select current_database() as name');
  const name = result.rows[0]?.name;
  if (typeof name !== 'string' || !name.endsWith('_test')) {
    throw new Error(
      `Refusing to TRUNCATE: connected to database "${String(name)}", whose name does not end ` +
        `in "_test". Integration tests must run through jest.integration.config.js, which ` +
        `forces POSTGRES_DB to the test database (see src/tests/integrationSetup.ts).`,
    );
  }
};

/**
 * Clears app-owned rows for integration tests. Uses physical PostgreSQL table names
 * (Knex models use camelCase; raw SQL does not). Refuses to run against any database
 * whose name does not end in `_test`.
 *
 * ⚠️ The TRUNCATE table list below is DUPLICATED in apps/api/src/tests/resetDb.ts
 * (deliberately — no shared test-support package). When a migration adds a table,
 * update BOTH copies.
 *
 * Re-seed stable test users afterward — `beforeAll` only runs once per suite, so
 * `afterEach` must restore `user` rows tests rely on for FKs.
 */
export const resetDb = async (db: Knex): Promise<void> => {
  await assertTestDatabase(db);
  await db.raw(`
    TRUNCATE TABLE
      share_contact,
      "grant",
      access_grant,
      album_item,
      album_member,
      "comment",
      notification,
      album,
      media_processing_job,
      media_deletion_job,
      media_asset,
      media_item,
      email_verification,
      rate_limit_event,
      "user"
    RESTART IDENTITY CASCADE;
  `);
};

export const resetIntegrationTestDb = async (db: Knex): Promise<void> => {
  await resetDb(db);
  await ensureTestViewerUsers(db);
};
