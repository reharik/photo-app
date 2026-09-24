import type { Knex } from 'knex';

/**
 * Add a per-account video flag: `user.video_enabled`.
 *
 * boolean, NOT NULL, default false. The default fills every existing row as the column
 * is added, so there is no separate backfill and no nullable interim state. Default
 * false rather than true: video is opt-in per account, so existing users keep today's
 * behaviour (photo only) until the flag is flipped for them.
 *
 * Nothing reads the column yet — no service or resolver wiring in this change. The
 * schema lands first so the flag exists to gate against.
 *
 * No import from @packages/contracts — no enum literals here, but the rule holds
 * regardless: migrations are compiled by plain `tsc` (tsconfig.db.json) and their
 * imports survive as live runtime specifiers, while the prod image never copies
 * `packages/`. See 0031's closing note for the full mechanics.
 */

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('user', (table) => {
    // per-account opt-in for video uploads
    table.boolean('video_enabled').notNullable().defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('user', (table) => {
    table.dropColumn('video_enabled');
  });
}
