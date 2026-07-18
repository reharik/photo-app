import { EntityType, InAppNotificationType } from '@packages/contracts';
import { pickEnum, prepareForDatabase } from '@reharik/smart-enum';
import { Knex } from 'knex';
import { EntityId } from '../../types';

export type SystemInAppNotificationRepository = {
  upsertActivityRow: (upsert: InAppNotification) => Promise<void>;
};

export type SystemInAppNotificationRepositoryDeps = {
  database: Knex;
};
export const InAppNotificationTargetType = pickEnum(EntityType, ['album', 'mediaItem']);
export const InAppNotificationSourceType = pickEnum(EntityType, ['comment', 'mediaItem']);
export type InAppNotification = {
  id: string;
  viewerId: EntityId;
  targetType: EntityType;
  targetId: EntityId;
  sourceType: EntityType;
  sourceId: EntityId;
  activityKind: InAppNotificationType;
};

export const build__SystemInAppNotificationRepository = ({
  database,
}: SystemInAppNotificationRepositoryDeps): SystemInAppNotificationRepository => ({
  upsertActivityRow: async (upsert: InAppNotification) => {
    await database('inAppNotification')
      .insert(prepareForDatabase({ ...upsert }))
      .onConflict(['viewerId', 'targetType', 'targetId', 'sourceType', 'sourceId'])
      .ignore();
  },
});
