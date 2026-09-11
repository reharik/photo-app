import { notEmpty } from '@packages/contracts';
import { groupByMapping, indexBy, Logger } from '@packages/infrastructure';
import {
  AsyncNotification,
  SystemAsyncNotificationRepository,
  SystemUserRepository,
} from '@packages/worker-core';
import { Config } from '../../../config';
import { FastSweepNotificationStrategies } from '../../../generated/ioc-registry.types';
import { RowOutcome } from '../outcomeCleanup';
import { ConcretePayloadResult } from './fastSweepNotificationStrategies/types';

export type BuildFastSweepPayloads = () => Promise<ConcretePayloadResult[]>;

type BuildFastSweepPayloadsDeps = {
  logger: Logger;
  systemAsyncNotificationRepository: SystemAsyncNotificationRepository;
  systemUserRepository: SystemUserRepository;
  config: Config;
  fastSweepNotificationStrategies: FastSweepNotificationStrategies;
};

export const build__BuildFastSweepPayloads = ({
  logger,
  systemAsyncNotificationRepository,
  systemUserRepository,
  config,
  fastSweepNotificationStrategies,
}: BuildFastSweepPayloadsDeps): BuildFastSweepPayloads => {
  const hydrateUsers = async (rows: AsyncNotification[]) => {
    const ids = rows.flatMap((x) => [x.actorId, x.recipientId]).filter(notEmpty);
    const uniqueIds = new Set(ids);
    const users = await systemUserRepository.getUserContacts([...uniqueIds]);
    return indexBy(users);
  };

  return async (): Promise<ConcretePayloadResult[]> => {
    // NOT a claim despite the name: plain SELECT, no lock, no status flip. Safe
    // only while exactly one worker process runs. A second worker would select
    // the same rows and double-send. Add SKIP LOCKED + a claim flip before
    // scaling out.
    const rows = await systemAsyncNotificationRepository.claimIndividualNotifications(
      config.debounceEmailWindowSeconds,
    );
    if (!rows.length) {
      return [];
    }
    logger.info(`[notification-send] claimed ${rows.length} row(s)`);
    const outcomes: RowOutcome[] = [];

    const userMap = await hydrateUsers(rows);
    const byKind = groupByMapping(rows, (x) => x.kind.value);
    const results: ConcretePayloadResult[][] = [];
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
      const newLocal = await strategy.execute(kindRows, userMap);
      results.push(newLocal);
    }
    return results.flat();
  };
};
