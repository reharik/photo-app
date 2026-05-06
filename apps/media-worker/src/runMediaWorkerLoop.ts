import { IocGeneratedCradle } from './di/generated/ioc-registry.types';

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export type RunMediaWorkerLoop = {
  start: () => Promise<void>;
  stop: () => void;
};

export const build__RunMediaWorkerLoop = ({
  config,
  logger,
  processNextMediaDeletionJob,
  processNextMediaImageJob,
}: IocGeneratedCradle): RunMediaWorkerLoop => {
  let running = false;
  let stopRequested = false;

  const start = async (): Promise<void> => {
    if (running) {
      return;
    }
    running = true;
    stopRequested = false;
    logger.info('Media worker started', {
      pollIntervalMs: config.mediaWorkerPollIntervalMs,
    });

    while (!stopRequested) {
      try {
        const deletionOutcome = await processNextMediaDeletionJob();
        if (deletionOutcome === 'processed') {
          continue;
        }
        const imageOutcome = await processNextMediaImageJob();
        if (imageOutcome === 'idle') {
          await sleep(config.mediaWorkerPollIntervalMs);
        }
      } catch (e) {
        if (e instanceof Error) {
          logger.error('Media worker loop error', e);
        } else {
          logger.error('Media worker loop error', { err: String(e) });
        }
        await sleep(config.mediaWorkerPollIntervalMs);
      }
    }

    running = false;
    logger.info('Media worker stopped');
  };

  const stop = (): void => {
    stopRequested = true;
  };

  return { start, stop };
};
