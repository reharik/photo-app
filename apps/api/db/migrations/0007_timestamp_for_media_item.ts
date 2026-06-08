import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE media_item
      ALTER COLUMN taken_at TYPE timestamptz
      USING taken_at AT TIME ZONE 'UTC'
  `);
  await knex.schema.alterTable('media_item', (table) => {
    table.integer('taken_at_utc_offset_minutes').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('media_item', (table) => {
    table.dropColumn('taken_at_utc_offset_minutes');
  });
  await knex.raw(`
    ALTER TABLE media_item
      ALTER COLUMN taken_at TYPE timestamp
      USING taken_at AT TIME ZONE 'UTC'
  `);
}
