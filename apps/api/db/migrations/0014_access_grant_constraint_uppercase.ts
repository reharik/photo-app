import { Knex } from 'knex';

export const up = async (knex: Knex): Promise<void> => {
  await knex.raw(`
      ALTER TABLE access_grant 
      DROP CONSTRAINT access_grant_permission_check
    `);
  await knex.raw(`
      ALTER TABLE access_grant 
      ADD CONSTRAINT access_grant_permission_check 
      CHECK (permission IN ('VIEW', 'COMMENT', 'DOWNLOAD'))
    `);
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.raw(`
      ALTER TABLE access_grant 
      DROP CONSTRAINT access_grant_permission_check
    `);
  await knex.raw(`
      ALTER TABLE access_grant 
      ADD CONSTRAINT access_grant_permission_check 
      CHECK (permission IN ('view', 'comment', 'download'))
    `);
};
