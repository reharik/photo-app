import { NotificationKind } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import type { NotificationRecord } from '../../domain/Notification/Notification';
import { Notification } from '../../domain/Notification/Notification';
import { UnitOfWork } from '../../infrastructure';
import { RequestScopeLifeCycle } from '../../services/readServices/readServiceBaseType';
import type { EntityId } from '../../types/types';
import { Persist } from './AggregateRepo';

export interface NotificationRepository extends RequestScopeLifeCycle {
  getById: (id: EntityId) => Promise<Notification | undefined>;
  save: (notification: Notification) => Promise<void>;
}

type NotificationRepositoryDeps = { uow: UnitOfWork; persist: Persist };

export const build__NotificationRepository = ({
  uow,
  persist,
}: NotificationRepositoryDeps): NotificationRepository => {
  const getById = async (id: EntityId): Promise<Notification | undefined> => {
    await uow.join();
    const notificationRow = await withEnumRevival(
      uow.db()<NotificationRecord>('notification').where({ id }).first(),
      { kind: NotificationKind },
    );

    if (!notificationRow) {
      return;
    }

    return Notification.rehydrate(notificationRow);
  };

  const save = async (notification: Notification): Promise<void> => {
    await persist(notification);
  };

  return {
    getById,
    save,
  };
};
