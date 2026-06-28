export type WorkerTaskOutcome = 'processed' | 'idle';

/**
 * One iteration unit for the media worker loop. The loop iterates a priority-
 * ordered list of tasks, running the first DUE task and breaking back to the top
 * on 'processed'. Type-only module — intentionally no `build__*` factory, so it
 * is never registered as an IoC contract.
 */
export type WorkerTask = {
  name: string;
  /** Cheap gate: should run() be attempted this pass? Queue tasks: () => true
   *  (the claim inside run() is itself the work-probe). Scheduled tasks gate on
   *  an interval. A task that is not due is skipped and does NOT count as work. */
  due: () => boolean | Promise<boolean>;
  /** Do one unit of work. 'processed' resets the idle backoff and restarts the
   *  pass from the highest-priority task; 'idle' falls through to the next task. */
  run: () => Promise<WorkerTaskOutcome>;
  /** Execution priority within the loop: lower runs first. The pass walks tasks
   *  in ascending `order`, and a 'processed' outcome restarts the pass from the
   *  top — so the lowest-`order` due task always gets first claim each cycle.
   *  Keep these values spaced (e.g. 100, 200) to leave room to insert tasks
   *  between existing ones without renumbering. */
  order: number;
};
