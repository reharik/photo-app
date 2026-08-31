import {
  AsyncNotificationKind,
  Batching,
  EntityType,
  NotificationContainerType,
  NotificationKind,
  NotificationSubjectType,
} from '@packages/contracts';
import { prepareForDatabase } from '@reharik/smart-enum';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import { DateTime } from 'luxon';
import { UnitOfWork } from '../../infrastructure';
import { RequestScopeLifeCycle } from '../../services/readServices/readServiceBaseType';
import { EntityId } from '../../types';

export interface SystemAsyncNotificationRepository extends RequestScopeLifeCycle {
  upsertRecipientRow: (upsert: AsyncNotificationInput) => Promise<number[]>;
  claimNotificationBatch: (window: number) => Promise<AsyncNotification[]>;
  claimIndividualNotifications: (window: number) => Promise<AsyncNotification[]>;
  deleteCompletedRecords: (ids: string[]) => Promise<void>;
  bumpRecordAttemptsByIds: (ids: string[]) => Promise<void>;
}

export type SystemAsyncNotificationRepositoryDeps = {
  uow: UnitOfWork;
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
  // The `data` jsonb column is intentionally NOT modelled here: token/commentId
  // migrated to subjectId in the container/subject rename, so nothing reads or
  // writes it. The column is left in place (see migrations) as an escape hatch.
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
];

type AsyncNotificationInput = Omit<AsyncNotification, 'dirtySince' | 'kind'> & {
  kind: NotificationKind;
};

export const build__SystemAsyncNotificationRepository = ({
  uow,
}: SystemAsyncNotificationRepositoryDeps): SystemAsyncNotificationRepository => ({
  upsertRecipientRow: async (upsert: AsyncNotificationInput) => {
    await uow.join();
    return uow
      .db()('asyncNotification')
      .insert({ ...prepareForDatabase(upsert), dirtySince: uow.db().fn.now() })
      .onConflict(['channel', 'kind', 'recipientId', 'containerType', 'containerId'])
      .merge({ dirtySince: uow.db().fn.now() });
  },
  // NOT a claim despite the name: plain SELECT, no lock, no status flip. Safe
  // only while exactly one worker process runs. A second worker would select
  // the same rows and double-send. Add SKIP LOCKED + a claim flip before
  // scaling out.
  claimNotificationBatch: async (windowSeconds: number) => {
    await uow.join();
    return withEnumRevival(
      uow
        .db()('asyncNotification')
        .select(asyncNotificationFields)
        .where('dirtySince', '<', uow.db().raw('now() - make_interval(secs => ?)', [windowSeconds]))
        .whereIn(
          'kind',
          AsyncNotificationKind.items()
            .filter((x) => x.cadence.equals(Batching.batched))
            .map((x) => x.value),
        ),
      {
        kind: AsyncNotificationKind,
        containerType: EntityType,
        subjectType: EntityType,
      },
    );
  },
  // NOT a claim despite the name: plain SELECT, no lock, no status flip. Safe
  // only while exactly one worker process runs. A second worker would select
  // the same rows and double-send. Add SKIP LOCKED + a claim flip before
  // scaling out.
  claimIndividualNotifications: async (windowSeconds: number) => {
    await uow.join();
    return withEnumRevival(
      uow
        .db()('asyncNotification')
        .select(asyncNotificationFields)
        .where('dirtySince', '<', uow.db().raw('now() - make_interval(secs => ?)', [windowSeconds]))
        .whereIn(
          'kind',
          AsyncNotificationKind.items()
            .filter((x) => x.cadence.equals(Batching.immediate))
            .map((x) => x.value),
        ),
      {
        kind: AsyncNotificationKind,
        containerType: EntityType,
        subjectType: EntityType,
      },
    );
  },
  deleteCompletedRecords: async (ids: string[]): Promise<void> => {
    if (ids.length === 0) {
      return;
    }
    await uow.join();
    await uow.db()('asyncNotification').delete().whereIn('id', ids);
  },
  bumpRecordAttemptsByIds: async (ids: string[]): Promise<void> => {
    if (ids.length === 0) {
      return;
    }
    await uow.join();
    await uow.db()('asyncNotification').whereIn('id', ids).increment('attempts', 1);
  },
});
