import { randomUUID } from 'node:crypto';
import { getDb } from './db';

/**
 * Per-test user factory. Each test's `userA`/`userB` fixture creates its own
 * fresh user rows, so teardown (owner-scoped deletes + the user row itself)
 * is structurally incapable of touching a concurrent test's data.
 *
 * A user is ONE row. The schema has no per-user settings / preferences /
 * profile / quota / default-album tables, so a single `user` insert produces
 * a fully usable account — the same shape `apps/api/db/seedUsers.ts` relies on.
 */
export type TestUser = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  /**
   * `${firstName} ${lastName}` — the exact format member rows and share
   * attributions render, so ARIA-name assertions can derive from this.
   */
  displayName: string;
};

/** Shared password for every factory-created user. */
export const TEST_USER_PASSWORD = '123123123';

/**
 * bcrypt(TEST_USER_PASSWORD, cost 12), precomputed ONCE. bcrypt embeds the
 * salt inside the hash string and login only ever runs `bcrypt.compare`
 * against this column — there is no salt/pepper column — so every created
 * user shares this value (seedUsers.ts uses the same trick across its four
 * rows). Never hash per user here: it's ~300ms per bcrypt call.
 */
export const TEST_USER_PASSWORD_HASH =
  '$2b$12$sc9Guv19f.uPOGPIgy/Z3uLLFQe.C5IoNdfSn3BaiWzYvWBGUiTgq';

export type TestUserRole = 'owner' | 'recipient';

const ROLE_NAMES: Record<TestUserRole, { firstName: string; lastName: string }> = {
  owner: { firstName: 'E2e', lastName: 'Owner' },
  recipient: { firstName: 'E2e', lastName: 'Recipient' },
};

/** Builds the identity; `insertTestUser` writes it. Email embeds `uniqueSuffix`
 * (which already includes the Playwright workerIndex) so concurrent workers and
 * retry attempts can never collide on the unique-email constraint. */
export const buildTestUser = (role: TestUserRole, uniqueSuffix: string): TestUser => {
  const { firstName, lastName } = ROLE_NAMES[role];
  return {
    // Must be lowercase — `user` has CHECK (email = lower(email)).
    email: `e2e-${role}-${uniqueSuffix}@example.test`.toLowerCase(),
    password: TEST_USER_PASSWORD,
    firstName,
    lastName,
    displayName: `${firstName} ${lastName}`,
  };
};

/**
 * Inserts the user row directly (same approach global-setup historically used
 * for the seed users) and returns its id.
 *
 * - `userStatus` MUST be 'ACTIVE': login ignores it, but addAlbumMembers
 *   rejects non-active users and grant materialization filters to active
 *   grantees.
 * - `emailVerified` is a dead flag (written in several places, read nowhere);
 *   set true for consistency only.
 * - `createdBy`/`updatedBy` self-reference the new id (bare uuids, no FK) —
 *   the established convention from seedUsers.ts.
 */
export const insertTestUser = async (user: TestUser): Promise<string> => {
  const id = randomUUID();
  await getDb()('user').insert({
    id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    passwordHash: TEST_USER_PASSWORD_HASH,
    emailVerified: true,
    createdBy: id,
    updatedBy: id,
    userStatus: 'ACTIVE',
  });
  return id;
};
