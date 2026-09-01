import { notEmpty } from '@packages/contracts';
import { groupByMapping, indexBy, Logger } from '@packages/infrastructure';
import {
  AsyncNotification,
  SystemAsyncNotificationRepository,
  SystemUserRepository,
  UnitOfWork,
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
  uow: UnitOfWork;
};

export const build__FastSweepNotification = ({
  logger,
  notificationService,
  systemAsyncNotificationRepository,
  systemUserRepository,
  config,
  fastSweepNotificationStrategies,
  uow,
}: FastSweepNotificationDeps): FastSweepNotification => {
  const hydrateUsers = async (rows: AsyncNotification[]) => {
    const ids = rows.flatMap((x) => [x.actorId, x.recipientId]).filter(notEmpty);
    const uniqueIds = new Set(ids);
    const users = await systemUserRepository.getUserContacts([...uniqueIds]);
    return indexBy(users);
  };

  return async (): Promise<WorkerTaskOutcome> => {
    await uow.join();
    // NOT a claim despite the name: plain SELECT, no lock, no status flip. Safe
    // only while exactly one worker process runs. A second worker would select
    // the same rows and double-send. Add SKIP LOCKED + a claim flip before
    // scaling out.
    const rows = await systemAsyncNotificationRepository.claimIndividualNotifications(
      config.debounceEmailWindowSeconds,
    );
    if (!rows.length) {
      await uow.complete(true);
      return 'idle';
    }
    logger.info(`[notification-send] claimed ${rows.length} row(s)`);
    const outcomes: RowOutcome[] = [];

    const userMap = await hydrateUsers(rows);
    const byKind = groupByMapping(rows, (x) => x.kind.value);
    const results = [];
    for (const [kind, kindRows] of byKind) {
      const strategy = fastSweepNotificationStrategies.find((s) => s.kind.value === kind);
      if (!strategy) {
        kindRows.forEach((row) => outcomes.push({ row, result: 'skipped' }));
        logger.warn(
          '[notification-send] no send strategy for kind — rows left in queue unprocessed',
          {
            kind,
            rowIds: kindRows.map((x) => x.id),
          },
        );
        continue;
      }
      results.push(await strategy.execute(kindRows, userMap));
    }
    await uow.complete(true);
    // execute per-kind batch
    for (const r of results.flat()) {
      if (r.kind === 'skipped') {
        logger.warn('[notification-send] row skipped, will be deleted without sending', {
          reason: r.reason,
          rowId: r.row.id,
          kind: r.row.kind.value,
          recipientId: r.row.recipientId,
          containerId: r.row.containerId,
          subjectId: r.row.subjectId,
        });
        outcomes.push({ row: r.row, result: 'skipped', reason: r.reason });
        continue;
      }
      const sent = await notificationService.notify(r.payload);
      outcomes.push({ row: r.row, result: sent.success ? 'sent' : 'failed' });
    }

    logger.info('[notification-send] send loop complete', summarizeOutcomes(outcomes));

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
        '[fastSweepNotification] outcome cleanup failed — rows not settled, next pass will re-send',
        e,
        { deleteCount: deleteIds.length, bumpCount: bumpRowIds.length },
      );
    }
    return deleteIds.length + bumpRowIds.length > 0 ? 'processed' : 'idle';
  };
};
