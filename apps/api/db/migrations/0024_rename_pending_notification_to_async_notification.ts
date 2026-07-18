import type { Knex } from 'knex';

// Pure rename: pending_notification -> async_notification. No column/shape changes.
export async function up(knex: Knex): Promise<void> {
  await knex.schema.renameTable('pending_notification', 'async_notification');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.renameTable('async_notification', 'pending_notification');
}
