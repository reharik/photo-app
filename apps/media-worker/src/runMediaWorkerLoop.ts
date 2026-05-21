import { IocGeneratedCradle } from './di/generated/ioc-registry.types';

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export type RunMediaWorkerLoop = {
  start: () => Promise<void>;
  stop: () => void;
};

/** Log an idle heartbeat at info roughly every 30s at the default 2s poll interval. */
const IDLE_HEARTBEAT_EVERY_CYCLES = 15;

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
    let idleCycles = 0;
    logger.info('Media worker started', {
      pollIntervalMs: config.mediaWorkerPollIntervalMs,
    });

    while (!stopRequested) {
      try {
        const deletionOutcome = await processNextMediaDeletionJob();
        if (deletionOutcome === 'processed') {
          idleCycles = 0;
          continue;
        }
        const imageOutcome = await processNextMediaImageJob();
        if (imageOutcome === 'processed') {
          idleCycles = 0;
          continue;
        }

        idleCycles += 1;
        logger.debug('Media worker poll: no jobs available', {
          idleCycles,
          pollIntervalMs: config.mediaWorkerPollIntervalMs,
        });
        if (idleCycles % IDLE_HEARTBEAT_EVERY_CYCLES === 0) {
          logger.info('Media worker heartbeat: waiting for jobs', {
            idleCycles,
            pollIntervalMs: config.mediaWorkerPollIntervalMs,
          });
        }
        await sleep(config.mediaWorkerPollIntervalMs);
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
