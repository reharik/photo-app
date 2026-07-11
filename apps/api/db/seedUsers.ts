import bcrypt from 'bcryptjs';
import type { Knex } from 'knex';

/** Shared password for all local seed users (dev admin + e2e fixtures). */
export const SEED_USER_PASSWORD = '123123123';

export type SeedUserRow = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userStatus: string;
};

/**
 * Stable ids so re-seeding and e2e global setup upsert the same rows.
 * E2e fixtures reference emails in `packages/e2e/fixtures/users.ts`.
 */
export const SEED_USER_ROWS: SeedUserRow[] = [
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

/** Idempotent upsert for local dev and e2e seed users. Does not delete existing rows. */
export const ensureSeedUsers = async (knex: Knex): Promise<void> => {
  const passwordHash = await bcrypt.hash(SEED_USER_PASSWORD, 12);

  for (const row of SEED_USER_ROWS) {
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
