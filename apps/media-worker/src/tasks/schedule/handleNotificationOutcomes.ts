import { Logger } from '@packages/infrastructure';
import { SystemAsyncNotificationRepository } from '@packages/worker-core';
import { cleanUp, RowOutcome } from './outcomeCleanup';

export type HandleNotificationOutcomes = (
  outcomes: RowOutcome[],
) => Promise<{ deleteIds: number; bumpRowIds: number }>;

type HandleNotificationOutcomesDeps = {
  logger: Logger;
  systemAsyncNotificationRepository: SystemAsyncNotificationRepository;
};

export const build__HandleNotificationOutcomes = ({
  logger,
  systemAsyncNotificationRepository,
}: HandleNotificationOutcomesDeps): HandleNotificationOutcomes => {
  return async (outcomes: RowOutcome[]): Promise<{ deleteIds: number; bumpRowIds: number }> => {
    const { deleteIds, bumpRowIds, logs } = cleanUp(outcomes);
    await systemAsyncNotificationRepository.deleteCompletedRecords(deleteIds);
    await systemAsyncNotificationRepository.bumpRecordAttemptsByIds(bumpRowIds);

    logs.forEach((x) => logger.info(x.message, x.meta));

    return { deleteIds: deleteIds.length, bumpRowIds: bumpRowIds.length };
  };
};
