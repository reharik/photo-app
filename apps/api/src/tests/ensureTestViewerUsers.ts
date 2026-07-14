import type { Knex } from 'knex';

import {
  TEST_OWNER_1_ID,
  TEST_USER_A_ID,
  TEST_VIEWER_1_ID,
  TEST_VIEWER_A_ID,
  TEST_VIEWER_B_ID,
  TEST_VIEWER_ONLY_ID,
} from './testViewerIds';

type TestUserRow = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
};

/**
 * Every stable test user id that may appear in FK columns (owner_id, created_by, member ids, etc.).
 * Inserts are idempotent (ON CONFLICT (id) DO NOTHING).
 */
const TEST_USER_ROWS: TestUserRow[] = [
  {
    id: TEST_VIEWER_1_ID,
    email: 'test-viewer-1@example.test',
    firstName: 'Demo',
    lastName: 'User',
  },
  {
    id: TEST_VIEWER_A_ID,
    email: 'test-viewer-a@example.test',
    firstName: 'Viewer',
    lastName: 'A',
  },
  {
    id: TEST_VIEWER_B_ID,
    email: 'test-viewer-b@example.test',
    firstName: 'Viewer',
    lastName: 'B',
  },
  {
    id: TEST_VIEWER_ONLY_ID,
    email: 'test-viewer-only@example.test',
    firstName: 'Viewer',
    lastName: 'Only',
  },
  {
    id: TEST_USER_A_ID,
    email: 'test-user-a@example.test',
    firstName: 'User',
    lastName: 'A',
  },
  {
    id: TEST_OWNER_1_ID,
    email: 'test-owner-1@example.test',
    firstName: 'Owner',
    lastName: 'One',
  },
];

/**
 * Ensures rows exist in `user` for integration tests that persist aggregates referencing user ids.
 * Safe to call multiple times (idempotent via ON CONFLICT DO NOTHING).
 */
export const ensureTestViewerUsers = async (database: Knex): Promise<void> => {
  for (const row of TEST_USER_ROWS) {
    await database('user')
      .insert({
        id: row.id,
        email: row.email,
        firstName: row.firstName,
        lastName: row.lastName,
        // RAI-76: user_status became NOT NULL in migration 0019; seed users are active.
        userStatus: 'ACTIVE',
        emailVerified: true,
        createdBy: row.id,
        updatedBy: row.id,
      })
      .onConflict('id')
      .ignore();
  }
};
