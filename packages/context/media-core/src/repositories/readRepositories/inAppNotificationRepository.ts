import {
  ActivitySurface,
  EntityType,
  InAppNotificationType,
  NotificationSourceType,
  NotificationTargetType,
} from '@packages/contracts';
import { prepareForDatabase } from '@reharik/smart-enum';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import { Knex } from 'knex';
import { EntityId } from '../../types';
import { InAppNotification } from '../systemRepositories/systemInAppNotificationRepository';

export type InAppNotificationSummary = {
  /** Unseen activity on individually shared media items (target_type = mediaItem). */
  mediaItems: boolean;
  /** Unseen activity on shared albums (target_type = album). */
  albums: boolean;
};

// waiting for query
const inAppNotificationFields = [
  'id',
  'viewerId',
  'targetType',
  'targetId',
  'sourceType',
  'sourceId',
  'kind',
  'surface',
];

type DeleteWhereInput = {
  viewerId: EntityId;
  targetType: EntityType;
  targetId: EntityId;
  kind: InAppNotificationType;
};

export interface InAppNotificationRepository {
  getInAppNotification: (viewerId: EntityId) => Promise<InAppNotification[]>;
  deleteWhere: ({ viewerId, targetType, targetId, kind }: DeleteWhereInput) => Promise<void>;
  deleteByIds: ({ viewerId, ids }: { viewerId: EntityId; ids: EntityId[] }) => Promise<void>;
  markSeen: (targetType: EntityType, viewerId: EntityId, targetId?: EntityId) => Promise<void>;
}

type InAppNotificationRepositoryDeps = { database: Knex };

export const build__InAppNotificationRepository = ({
  database,
}: InAppNotificationRepositoryDeps): InAppNotificationRepository => ({
  getInAppNotification: async (viewerId: EntityId): Promise<InAppNotification[]> =>
    await withEnumRevival(
      database('inAppNotification')
        .where({ viewerId })
        .select<InAppNotification[]>(inAppNotificationFields),
      {
        targetType: NotificationTargetType,
        sourceType: NotificationSourceType,
        kind: InAppNotificationType,
        surface: ActivitySurface,
      },
      { strict: true },
    ),
  deleteWhere: async ({
    viewerId,
    targetType,
    targetId,
    kind,
  }: DeleteWhereInput): Promise<void> => {
    await database('inAppNotification').delete().where(
      prepareForDatabase({
        viewerId,
        targetType,
        targetId,
        kind,
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
    await database('inAppNotification').delete().where({ viewerId }).and.whereIn('id', ids);
  },

  // Clears ALL unseen activity at this target (every activity_kind) for the
  // viewer. Keyed on target_type + target_id only — opening an album must not
  // leave per-mediaItem (comment) dots behind, and vice versa.
  markSeen: async (targetType: EntityType, viewerId: EntityId, targetId?: string) => {
    const filterOnTargetId = targetId ? { targetId } : {};
    await database('inAppNotification')
      .delete()
      .where({ targetType: targetType.value, ...filterOnTargetId, viewerId });
  },
});
