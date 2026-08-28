import {
  ActivitySurface,
  InAppNotificationType,
  NotificationContainerType,
  NotificationKind,
  NotificationSubjectType,
} from '@packages/contracts';
import { prepareForDatabase } from '@reharik/smart-enum';
import { UnitOfWork } from '../../infrastructure';
import { EntityId } from '../../types';

export type SystemInAppNotificationRepository = {
  upsertActivityRow: (upsert: InAppNotificationInput) => Promise<void>;
};

export type SystemInAppNotificationRepositoryDeps = {
  uow: UnitOfWork;
};

export type InAppNotification = {
  id: string;
  viewerId: EntityId;
  containerType: NotificationContainerType;
  containerId: EntityId;
  subjectType: NotificationSubjectType;
  subjectId: EntityId;
  kind: InAppNotificationType;
  actorId: EntityId;
  surface: ActivitySurface;
};

type InAppNotificationInput = Omit<InAppNotification, 'kind'> & { kind: NotificationKind };
export const build__SystemInAppNotificationRepository = ({
  uow,
}: SystemInAppNotificationRepositoryDeps): SystemInAppNotificationRepository => ({
  upsertActivityRow: async (upsert: InAppNotificationInput) => {
    await uow.join();
    await uow
      .db()('inAppNotification')
      .insert(prepareForDatabase({ ...upsert }))
      .onConflict(['viewerId', 'containerType', 'containerId', 'subjectType', 'subjectId'])
      .ignore();
  },
});
