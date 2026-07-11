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

/** Cleans up grant rows where `granted_to_user` is the recipient. */
export const cleanupGrantsToRecipient = async (recipientId: string): Promise<void> => {
  const db = getDb();
  await db('grant').where({ granted_to_user: recipientId }).delete();
  await db('access_grant').where({ granted_to_user: recipientId }).delete();
  await db('share_contact').where({ contact_user_id: recipientId }).delete();
};
