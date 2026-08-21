import { BatchedPayloadKind, EmailKind, notEmpty, SYSTEM_ACTOR_ID } from '@packages/contracts';
import { groupByMapping, indexBy, Logger } from '@packages/infrastructure';
import {
  EmailDelivery,
  SystemAsyncNotificationRepository,
  SystemUserRepository,
} from '@packages/media-core';
import { ActivitySection, NotificationPayload, NotificationService } from '@packages/notifications';
import { Config } from '../../../config';
import {
  BatchedEmailActivity,
  OpenEmailDeliveryContextScope,
} from '../../../generated/ioc-registry.types';
import { EmailDeliveryContext } from '../../../infrastructure/database/emailDeliveryContext';
import { WorkerTaskOutcome } from '../../../types';
import { cleanUp, RowOutcome, summarizeOutcomes } from '../outcomeCleanup';

export type NotificationBatcher = () => Promise<WorkerTaskOutcome>;

type NotificationBatcherDeps = {
  logger: Logger;
  notificationService: NotificationService;
  systemAsyncNotificationRepository: SystemAsyncNotificationRepository;
  systemUserRepository: SystemUserRepository;
  batchedEmailActivity: BatchedEmailActivity;
  openEmailDeliveryContextScope: OpenEmailDeliveryContextScope;
  config: Config;
};

export const build__NotificationBatcher = ({
  logger,
  notificationService,
  systemAsyncNotificationRepository,
  systemUserRepository,
  batchedEmailActivity,
  openEmailDeliveryContextScope,
  config,
}: NotificationBatcherDeps): NotificationBatcher => {
  /**
   * One transactional phase: open the delivery scope, start its uow, run the
   * work, and settle the transaction exactly once — commit on return, roll back
   * on throw — before disposing the scope. Deliberately local to this batcher
   * (not a shared util): the two queue runners keep their own copies.
   */
  const inDeliveryScope = async <T>(fn: (op: EmailDeliveryContext) => Promise<T>): Promise<T> => {
    const { emailDeliveryContext, dispose } = openEmailDeliveryContextScope();
    await emailDeliveryContext.start();
    try {
      const result = await fn(emailDeliveryContext);
      await emailDeliveryContext.finalize(true);
      return result;
    } catch (e) {
      await emailDeliveryContext.finalize(false);
      throw e;
    } finally {
      await dispose();
    }
  };

  return async (): Promise<WorkerTaskOutcome> => {
    const rows = await systemAsyncNotificationRepository.claimNotificationBatch(
      config.debounceEmailWindowSeconds,
    );
    if (!rows.length) return 'idle';
    logger.info(`[notificationBatcher] claimed ${rows.length} row(s)`);

    // outcomes surfaced by processors (skipped rows) merge with send outcomes below
    const outcomes: RowOutcome[] = [];

    // null recipientId = cadence-filter leak upstream; log and process
    const bad = rows.filter((r) => !notEmpty(r.recipientId));
    if (bad.length) {
      logger.error(`[batcher] claimed ${bad.length} null-recipient row(s) — cadence filter leak`);
      bad.forEach((row) => outcomes.push({ row, result: 'skipped', reason: 'null-recipient' }));
    }

    const candidates = rows.filter((r) => notEmpty(r.recipientId));

    const activityPayloads = batchedEmailActivity.map((x) => x.execute(candidates));
    // section processors are independent — run together
    const payloads = await Promise.all(activityPayloads);

    // outcomes surfaced by processors (skipped rows) merge with send outcomes below
    outcomes.push(...payloads.flatMap((x) => x.deadRows));
    const liveRows = payloads.flatMap((x) => x.livingRows);
    const accountedFor = new Set([...outcomes.map((o) => o.row.id), ...liveRows.map((r) => r.id)]);
    const orphans = candidates.filter((r) => !accountedFor.has(r.id));
    if (orphans.length) {
      logger.error('[batcher] rows matched no section processor', {
        rowIds: orphans.map((r) => r.id),
      });
      orphans.forEach((row) =>
        outcomes.push({ row, result: 'skipped', reason: 'no section processor' }),
      );
    }
    const recipientMap = groupByMapping(liveRows, (x) => x.recipientId);

    const userIds = [...recipientMap.keys()];
    const recipientEmailMap = indexBy(await systemUserRepository.getUserContacts(userIds));

    for (const [recipientId, rowsForRecipient] of recipientMap) {
      const recipientEmail = recipientEmailMap.get(recipientId);
      if (!recipientEmail) {
        logger.warn(
          '[notificationBatcher] no user row / email for recipient — rows will be deleted without sending',
          {
            recipientId,
            rowIds: rowsForRecipient.map((x) => x.id),
          },
        );
        for (const row of rowsForRecipient) {
          outcomes.push({ row, result: 'skipped', reason: 'no user row / email for recipient_id' });
        }
        continue;
      }
      const data = new Map<BatchedPayloadKind, ActivitySection>();
      payloads.forEach((x) => {
        const activity = x.activity.get(recipientId);
        if (activity) {
          data.set(x.kind, activity);
        }
      });
      if (data.size === 0) {
        for (const row of rowsForRecipient) {
          outcomes.push({ row, result: 'skipped', reason: 'no activity sections for recipient' });
        }
        continue;
      }

      const payload: NotificationPayload<'activityDigest'> = {
        to: recipientEmail.email,
        template: 'activityDigest',
        data: { data, appUrl: config.clientUrl },
        channels: ['email'],
      };
      const r = await notificationService.notify(payload);

      let result = 'failed' as 'skipped' | 'sent' | 'failed';
      if (r.success) {
        result = 'sent';
        const newEmailDelivery = EmailDelivery.create(
          {
            sesMessageId: r.value,
            emailKind: EmailKind.activityDigest,
            recipientEmail: recipientEmail.email,
          },
          SYSTEM_ACTOR_ID,
        );
        try {
          await inDeliveryScope((op) => op.emailDeliveryRepository.save(newEmailDelivery));
        } catch (e) {
          logger.error(
            '[notificationBatcher] delivery record insert failed — telemetry gap, not resending',
            { sesMessageId: r.value, error: e },
          );
        }
      }

      // one send → fan its fate across all this recipient's rows (reactions ride along)
      for (const row of rowsForRecipient) outcomes.push({ row, result });
    }

    logger.info('[notificationBatcher] send loop complete', summarizeOutcomes(outcomes));

    const { deleteIds, bumpRowIds, logs } = cleanUp(outcomes);
    await Promise.all([
      systemAsyncNotificationRepository.deleteCompletedRecords(deleteIds),
      systemAsyncNotificationRepository.bumpRecordAttemptsByIds(bumpRowIds),
    ]);
    logs.forEach((x) => logger.info(x.message, x.meta));

    return deleteIds.length + bumpRowIds.length > 0 ? 'processed' : 'idle';
  };
};
