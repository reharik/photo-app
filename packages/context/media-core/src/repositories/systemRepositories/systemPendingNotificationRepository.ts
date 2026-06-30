import { EntityType } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import { Knex } from 'knex';
import { DateTime } from 'luxon';
import { EntityId } from '../../types';

export type SystemPendingNotificationRepository = {
  upsertRecipientRow: (upsert: PendingNotificationInput) => Promise<number[]>;
  claimNotificationBatch: (window: number) => Promise<PendingNotification[]>;
  claimIndividualNotifications: (window: number) => Promise<PendingNotification[]>;
  deleteCompletedRecords: (ids: string[]) => Promise<void>;
  bumpRecordAttemptsByIds: (ids: string[]) => Promise<void>;
};

export type SystemPendingNotificationRepositoryDeps = {
  database: Knex;
};

export type PendingNotification = {
  id: string;
  channel: 'email' | 'sms';
  kind: string;
  recipientId: EntityId;
  aggregateType: EntityType;
  aggregateId: EntityId;
  dirtySince: DateTime;
  attempts: number;
  actorId: EntityId;
};
const pendingNotificationFields = [
  'id',
  'channel',
  'kind',
  'recipientId',
  'aggregateType',
  'aggregateId',
  'dirtySince',
  'attempts',
  'actorId',
];

type PendingNotificationInput = Omit<PendingNotification, 'dirtySince' | 'actorId'>;

export const build__SystemPendingNotificationRepository = ({
  database,
}: SystemPendingNotificationRepositoryDeps): SystemPendingNotificationRepository => ({
  upsertRecipientRow: async (upsert: PendingNotificationInput) => {
    return database('pendingNotification')
      .insert({ ...upsert, dirtySince: database.fn.now() })
      .onConflict(['channel', 'kind', 'recipientId', 'aggregateType', 'aggregateId'])
      .merge({ dirtySince: database.fn.now() });
  },
  claimNotificationBatch: (windowMinutes: number) => {
    return withEnumRevival(
      database('pendingNotification')
        .select(pendingNotificationFields)
        .where('dirtySince', '<', database.raw('now() - make_interval(mins => ?)', [windowMinutes]))
        .andWhere({ kind: 'albumActivity' }),
      {
        aggregateType: EntityType,
      },
      { strict: true },
    );
  },
  claimIndividualNotifications: (windowMinutes: number) => {
    return withEnumRevival(
      database('pendingNotification')
        .select(pendingNotificationFields)
        .where('dirtySince', '<', database.raw('now() - make_interval(mins => ?)', [windowMinutes]))
        .andWhere({ kind: 'albumActivity' }),
      {
        aggregateType: EntityType,
      },
      { strict: true },
    );
  },
  deleteCompletedRecords: async (ids: string[]): Promise<void> => {
    if (ids.length === 0) {
      return;
    }
    await database('pendingNotification').delete().whereIn('id', ids);
  },
  bumpRecordAttemptsByIds: async (ids: string[]): Promise<void> => {
    if (ids.length === 0) {
      return;
    }
    await database('pendingNotification').whereIn('id', ids).increment('attempts', 1);
  },
});
