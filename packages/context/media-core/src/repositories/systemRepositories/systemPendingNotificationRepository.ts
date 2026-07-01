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

export type PendingNotificationKind = 'albumShared' | 'itemAdded' | 'itemShared';
export type NotificationCadence = 'immediate' | 'batched';

export const NOTIFICATION_CADENCE = {
  albumShared: 'immediate',
  itemAdded: 'batched',
  itemShared: 'immediate',
} satisfies Record<PendingNotificationKind, NotificationCadence>;

export const kindsByCadence = (c: NotificationCadence): PendingNotificationKind[] =>
  (Object.keys(NOTIFICATION_CADENCE) as PendingNotificationKind[]).filter(
    (k) => NOTIFICATION_CADENCE[k] === c,
  );

export type PendingNotification = {
  id: string;
  channel: 'email' | 'sms';
  kind: PendingNotificationKind;
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
        .whereIn('kind', kindsByCadence('batched')),
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
        .whereIn('kind', kindsByCadence('immediate')),
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
