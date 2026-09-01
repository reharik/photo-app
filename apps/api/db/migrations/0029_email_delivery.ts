import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('email_delivery', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.text('ses_message_id').notNullable().unique();
    table.uuid('access_grant_id').nullable().references('id').inTable('access_grant');
    table.text('email_kind').notNullable();
    table.text('recipient_email').notNullable();
    table.text('status').notNullable();
    table.text('bounce_type').nullable();
    table.text('diagnostic_code').nullable();
    table.jsonb('last_event').nullable();
    table.timestamp('sent_at', { useTz: true }).notNullable();
    table.timestamp('status_updated_at', { useTz: true }).nullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.uuid('updated_by').notNullable();

    table.index('access_grant_id');
  });

  // Hand-written SQL: values must match smart-enum wire format exactly — CONSTANT_CASE
  await knex.raw(`
    ALTER TABLE email_delivery
    ADD CONSTRAINT email_delivery_status_check
    CHECK (status IN ('SENT', 'DELIVERED', 'BOUNCED', 'REJECTED', 'COMPLAINED'))
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('email_delivery');
}
