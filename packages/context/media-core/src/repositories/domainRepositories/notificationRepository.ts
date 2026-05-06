import { NotificationKindEnum } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import type { Knex } from 'knex';
import type { NotificationRecord } from '../../domain/Notification/Notification';
import { Notification } from '../../domain/Notification/Notification';
import { RepoOptions, runInTransaction } from '../../infrastructure/repositories/runInTransaction';
import type { EntityId } from '../../types/types';

export type NotificationRepository = {
  getById: (id: EntityId) => Promise<Notification | undefined>;
  save: (notification: Notification, options?: RepoOptions) => Promise<void>;
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

  const save = async (notification: Notification, options?: RepoOptions): Promise<void> => {
    await runInTransaction(database, options, async (trx) => {
      const record = notification.toPersistence();

      const existing = await trx<NotificationRecord>('notification')
        .where({ id: record.id })
        .first();

      if (existing) {
        await trx<NotificationRecord>('notification').where({ id: record.id }).update(record);
      } else {
        await trx<NotificationRecord>('notification').insert(record);
      }
    });
  };

  return {
    getById,
    save,
  };
};
