import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('pending_notification', (table) => {
    // the user who triggered the activity (optional); nullable so a deleted
    // actor leaves the notification intact (SET NULL, not CASCADE)
    table.uuid('actor_id').nullable().references('id').inTable('user').onDelete('SET NULL');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('pending_notification', (table) => {
    table.dropColumn('actor_id');
  });
}
