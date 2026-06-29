import { EntityType } from '@packages/contracts';
import { Knex } from 'knex';
import { EntityId } from '../../types';

export interface UnseenActivityRepository {
  getUnseenActivity: (viewerId: EntityId) => Promise<boolean>;
  markSeen: (targetType: EntityType, targetId: EntityId, viewerId: EntityId) => Promise<void>;
}

type UnseenActivityRepositoryDeps = { database: Knex };

export const build__UnseenActivityRepository = ({
  database,
}: UnseenActivityRepositoryDeps): UnseenActivityRepository => ({
  getUnseenActivity: async (viewerId: EntityId): Promise<boolean> =>
    Boolean(await database('unseenActivity').where({ viewerId }).first()),
  // Clears ALL unseen activity at this target (every activity_kind) for the
  // viewer. Keyed on target_type + target_id only — opening an album must not
  // leave per-mediaItem (comment) dots behind, and vice versa.
  markSeen: async (targetType, targetId, viewerId) => {
    await database('unseenActivity')
      .delete()
      .where({ targetType: targetType.value, targetId, viewerId });
  },
});
