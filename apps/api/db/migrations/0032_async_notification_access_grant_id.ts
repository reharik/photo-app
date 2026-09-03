import type { Knex } from 'knex';

/**
 * Add `access_grant_id` to async_notification.
 *
 * `email_delivery.access_grant_id` (0029) is the join key the share-modal roster uses
 * to show delivery state on a row, but nothing populates it: the send paths in the
 * worker see only what the async_notification row carries, and that row carried no
 * grant reference. The domain events that drive enqueue DO carry the id
 * (`albumSharedWithUser.authorizationId`, `albumSharedWithPendingUser.authorizationId`)
 * — it was simply dropped at the queue boundary. This column reopens that path; the
 * app-side threading lands separately.
 *
 * Naming: the table is `access_grant`, so the column is `access_grant_id` and the prop
 * is `accessGrantId`, matching 0029. The domain calls the concept an Authorization.
 * That divergence is deliberate and is not being reconciled here.
 *
 * Nullable, and permanently so — this is not a column awaiting a NOT NULL follow-up.
 * Three of the five enqueue paths (mediaItemAddedToAlbum, commentPosted, reactionAdded)
 * describe activity on an album or item rather than on a grant, and their events carry
 * no authorization at all. Those are also exactly the batched kinds, which fan into one
 * per-recipient digest spanning many albums — nothing a single grant could describe.
 * Only the two `immediate` kinds (albumShared, guestAlbumShared) can be attributed.
 *
 * Plain FK, no cascade: matches 0029's `email_delivery.access_grant_id`. A revoked
 * grant is soft-deleted (revoked_at), not removed, so ON DELETE behaviour is
 * unexercised in practice; leaving it at the default RESTRICT means a hard delete of a
 * grant fails loudly against any queue row still referencing it rather than silently
 * nulling out the attribution.
 *
 * No backfill. async_notification holds transient queue rows: they are claimed, sent,
 * and deleted within a debounce window (see deleteCompletedRecords). Any row present
 * when this runs is either about to be sent with a null attribution or about to be
 * deleted; neither is worth reconstructing, and the grant id is not recoverable from
 * the row for the batched kinds anyway.
 *
 * Index for the same reason 0029 indexed its copy: the roster lookup is by grant.
 *
 * No import from @packages/contracts — no enum literals here, but the rule holds
 * regardless: migrations are compiled by plain `tsc` (tsconfig.db.json) and their
 * imports survive as live runtime specifiers, while the prod image never copies
 * `packages/`. See 0031's closing note for the full mechanics.
 */

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('async_notification', (table) => {
    // the grant this notification was minted for; null for grant-less activity kinds
    table.uuid('access_grant_id').nullable().references('id').inTable('access_grant');

    table.index('access_grant_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('async_notification', (table) => {
    // drops the FK and the index with it
    table.dropColumn('access_grant_id');
  });
}
