import { getDb } from './db';

/**
 * Clears the two tables that reference `access_grant` WITHOUT `ON DELETE CASCADE`.
 *
 * `email_delivery.access_grant_id` (migration 0029) and
 * `async_notification.access_grant_id` (0032) are deliberately plain FKs: grants are
 * soft-deleted in the app (`revoked_at`), so a hard delete is meant to fail loudly
 * rather than silently drop the attribution. Teardown is the one place that DOES hard
 * delete, and every route below removes grants by cascade — so these rows have to go
 * first or the cascade hits RESTRICT and the whole delete aborts.
 *
 * Grants reachable from a user, matching the cascade paths the deletes rely on:
 * `granted_by` / `granted_to_user` (via the user delete), `album_id` (via the album
 * delete), and `media_item_id` (via the user delete cascading `media_item`).
 */
export const clearGrantDeliveryRecords = async (userIds: string[]): Promise<void> => {
  if (userIds.length === 0) {
    return;
  }
  const db = getDb();
  const grantIds = db('access_grant')
    .select('id')
    .whereIn('granted_by', userIds)
    .orWhereIn('granted_to_user', userIds)
    .orWhereIn('album_id', db('album').select('id').whereIn('created_by', userIds))
    .orWhereIn('media_item_id', db('media_item').select('id').whereIn('owner_id', userIds));

  await db('email_delivery').whereIn('access_grant_id', grantIds).delete();
  await db('async_notification').whereIn('access_grant_id', grantIds).delete();
};

/**
 * Deletes a factory-created test user and everything they produced. Teardown
 * only — tests must create media and albums through the UI, not via direct DB
 * inserts.
 *
 * Order matters; the user delete cascades MOST of the graph but not all of it:
 *
 * 1. `comment` — `comment.author_id`/`created_by` are ON DELETE SET NULL (not
 *    CASCADE), so the user's comments would survive as anonymized rows, and
 *    `comment.target_id` is polymorphic with no FK, so comments on the user's
 *    media would orphan. Must run while the `media_item` rows still exist for
 *    the subquery.
 * 2. `album` — `album.created_by` is a bare uuid with NO FK; albums survive a
 *    user delete as dangling rows. Deleting them cascades `album_item`,
 *    `album_member`, and album-scoped `access_grant` (→ `grant`).
 * 3. `user` — cascades everything else: `media_item` (→ `album_item`, `grant`,
 *    media-scoped `access_grant`, `media_asset`, `media_processing_job`,
 *    `media_item_tag`), `reaction`, `share_contact` (both directions),
 *    `access_grant` (granted_by AND granted_to_user), `grant`
 *    (granted_to_user), `async_notification`, `in_app_notification`.
 *
 * Step 0 (`clearGrantDeliveryRecords`) exists because two tables reference
 * `access_grant` withOUT a cascade and would block steps 2 and 3; see its doc.
 *
 * S3 objects are NOT touched — pre-existing behavior; teardown has never
 * cleaned storage.
 */
export const cleanupTestUser = async (userId: string): Promise<void> => {
  const db = getDb();

  // Must precede the album and user deletes — both cascade into `access_grant`.
  await clearGrantDeliveryRecords([userId]);

  await db('comment')
    .where({ created_by: userId })
    .orWhereIn('target_id', db('media_item').select('id').where({ owner_id: userId }))
    .delete();

  await db('album').where({ created_by: userId }).delete();

  await db('user').where({ id: userId }).delete();
};

/**
 * Removes the shadow (pending) recipient user created when a share targets an email
 * that isn't yet a user. Recipient emails are per-test unique, so this exists to stop
 * shadow users accumulating across runs, not to defend against cross-spec reuse.
 * Every FK into `user` is ON DELETE CASCADE, so deleting the row also clears its
 * grants, share-contacts, and pending notifications.
 */
export const cleanupRecipientByEmail = async (email: string): Promise<void> => {
  const db = getDb();
  const users = await db<{ id: string }>('user')
    .whereRaw('lower(email) = ?', email.toLowerCase())
    .select('id');
  await clearGrantDeliveryRecords(users.map((u) => u.id));
  await db('user').whereRaw('lower(email) = ?', email.toLowerCase()).delete();
};
