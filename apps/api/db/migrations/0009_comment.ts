import type { Knex } from 'knex';

/**
 * Replaces the stub `comment` table from 0001_init_schema with the full
 * comments-domain schema: polymorphic target, recursive replies (two-level
 * cap enforced in the service), denormalized display fields, and soft delete.
 */
export const up = async (knex: Knex): Promise<void> => {
  await knex.schema.dropTableIfExists('comment');

  await knex.schema.createTable('comment', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());

    table.text('target_type').notNullable();
    // No FK on target_id — polymorphism kills referential integrity at the DB level.
    // Target existence is validated in the write service.
    table.uuid('target_id').notNullable();

    // Self-referential FK for replies. ON DELETE CASCADE so removing a top-level
    // comment also removes its replies.
    table
      .uuid('parent_comment_id')
      .nullable()
      .references('id')
      .inTable('comment')
      .onDelete('CASCADE');

    // Nullable on purpose: v1 rejects unauthenticated authors in the write
    // service, but the column stays nullable for future anonymous-via-share-token
    // support without a schema migration.
    table.uuid('author_user_id').nullable().references('id').inTable('user').onDelete('SET NULL');

    table.text('body').notNullable();

    // Denormalized display fields — intentional snapshots captured at write time.
    // Do NOT replace with joins through the user table.
    table.text('display_name').notNullable();
    table.text('display_avatar_url').nullable();

    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at', { useTz: true }).nullable();

    // Main fetch path: all top-level (or reply) comments for a target, ordered by time.
    table.index(['target_type', 'target_id', 'created_at']);
    // Reply lookup: all direct children of a given comment.
    table.index(['parent_comment_id']);
    // "Comments by user" / audit path.
    table.index(['author_user_id']);
  });

  await knex.raw(`
    ALTER TABLE "comment"
    ADD CONSTRAINT comment_target_type_check
    CHECK (target_type IN ('MEDIA_ITEM', 'ALBUM'))
  `);

  await knex.raw(`
    ALTER TABLE "comment"
    ADD CONSTRAINT comment_body_not_empty_check
    CHECK (char_length(body) > 0)
  `);
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.schema.dropTableIfExists('comment');
};
