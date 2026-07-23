import type { Knex } from 'knex';

// Consolidated notification-table migration (squash of the former 0022–0027, none of
// which shipped past 0021 in production). Takes the post-0021 baseline straight to the
// final shape:
//
//   pending_notification  ->  async_notification
//     - aggregate_type/id     -> container_type/id   (the containing entity)
//     - + subject_type/id                            (the generator: comment/reaction/…)
//     - dedup unique rebuilt against container_*
//     - data / actor_id / attempts / dirty_since kept as-is
//
//   unseen_activity       ->  in_app_notification
//     - activity_kind         -> kind
//     - target_type/id        -> container_type/id
//     - + source -> subject_type/id                  (the generator)
//     - + actor_id (nullable, no FK — polymorphic-adjacent)
//     - + surface (nav destination for the dot; computed at write time)
//
// Both tables are disposable tracking/queue data whose new columns are NOT NULL with no
// default, so we truncate/recreate rather than backfill (same idiom as the originals).
// The `data` jsonb column on async_notification is intentionally retained (unused by the
// app now, kept as an escape hatch).

const ASYNC_UNIQUE = 'async_notification_unique';
const PENDING_UNIQUE = 'pending_notification_unique';
const IN_APP_REPLAY_KEY = 'unseen_activity_replay_key'; // stale prefix kept on purpose

export async function up(knex: Knex): Promise<void> {
  // ---- pending_notification -> async_notification ----
  await knex.raw('TRUNCATE TABLE pending_notification');
  await knex.raw(`ALTER TABLE pending_notification DROP CONSTRAINT IF EXISTS ${PENDING_UNIQUE}`);

  await knex.schema.renameTable('pending_notification', 'async_notification');

  await knex.schema.alterTable('async_notification', (table) => {
    table.renameColumn('aggregate_type', 'container_type');
    table.renameColumn('aggregate_id', 'container_id');
    table.text('subject_type').notNullable(); // the generator, e.g. COMMENT
    table.uuid('subject_id').notNullable(); // polymorphic → no FK
  });

  // 5-col dedup/upsert key the app's onConflict infers on (subject_* deliberately excluded)
  await knex.raw(`
    ALTER TABLE async_notification
    ADD CONSTRAINT ${ASYNC_UNIQUE}
    UNIQUE (channel, kind, recipient_id, container_type, container_id)
  `);

  // ---- unseen_activity -> in_app_notification ----
  await knex.schema.dropTableIfExists('unseen_activity');

  await knex.schema.createTable('in_app_notification', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    table.uuid('viewer_id').notNullable().references('id').inTable('user').onDelete('CASCADE'); // real user → FK is safe

    table.text('kind').notNullable(); // smart-enum .value: ALBUM_SHARED | COMMENT_POSTED | ITEM_ADDED | ITEM_SHARED | REPLY_POSTED

    table.text('container_type').notNullable(); // MEDIA_ITEM | ALBUM — the anchor / clear-grain
    table.uuid('container_id').notNullable(); // polymorphic → no FK

    table.text('subject_type').notNullable(); // COMMENT | MEDIA_ITEM — the generator
    table.uuid('subject_id').notNullable(); // polymorphic → no FK

    table.uuid('actor_id').nullable(); // who triggered it (optional); polymorphic-adjacent, no FK

    table.text('surface').notNullable(); // ActivitySurface .value: ALBUMS | RECENT | SHARED_ALBUMS | SHARED_ITEMS

    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.unique(['viewer_id', 'container_type', 'container_id', 'subject_type', 'subject_id'], {
      indexName: IN_APP_REPLAY_KEY,
    });

    // nav aggregate dot
    table.index(['viewer_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  // ---- in_app_notification -> unseen_activity (post-0021 shape) ----
  await knex.schema.dropTableIfExists('in_app_notification');

  await knex.schema.createTable('unseen_activity', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    table.uuid('viewer_id').notNullable().references('id').inTable('user').onDelete('CASCADE');

    table.text('target_type').notNullable();
    table.uuid('target_id').notNullable();

    table.text('activity_kind').notNullable();

    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['viewer_id']);
  });

  await knex.raw(`
    ALTER TABLE unseen_activity
    ADD CONSTRAINT unseen_activity_unique
    UNIQUE (viewer_id, target_type, target_id, activity_kind)
  `);

  // ---- async_notification -> pending_notification (post-0021 shape) ----
  await knex.raw(`ALTER TABLE async_notification DROP CONSTRAINT IF EXISTS ${ASYNC_UNIQUE}`);

  await knex.schema.alterTable('async_notification', (table) => {
    table.dropColumn('subject_type');
    table.dropColumn('subject_id');
    table.renameColumn('container_type', 'aggregate_type');
    table.renameColumn('container_id', 'aggregate_id');
  });

  await knex.schema.renameTable('async_notification', 'pending_notification');

  await knex.raw(`
    ALTER TABLE pending_notification
    ADD CONSTRAINT ${PENDING_UNIQUE}
    UNIQUE (channel, kind, recipient_id, aggregate_type, aggregate_id)
  `);
}
