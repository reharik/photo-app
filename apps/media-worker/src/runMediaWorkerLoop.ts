import type { Logger } from '@packages/infrastructure';
import type { Config } from './config.js';
import { IocGeneratedCradle } from './generated/ioc-registry.types';
import type { WorkerTask } from './types.js';

type WorkerTasks = IocGeneratedCradle['workerTasks'];

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export type RunMediaWorkerLoop = {
  start: () => Promise<void>;
  stop: () => void;
};

/**
 * Run one pass over the priority-ordered task list: run the first DUE task,
 * stopping at the first 'processed' (restart-from-top semantics). Returns true
 * iff a task did work. Tasks that are not due, or that ran but returned 'idle',
 * both fall through without counting as work. A thrown run() propagates to the
 * caller's try/catch and skips the remaining tasks this pass.
 */
export const runWorkerTasksOnce = async (tasks: WorkerTask[]): Promise<boolean> => {
  for (const task of tasks) {
    if (!(await task.due())) {
      continue;
    }
    const outcome = await task.run();
    if (outcome === 'processed') {
      return true;
    }
  }
  return false;
};

/** Log an idle heartbeat at info roughly every 30s at the default 2s poll interval. */
const IDLE_HEARTBEAT_EVERY_CYCLES = 225;

type RunMediaWorkerLoopDeps = {
  config: Config;
  logger: Logger;
  workerTasks: WorkerTasks;
};

export const build__RunMediaWorkerLoop = ({
  config,
  logger,
  workerTasks,
}: RunMediaWorkerLoopDeps): RunMediaWorkerLoop => {
  let running = false;
  let stopRequested = false;
  const orderedTasks = [...workerTasks].sort((a, b) => a.order - b.order);
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
        const didWork = await runWorkerTasksOnce(orderedTasks);
        if (didWork) {
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
