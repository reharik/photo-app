import type { Logger } from '@packages/infrastructure';
import { UnitOfWork } from '@packages/worker-core';
import type { Config } from './config.js';
import { IntervalGate } from './intervalGate.js';
import { isQueueTask, WorkerTaskOutcome, type WorkerTask } from './types.js';

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
 * both fall through without counting as work. A thrown run() is logged here and
 * then propagates to the caller's try/catch, skipping the remaining tasks this
 * pass.
 */
export const runWorkerTasksOnce = async (
  tasks: ReadonlyArray<WorkerTask>,
  logger: Logger,
  uow: UnitOfWork,
): Promise<boolean> => {
  for (const task of tasks) {
    let outcome: WorkerTaskOutcome;
    try {
      outcome = await task.run();
    } catch (e) {
      logger.error(`[mediaWorker-run_once] task "${task.name}" threw`, e);
      // Log HERE, rethrow, and let the caller swallow it — the one place that
      // reports this is the one place that still holds the task name and the
      // error together.
      //
      // Why this rethrows and runAllTasks below does not: the two segments have
      // opposite iteration contracts. Queue tasks are priority-ordered with
      // restart-from-top preemption, so the walk is meant to stop early — this
      // rethrow is just the abort arm of the same `return`-on-'processed' rule,
      // and it hands the caller a "queue segment is over" signal that leaves
      // didWork false so the sweeps still run. Sweeps are peers on independent
      // interval gates with no ordering between them, so runAllTasks logs and
      // keeps walking: one failing sweep must not skip the others, and there is
      // no early exit for a throw to be the abort arm OF.
      //
      // Rethrowing is also what keeps the caller's catch honest. Swallow it here
      // instead and that catch becomes dead code, while its comment goes on
      // claiming a rethrow that never happens — which is exactly how this
      // function came to log nothing at all for a while.
      throw e;
    } finally {
      if (uow.isOpen()) {
        logger.error(`[mediaWorker-run_once] task "${task.name}" left a transaction open`);
        await uow.complete(false);
      }
    }
    if (outcome === 'processed') {
      return true;
    }
  }
  return false;
};

export const runAllTasks = async (
  tasks: ReadonlyArray<WorkerTask>,
  logger: Logger,
  uow: UnitOfWork,
): Promise<boolean> => {
  let didWork = false;
  for (const task of tasks) {
    try {
      const outcome = await task.run();
      if (outcome === 'processed') didWork = true;
    } catch (e) {
      logger.error(`[mediaWorker-run_all] task "${task.name}" threw`, e);
    } finally {
      if (uow.isOpen()) {
        logger.error(`[mediaWorker-run_all] task "${task.name}" left a transaction open`);
        await uow.complete(false);
      }
    }
  }
  return didWork;
};

/** Log an idle heartbeat at info roughly every 30s at the default 2s poll interval. */
const IDLE_HEARTBEAT_EVERY_CYCLES = 225;

type RunMediaWorkerLoopDeps = {
  config: Config;
  logger: Logger;
  intervalGate: IntervalGate;
  uow: UnitOfWork;
};

export const build__RunMediaWorkerLoop = ({
  config,
  logger,
  intervalGate,
  uow,
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
        // Two-phase pass. Queue tasks first, with restart-from-top preemption: run the
        // highest-priority due task, return on the first 'processed', and re-poll so the
        // lowest-order task always gets the next claim. Only when the queue reports idle
        // do due sweeps run — all of them, no early return, each stamping its own gate on
        // completion. This keeps a busy queue from consuming a sweep's interval slot
        // without ever firing it.
        const tasks = intervalGate.getTasksDue();
        const queueTasks = tasks.filter(isQueueTask);
        const sweepTasks = tasks.filter((t) => !isQueueTask(t));

        let didWork = false;
        try {
          didWork = await runWorkerTasksOnce(queueTasks, logger, uow);
        } catch {
          // Swallowed deliberately: runWorkerTasksOnce already logged the task name
          // and the error before rethrowing. The rethrow's job is to abort the rest
          // of the QUEUE segment, not the pass — sweeps run only on an idle queue,
          // which is the same condition that reaches a low-order throwing task, so
          // letting this reach the outer catch starves every scheduled task for as
          // long as the throw persists. Falling through leaves the backoff intact:
          // didWork stays false, so an all-idle pass still sleeps the poll interval.
        }
        if (didWork) {
          idleCycles = 0;
          continue;
        }

        const sweepDidWork = await runAllTasks(sweepTasks, logger, uow);
        if (sweepDidWork) {
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
        logger.error('Media worker loop error', e);
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
