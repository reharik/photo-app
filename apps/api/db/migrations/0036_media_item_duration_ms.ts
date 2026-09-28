import type { Knex } from 'knex';

/**
 * Rename `media_item.duration_seconds` to `duration_ms` and widen it from integer to
 * bigint.
 *
 * Why: the video pipeline measures duration with sub-second precision, and writing that
 * fractional value into an integer column fails (Postgres 22P02, pg_strtoint32_safe).
 * Storing whole milliseconds keeps the precision in an integral column. bigint rather
 * than integer because integer tops out at ~24.8 days of ms. The API exposes the value
 * as GraphQL Int (32-bit), which is ample for any clip we accept; widen it to SafeInt
 * (like size_bytes) if that ever stops being true.
 *
 * Existing values are whole seconds, so they are multiplied by 1000 in this migration;
 * the column never holds mixed units. The multiply runs after the widen so it can't
 * overflow integer.
 *
 * down reverses both: divide by 1000 (rounded — a sub-second remainder cannot survive
 * the integer seconds column), narrow back to integer, rename back.
 *
 * The column stays nullable with no default (images have no duration), so `.alter()`
 * restating nullable() leaves it as 0001 created it.
 *
 * No import from @packages/contracts — migrations are compiled by plain `tsc`
 * (tsconfig.db.json) and their imports survive as live runtime specifiers, while the
 * prod image never copies `packages/`. See 0031's closing note for the full mechanics.
 */

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('media_item', (table) => {
    table.renameColumn('duration_seconds', 'duration_ms');
  });

  await knex.schema.alterTable('media_item', (table) => {
    // video duration in milliseconds; null for images
    table.bigInteger('duration_ms').nullable().alter();
  });

  await knex('media_item')
    .whereNotNull('duration_ms')
    .update({ duration_ms: knex.raw('duration_ms * 1000') });
}

export async function down(knex: Knex): Promise<void> {
  await knex('media_item')
    .whereNotNull('duration_ms')
    .update({ duration_ms: knex.raw('round(duration_ms / 1000.0)') });

  await knex.schema.alterTable('media_item', (table) => {
    table.integer('duration_ms').nullable().alter();
  });

  await knex.schema.alterTable('media_item', (table) => {
    table.renameColumn('duration_ms', 'duration_seconds');
  });
}
