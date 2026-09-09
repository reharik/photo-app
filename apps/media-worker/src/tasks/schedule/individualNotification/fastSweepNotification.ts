import { Logger } from '@packages/infrastructure';
import { SystemAsyncNotificationRepository, UnitOfWork } from '@packages/worker-core';
import { WorkerTaskOutcome } from '../../../types';
import { HandleNotificationOutcomes } from '../handleNotificationOutcomes';
import { RowOutcome, summarizeOutcomes } from '../outcomeCleanup';
import { BuildFastSweepPayloads } from './buildFastSweepPayloads';
import { PersistNotificationDelivery } from './persistNotificationDelivery';
import { SendNotificationForPayload } from './sendNotificationForPayload';

export type FastSweepNotification = () => Promise<'idle' | 'processed'>;

type FastSweepNotificationDeps = {
  logger: Logger;
  buildFastSweepPayloads: BuildFastSweepPayloads;
  systemAsyncNotificationRepository: SystemAsyncNotificationRepository;
  uow: UnitOfWork;
  sendNotificationForPayload: SendNotificationForPayload;
  persistNotificationDelivery: PersistNotificationDelivery;
  handleNotificationOutcomes: HandleNotificationOutcomes;
};

export const build__FastSweepNotification =
  ({
    logger,
    buildFastSweepPayloads,
    persistNotificationDelivery,
    handleNotificationOutcomes,
    uow,
    sendNotificationForPayload,
  }: FastSweepNotificationDeps): FastSweepNotification =>
  async (): Promise<WorkerTaskOutcome> => {
    const results = await uow.inTransaction(buildFastSweepPayloads);

    const outcomes: RowOutcome[] = [];
    // Trx per email: one failed save loses one row's telemetry rather than
    // rolling back the batch and resending everything. Revisit if trx count hurts.
    for (const r of results) {
      const sendResult = await sendNotificationForPayload(r);
      if (sendResult.success) {
        try {
          await uow.inTransaction(() => persistNotificationDelivery(r, sendResult.messageId));
        } catch (e) {
          logger.error(
            '[fastSweepNotification] delivery record insert failed — telemetry gap, not resending',
            { sesMessageId: sendResult.messageId, error: e },
          );
        }
      }
      outcomes.push(sendResult.outcome);
    }

    logger.info('[notification-send] send loop complete', summarizeOutcomes(outcomes));

    try {
      const result = await uow.inTransaction(() => handleNotificationOutcomes(outcomes));
      return result.deleteIds + result.bumpRowIds > 0 ? 'processed' : 'idle';
    } catch (e) {
      logger.error(
        '[fastSweepNotification] outcome cleanup failed — rows not settled, next pass will re-send',
        e,
      );
      return 'idle';
    }
  };
