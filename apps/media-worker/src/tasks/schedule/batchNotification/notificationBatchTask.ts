import { SweepCadence } from '@packages/contracts';
import { Logger } from '@packages/infrastructure';
import { Config } from '../../../config';
import { ScheduledWorkerTask } from '../../../types';
import { NotificationBatcher } from './notificationBatcher';

// Named per-task contract interface (name narrowed to this task's literal):
// discovery cannot use the WorkerTask union as a contract, a bare alias is
// structurally deduped back to the arm, and a dedicated interface keeps the
// workerTasks group default-free.
export interface NotificationBatchTask extends ScheduledWorkerTask {
  name: 'notificationBatcher';
}

type NotificationBatchTaskDeps = {
  config: Config;
  logger: Logger;
  notificationBatcher: NotificationBatcher;
};

// Batched notifications wait for company (Batching.batched); that delivery axis
// maps onto the worker's slow sweep interval here, once, at registration.
export const build__NotificationBatchTask = ({
  notificationBatcher,
}: NotificationBatchTaskDeps): NotificationBatchTask => ({
  name: 'notificationBatcher',
  type: 'schedule',
  cadence: SweepCadence.slow,
  run: async () => notificationBatcher(),
});
