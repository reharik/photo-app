import {
  ActivitySurface,
  EntityType,
  InAppNotificationType,
  NotificationContainerType,
  NotificationSubjectType,
} from '@packages/contracts';
import { prepareForDatabase } from '@reharik/smart-enum';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import { Knex } from 'knex';
import { EntityId } from '../../types';
import { InAppNotification } from '../systemRepositories/systemInAppNotificationRepository';

export type InAppNotificationSummary = {
  /** Unseen activity on individually shared media items (container_type = mediaItem). */
  mediaItems: boolean;
  /** Unseen activity on shared albums (container_type = album). */
  albums: boolean;
};

// waiting for query
const inAppNotificationFields = [
  'id',
  'viewerId',
  'containerType',
  'containerId',
  'subjectType',
  'subjectId',
  'kind',
  'surface',
];

type DeleteWhereInput = {
  viewerId: EntityId;
  containerType: EntityType;
  containerId: EntityId;
  kind: InAppNotificationType;
};

export interface InAppNotificationRepository {
  getInAppNotification: (viewerId: EntityId) => Promise<InAppNotification[]>;
  deleteWhere: ({ viewerId, containerType, containerId, kind }: DeleteWhereInput) => Promise<void>;
  deleteByIds: ({ viewerId, ids }: { viewerId: EntityId; ids: EntityId[] }) => Promise<void>;
  markSeen: (
    containerType: EntityType,
    viewerId: EntityId,
    containerId?: EntityId,
  ) => Promise<void>;
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
        containerType: NotificationContainerType,
        subjectType: NotificationSubjectType,
        kind: InAppNotificationType,
        surface: ActivitySurface,
      },
      { strict: true },
    ),
  deleteWhere: async ({
    viewerId,
    containerType,
    containerId,
    kind,
  }: DeleteWhereInput): Promise<void> => {
    await database('inAppNotification').delete().where(
      prepareForDatabase({
        viewerId,
        containerType,
        containerId,
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

  // Clears ALL unseen activity at this container (every activity_kind) for the
  // viewer. Keyed on container_type + container_id only — opening an album must not
  // leave per-mediaItem (comment) dots behind, and vice versa.
  markSeen: async (containerType: EntityType, viewerId: EntityId, containerId?: string) => {
    const filterOnContainerId = containerId ? { containerId } : {};
    await database('inAppNotification')
      .delete()
      .where({ containerType: containerType.value, ...filterOnContainerId, viewerId });
  },
});
