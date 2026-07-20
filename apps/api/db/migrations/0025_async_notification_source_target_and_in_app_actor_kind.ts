import type { Knex } from 'knex';

const ASYNC_UNIQUE = 'pending_notification_unique'; // existing (pre-rename) constraint name

export async function up(knex: Knex): Promise<void> {
  // ---- async_notification ----
  // source_* are NOT NULL with no default; existing rows can't satisfy that and the
  // data is disposable, so truncate first (zero backfill ceremony).
  await knex.raw('TRUNCATE TABLE async_notification');

  await knex.raw(`ALTER TABLE async_notification DROP CONSTRAINT IF EXISTS ${ASYNC_UNIQUE}`);

  await knex.schema.alterTable('async_notification', (table) => {
    table.renameColumn('aggregate_type', 'target_type');
    table.renameColumn('aggregate_id', 'target_id');
    table.text('source_type').notNullable(); // the generator, e.g. COMMENT
    table.uuid('source_id').notNullable(); // polymorphic → no FK
  });

  // recreate the dedup/upsert key against the renamed columns (same 5-col arity the
  // app's onConflict infers on — source_* deliberately NOT included)
  await knex.raw(`
    ALTER TABLE async_notification
    ADD CONSTRAINT async_notification_unique
    UNIQUE (channel, kind, recipient_id, target_type, target_id)
  `);

  // ---- in_app_notification ----
  await knex.schema.alterTable('in_app_notification', (table) => {
    table.renameColumn('activity_kind', 'kind');
    // actor who triggered the activity (optional); polymorphic-adjacent, no FK
    table.uuid('actor_id').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  // ---- in_app_notification ----
  await knex.schema.alterTable('in_app_notification', (table) => {
    table.dropColumn('actor_id');
    table.renameColumn('kind', 'activity_kind');
  });

  // ---- async_notification ----
  await knex.raw(
    'ALTER TABLE async_notification DROP CONSTRAINT IF EXISTS async_notification_unique',
  );

  await knex.schema.alterTable('async_notification', (table) => {
    table.dropColumn('source_type');
    table.dropColumn('source_id');
    table.renameColumn('target_type', 'aggregate_type');
    table.renameColumn('target_id', 'aggregate_id');
  });

  await knex.raw(`
    ALTER TABLE async_notification
    ADD CONSTRAINT ${ASYNC_UNIQUE}
    UNIQUE (channel, kind, recipient_id, aggregate_type, aggregate_id)
  `);
}
