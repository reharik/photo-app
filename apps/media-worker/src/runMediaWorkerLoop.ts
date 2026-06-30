import type { Logger } from '@packages/infrastructure';
import type { Config } from './config.js';
import { IocGeneratedCradle } from './generated/ioc-registry.types';
import { IntervalGate } from './intervalGate.js';
import type { WorkerTaskOutcome } from './types.js';

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
export const runWorkerTasksOnce = async (tasks: WorkerTasks, logger: Logger): Promise<boolean> => {
  if (tasks.length === 0) {
    return false;
  }
  for (const task of tasks) {
    let outcome: WorkerTaskOutcome;
    try {
      outcome = await task.run();
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      logger.error(`[mediaWorker] task "${task.name}" threw`, err);
      throw e;
    }
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
  intervalGate: IntervalGate;
};

export const build__RunMediaWorkerLoop = ({
  config,
  logger,
  intervalGate,
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
        // get all tasks that are due (queue tasks are always due)
        // execute them in a priority order, this means run all due tasks
        // in a loop. Execute the highest priority and return. loop again
        // till there is no more work to be done. Then fall through to the
        // sleep.
        const tasks = intervalGate.getTasksDue();
        const didWork = await runWorkerTasksOnce(tasks, logger);
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
