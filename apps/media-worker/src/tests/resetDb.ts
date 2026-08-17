import type { Knex } from 'knex';

import { ensureTestViewerUsers } from './ensureTestViewerUsers';

/**
 * Clears app-owned rows for integration tests. Uses physical PostgreSQL table names
 * (Knex models use camelCase; raw SQL does not).
 *
 * ⚠️ The TRUNCATE table list below is DUPLICATED in apps/api/src/tests/resetDb.ts
 * (deliberately — no shared test-support package). When a migration adds a table,
 * update BOTH copies.
 *
 * Re-seed stable test users afterward — `beforeAll` only runs once per suite, so
 * `afterEach` must restore `user` rows tests rely on for FKs.
 */
export const resetDb = async (db: Knex): Promise<void> => {
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
