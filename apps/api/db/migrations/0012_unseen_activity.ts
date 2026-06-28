import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('unseen_activity', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    table
      .uuid('viewer_id')
      .notNullable()
      .references('id')
      .inTable('user')
      .onDelete('CASCADE');

    // nullable rollup hint
    table.uuid('album_id').nullable();

    // 'album' | 'mediaItem' (validated in app code)
    table.text('target_type').notNullable();
    // which specific thing
    table.uuid('target_id').notNullable();

    // 'item_added' | 'comment_added' (validated in app code)
    table.text('activity_kind').notNullable();

    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    // collapse duplicate activity for the same (viewer, album, thing, kind)
    table.unique(['viewer_id', 'album_id', 'target_type', 'target_id', 'activity_kind']);

    // nav aggregate dot
    table.index(['viewer_id']);
    // per-album dot
    table.index(['viewer_id', 'album_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('unseen_activity');
}
