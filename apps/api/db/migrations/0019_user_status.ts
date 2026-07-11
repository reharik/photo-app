import type { Knex } from 'knex';

/**
 * Add `user_status` to `user`, backing the `UserStatus` smart-enum (`pending` | `active`).
 * Stored as the enum's wire value (constantCase): 'PENDING' | 'ACTIVE'. Text, not a Postgres
 * enum type (baseline convention). The domain always sets userStatus explicitly on insert
 * (User.create / PendingUser), so no DB default; existing rows are backfilled to ACTIVE.
 */
export const up = async (knex: Knex): Promise<void> => {
  await knex.schema.alterTable('user', (table) => {
    table.string('user_status', 32).nullable();
  });

  await knex('user').whereNull('user_status').update({ user_status: 'ACTIVE' });

  await knex.schema.alterTable('user', (table) => {
    table.string('user_status', 32).notNullable().alter();
  });
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.schema.alterTable('user', (table) => {
    table.dropColumn('user_status');
  });
};
