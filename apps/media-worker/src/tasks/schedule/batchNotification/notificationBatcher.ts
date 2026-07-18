import { ActivityKind, notEmpty } from '@packages/contracts';
import { groupByMapping, indexBy, Logger } from '@packages/infrastructure';
import { SystemAsyncNotificationRepository, SystemUserRepository } from '@packages/media-core';
import { ActivitySection, NotificationPayload, NotificationService } from '@packages/notifications';
import { pickEnum } from '@reharik/smart-enum';
import { Config } from '../../../config';
import { BatchedEmailActivity } from '../../../generated/ioc-registry.types';
import { WorkerTaskOutcome } from '../../../types';
import { cleanUp, RowOutcome, summarizeOutcomes } from '../outcomeCleanup';

const drivers = pickEnum(ActivityKind, ['comment', 'album']);
export type NotificationBatcher = () => Promise<WorkerTaskOutcome>;

type NotificationBatcherDeps = {
  logger: Logger;
  notificationService: NotificationService;
  systemAsyncNotificationRepository: SystemAsyncNotificationRepository;
  systemUserRepository: SystemUserRepository;
  batchedEmailActivity: BatchedEmailActivity;
  config: Config;
};

export const build__NotificationBatcher = ({
  logger,
  notificationService,
  systemAsyncNotificationRepository,
  systemUserRepository,
  batchedEmailActivity,
  config,
}: NotificationBatcherDeps): NotificationBatcher => {
  return async (): Promise<WorkerTaskOutcome> => {
    const rows = await systemAsyncNotificationRepository.claimNotificationBatch(
      config.debounceEmailWindowSeconds,
    );
    logger.info(`[notificationBatcher] claimed ${rows.length} row(s)`);
    if (!rows.length) return 'idle';

    // null recipientId = cadence-filter leak upstream; log but don't process
    const bad = rows.filter((r) => !notEmpty(r.recipientId));
    if (bad.length) {
      logger.error(`[batcher] claimed ${bad.length} null-recipient row(s) — cadence filter leak`);
    }

    const recipientMap = groupByMapping(
      rows.filter((r) => notEmpty(r.recipientId)),
      (x) => x.recipientId,
    );

    const userIds = [...recipientMap.keys()];
    const recipientEmailMap = indexBy(await systemUserRepository.getUserContacts(userIds));

    const activityPayloads = batchedEmailActivity.map((x) => x.execute(rows));
    // section processors are independent — run together
    const payloads = await Promise.all(activityPayloads);

    // outcomes surfaced by processors (skipped rows) merge with send outcomes below
    const outcomes: RowOutcome[] = payloads.flatMap((x) => x.outcomes);

    for (const [recipientId, rowsForRecipient] of recipientMap) {
      const recipientEmail = recipientEmailMap.get(recipientId);
      if (!recipientEmail) {
        logger.warn(`User ${recipientId} has no email`);
        for (const row of rowsForRecipient) outcomes.push({ row, result: 'skipped' });
        continue;
      }
      const data = new Map<ActivityKind, ActivitySection>();
      let hasDriver = false;
      payloads.forEach((x) => {
        const activity = x.activity.get(recipientId);
        if (activity) {
          data.set(x.kind, activity);
          hasDriver ||= drivers.has(x.kind);
        }
      });
      if (hasDriver) {
        const payload: NotificationPayload<'activityDigest'> = {
          to: recipientEmail.email,
          template: 'activityDigest',
          data: { data, viewUrl: '' },
          channels: ['email'],
        };
        const r = await notificationService.notify(payload);
        const result = r.success ? 'sent' : 'failed';

        // one send → fan its fate across all this recipient's rows (reactions ride along)
        for (const row of rowsForRecipient) outcomes.push({ row, result });
      }
    }

    logger.info('[notificationBatcher] send loop complete', summarizeOutcomes(outcomes));

    const { deleteIds, bumpRowIds, logs } = cleanUp(outcomes);
    await Promise.all([
      systemAsyncNotificationRepository.deleteCompletedRecords(deleteIds),
      systemAsyncNotificationRepository.bumpRecordAttemptsByIds(bumpRowIds),
    ]);
    logs.forEach((x) => logger.info(x));

    return deleteIds.length + bumpRowIds.length > 0 ? 'processed' : 'idle';
  };
};
