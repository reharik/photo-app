import { EntityType, UnseenActivityType } from '@packages/contracts';
import { prepareForDatabase } from '@reharik/smart-enum';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import { Knex } from 'knex';
import { EntityId } from '../../types';
import {
  UnseenActivity,
  UnseenActivitySourceType,
  UnseenActivityTargetType,
} from '../systemRepositories/systemUnseenActivityRepository';

export type UnseenActivitySummary = {
  /** Unseen activity on individually shared media items (target_type = mediaItem). */
  mediaItems: boolean;
  /** Unseen activity on shared albums (target_type = album). */
  albums: boolean;
};

// waiting for query
const unseenActivityFields = [
  'id',
  'viewerId',
  'targetType',
  'targetId',
  'sourceType',
  'sourceId',
  'activityKind',
];

type DeleteWhereInput = {
  viewerId: EntityId;
  targetType: EntityType;
  targetId: EntityId;
  activityKind: UnseenActivityType;
};

export interface UnseenActivityRepository {
  getUnseenActivity: (viewerId: EntityId) => Promise<UnseenActivity[]>;
  deleteWhere: ({
    viewerId,
    targetType,
    targetId,
    activityKind,
  }: DeleteWhereInput) => Promise<void>;
  deleteByIds: ({ viewerId, ids }: { viewerId: EntityId; ids: EntityId[] }) => Promise<void>;
  markSeen: (targetType: EntityType, viewerId: EntityId, targetId?: EntityId) => Promise<void>;
}

type UnseenActivityRepositoryDeps = { database: Knex };

export const build__UnseenActivityRepository = ({
  database,
}: UnseenActivityRepositoryDeps): UnseenActivityRepository => ({
  getUnseenActivity: async (viewerId: EntityId): Promise<UnseenActivity[]> =>
    await withEnumRevival(
      database('unseenActivity').where({ viewerId }).select<UnseenActivity[]>(unseenActivityFields),
      {
        targetType: UnseenActivityTargetType,
        sourceType: UnseenActivitySourceType,
        activityKind: UnseenActivityType,
      },
      { strict: true },
    ),
  deleteWhere: async ({
    viewerId,
    targetType,
    targetId,
    activityKind,
  }: DeleteWhereInput): Promise<void> => {
    await database('unseenActivity').delete().where(
      prepareForDatabase({
        viewerId,
        targetType,
        targetId,
        activityKind,
      }),
    );
  },
  deleteByIds: async ({
    viewerId,
    ids,
  }: {
    viewerId: EntityId;
    ids: EntityId[];
  }): Promise<void> => {
    await database('unseenActivity').delete().where({ viewerId }).and.whereIn('id', ids);
  },

  // Clears ALL unseen activity at this target (every activity_kind) for the
  // viewer. Keyed on target_type + target_id only — opening an album must not
  // leave per-mediaItem (comment) dots behind, and vice versa.
  markSeen: async (targetType: EntityType, viewerId: EntityId, targetId?: string) => {
    const filterOnTargetId = targetId ? { targetId } : {};
    await database('unseenActivity')
      .delete()
      .where({ targetType: targetType.value, ...filterOnTargetId, viewerId });
  },
});
