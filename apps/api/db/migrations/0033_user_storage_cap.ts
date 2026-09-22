import type { Knex } from 'knex';

/**
 * Add a per-account storage cap: `user.storage_cap_bytes`, plus an index on
 * `media_item.owner_id` for the usage sum that is checked against it.
 *
 * Cap: bigint, NOT NULL, default 5368709120 (5 GiB). The default fills every existing
 * row as the column is added, so there is no separate backfill and no nullable interim
 * state. bigint rather than integer because integer tops out at ~2 GiB.
 *
 * Usage is not stored. It is computed per upload as
 * SUM(media_item.size_bytes) over the owner's items, excluding the FAILED /
 * DELETE_PENDING / DELETE_FAILED statuses and PENDING items older than the presigned-URL
 * TTL. media_item.size_bytes is already bigint (0001), so no widening is needed. Bytes
 * are counted at the uploaded size; derivatives (media_asset) are not counted.
 *
 * Index: the usage sum filters media_item by owner_id, and Postgres does not index
 * foreign keys on its own — media_item.owner_id has had no index since 0001. A plain
 * single-column index. The status and created_at predicates are applied to the owner's
 * rows, which is a small set per user; a composite isn't worth it yet.
 *
 * No import from @packages/contracts — no enum literals here, but the rule holds
 * regardless: migrations are compiled by plain `tsc` (tsconfig.db.json) and their
 * imports survive as live runtime specifiers, while the prod image never copies
 * `packages/`. See 0031's closing note for the full mechanics.
 */

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('user', (table) => {
    // per-account upload quota in bytes; 5 GiB default
    table.bigInteger('storage_cap_bytes').notNullable().defaultTo(5368709120);
  });

  await knex.schema.alterTable('media_item', (table) => {
    table.index('owner_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('media_item', (table) => {
    table.dropIndex('owner_id');
  });

  await knex.schema.alterTable('user', (table) => {
    table.dropColumn('storage_cap_bytes');
  });
}
