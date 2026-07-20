import type { Knex } from 'knex';

// Add `surface` to in_app_notification: the nav destination the dot should light —
// ActivitySurface smart-enum (.value: ALBUMS | RECENT | SHARED_ALBUMS | SHARED_ITEMS).
// Computed at write time from kind + the recipient's ownership of the target
// (see inAppWriter.ts), so the FE stops re-deriving owned-vs-shared from kind alone.
//
// NOT NULL with no default; in_app_notification is disposable tracking data, so
// truncate rather than backfill (same idiom as 0022/0025).
export async function up(knex: Knex): Promise<void> {
  await knex.raw('TRUNCATE TABLE in_app_notification');

  await knex.schema.alterTable('in_app_notification', (table) => {
    table.text('surface').notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('in_app_notification', (table) => {
    table.dropColumn('surface');
  });
}
