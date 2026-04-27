import type { Knex } from 'knex';

/**
 * Partial unique indexes (WHERE ...) are not inferable for plain
 * `ON CONFLICT (album_id, granted_to_user)` without a matching WHERE in the
 * conflict clause. Knex's `.onConflict([...])` has no WHERE, so the partial
 * index from 0015 could not be used. A full unique index on the same
 * columns is inferable; multiple token rows (granted_to_user NULL) remain
 * valid because NULLs are distinct in unique checks.
 */
export const up = async (knex: Knex): Promise<void> => {
  await knex.raw('DROP INDEX IF EXISTS access_grant_album_granted_user_unique');
  await knex.raw(`
    CREATE UNIQUE INDEX access_grant_album_granted_user_unique
    ON access_grant (album_id, granted_to_user)
  `);
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.raw('DROP INDEX IF EXISTS access_grant_album_granted_user_unique');
  await knex.raw(`
    CREATE UNIQUE INDEX access_grant_album_granted_user_unique
    ON access_grant (album_id, granted_to_user)
    WHERE granted_to_user IS NOT NULL
  `);
};
