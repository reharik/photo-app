import {
  AsyncNotificationKind,
  EntityType,
  NotificationCadence,
  NotificationContainerType,
  NotificationKind,
  NotificationSubjectType,
} from '@packages/contracts';
import { prepareForDatabase } from '@reharik/smart-enum';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import { Knex } from 'knex';
import { DateTime } from 'luxon';
import { EntityId } from '../../types';

export type SystemAsyncNotificationRepository = {
  upsertRecipientRow: (upsert: AsyncNotificationInput) => Promise<number[]>;
  claimNotificationBatch: (window: number) => Promise<AsyncNotification[]>;
  claimIndividualNotifications: (window: number) => Promise<AsyncNotification[]>;
  deleteCompletedRecords: (ids: string[]) => Promise<void>;
  bumpRecordAttemptsByIds: (ids: string[]) => Promise<void>;
};

export type SystemAsyncNotificationRepositoryDeps = {
  database: Knex;
};

// Template names are owned by the notifications context (its `TemplateName`).
// They are mirrored here as a local literal union on purpose: media-core must
// not depend on @packages/notifications (independent sibling contexts). The
// worker — which composes both — maps this to the real TemplateName at send
// time. `null` = no template wired for this kind yet.
export type NotificationTemplate = 'shareInvite' | 'albumActivity';

export type AsyncNotification = {
  id: string;
  channel: 'email' | 'sms';
  kind: AsyncNotificationKind;
  recipientId: EntityId;
  containerType: NotificationContainerType;
  containerId: EntityId;
  subjectType: NotificationSubjectType;
  subjectId: EntityId;
  dirtySince: DateTime;
  attempts: number;
  actorId: EntityId;
  data?: { token?: string; commentId?: string };
};

const asyncNotificationFields = [
  'id',
  'channel',
  'kind',
  'recipientId',
  'containerType',
  'containerId',
  'subjectType',
  'subjectId',
  'dirtySince',
  'attempts',
  'actorId',
  'data',
];

type AsyncNotificationInput = Omit<AsyncNotification, 'dirtySince' | 'kind'> & {
  kind: NotificationKind;
};

export const build__SystemAsyncNotificationRepository = ({
  database,
}: SystemAsyncNotificationRepositoryDeps): SystemAsyncNotificationRepository => ({
  upsertRecipientRow: async (upsert: AsyncNotificationInput) => {
    return database('asyncNotification')
      .insert({ ...prepareForDatabase(upsert), dirtySince: database.fn.now() })
      .onConflict(['channel', 'kind', 'recipientId', 'containerType', 'containerId'])
      .merge({ dirtySince: database.fn.now() });
  },
  claimNotificationBatch: (windowSeconds: number) => {
    return withEnumRevival(
      database('asyncNotification')
        .select(asyncNotificationFields)
        .where('dirtySince', '<', database.raw('now() - make_interval(secs => ?)', [windowSeconds]))
        .whereIn(
          'kind',
          AsyncNotificationKind.items()
            .filter((x) => x.cadence.equals(NotificationCadence.batched))
            .map((x) => x.value),
        ),
      {
        kind: AsyncNotificationKind,
        containerType: EntityType,
        subjectType: EntityType,
      },
      { strict: true },
    );
  },
  claimIndividualNotifications: (windowSeconds: number) => {
    return withEnumRevival(
      database('asyncNotification')
        .select(asyncNotificationFields)
        .where('dirtySince', '<', database.raw('now() - make_interval(secs => ?)', [windowSeconds]))
        .whereIn(
          'kind',
          AsyncNotificationKind.items()
            .filter((x) => x.cadence.equals(NotificationCadence.immediate))
            .map((x) => x.value),
        ),
      {
        kind: AsyncNotificationKind,
        containerType: EntityType,
        subjectType: EntityType,
      },
      { strict: true },
    );
  },
  deleteCompletedRecords: async (ids: string[]): Promise<void> => {
    if (ids.length === 0) {
      return;
    }
    await database('asyncNotification').delete().whereIn('id', ids);
  },
  bumpRecordAttemptsByIds: async (ids: string[]): Promise<void> => {
    if (ids.length === 0) {
      return;
    }
    await database('asyncNotification').whereIn('id', ids).increment('attempts', 1);
  },
});
