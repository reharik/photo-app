import type { Knex } from 'knex';

export const up = async (knex: Knex): Promise<void> => {
  await knex.raw(`
    CREATE UNIQUE INDEX access_grant_media_item_granted_user_unique
    ON access_grant (media_item_id, granted_to_user)
    WHERE granted_to_user IS NOT NULL
  `);
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.raw('DROP INDEX IF EXISTS access_grant_media_item_granted_user_unique');
};
