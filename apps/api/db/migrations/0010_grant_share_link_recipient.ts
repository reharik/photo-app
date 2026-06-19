import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE "grant"
    ALTER COLUMN access_grant_id SET NOT NULL
  `);

  await knex.schema.alterTable('grant', (table) => {
    table
      .uuid('share_link_id')
      .nullable()
      .references('id')
      .inTable('share_link')
      .onDelete('CASCADE');
  });

  await knex.raw(`
    ALTER TABLE "grant"
    ADD CONSTRAINT grant_one_recipient
    CHECK (num_nonnulls(granted_to_user, share_link_id) = 1)
  `);

  await knex.raw(`
    ALTER TABLE "grant"
    ADD CONSTRAINT grant_media_item_access_grant_unique UNIQUE (media_item_id, access_grant_id)
  `);

  await knex.schema.alterTable('grant', (table) => {
    table.index(['share_link_id', 'media_item_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('grant', (table) => {
    table.dropIndex(['share_link_id', 'media_item_id']);
  });

  await knex.raw(`
    ALTER TABLE "grant"
    DROP CONSTRAINT grant_one_recipient
  `);

  await knex.raw(`
    ALTER TABLE "grant"
    DROP CONSTRAINT grant_media_item_access_grant_unique
  `);

  await knex.schema.alterTable('grant', (table) => {
    table.dropColumn('share_link_id');
  });

  await knex.raw(`
    ALTER TABLE "grant"
    ALTER COLUMN access_grant_id DROP NOT NULL
  `);
}
