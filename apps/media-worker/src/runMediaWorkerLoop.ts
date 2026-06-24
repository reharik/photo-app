import type { Logger } from '@packages/infrastructure';

import type { RunNextMediaDeletionJob } from './application/processNextMediaDeletionJob.js';
import type { RunNextMediaImageJob } from './application/processNextMediaImageJob.js';
import type { Config } from './config.js';

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export type RunMediaWorkerLoop = {
  start: () => Promise<void>;
  stop: () => void;
};

/** Log an idle heartbeat at info roughly every 30s at the default 2s poll interval. */
const IDLE_HEARTBEAT_EVERY_CYCLES = 225;

type RunMediaWorkerLoopDeps = {
  config: Config;
  logger: Logger;
  runNextMediaDeletionJob: RunNextMediaDeletionJob;
  runNextMediaImageJob: RunNextMediaImageJob;
};

export const build__RunMediaWorkerLoop = ({
  config,
  logger,
  runNextMediaDeletionJob,
  runNextMediaImageJob,
}: RunMediaWorkerLoopDeps): RunMediaWorkerLoop => {
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
        const deletionOutcome = await runNextMediaDeletionJob();
        if (deletionOutcome === 'processed') {
          idleCycles = 0;
          continue;
        }
        const imageOutcome = await runNextMediaImageJob();
        if (imageOutcome === 'processed') {
          idleCycles = 0;
          continue;
        }

        idleCycles += 1;
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
