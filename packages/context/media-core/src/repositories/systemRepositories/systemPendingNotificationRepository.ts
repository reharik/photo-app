import { EntityType, NotificationCadence, PendingNotificationKind } from '@packages/contracts';
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

// Template names are owned by the notifications context (its `TemplateName`).
// They are mirrored here as a local literal union on purpose: media-core must
// not depend on @packages/notifications (independent sibling contexts). The
// worker — which composes both — maps this to the real TemplateName at send
// time. `null` = no template wired for this kind yet.
export type NotificationTemplate = 'shareInvite' | 'albumActivity';

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
  data?: { token: string };
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
  'data',
];

type PendingNotificationInput = Omit<PendingNotification, 'dirtySince'>;

export const build__SystemPendingNotificationRepository = ({
  database,
}: SystemPendingNotificationRepositoryDeps): SystemPendingNotificationRepository => ({
  upsertRecipientRow: async (upsert: PendingNotificationInput) => {
    return database('pendingNotification')
      .insert({
        ...upsert,
        kind: upsert.kind.value,
        aggregateType: upsert.aggregateType.value,
        dirtySince: database.fn.now(),
      })
      .onConflict(['channel', 'kind', 'recipientId', 'aggregateType', 'aggregateId'])
      .merge({ dirtySince: database.fn.now() });
  },
  claimNotificationBatch: (windowSeconds: number) => {
    return withEnumRevival(
      database('pendingNotification')
        .select(pendingNotificationFields)
        .where('dirtySince', '<', database.raw('now() - make_interval(secs => ?)', [windowSeconds]))
        .whereIn(
          'kind',
          PendingNotificationKind.items()
            .filter((x) => x.cadence.equals(NotificationCadence.batched))
            .map((x) => x.value),
        ),
      {
        kind: PendingNotificationKind,
        aggregateType: EntityType,
      },
      { strict: true },
    );
  },
  claimIndividualNotifications: (windowSeconds: number) => {
    return withEnumRevival(
      database('pendingNotification')
        .select(pendingNotificationFields)
        .where('dirtySince', '<', database.raw('now() - make_interval(secs => ?)', [windowSeconds]))
        .whereIn(
          'kind',
          PendingNotificationKind.items()
            .filter((x) => x.cadence.equals(NotificationCadence.immediate))
            .map((x) => x.value),
        ),
      {
        kind: PendingNotificationKind,
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
