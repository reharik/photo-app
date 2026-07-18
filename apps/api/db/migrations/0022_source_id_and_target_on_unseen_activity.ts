import type { Knex } from 'knex';

// Re-shape unseen_activity to distinguish the target (the anchor/clear-grain, e.g. the
// Album or MediaItem you navigate to) from the source (the generator, e.g. the Comment
// or Reaction). unseen_activity is ephemeral tracking data, so we drop and recreate
// rather than backfill NOT NULL source columns onto existing rows.
export async function up(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('unseen_activity');

  await knex.schema.createTable('unseen_activity', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    table.uuid('viewer_id').notNullable().references('id').inTable('user').onDelete('CASCADE'); // real user → FK is safe

    table.text('activity_kind').notNullable(); // smart-enum .value:  ALBUM_SHARED | COMMENT_POSTED | ITEM_ADDED | ITEM_SHARED | REPLY_POSTED

    table.text('target_type').notNullable(); // smart-enum: MEDIA_ITEM | ALBUM — the anchor / clear-grain
    table.uuid('target_id').notNullable(); // polymorphic → NO FK

    table.text('source_type').notNullable(); // smart-enum: COMMENT | MEDIA_ITEM — the generator
    table.uuid('source_id').notNullable(); // polymorphic → NO FK

    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.unique(['viewer_id', 'target_type', 'target_id', 'source_type', 'source_id'], {
      indexName: 'unseen_activity_replay_key',
    });

    // nav aggregate dot
    table.index(['viewer_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('unseen_activity');

  // Restore the prior shape (post-0015): target-only, no source columns.
  await knex.schema.createTable('unseen_activity', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    table.uuid('viewer_id').notNullable().references('id').inTable('user').onDelete('CASCADE');

    table.text('target_type').notNullable();
    table.uuid('target_id').notNullable();

    table.text('activity_kind').notNullable();

    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['viewer_id']);
  });

  await knex.raw(`
    ALTER TABLE unseen_activity
    ADD CONSTRAINT unseen_activity_unique
    UNIQUE (viewer_id, target_type, target_id, activity_kind)
  `);
}
