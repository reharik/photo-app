import { Logger } from '@packages/infrastructure';
import { Config } from './config';
import { IocGeneratedCradle } from './generated/ioc-registry.types';
import { WorkerTask } from './types';

export interface IntervalGate {
  getTasksDue: () => WorkerTask[];
}

type WorkerTasks = IocGeneratedCradle['workerTasks'];
type IntervalGateDeps = { logger: Logger; config: Config; workerTasks: WorkerTasks };

// This is dumb refactor to strategies and inject.  Maybe subtype WorkerTasks or something
export const build__IntervalGate = ({
  logger,
  config,
  workerTasks,
}: IntervalGateDeps): IntervalGate => {
  const slowSweepSet = {
    lastRun: 0,
    interval: config.slowSweepIntervalMS,
    tasks: workerTasks.filter((x) => x.cadence && x.cadence === 'slow'),
  };
  const fastSweepSet = {
    lastRun: 0,
    interval: config.fastSweepIntervalMS,
    tasks: workerTasks.filter((x) => x.cadence && x.cadence === 'fast'),
  };

  const getTasksDue = () => {
    const now = Date.now();
    const queueTasks = workerTasks.filter((x) => x.type === 'queue');
    const slowOpen = now - slowSweepSet.lastRun > slowSweepSet.interval;
    const fastOpen = now - fastSweepSet.lastRun > fastSweepSet.interval;
    if (slowOpen) {
      logger.info(
        `[Interval-Gate] slow gate opened: intervalMs=${slowSweepSet.interval} msSinceLastFire=${slowSweepSet.lastRun - now}`,
      );
      slowSweepSet.lastRun = now;
    }
    if (fastOpen) {
      logger.info(
        `[Interval-Gate] fast gate opened: intervalMs=${fastSweepSet.interval} msSinceLastFire=${fastSweepSet.lastRun - now}`,
      );
      fastSweepSet.lastRun = now;
    }
    const dueTasks = [
      ...queueTasks,
      ...(slowOpen ? slowSweepSet.tasks : []),
      ...(fastOpen ? fastSweepSet.tasks : []),
    ].sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));

    //////
    // log tasks that are registered
    // logger.info(
    //       `[notif-sweep] worker tasks: [${orderedTasks.map((t) => t.name).join(', ')}] (${orderedTasks.length})`,
    //     );
    return dueTasks;
  };
  return { getTasksDue };
};
