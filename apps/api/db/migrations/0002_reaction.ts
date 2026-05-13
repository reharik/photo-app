import type { Knex } from 'knex';

export const up = async (knex: Knex): Promise<void> => {
  await knex.schema.createTable('reaction', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.text('target_type').notNullable();
    table.uuid('target_id').notNullable();
    table.uuid('user_id').notNullable().references('id').inTable('user').onDelete('CASCADE');
    table.text('emoji').notNullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.uuid('updated_by').notNullable();

    table.unique(['target_type', 'target_id', 'user_id', 'emoji']);
    table.index(['target_type', 'target_id']);
    table.index(['user_id', 'target_type', 'target_id']);
  });

  await knex.raw(`
    ALTER TABLE "reaction"
    ADD CONSTRAINT reaction_target_type_check
    CHECK (target_type IN ('mediaItem', 'comment'))
  `);

  await knex.raw(`
    ALTER TABLE "reaction"
    ADD CONSTRAINT reaction_emoji_not_empty_check
    CHECK (char_length(emoji) > 0)
  `);

  await knex.schema.table('media_item', (table) => {
    table.jsonb('reaction_counts').notNullable().defaultTo('{}');
  });

  await knex.schema.table('comment', (table) => {
    table.jsonb('reaction_counts').notNullable().defaultTo('{}');
  });
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.schema.table('comment', (table) => {
    table.dropColumn('reaction_counts');
  });

  await knex.schema.table('media_item', (table) => {
    table.dropColumn('reaction_counts');
  });

  await knex.schema.dropTableIfExists('reaction');
};
