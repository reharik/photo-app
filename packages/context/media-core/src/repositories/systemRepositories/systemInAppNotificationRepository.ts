import {
  ActivitySurface,
  InAppNotificationType,
  NotificationKind,
  NotificationSourceType,
  NotificationTargetType,
} from '@packages/contracts';
import { prepareForDatabase } from '@reharik/smart-enum';
import { Knex } from 'knex';
import { EntityId } from '../../types';

export type SystemInAppNotificationRepository = {
  upsertActivityRow: (upsert: InAppNotificationInput) => Promise<void>;
};

export type SystemInAppNotificationRepositoryDeps = {
  database: Knex;
};

export type InAppNotification = {
  id: string;
  viewerId: EntityId;
  targetType: NotificationTargetType;
  targetId: EntityId;
  sourceType: NotificationSourceType;
  sourceId: EntityId;
  kind: InAppNotificationType;
  actorId: EntityId;
  surface: ActivitySurface;
};

type InAppNotificationInput = Omit<InAppNotification, 'kind'> & { kind: NotificationKind };
export const build__SystemInAppNotificationRepository = ({
  database,
}: SystemInAppNotificationRepositoryDeps): SystemInAppNotificationRepository => ({
  upsertActivityRow: async (upsert: InAppNotificationInput) => {
    await database('inAppNotification')
      .insert(prepareForDatabase({ ...upsert }))
      .onConflict(['viewerId', 'targetType', 'targetId', 'sourceType', 'sourceId'])
      .ignore();
  },
});
