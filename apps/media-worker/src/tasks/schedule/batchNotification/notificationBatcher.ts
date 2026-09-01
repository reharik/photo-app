import { BatchedPayloadKind, EmailKind, notEmpty, SYSTEM_ACTOR_ID } from '@packages/contracts';
import { groupByMapping, indexBy, Logger } from '@packages/infrastructure';
import {
  EmailDelivery,
  EmailDeliveryRepository,
  SystemAsyncNotificationRepository,
  SystemUserRepository,
  UnitOfWork,
} from '@packages/media-core';
import { ActivitySection, NotificationPayload, NotificationService } from '@packages/notifications';
import { Config } from '../../../config';
import { BatchedEmailActivity } from '../../../generated/ioc-registry.types';
import { WorkerTaskOutcome } from '../../../types';
import { cleanUp, RowOutcome, summarizeOutcomes } from '../outcomeCleanup';
import { ActivityResult } from './batchedPayloads/types';

export type NotificationBatcher = () => Promise<WorkerTaskOutcome>;

type NotificationBatcherDeps = {
  logger: Logger;
  notificationService: NotificationService;
  systemAsyncNotificationRepository: SystemAsyncNotificationRepository;
  systemUserRepository: SystemUserRepository;
  batchedEmailActivity: BatchedEmailActivity;
  // openEmailDeliveryContextScope: OpenEmailDeliveryContextScope;
  config: Config;
  uow: UnitOfWork;
  emailDeliveryRepository: EmailDeliveryRepository;
};

export const build__NotificationBatcher = ({
  logger,
  notificationService,
  systemAsyncNotificationRepository,
  systemUserRepository,
  batchedEmailActivity,
  config,
  uow,
  emailDeliveryRepository,
}: NotificationBatcherDeps): NotificationBatcher => {
  return async (): Promise<WorkerTaskOutcome> => {
    // NOT a claim despite the name: plain SELECT, no lock, no status flip. Safe
    // only while exactly one worker process runs. A second worker would select
    // the same rows and double-send. Add SKIP LOCKED + a claim flip before
    // scaling out.
    await uow.join();
    const rows = await systemAsyncNotificationRepository.claimNotificationBatch(
      config.debounceEmailWindowSeconds,
    );
    if (!rows.length) {
      await uow.complete(true);
      return 'idle';
    }

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

    const payloads: ActivityResult[] = [];
    for (const activity of batchedEmailActivity) {
      payloads.push(await activity.execute(candidates));
    }

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
    await uow.complete(true);
    // begin ses processing
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
          await uow.join();
          await emailDeliveryRepository.save(newEmailDelivery);
          await uow.complete(true);
        } catch (e) {
          await uow.settle(false);
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
    try {
      await uow.join();
      await systemAsyncNotificationRepository.deleteCompletedRecords(deleteIds);
      await systemAsyncNotificationRepository.bumpRecordAttemptsByIds(bumpRowIds);
      await uow.complete(true);
      logs.forEach((x) => logger.info(x.message, x.meta));
    } catch (e) {
      await uow.settle(false);
      logger.error(
        '[notificationBatcher] outcome cleanup failed — rows not settled, next pass will re-send',
        e,
        { deleteCount: deleteIds.length, bumpCount: bumpRowIds.length },
      );
    }
    return deleteIds.length + bumpRowIds.length > 0 ? 'processed' : 'idle';
  };
};
