import { EntityType } from '@packages/contracts';
import { Knex } from 'knex';
import { EntityId } from '../../types';

export type UnseenActivitySummary = {
  /** Unseen activity on individually shared media items (target_type = mediaItem). */
  mediaItems: boolean;
  /** Unseen activity on shared albums (target_type = album). */
  albums: boolean;
};

export interface UnseenActivityRepository {
  getUnseenActivity: (viewerId: EntityId) => Promise<boolean>;
  getUnseenActivitySummary: (viewerId: EntityId) => Promise<UnseenActivitySummary>;
  markSeen: (targetType: EntityType, targetId: EntityId, viewerId: EntityId) => Promise<void>;
}

type UnseenActivityRepositoryDeps = { database: Knex };

export const build__UnseenActivityRepository = ({
  database,
}: UnseenActivityRepositoryDeps): UnseenActivityRepository => ({
  getUnseenActivity: async (viewerId: EntityId): Promise<boolean> =>
    Boolean(await database('unseenActivity').where({ viewerId }).first()),
  // One round-trip breakdown by target_type, for per-category dots ("Shared >
  // Photos" vs "Shared > Albums"). Raw SQL, so use the physical column name and
  // compare against the wire values; bool_or over zero rows is null → false.
  getUnseenActivitySummary: async (viewerId: EntityId): Promise<UnseenActivitySummary> => {
    const row = await database('unseenActivity')
      .where({ viewerId })
      .select(
        database.raw('bool_or(target_type = ?) as mediaItems', [EntityType.mediaItem.value]),
        database.raw('bool_or(target_type = ?) as albums', [EntityType.album.value]),
      )
      .first<{ mediaItems: boolean | null; albums: boolean | null } | undefined>();
    return { mediaItems: Boolean(row?.mediaItems), albums: Boolean(row?.albums) };
  },
  // Clears ALL unseen activity at this target (every activity_kind) for the
  // viewer. Keyed on target_type + target_id only — opening an album must not
  // leave per-mediaItem (comment) dots behind, and vice versa.
  markSeen: async (targetType, targetId, viewerId) => {
    await database('unseenActivity')
      .delete()
      .where({ targetType: targetType.value, targetId, viewerId });
  },
});
