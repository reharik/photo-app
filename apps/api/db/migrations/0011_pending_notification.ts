import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('pending_notification', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // delivery channel: 'email' | 'sms' (validated in app code)
    table.text('channel').notNullable();
    // notification kind: 'album_activity' (more later; validated in app code)
    table.text('kind').notNullable();

    table
      .uuid('recipient_id')
      .notNullable()
      .references('id')
      .inTable('user')
      .onDelete('CASCADE');

    // polymorphic ref: 'album' | 'mediaItem' (more later); no FK because polymorphic
    table.text('aggregate_type').notNullable();
    table.uuid('aggregate_id').notNullable();

    // bumped to NOW() on each new event (steady-drip debounce)
    table.timestamp('dirty_since', { useTz: true }).notNullable();
    // minimal channel/kind-specific payload
    table.jsonb('data').notNullable().defaultTo('{}');
    // send-failure retry counter
    table.integer('attempts').notNullable().defaultTo(0);

    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    // upsert conflict target: collapse many events for the same
    // (delivery, kind, recipient, thing) into one pending row
    table.unique(['channel', 'kind', 'recipient_id', 'aggregate_type', 'aggregate_id']);

    // cron sweep scans by dirty_since (rows quiet longer than the threshold)
    table.index(['dirty_since']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('pending_notification');
}
