import bcrypt from 'bcryptjs';
import type { Knex } from 'knex';

/**
 * Local seed users — DEV and E2E ONLY. Never prod.
 *
 * These rows carry a known shared password and `emailVerified: true`. They are
 * fixtures, not reference data, and nothing in production depends on them.
 * The prod boot path no longer calls into this file; `assertNotProduction`
 * below is a second line of defense, not the primary control.
 *
 * Two disjoint groups:
 *   DEV_SEED_USERS  — real developer logins for local work
 *   E2E_SEED_USERS  — fixtures referenced by packages/e2e/fixtures/users.ts
 *
 * Ids are stable so re-seeding upserts the same rows rather than accumulating
 * duplicates. Conflict target is `id`, not `email`.
 */

/**
 * Shared password for all local seed users.
 *
 * Overridable via env so CI can inject a throwaway value. The default is
 * committed and therefore public — that is acceptable precisely because these
 * accounts only ever exist in dev and e2e databases.
 */
export const SEED_USER_PASSWORD = process.env.SEED_USER_PASSWORD ?? '123123123';

export type SeedUserRow = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userStatus: string;
};

/** Developer logins. Seeded on dev boot. */
export const DEV_SEED_USERS: SeedUserRow[] = [
  {
    id: '11111111-1111-4111-8111-111111111001',
    email: 'harik.raif@gmail.com',
    firstName: 'Raif',
    lastName: 'Harik',
    userStatus: 'ACTIVE',
  },
  {
    id: '11111111-1111-4111-8111-111111111002',
    email: 'bubba.jones@gmail.com',
    firstName: 'Bubba',
    lastName: 'Jones',
    userStatus: 'ACTIVE',
  },
];

/** E2E fixtures. Seeded by the e2e global setup, not by dev boot. */
export const E2E_SEED_USERS: SeedUserRow[] = [
  {
    id: '11111111-1111-4111-8111-111111111003',
    email: 'tester.one@gmail.com',
    firstName: 'E2e',
    lastName: 'Owner',
    userStatus: 'ACTIVE',
  },
  {
    id: '11111111-1111-4111-8111-111111111004',
    email: 'two.tester@gmail.com',
    firstName: 'E2e',
    lastName: 'Recipient',
    userStatus: 'ACTIVE',
  },
];

/** Both groups. Retained so existing callers keep their current behavior. */
export const SEED_USER_ROWS: SeedUserRow[] = [...DEV_SEED_USERS, ...E2E_SEED_USERS];

const assertNotProduction = (caller: string): void => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      `${caller} refused to run: NODE_ENV=production. Seed users are dev/e2e ` +
        `fixtures with a known password and must never reach a production database.`,
    );
  }
};

/**
 * Idempotent upsert. Does not delete existing rows.
 *
 * Note that `.merge()` includes `passwordHash`, so this resets the password of
 * any matching row on every run. Harmless for fixtures; the reason this file
 * must not touch prod.
 */
const upsertSeedUsers = async (knex: Knex, rows: SeedUserRow[]): Promise<void> => {
  if (rows.length === 0) {
    return;
  }

  const passwordHash = await bcrypt.hash(SEED_USER_PASSWORD, 12);

  for (const row of rows) {
    await knex('user')
      .insert({
        id: row.id,
        email: row.email,
        firstName: row.firstName,
        lastName: row.lastName,
        passwordHash,
        emailVerified: true,
        createdBy: row.id,
        updatedBy: row.id,
        userStatus: row.userStatus,
      })
      .onConflict('id')
      .merge({
        email: row.email,
        firstName: row.firstName,
        lastName: row.lastName,
        passwordHash,
        emailVerified: true,
        userStatus: row.userStatus,
        updatedBy: row.id,
      });
  }
};

/** Seed developer logins only. Call this from the dev boot path. */
export const ensureDevSeedUsers = async (knex: Knex): Promise<void> => {
  assertNotProduction('ensureDevSeedUsers');
  await upsertSeedUsers(knex, DEV_SEED_USERS);
};

/** Seed e2e fixtures only. Call this from the e2e global setup. */
export const ensureE2eSeedUsers = async (knex: Knex): Promise<void> => {
  assertNotProduction('ensureE2eSeedUsers');
  await upsertSeedUsers(knex, E2E_SEED_USERS);
};

/**
 * Seed an explicit set, defaulting to every group.
 *
 * Kept so existing call sites compile unchanged. Prefer the group-specific
 * helpers above in new code.
 */
export const ensureSeedUsers = async (
  knex: Knex,
  rows: SeedUserRow[] = SEED_USER_ROWS,
): Promise<void> => {
  assertNotProduction('ensureSeedUsers');
  await upsertSeedUsers(knex, rows);
};
