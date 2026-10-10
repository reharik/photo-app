import type { Knex } from 'knex';

/**
 * Add `media_item.taken_at_source`: where `taken_at` came from (`exif`, `filename`,
 * `userInput` in the MediaItem domain type).
 *
 * Plain nullable text with no default and no backfill: existing rows don't know their
 * source, and null is the honest value for them.
 */

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('media_item', (table) => {
    table.text('taken_at_source').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('media_item', (table) => {
    table.dropColumn('taken_at_source');
  });
}
