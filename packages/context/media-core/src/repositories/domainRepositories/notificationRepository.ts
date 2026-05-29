import { NotificationKindEnum } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import type { Knex } from 'knex';
import type { NotificationRecord } from '../../domain/Notification/Notification';
import { Notification } from '../../domain/Notification/Notification';
import type { EntityId } from '../../types/types';
import { persist } from './AggregateRepo';

export type NotificationRepository = {
  getById: (id: EntityId) => Promise<Notification | undefined>;
  save: (notification: Notification, trx: Knex.Transaction) => Promise<void>;
};

type NotificationRepositoryDeps = { database: Knex };

export const build__NotificationRepository = ({
  database,
}: NotificationRepositoryDeps): NotificationRepository => {
  const getById = async (id: EntityId): Promise<Notification | undefined> => {
    const notificationRow = await withEnumRevival(
      database<NotificationRecord>('notification').where({ id }).first(),
      { notificationKind: NotificationKindEnum },
      { strict: true },
    );

    if (!notificationRow) {
      return;
    }

    return Notification.rehydrate(notificationRow);
  };

  const save = async (notification: Notification, trx: Knex.Transaction): Promise<void> => {
    await persist(trx, notification);
  };

  return {
    getById,
    save,
  };
};
