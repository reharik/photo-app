import { Logger } from '@packages/infrastructure';
import { SystemAsyncNotificationRepository } from '../../repositories';
import { NotificationWriter } from './inAppWriter';

export interface AsyncWriter extends NotificationWriter {
  readonly __brand?: 'async';
}
type Deps = {
  systemAsyncNotificationRepository: SystemAsyncNotificationRepository;
  logger: Logger;
};

// Dumb mapper: canonical -> async_notification (queue) row.
// - sets channel + attempts (queue/delivery concerns)
// - uses the renamed target* columns (was aggregate*) + new source* columns
// - no data bag: token left it (-> source=authorization), commentId left it (-> source)
export const build__AsyncWriter =
  ({ systemAsyncNotificationRepository, logger }: Deps): AsyncWriter =>
  async (n) => {
    logger.debug(
      `[AsyncWriter] writing ${n.kind.key} row for recipient: ${n.recipients.map((x) => x.id).join(',')}`,
    );
    await Promise.all(
      n.recipients.map((r) =>
        systemAsyncNotificationRepository.upsertRecipientRow({
          id: crypto.randomUUID(),
          channel: 'email', // becomes a real choice when SMS lands
          kind: n.kind,
          recipientId: r.id,
          actorId: n.actorId,
          targetType: n.targetType, // was aggregateType
          targetId: n.targetId, // was aggregateId
          sourceType: n.sourceType,
          sourceId: n.sourceId,
          attempts: 0,
        }),
      ),
    );
  };
