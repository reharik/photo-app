import type { Knex } from 'knex';

// Pure column rename on both notification tables:
//   target_type -> container_type, target_id -> container_id  (the containing entity)
//   source_type -> subject_type,   source_id -> subject_id    (the new/finer entity)
//
// Both tables carry all four columns. Each has a unique constraint referencing the
// renamed columns; we drop the constraint first, rename, then recreate it against the
// new names — keeping the EXISTING (stale-prefixed) constraint names unchanged. Name
// cleanup is deferred to a later schema squash. renameColumn preserves data.
const ASYNC_UNIQUE = 'async_notification_unique'; // (channel, kind, recipient_id, <container>)
const IN_APP_UNIQUE = 'unseen_activity_replay_key'; // stale prefix, kept as-is on purpose

export async function up(knex: Knex): Promise<void> {
  // ---- async_notification ----
  await knex.raw(`ALTER TABLE async_notification DROP CONSTRAINT IF EXISTS ${ASYNC_UNIQUE}`);

  await knex.schema.alterTable('async_notification', (table) => {
    table.renameColumn('target_type', 'container_type');
    table.renameColumn('target_id', 'container_id');
    table.renameColumn('source_type', 'subject_type');
    table.renameColumn('source_id', 'subject_id');
  });

  await knex.raw(`
    ALTER TABLE async_notification
    ADD CONSTRAINT ${ASYNC_UNIQUE}
    UNIQUE (channel, kind, recipient_id, container_type, container_id)
  `);

  // ---- in_app_notification ----
  await knex.raw(`ALTER TABLE in_app_notification DROP CONSTRAINT IF EXISTS ${IN_APP_UNIQUE}`);

  await knex.schema.alterTable('in_app_notification', (table) => {
    table.renameColumn('target_type', 'container_type');
    table.renameColumn('target_id', 'container_id');
    table.renameColumn('source_type', 'subject_type');
    table.renameColumn('source_id', 'subject_id');
  });

  await knex.raw(`
    ALTER TABLE in_app_notification
    ADD CONSTRAINT ${IN_APP_UNIQUE}
    UNIQUE (viewer_id, container_type, container_id, subject_type, subject_id)
  `);
}

export async function down(knex: Knex): Promise<void> {
  // ---- in_app_notification ----
  await knex.raw(`ALTER TABLE in_app_notification DROP CONSTRAINT IF EXISTS ${IN_APP_UNIQUE}`);

  await knex.schema.alterTable('in_app_notification', (table) => {
    table.renameColumn('container_type', 'target_type');
    table.renameColumn('container_id', 'target_id');
    table.renameColumn('subject_type', 'source_type');
    table.renameColumn('subject_id', 'source_id');
  });

  await knex.raw(`
    ALTER TABLE in_app_notification
    ADD CONSTRAINT ${IN_APP_UNIQUE}
    UNIQUE (viewer_id, target_type, target_id, source_type, source_id)
  `);

  // ---- async_notification ----
  await knex.raw(`ALTER TABLE async_notification DROP CONSTRAINT IF EXISTS ${ASYNC_UNIQUE}`);

  await knex.schema.alterTable('async_notification', (table) => {
    table.renameColumn('container_type', 'target_type');
    table.renameColumn('container_id', 'target_id');
    table.renameColumn('subject_type', 'source_type');
    table.renameColumn('subject_id', 'source_id');
  });

  await knex.raw(`
    ALTER TABLE async_notification
    ADD CONSTRAINT ${ASYNC_UNIQUE}
    UNIQUE (channel, kind, recipient_id, target_type, target_id)
  `);
}
