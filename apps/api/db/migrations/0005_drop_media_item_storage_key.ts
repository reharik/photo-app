import type { Knex } from 'knex';

export const up = async (knex: Knex): Promise<void> => {
  await knex.schema.alterTable('media_item', (table) => {
    table.dropColumn('storage_key');
  });
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.schema.alterTable('media_item', (table) => {
    table.string('storage_key', 1024).nullable();
  });

  await knex.raw(`
    UPDATE media_item
    SET storage_key = 'media/' || owner_id::text || '/' || id::text
  `);

  await knex.raw(`
    ALTER TABLE media_item
    ALTER COLUMN storage_key SET NOT NULL
  `);
};
