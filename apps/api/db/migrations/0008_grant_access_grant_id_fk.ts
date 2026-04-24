import type { Knex } from 'knex';

export const up = async (knex: Knex): Promise<void> => {
  await knex.schema.alterTable('grant', (table) => {
    table.foreign('access_grant_id').references('id').inTable('access_grant').onDelete('CASCADE');
  });
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.schema.alterTable('grant', (table) => {
    table.dropForeign(['access_grant_id']);
  });
};
