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

// Template names are owned by the notifications context (its `TemplateName`).
// They are mirrored here as a local literal union on purpose: media-core must
// not depend on @packages/notifications (independent sibling contexts). The
// worker — which composes both — maps this to the real TemplateName at send
// time. `null` = no template wired for this kind yet.
export type NotificationTemplate = 'shareInvite' | 'albumActivity';

export type NotificationRouting = {
  cadence: NotificationCadence;
  template: NotificationTemplate | null;
};

export const NOTIFICATION_ROUTING = {
  albumShared: { cadence: 'immediate', template: 'shareInvite' },
  itemAdded: { cadence: 'batched', template: 'albumActivity' },
  // TODO(phaseB): itemShared has no producer or template yet. shareInvite is
  // album-specific copy ("View album", /album/ url), so a single-item share
  // needs its own template/copy before this can be non-null.
  itemShared: { cadence: 'immediate', template: null },
} satisfies Record<PendingNotificationKind, NotificationRouting>;

export const kindsByCadence = (c: NotificationCadence): PendingNotificationKind[] =>
  (Object.keys(NOTIFICATION_ROUTING) as PendingNotificationKind[]).filter(
    (k) => NOTIFICATION_ROUTING[k].cadence === c,
  );

export const templateForKind = (k: PendingNotificationKind): NotificationTemplate | null =>
  NOTIFICATION_ROUTING[k].template;

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

type PendingNotificationInput = Omit<PendingNotification, 'dirtySince'>;

export const build__SystemPendingNotificationRepository = ({
  database,
}: SystemPendingNotificationRepositoryDeps): SystemPendingNotificationRepository => ({
  upsertRecipientRow: async (upsert: PendingNotificationInput) => {
    return database('pendingNotification')
      .insert({
        ...upsert,
        aggregateType: upsert.aggregateType.value,
        dirtySince: database.fn.now(),
      })
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
