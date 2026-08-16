import { SweepCadence } from '@packages/contracts';

export type WorkerTaskOutcome = 'processed' | 'idle';

/**
 * One iteration unit for the media worker loop. The loop iterates a priority-
 * ordered list of tasks, running the first DUE task and breaking back to the top
 * on 'processed'. Type-only module — intentionally no `build__*` factory, so it
 * is never registered as an IoC contract.
 */
export type WorkerTask = QueueWorkerTask | ScheduledWorkerTask;

/**
 * Exported because it is the `workerTasks` IoC group's baseType: group membership
 * is NOMINAL (extends chains / type-alias intersections), so the WorkerTask union
 * itself can never collect members — the shared base is what every per-task
 * contract interface transitively reaches. The generated group type is the union
 * of member contracts, which stays discriminated on `type`.
 */
export type WorkerTaskBase = {
  name: string;
  /** Do one unit of work. 'processed' resets the idle backoff and restarts the
   *  pass from the highest-priority task; 'idle' falls through to the next task. */
  run: () => Promise<WorkerTaskOutcome>;
};
export type QueueWorkerTask = WorkerTaskBase & {
  type: 'queue';
  /** Execution priority among queue tasks: lower runs first. The pass walks queue
   *  tasks in ascending `order`, and a 'processed' outcome restarts the pass from
   *  the top — so the lowest-`order` due task always gets first claim each cycle.
   *  Keep these values spaced (e.g. 100, 200) to leave room to insert tasks
   *  between existing ones without renumbering. */
  order: number;
};
export type ScheduledWorkerTask = WorkerTaskBase & {
  type: 'schedule';
  cadence: SweepCadence;
};

export const isQueueTask = (x: WorkerTask): x is QueueWorkerTask => x.type === 'queue';
