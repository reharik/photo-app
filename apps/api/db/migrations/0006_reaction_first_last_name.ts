import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('reactions', (table) => {
    table.string('first_name').nullable();
    table.string('last_name').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('reactions', (table) => {
    table.dropColumn('first_name');
    table.dropColumn('last_name');
  });
}
