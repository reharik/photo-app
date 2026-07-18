import { notEmpty } from '@packages/contracts';
import { groupByMapping, indexBy, Logger } from '@packages/infrastructure';
import {
  AsyncNotification,
  SystemAsyncNotificationRepository,
  SystemUserRepository,
} from '@packages/media-core';
import { NotificationService } from '@packages/notifications';
import { Config } from '../../../config';
import { FastSweepNotificationStrategies } from '../../../generated/ioc-registry.types';
import { WorkerTaskOutcome } from '../../../types';
import { cleanUp, RowOutcome, summarizeOutcomes } from '../outcomeCleanup';

export type FastSweepNotification = () => Promise<'idle' | 'processed'>;

type FastSweepNotificationDeps = {
  logger: Logger;
  notificationService: NotificationService;
  systemAsyncNotificationRepository: SystemAsyncNotificationRepository;
  systemUserRepository: SystemUserRepository;
  config: Config;
  fastSweepNotificationStrategies: FastSweepNotificationStrategies;
};

export const build__FastSweepNotification = ({
  logger,
  notificationService,
  systemAsyncNotificationRepository,
  systemUserRepository,
  config,
  fastSweepNotificationStrategies,
}: FastSweepNotificationDeps): FastSweepNotification => {
  const hydrateUsers = async (rows: AsyncNotification[]) => {
    const ids = rows.flatMap((x) => [x.actorId, x.recipientId]).filter(notEmpty);
    const uniqueIds = new Set(ids);
    const users = await systemUserRepository.getUserContacts([...uniqueIds]);
    return indexBy(users);
  };

  return async (): Promise<WorkerTaskOutcome> => {
    const rows = await systemAsyncNotificationRepository.claimIndividualNotifications(
      config.debounceEmailWindowSeconds,
    );
    logger.info(`[notification-send] claimed ${rows.length} row(s)`);
    if (!rows.length) {
      return 'idle';
    }
    const outcomes: RowOutcome[] = [];

    const userMap = await hydrateUsers(rows);
    const byKind = groupByMapping(rows, (x) => x.kind.value);
    const promises = [];
    for (const [kind, kindRows] of byKind) {
      const strategy = fastSweepNotificationStrategies.find((s) => s.kind.value === kind);
      if (!strategy) {
        kindRows.forEach((row) => [...outcomes, { row, result: 'skipped' }]);
        logger.warn(`[notification-send] no strategy for kind '${kind}'`);
        continue;
      }
      promises.push(strategy.execute(kindRows, userMap));
    }
    const results = (await Promise.all(promises)).flat();

    // execute per-kind batch
    for (const r of results) {
      if (r.kind === 'skipped') {
        outcomes.push({ row: r.row, result: 'skipped' });
        continue;
      }
      const sent = await notificationService.notify(r.payload);
      outcomes.push({ row: r.row, result: sent.success ? 'sent' : 'failed' });
    }

    logger.info('[notification-send] send loop complete', summarizeOutcomes(outcomes));

    const { deleteIds, bumpRowIds, logs } = cleanUp(outcomes);
    await systemAsyncNotificationRepository.deleteCompletedRecords(deleteIds);
    await systemAsyncNotificationRepository.bumpRecordAttemptsByIds(bumpRowIds);
    logs.forEach((x) => logger.info(x));
    return deleteIds.length + bumpRowIds.length > 0 ? 'processed' : 'idle';
  };
};
