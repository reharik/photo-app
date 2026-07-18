import type { Knex } from 'knex';

// Pure rename: unseen_activity -> in_app_notification. No column/shape changes.
export async function up(knex: Knex): Promise<void> {
  await knex.schema.renameTable('unseen_activity', 'in_app_notification');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.renameTable('in_app_notification', 'unseen_activity');
}
