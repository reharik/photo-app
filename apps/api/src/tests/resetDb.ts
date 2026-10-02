import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import type { Knex } from 'knex';

import { ensureTestViewerUsers } from './ensureTestViewerUsers';

const isPathUnderDirectory = (root: string, candidate: string): boolean => {
  const rootResolved = path.resolve(root);
  const candidateResolved = path.resolve(candidate);
  const rel = path.relative(rootResolved, candidateResolved);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
};

/**
 * Deletes and recreates the media root directory. Only paths under `process.cwd()` or
 * `os.tmpdir()` are allowed so tests cannot wipe arbitrary filesystem locations.
 */
export const cleanMediaStorageRoot = async (mediaStorageRoot: string): Promise<void> => {
  const resolved = path.resolve(mediaStorageRoot);
  const cwd = process.cwd();
  const tmp = os.tmpdir();

  if (!isPathUnderDirectory(cwd, resolved) && !isPathUnderDirectory(tmp, resolved)) {
    throw new Error(`Refusing to clean media storage outside project cwd or temp dir: ${resolved}`);
  }

  await fs.rm(resolved, { recursive: true, force: true });
  await fs.mkdir(resolved, { recursive: true });
};

/**
 * Asks the live connection which database it is on — not the env, which is exactly
 * what went wrong when this used to wipe the dev database. Duplicated in
 * apps/media-worker/src/tests/resetDb.ts along with the TRUNCATE below.
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
 * ⚠️ The TRUNCATE table list below is DUPLICATED in apps/media-worker/src/tests/resetDb.ts
 * (deliberately — no shared test-support package). When a migration adds a table,
 * update BOTH copies.
 *
 * Re-seed stable test users afterward — `beforeAll` only runs once per suite, so
 * `afterEach` must restore `user` rows tests rely on for FKs and auth.
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

export const resetIntegrationTestDb = async (
  db: Knex,
  mediaStorageRoot?: string,
  clearIntegrationTestMedia?: () => void,
): Promise<void> => {
  await resetDb(db);
  await ensureTestViewerUsers(db);
  if (clearIntegrationTestMedia !== undefined) {
    clearIntegrationTestMedia();
  }
  if (mediaStorageRoot !== undefined) {
    await cleanMediaStorageRoot(mediaStorageRoot);
  }
};
