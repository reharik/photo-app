import type { Knex } from 'knex';

export const up = async (knex: Knex): Promise<void> => {
  await knex.schema.createTable('grant', (table) => {
    table.uuid('id').primary();
    table
      .uuid('media_item_id')
      .notNullable()
      .references('id')
      .inTable('media_item')
      .onDelete('CASCADE');
    table.uuid('access_grant_id').nullable(); // FK added when access_grant table exists
    table.uuid('granted_to_user').nullable().references('id').inTable('user').onDelete('CASCADE');
    table.text('token_hash').nullable();
    table.text('source').notNullable();
    table.uuid('source_id').notNullable();
    table.uuid('source_album_id').nullable().references('id').inTable('album').onDelete('SET NULL');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.index(['media_item_id', 'granted_to_user']);
    table.index(['media_item_id', 'token_hash']);
    table.index(['source_id']);
    table.index(['source_album_id']);
  });

  await knex.raw(`
    ALTER TABLE "grant"
    ADD CONSTRAINT grant_source_check
    CHECK (source IN ('direct_share', 'album_share', 'album_member'))
  `);

  await knex.raw(`
    ALTER TABLE "grant"
    ADD CONSTRAINT grant_subject_xor_check
    CHECK (
      (granted_to_user IS NOT NULL AND token_hash IS NULL) OR
      (granted_to_user IS NULL AND token_hash IS NOT NULL)
    )
  `);
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.schema.dropTableIfExists('grant');
};
