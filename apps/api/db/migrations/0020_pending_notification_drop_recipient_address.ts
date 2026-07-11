import type { Knex } from 'knex';

// Reverts the polymorphic-recipient change from 0016: pending_notification recipients are
// always users again. Drops `recipient_address`, restores `recipient_id` NOT NULL, and swaps
// the 6-column NULLS-NOT-DISTINCT dedup key back to the original 5-column unique
// (channel, kind, recipient_id, aggregate_type, aggregate_id) that the upsert targets.

const UNIQUE_NAME = 'pending_notification_unique';
const RECIPIENT_CHECK_NAME = 'pending_notification_recipient_target';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`ALTER TABLE pending_notification DROP CONSTRAINT IF EXISTS ${UNIQUE_NAME}`);
  await knex.raw(
    `ALTER TABLE pending_notification DROP CONSTRAINT IF EXISTS ${RECIPIENT_CHECK_NAME}`,
  );

  // Address-only rows have no user recipient; they cannot survive a NOT NULL recipient_id.
  await knex('pending_notification').whereNull('recipient_id').del();

  await knex.schema.alterTable('pending_notification', (table) => {
    table.dropColumn('recipient_address');
    table.dropNullable('recipient_id');
  });

  await knex.raw(`
    ALTER TABLE pending_notification
    ADD CONSTRAINT ${UNIQUE_NAME}
    UNIQUE (channel, kind, recipient_id, aggregate_type, aggregate_id)
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`ALTER TABLE pending_notification DROP CONSTRAINT IF EXISTS ${UNIQUE_NAME}`);

  await knex.schema.alterTable('pending_notification', (table) => {
    table.setNullable('recipient_id');
    table.text('recipient_address').nullable();
  });

  await knex.raw(`
    ALTER TABLE pending_notification
    ADD CONSTRAINT ${RECIPIENT_CHECK_NAME}
    CHECK ((recipient_id IS NOT NULL) <> (recipient_address IS NOT NULL))
  `);

  await knex.raw(`
    ALTER TABLE pending_notification
    ADD CONSTRAINT ${UNIQUE_NAME}
    UNIQUE NULLS NOT DISTINCT (channel, kind, recipient_id, recipient_address, aggregate_type, aggregate_id)
  `);
}
