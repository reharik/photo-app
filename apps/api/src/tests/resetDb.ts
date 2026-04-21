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
 * Clears app-owned rows for integration tests. Uses physical PostgreSQL table names
 * (Knex models use camelCase; raw SQL does not).
 *
 * Re-seed stable test users afterward — `beforeAll` only runs once per suite, so
 * `afterEach` must restore `user` rows tests rely on for FKs and auth.
 */
export const resetDb = async (db: Knex): Promise<void> => {
  await db.raw(`
    TRUNCATE TABLE
      album_item,
      album_member,
      share_link,
      "comment",
      notification,
      album,
      media_processing_job,
      media_deletion_job,
      media_asset,
      media_item,
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
