import { EmailKind, SYSTEM_ACTOR_ID } from '@packages/contracts';
import { bestEffort, Logger } from '@packages/infrastructure';
import { EmailDelivery, EmailDeliveryRepository, UnitOfWork } from '@packages/worker-core';
import { WorkerTaskOutcome } from '../../../types';
import { HandleNotificationOutcomes } from '../handleNotificationOutcomes';
import { summarizeOutcomes } from '../outcomeCleanup';
import { ClaimDigestBatch } from './claimDigestBatch';
import { SendBatchNotification } from './sendBatchNotification';

export type NotificationBatcher = () => Promise<WorkerTaskOutcome>;

type NotificationBatcherDeps = {
  logger: Logger;
  uow: UnitOfWork;
  emailDeliveryRepository: EmailDeliveryRepository;
  claimDigestBatch: ClaimDigestBatch;
  sendBatchNotification: SendBatchNotification;
  handleNotificationOutcomes: HandleNotificationOutcomes;
};

export const build__NotificationBatcher = ({
  logger,
  uow,
  emailDeliveryRepository,
  claimDigestBatch,
  sendBatchNotification,
  handleNotificationOutcomes,
}: NotificationBatcherDeps): NotificationBatcher => {
  return async (): Promise<WorkerTaskOutcome> => {
    const batchResult = await uow.inTransaction(claimDigestBatch);
    if (!batchResult) {
      return 'idle';
    }
    const { recipientMap, payloads, recipientEmailMap, outcomes } = batchResult;
    // begin ses processing
    for (const [recipientId, rowsForRecipient] of recipientMap) {
      const r = await sendBatchNotification({
        recipientId,
        rowsForRecipient,
        payloads,
        recipientEmailMap,
      });
      if (r.kind === 'skipped') {
        rowsForRecipient.forEach((row) =>
          outcomes.push({ row, result: 'skipped', reason: r.reason }),
        );
        continue;
      }

      const result = r.kind === 'sent' ? 'sent' : 'failed';
      if (r.kind === 'sent') {
        const newEmailDelivery = EmailDelivery.create(
          {
            sesMessageId: r.messageId,
            emailKind: EmailKind.activityDigest,
            recipientEmail: r.email,
            // No accessGrantId, and there cannot be one: this is a single digest
            // spanning every album and kind that accumulated for this recipient, and
            // all four batched kinds come from events that carry no authorization
            // anyway. Attribution is only meaningful for the immediate share emails.
          },
          SYSTEM_ACTOR_ID,
        );
        await bestEffort(
          () => uow.inTransaction(() => emailDeliveryRepository.save(newEmailDelivery)),
          (e) =>
            logger.error(
              '[notificationBatcher] delivery record insert failed — telemetry gap, not resending',
              { sesMessageId: r.messageId, error: e },
            ),
        );
      }

      // one send → fan its fate across all this recipient's rows (reactions ride along)
      for (const row of rowsForRecipient) outcomes.push({ row, result });
    }

    logger.info('[notificationBatcher] send loop complete', summarizeOutcomes(outcomes));
    try {
      const result = await uow.inTransaction(() => handleNotificationOutcomes(outcomes));
      return result.deleteIds + result.bumpRowIds > 0 ? 'processed' : 'idle';
    } catch (e) {
      logger.error(
        '[NotificationBatcher] outcome cleanup failed — rows not settled, next pass will re-send',
        e,
      );
      return 'idle';
    }
  };
};
