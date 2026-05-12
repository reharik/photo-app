import type { Knex } from 'knex';

/**
 * Consolidated baseline schema for PhotoApp (PostgreSQL); replaces migrations 0001–0013.
 * Use string/varchar columns for enum-like fields. Do NOT use Postgres enum types.
 *
 * After replacing migration history: truncate `knex_migrations` (or equivalent) and insert a single
 * row for `0001_init_schema.ts` before applying on fresh DBs.
 */
export const up = async (knex: Knex): Promise<void> => {
  await knex.schema.createTable('user', (table) => {
    table.uuid('id').primary();
    table.string('email', 255).notNullable().unique();
    table.string('first_name', 255).notNullable();
    table.string('last_name', 255).notNullable();
    table.string('phone', 64).nullable();
    table.string('address_line1', 512).nullable();
    table.string('address_line2', 512).nullable();
    table.string('city', 255).nullable();
    table.string('postal_code', 32).nullable();
    table.string('state', 128).nullable();
    table.string('country', 128).nullable();
    table.string('password_hash', 255).nullable();
    table.timestamp('last_login_at', { useTz: false }).nullable();
    table.boolean('email_verified').notNullable().defaultTo(false);
    table.timestamp('created_at', { useTz: false }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: false }).notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.uuid('updated_by').notNullable();
  });

  await knex.schema.createTable('media_item', (table) => {
    table.uuid('id').primary();
    table.uuid('owner_id').notNullable().references('id').inTable('user').onDelete('CASCADE');
    table.string('kind', 32).notNullable();
    table.string('storage_key', 1024).notNullable();
    table.string('mime_type', 128).notNullable();
    table.bigInteger('size_bytes').notNullable();
    table.integer('width').nullable();
    table.integer('height').nullable();
    table.integer('duration_seconds').nullable();
    table.string('title', 512).nullable();
    table.text('description').nullable();
    table.timestamp('taken_at', { useTz: false }).nullable();
    table.string('status', 32).notNullable().defaultTo('pending');
    table.string('original_file_name', 1024).nullable();
    table.timestamp('created_at', { useTz: false }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: false }).notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.uuid('updated_by').notNullable();
  });

  await knex.schema.createTable('album', (table) => {
    table.uuid('id').primary();
    table.string('title', 512).notNullable();
    table
      .uuid('cover_media_id')
      .nullable()
      .references('id')
      .inTable('media_item')
      .onDelete('SET NULL');
    table.boolean('is_public_link_album').notNullable().defaultTo(false);
    table.timestamp('created_at', { useTz: false }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: false }).notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.uuid('updated_by').notNullable();
  });

  await knex.schema.createTable('album_member', (table) => {
    table.uuid('id').primary();
    table.uuid('album_id').notNullable().references('id').inTable('album').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('user').onDelete('CASCADE');
    table.string('role', 32).notNullable();
    table.timestamp('created_at', { useTz: false }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: false }).notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.uuid('updated_by').notNullable();
    table.unique(['album_id', 'user_id']);
  });

  await knex.schema.createTable('album_item', (table) => {
    table.uuid('id').primary();
    table.uuid('album_id').notNullable().references('id').inTable('album').onDelete('CASCADE');
    table
      .uuid('media_item_id')
      .notNullable()
      .references('id')
      .inTable('media_item')
      .onDelete('CASCADE');
    table.bigInteger('order_index').notNullable();
    table.timestamp('created_at', { useTz: false }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: false }).notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.uuid('updated_by').notNullable();
    table.unique(['album_id', 'media_item_id']);
  });

  await knex.schema.createTable('comment', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());

    table.text('target_type').notNullable();
    table.uuid('target_id').notNullable();

    table
      .uuid('parent_comment_id')
      .nullable()
      .references('id')
      .inTable('comment')
      .onDelete('CASCADE');

    table.uuid('author_id').nullable().references('id').inTable('user').onDelete('SET NULL');

    table.text('body').notNullable();

    table.text('display_name').notNullable();
    table.text('display_avatar_url').nullable();

    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at', { useTz: true }).nullable();

    table.uuid('created_by').nullable().references('id').inTable('user').onDelete('SET NULL');
    table.uuid('updated_by').nullable().references('id').inTable('user').onDelete('SET NULL');

    table.boolean('is_edited').notNullable().defaultTo(false);

    table.index(['target_type', 'target_id', 'created_at']);
    table.index(['parent_comment_id']);
    table.index(['author_id']);
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

  await knex.schema.createTable('notification', (table) => {
    table.uuid('id').primary();
    table.uuid('recipient_id').notNullable().references('id').inTable('user').onDelete('CASCADE');
    table.string('kind', 32).notNullable();
    table.string('title', 512).notNullable();
    table.text('body').notNullable();
    table.timestamp('read_at', { useTz: false }).nullable();
    table.timestamp('created_at', { useTz: false }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: false }).notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.uuid('updated_by').notNullable();
  });

  await knex.schema.createTable('media_asset', (table) => {
    table.uuid('id').primary();
    table
      .uuid('media_item_id')
      .notNullable()
      .references('id')
      .inTable('media_item')
      .onDelete('CASCADE');
    table.string('kind', 32).notNullable();
    table.string('mime_type', 128).notNullable();
    table.integer('width').nullable();
    table.integer('height').nullable();
    table.bigInteger('file_size_bytes').nullable();
    table.string('status', 32).notNullable();
    table.timestamp('created_at', { useTz: false }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: false }).notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.uuid('updated_by').notNullable();
    table.unique(['media_item_id', 'kind']);
    table.index(['media_item_id']);
  });

  await knex.schema.createTable('media_processing_job', (table) => {
    table.uuid('id').primary();
    table
      .uuid('media_item_id')
      .notNullable()
      .references('id')
      .inTable('media_item')
      .onDelete('CASCADE');
    table.string('status', 32).notNullable();
    table.integer('attempt_count').notNullable().defaultTo(0);
    table.timestamp('available_at', { useTz: false }).notNullable();
    table.timestamp('started_at', { useTz: false }).nullable();
    table.timestamp('completed_at', { useTz: false }).nullable();
    table.text('last_error').nullable();
    table.timestamp('created_at', { useTz: false }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: false }).notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.uuid('updated_by').notNullable();
    table.index(['status', 'available_at']);
    table.index(['media_item_id']);
  });

  await knex.raw(`
    CREATE UNIQUE INDEX media_processing_job_one_active_per_media_item
    ON media_processing_job (media_item_id)
    WHERE status IN ('pending', 'processing')
  `);

  await knex.schema.createTable('user_tag', (table) => {
    table.uuid('id').primary();
    table.uuid('user_id').notNullable().references('id').inTable('user').onDelete('CASCADE');
    table.string('label', 512).notNullable();
    table.string('label_key', 512).notNullable();
    table.timestamp('created_at', { useTz: false }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: false }).notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.uuid('updated_by').notNullable();
    table.unique(['user_id', 'label_key']);
    table.index(['user_id']);
  });

  await knex.schema.createTable('media_item_tag', (table) => {
    table.uuid('id').primary();
    table
      .uuid('media_item_id')
      .notNullable()
      .references('id')
      .inTable('media_item')
      .onDelete('CASCADE');
    table
      .uuid('user_tag_id')
      .notNullable()
      .references('id')
      .inTable('user_tag')
      .onDelete('CASCADE');
    table.timestamp('created_at', { useTz: false }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: false }).notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.uuid('updated_by').notNullable();
    table.unique(['media_item_id', 'user_tag_id']);
    table.index(['user_tag_id']);
  });

  await knex.schema.createTable('media_deletion_job', (table) => {
    table.uuid('id').primary();
    table.uuid('media_item_id').notNullable();
    table.string('storage_key', 1024).notNullable();
    table.string('status', 32).notNullable();
    table.integer('attempt_count').notNullable().defaultTo(0);
    table.timestamp('available_at', { useTz: false }).notNullable();
    table.timestamp('started_at', { useTz: false }).nullable();
    table.timestamp('completed_at', { useTz: false }).nullable();
    table.text('last_error').nullable();
    table.timestamp('created_at', { useTz: false }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: false }).notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.uuid('updated_by').notNullable();
    table.index(['status', 'available_at']);
    table.index(['media_item_id']);
  });

  await knex.raw(`
    CREATE UNIQUE INDEX media_deletion_job_one_active_per_media_item
    ON media_deletion_job (media_item_id)
    WHERE status IN ('pending', 'processing')
  `);

  await knex.schema.createTable('share_link', (table) => {
    table.uuid('id').primary();
    table.text('link_token').notNullable().unique();
    table
      .uuid('album_id')
      .nullable()
      .references('id')
      .inTable('album')
      .onDelete('CASCADE');
    table.index(['album_id']);
    table.uuid('created_by').notNullable().references('id').inTable('user').onDelete('CASCADE');
    table
      .uuid('granted_by')
      .notNullable()
      .references('id')
      .inTable('user')
      .onDelete('CASCADE');
    table.index(['granted_by']);
    table
      .uuid('updated_by')
      .notNullable()
      .references('id')
      .inTable('user')
      .onDelete('CASCADE');
    table.timestamp('expires_at', { useTz: false }).nullable();
    table.timestamp('revoked_at', { useTz: false }).nullable();
    table.timestamp('created_at', { useTz: false }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: false }).notNullable().defaultTo(knex.fn.now());
  });

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
    table.text('permission').notNullable();
    table.text('description').nullable();
    table.timestamp('expires_at', { useTz: true }).nullable();
    table.timestamp('revoked_at', { useTz: true }).nullable();
    table.timestamp('created_at', { useTz: false }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: false }).notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.uuid('updated_by').notNullable();
    table.text('label').nullable();
    table
      .uuid('share_link_id')
      .nullable()
      .references('id')
      .inTable('share_link')
      .onDelete('SET NULL');

    table.index(['media_item_id', 'granted_to_user']);
    table.index(['album_id', 'granted_to_user']);
    table.index(['granted_by']);
  });

  await knex.raw(`
    ALTER TABLE "access_grant"
    ADD CONSTRAINT access_grant_permission_check
    CHECK (permission IN ('VIEW', 'COMMENT', 'DOWNLOAD'))
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
    ADD CONSTRAINT access_grant_share_link_id_unique UNIQUE (share_link_id)
  `);

  await knex.raw(`
    CREATE UNIQUE INDEX access_grant_media_item_granted_user_unique
    ON access_grant (media_item_id, granted_to_user)
  `);

  await knex.raw(`
    CREATE UNIQUE INDEX access_grant_album_granted_user_unique
    ON access_grant (album_id, granted_to_user)
  `);

  await knex.schema.createTable('grant', (table) => {
    table.uuid('id').primary();
    table
      .uuid('media_item_id')
      .notNullable()
      .references('id')
      .inTable('media_item')
      .onDelete('CASCADE');
    table
      .uuid('access_grant_id')
      .nullable()
      .references('id')
      .inTable('access_grant')
      .onDelete('CASCADE');
    table.uuid('granted_to_user').nullable().references('id').inTable('user').onDelete('CASCADE');
    table.string('permissions').nullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.index(['media_item_id', 'granted_to_user']);
  });

  await knex.schema.createTable('share_contact', (table) => {
    table.uuid('user_id').notNullable().references('id').inTable('user').onDelete('CASCADE');
    table
      .uuid('contact_user_id')
      .notNullable()
      .references('id')
      .inTable('user')
      .onDelete('CASCADE');
    table.text('handle').notNullable();
    table.timestamp('last_shared_at', { useTz: true }).notNullable();

    table.primary(['user_id', 'contact_user_id']);
    table.index(['user_id', 'last_shared_at']);
  });

  await knex.schema.createTable('share_link_grant', (table) => {
    table.uuid('id').primary();
    table
      .uuid('share_link_id')
      .notNullable()
      .references('id')
      .inTable('share_link')
      .onDelete('CASCADE');
    table
      .uuid('access_grant_id')
      .notNullable()
      .references('id')
      .inTable('access_grant')
      .onDelete('CASCADE');
    table.index(['share_link_id']);
    table.index(['access_grant_id']);
  });
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.raw('DROP INDEX IF EXISTS media_processing_job_one_active_per_media_item');
  await knex.raw('DROP INDEX IF EXISTS media_deletion_job_one_active_per_media_item');

  await knex.schema.dropTableIfExists('share_link_grant');
  await knex.schema.dropTableIfExists('share_contact');
  await knex.schema.dropTableIfExists('grant');
  await knex.raw('DROP INDEX IF EXISTS access_grant_media_item_granted_user_unique');
  await knex.raw('DROP INDEX IF EXISTS access_grant_album_granted_user_unique');
  await knex.schema.dropTableIfExists('access_grant');
  await knex.schema.dropTableIfExists('share_link');
  await knex.schema.dropTableIfExists('media_item_tag');
  await knex.schema.dropTableIfExists('user_tag');
  await knex.schema.dropTableIfExists('media_deletion_job');
  await knex.schema.dropTableIfExists('media_processing_job');
  await knex.schema.dropTableIfExists('media_asset');
  await knex.schema.dropTableIfExists('notification');
  await knex.schema.dropTableIfExists('comment');
  await knex.schema.dropTableIfExists('album_item');
  await knex.schema.dropTableIfExists('album_member');
  await knex.schema.dropTableIfExists('album');
  await knex.schema.dropTableIfExists('media_item');
  await knex.schema.dropTableIfExists('user');
};
