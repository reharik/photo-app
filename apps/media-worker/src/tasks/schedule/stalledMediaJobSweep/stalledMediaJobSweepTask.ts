import { SweepCadence } from '@packages/contracts';
import { Logger } from '@packages/infrastructure';
import { Config } from '../../../config';
import { ScheduledWorkerTask } from '../../../types';
import { StalledMediaJobSweep } from './stalledMediaJobSweep';

// Named per-task contract interface (name narrowed to this task's literal):
// discovery cannot use the WorkerTask union as a contract, a bare alias is
// structurally deduped back to the arm, and a dedicated interface keeps the
// workerTasks group default-free.
export interface StalledMediaJobSweepTask extends ScheduledWorkerTask {
  name: 'stalledMediaJobSweep';
}

type StalledMediaJobSweepTaskDeps = {
  config: Config;
  logger: Logger;
  stalledMediaJobSweep: StalledMediaJobSweep;
};

export const build__StalledMediaJobSweepTask = ({
  stalledMediaJobSweep,
}: StalledMediaJobSweepTaskDeps): StalledMediaJobSweepTask => ({
  name: 'stalledMediaJobSweep',
  type: 'schedule',
  cadence: SweepCadence.slow,
  run: async () => stalledMediaJobSweep(),
});
