import type { Knex } from 'knex';

// Adds a `count` (weight) column to `rate_limit_event` so one call can consume
// multiple units — e.g. a request carrying 10 items spends 10 against the
// window in a single row, instead of the limiter only seeing "1 request".
// Existing rows and single-unit callers default to 1, so nothing re-counts.

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('rate_limit_event', (table) => {
    table.integer('count').notNullable().defaultTo(1);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('rate_limit_event', (table) => {
    table.dropColumn('count');
  });
}
