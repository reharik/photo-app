import { notEmpty } from '@packages/contracts';
import { groupByMapping, indexBy, Logger } from '@packages/infrastructure';
import {
  SystemAsyncNotificationRepository,
  SystemUserRepository,
  UserContact,
} from '@packages/worker-core';
import { Config } from '../../../config';
import { BatchedEmailActivity } from '../../../generated/ioc-registry.types';
import { RowOutcome } from '../outcomeCleanup';
import { ActivityResult, LivingRow } from './batchedPayloads/types';

export type DigestBatchResult = {
  recipientMap: Map<string, LivingRow[]>;
  payloads: ActivityResult[];
  recipientEmailMap: Map<string, UserContact>;
  outcomes: RowOutcome[];
};
export type ClaimDigestBatch = () => Promise<DigestBatchResult | undefined>;

type ClaimDigestBatchDeps = {
  logger: Logger;
  systemAsyncNotificationRepository: SystemAsyncNotificationRepository;
  systemUserRepository: SystemUserRepository;
  batchedEmailActivity: BatchedEmailActivity;
  config: Config;
};

export const build__ClaimDigestBatch = ({
  logger,
  systemAsyncNotificationRepository,
  systemUserRepository,
  batchedEmailActivity,
  config,
}: ClaimDigestBatchDeps): ClaimDigestBatch => {
  return async (): Promise<DigestBatchResult | undefined> => {
    // NOT a claim despite the name: plain SELECT, no lock, no status flip. Safe
    // only while exactly one worker process runs. A second worker would select
    // the same rows and double-send. Add SKIP LOCKED + a claim flip before
    // scaling out.
    const rows = await systemAsyncNotificationRepository.claimNotificationBatch(
      config.debounceEmailWindowSeconds,
    );
    if (!rows.length) {
      return;
    }

    logger.info(`[ClaimDigestBatch] claimed ${rows.length} row(s)`);

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
    return { recipientMap, payloads, recipientEmailMap, outcomes };
  };
};
