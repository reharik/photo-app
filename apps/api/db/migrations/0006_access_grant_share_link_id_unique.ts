import type { Knex } from 'knex';

const ACCESS_GRANT_TABLE = 'access_grant';
const CONSTRAINT_NAME = 'access_grant_share_link_id_unique';

/**
 * Public-link grants use `share_link_id`; ON CONFLICT (share_link_id) requires a matching unique
 * arbiter. PostgreSQL UNIQUE allows multiple NULL `share_link_id` rows (NULLs are not equal for
 * uniqueness), so user-targeted grants are unaffected.
 */
export const up = async (knex: Knex): Promise<void> => {
  const { rows } = await knex.raw<{ rows: { oid: unknown }[] }>(
    `SELECT oid FROM pg_constraint WHERE conname = ?`,
    [CONSTRAINT_NAME],
  );
  if (rows.length > 0) {
    return;
  }

  await knex.raw(`ALTER TABLE ?? ADD CONSTRAINT ?? UNIQUE (share_link_id)`, [
    ACCESS_GRANT_TABLE,
    CONSTRAINT_NAME,
  ]);
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.raw(`ALTER TABLE ?? DROP CONSTRAINT IF EXISTS ??`, [
    ACCESS_GRANT_TABLE,
    CONSTRAINT_NAME,
  ]);
};
