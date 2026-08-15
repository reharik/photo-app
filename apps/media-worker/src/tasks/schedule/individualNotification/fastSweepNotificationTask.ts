import { SweepCadence } from '@packages/contracts';
import { Logger } from '@packages/infrastructure';
import { Config } from '../../../config';
import { ScheduledWorkerTask } from '../../../types';
import { FastSweepNotification } from './fastSweepNotification';

// Named per-task contract interface (name narrowed to this task's literal):
// discovery cannot use the WorkerTask union as a contract, a bare alias is
// structurally deduped back to the arm, and a dedicated interface keeps the
// workerTasks group default-free.
export interface FastSweepNotificationTask extends ScheduledWorkerTask {
  name: 'fastSweepNotification';
}

type FastSweepNotificationTaskDeps = {
  config: Config;
  logger: Logger;
  fastSweepNotification: FastSweepNotification;
};

// Immediate notifications (Batching.immediate) map onto the fast sweep interval
// here, once, at registration.
export const build__FastSweepNotificationTask = ({
  fastSweepNotification,
}: FastSweepNotificationTaskDeps): FastSweepNotificationTask => ({
  name: 'fastSweepNotification',
  type: 'schedule',
  cadence: SweepCadence.fast,
  run: async () => fastSweepNotification(),
});
