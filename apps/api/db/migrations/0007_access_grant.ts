import type { Knex } from 'knex';

export const up = async (knex: Knex): Promise<void> => {
  await knex.schema.createTable('access_grant', (table) => {
    table.uuid('id').primary();
    table
      .uuid('media_item_id')
      .nullable()
      .references('id')
      .inTable('media_item')
      .onDelete('CASCADE');
    table.uuid('album_id').nullable().references('id').inTable('album').onDelete('CASCADE');
    table.uuid('granted_by').notNullable().references('id').inTable('user').onDelete('CASCADE');
    table.uuid('granted_to_user').nullable().references('id').inTable('user').onDelete('CASCADE');
    table.text('token').nullable();
    table.text('permission').notNullable();
    table.text('description').nullable();
    table.timestamp('expires_at', { useTz: true }).nullable();
    table.timestamp('revoked_at', { useTz: true }).nullable();
    table.timestamp('created_at', { useTz: false }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: false }).notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.uuid('updated_by').notNullable();

    table.index(['media_item_id', 'granted_to_user']);
    table.index(['media_item_id', 'token']);
    table.index(['album_id', 'granted_to_user']);
    table.index(['album_id', 'token']);
    table.index(['granted_by']);
  });

  await knex.raw(`
    ALTER TABLE "access_grant"
    ADD CONSTRAINT access_grant_permission_check
    CHECK (permission IN ('view', 'download', 'contribute'))
  `);

  await knex.raw(`
    ALTER TABLE "access_grant"
    ADD CONSTRAINT access_grant_media_xor_album_check
    CHECK (
      (media_item_id IS NOT NULL AND album_id IS NULL) OR
      (media_item_id IS NULL AND album_id IS NOT NULL)
    )
  `);

  await knex.raw(`
    ALTER TABLE "access_grant"
    ADD CONSTRAINT access_grant_user_xor_token_check
    CHECK (
      (granted_to_user IS NOT NULL AND token IS NULL) OR
      (granted_to_user IS NULL AND token IS NOT NULL)
    )
  `);
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.schema.dropTableIfExists('access_grant');
};
