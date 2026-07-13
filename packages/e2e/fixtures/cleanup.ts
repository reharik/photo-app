import { getDb } from './db';

/**
 * Deletes rows created during tests for `ownerId`. Teardown only — tests must
 * create media and albums through the UI, not via direct DB inserts.
 */
export const cleanupOwnedRows = async (ownerId: string): Promise<void> => {
  const db = getDb();

  await db('access_grant').where({ granted_by: ownerId }).delete();

  await db('comment')
    .where({ created_by: ownerId })
    .orWhereIn('target_id', db('media_item').select('id').where({ owner_id: ownerId }))
    .delete();

  await db('grant')
    .whereIn('media_item_id', db('media_item').select('id').where({ owner_id: ownerId }))
    .delete();

  await db('album_item')
    .whereIn('album_id', db('album').select('id').where({ created_by: ownerId }))
    .delete();

  await db('album_member')
    .whereIn('album_id', db('album').select('id').where({ created_by: ownerId }))
    .delete();

  await db('album').where({ created_by: ownerId }).delete();

  await db('media_item').where({ owner_id: ownerId }).delete();

  await db('share_contact').where({ user_id: ownerId }).delete();
  await db('share_contact').where({ contact_user_id: ownerId }).delete();
};

/**
 * Removes the shadow (pending) recipient user created when a share targets an email
 * that isn't yet a user. The non-user share specs reuse a fixed recipient email, so
 * without this the first spec's shadow user lingers and changes the second spec's
 * share path (an existing pending user instead of a fresh one), breaking whichever
 * runs second. Every FK into `user` is ON DELETE CASCADE, so deleting the row also
 * clears its grants, share-contacts, and pending notifications. Runs before each such
 * test so it's resilient to leftovers from a prior/interrupted run too.
 */
export const cleanupRecipientByEmail = async (email: string): Promise<void> => {
  await getDb()('user').whereRaw('lower(email) = ?', email.toLowerCase()).delete();
};

/** Cleans up grant rows where `granted_to_user` is the recipient. */
export const cleanupGrantsToRecipient = async (recipientId: string): Promise<void> => {
  const db = getDb();
  await db('grant').where({ granted_to_user: recipientId }).delete();
  await db('access_grant').where({ granted_to_user: recipientId }).delete();
  await db('share_contact').where({ contact_user_id: recipientId }).delete();
};
