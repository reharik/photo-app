import {
  AsyncNotificationKind,
  Batching,
  EntityType,
  NotificationContainerType,
  NotificationSubjectType,
} from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import { DateTime } from 'luxon';
import { UnitOfWork } from '../../infrastructure';
import { RequestScopeLifeCycle } from '../../services/readServices/readServiceBaseType';
import { EntityId } from '../../types';

export interface SystemAsyncNotificationRepository extends RequestScopeLifeCycle {
  claimNotificationBatch: (window: number) => Promise<AsyncNotification[]>;
  claimIndividualNotifications: (window: number) => Promise<AsyncNotification[]>;
  deleteCompletedRecords: (ids: string[]) => Promise<void>;
  bumpRecordAttemptsByIds: (ids: string[]) => Promise<void>;
}

export type SystemAsyncNotificationRepositoryDeps = {
  uow: UnitOfWork;
};

// Template names are owned by the notifications context (its `TemplateName`).
// They are mirrored here as a local literal union on purpose: worker-core must
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
  // The grant this notification was minted for, when there is one. Undefined for the
  // activity kinds (itemAdded / commentPosted / replyPosted / reactionAdded), whose
  // events describe activity on an album or item rather than on a grant and carry no
  // authorization at all. Only the two `immediate` kinds can be attributed; the fast
  // sweep copies this onto the EmailDelivery row so the share roster can join on it.
  // The domain calls this an Authorization; the column matches the `access_grant`
  // table (and email_delivery.access_grant_id), which is why the names differ.
  accessGrantId?: EntityId;
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
  'accessGrantId',
];

export const build__SystemAsyncNotificationRepository = ({
  uow,
}: SystemAsyncNotificationRepositoryDeps): SystemAsyncNotificationRepository => ({
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
