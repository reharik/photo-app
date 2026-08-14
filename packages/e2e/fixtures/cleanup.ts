import { getDb } from './db';

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
 * S3 objects are NOT touched — pre-existing behavior; teardown has never
 * cleaned storage.
 */
export const cleanupTestUser = async (userId: string): Promise<void> => {
  const db = getDb();

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
  await getDb()('user').whereRaw('lower(email) = ?', email.toLowerCase()).delete();
};
