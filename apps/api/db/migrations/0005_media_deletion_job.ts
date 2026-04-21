import type { Knex } from 'knex';

/**
 * Durable media deletion work queue. `media_item_id` is not a foreign key so the worker can
 * finish storage cleanup after the API has already removed the row (snapshot `storage_key` is authoritative for S3 keys).
 */
export const up = async (knex: Knex): Promise<void> => {
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
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.raw('DROP INDEX IF EXISTS media_deletion_job_one_active_per_media_item');
  await knex.schema.dropTableIfExists('media_deletion_job');
};
