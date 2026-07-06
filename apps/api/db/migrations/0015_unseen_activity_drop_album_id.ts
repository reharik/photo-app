import type { Knex } from 'knex';

// album_id was a redundant "rollup hint": every row written had album_id === target_id
// (both handlers only emit album-target activity), and the sole reader
// (withUnseenAlbumFlag) can key on target_id + target_type instead. Drop the column
// and re-key the unique constraint. All remaining columns are NOT NULL, so a plain
// UNIQUE replaces the previous NULLS NOT DISTINCT variant.
const CONSTRAINT_NAME = 'unseen_activity_unique';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`ALTER TABLE unseen_activity DROP CONSTRAINT IF EXISTS ${CONSTRAINT_NAME}`);

  // Dropping the column also drops the (viewer_id, album_id) index that references it.
  await knex.schema.alterTable('unseen_activity', (table) => {
    table.dropColumn('album_id');
  });

  await knex.raw(`
    ALTER TABLE unseen_activity
    ADD CONSTRAINT ${CONSTRAINT_NAME}
    UNIQUE (viewer_id, target_type, target_id, activity_kind)
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`ALTER TABLE unseen_activity DROP CONSTRAINT IF EXISTS ${CONSTRAINT_NAME}`);

  await knex.schema.alterTable('unseen_activity', (table) => {
    table.uuid('album_id').nullable();
    table.index(['viewer_id', 'album_id']);
  });

  await knex.raw(`
    ALTER TABLE unseen_activity
    ADD CONSTRAINT ${CONSTRAINT_NAME}
    UNIQUE NULLS NOT DISTINCT (viewer_id, album_id, target_type, target_id, activity_kind)
  `);
}
