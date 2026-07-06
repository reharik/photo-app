import type { Knex } from 'knex';

// pending_notification.recipient_id assumed the recipient is always a user (FK -> user),
// and the send path resolves the address from that user. Non-user deliveries (a public
// link shared to a raw email address; SMS to a phone number later) have no user row, so
// the destination itself is the identity. Make the recipient polymorphic:
//
//   recipient_id       -> user reference; contact resolved LATE at send time
//   recipient_address  -> literal destination (email/phone), interpreted per `channel`
//
// Exactly one is set (CHECK). The address is NOT smuggled into `data` (that column is the
// template payload, not recipient identity).
//
// The dedup/upsert key gains recipient_address and switches to NULLS NOT DISTINCT so the
// now-nullable half of the recipient still collapses duplicates (standard SQL treats NULLs
// as distinct, which would silently break dedup for both row shapes).

// Columns of the ORIGINAL unique constraint (created via table.unique([...]) in 0011, so it
// carries an auto-generated, possibly-truncated name we must discover to drop).
const ORIGINAL_UNIQUE_COLUMNS = [
  'channel',
  'kind',
  'recipient_id',
  'aggregate_type',
  'aggregate_id',
];

const UNIQUE_NAME = 'pending_notification_unique';
const RECIPIENT_CHECK_NAME = 'pending_notification_recipient_target';

// Drops whatever unique constraint currently spans ORIGINAL_UNIQUE_COLUMNS on
// pending_notification, regardless of its (possibly truncated) auto-generated name.
async function dropOriginalUniqueConstraint(knex: Knex): Promise<void> {
  // A `DO` block cannot take bind parameters, so the column list is inlined as a literal
  // array. ORIGINAL_UNIQUE_COLUMNS is a hardcoded constant (not user input) — no injection.
  const columnArrayLiteral = `ARRAY[${ORIGINAL_UNIQUE_COLUMNS.map((c) => `'${c}'`).join(', ')}]::text[]`;
  await knex.raw(`
    DO $$
    DECLARE
      con_name text;
    BEGIN
      SELECT conname INTO con_name
      FROM pg_constraint
      WHERE conrelid = 'pending_notification'::regclass
        AND contype = 'u'
        AND (
          SELECT array_agg(attname::text ORDER BY attname::text)
          FROM unnest(conkey) AS k(attnum)
          JOIN pg_attribute a ON a.attrelid = conrelid AND a.attnum = k.attnum
        ) = (SELECT array_agg(c ORDER BY c) FROM unnest(${columnArrayLiteral}) AS c);

      IF con_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE pending_notification DROP CONSTRAINT %I', con_name);
      END IF;
    END $$;
  `);
}

export async function up(knex: Knex): Promise<void> {
  await dropOriginalUniqueConstraint(knex);

  await knex.schema.alterTable('pending_notification', (table) => {
    // user reference is now optional (FK + CASCADE unchanged)
    table.setNullable('recipient_id');
    // literal destination for non-user deliveries; meaning is `channel`-typed
    table.text('recipient_address').nullable();
  });

  // exactly one of (recipient_id, recipient_address) is present
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

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`ALTER TABLE pending_notification DROP CONSTRAINT IF EXISTS ${UNIQUE_NAME}`);
  await knex.raw(
    `ALTER TABLE pending_notification DROP CONSTRAINT IF EXISTS ${RECIPIENT_CHECK_NAME}`,
  );

  // recipient_id becomes NOT NULL again — address-only rows exist only because of this
  // feature, so drop them before restoring the constraint.
  await knex('pending_notification').whereNull('recipient_id').del();

  await knex.schema.alterTable('pending_notification', (table) => {
    table.dropColumn('recipient_address');
    table.dropNullable('recipient_id');
    // restores the original auto-named unique from 0011
    table.unique(ORIGINAL_UNIQUE_COLUMNS);
  });
}
