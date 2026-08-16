import { SweepCadence } from '@packages/contracts';
import { Logger } from '@packages/infrastructure';
import { Config } from './config';
import { WorkerTasks } from './generated/ioc-registry.types';
import { isQueueTask, ScheduledWorkerTask, WorkerTask } from './types';

type SweepSet = {
  lastRun: number;
  interval: number;
  tasks: ScheduledWorkerTask[];
};
export interface IntervalGate {
  getTasksDue: () => WorkerTask[];
}

// WorkerTasks is the generated group type: a union of per-task contracts, each
// narrowing `name` to its literal. It is assignable to ReadonlyArray<WorkerTask>,
// so all gate logic below works on the domain union.
type IntervalGateDeps = { logger: Logger; config: Config; workerTasks: WorkerTasks };

const isScheduledWith =
  (cadence: SweepCadence) =>
  (x: WorkerTask): x is ScheduledWorkerTask =>
    x.type === 'schedule' && x.cadence.equals(cadence);

// This is dumb refactor to strategies and inject.  Maybe subtype WorkerTasks or something
export const build__IntervalGate = ({
  logger,
  config,
  workerTasks,
}: IntervalGateDeps): IntervalGate => {
  // Widen the generated contract union to the domain union so the type-predicate
  // filters can narrow to the arms (predicate S must extend the element type).
  const allTasks: readonly WorkerTask[] = workerTasks;
  const slowSweepSet = {
    lastRun: 0,
    interval: config.slowSweepIntervalMS,
    tasks: allTasks.filter(isScheduledWith(SweepCadence.slow)),
  };
  const fastSweepSet = {
    lastRun: 0,
    interval: config.fastSweepIntervalMS,
    tasks: allTasks.filter(isScheduledWith(SweepCadence.fast)),
  };
  const withStamp = (task: ScheduledWorkerTask, set: SweepSet): ScheduledWorkerTask => ({
    ...task,
    run: () =>
      task.run().finally(() => {
        set.lastRun = Date.now();
      }),
  });
  const getTasksDue = () => {
    const now = Date.now();
    // filter() returns a fresh array, so the in-place sort below is safe; the sweep
    // sets are built once at gate construction and must never be sorted in place.
    const queueTasks = allTasks.filter(isQueueTask);
    const slowOpen = now - slowSweepSet.lastRun > slowSweepSet.interval;
    const fastOpen = now - fastSweepSet.lastRun > fastSweepSet.interval;
    // debug, not info: these fire on every interval regardless of whether there
    // is any work, and at dev sweep intervals they drown out real job logs.
    if (slowOpen) {
      logger.debug(
        `[Interval-Gate] slow gate opened: intervalMs=${slowSweepSet.interval} msSinceLastFire=${now - slowSweepSet.lastRun}`,
      );
    }
    if (fastOpen) {
      logger.debug(
        `[Interval-Gate] fast gate opened: intervalMs=${fastSweepSet.interval} msSinceLastFire=${now - fastSweepSet.lastRun}`,
      );
    }
    return [
      ...queueTasks.sort((a, b) => a.order - b.order),
      ...(slowOpen ? slowSweepSet.tasks.map((t) => withStamp(t, slowSweepSet)) : []),
      ...(fastOpen ? fastSweepSet.tasks.map((t) => withStamp(t, fastSweepSet)) : []),
    ];
  };
  return { getTasksDue };
};
