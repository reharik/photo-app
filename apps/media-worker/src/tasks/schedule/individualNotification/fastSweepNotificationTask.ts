import { Logger } from '@packages/infrastructure';
import { Config } from '../../../config';
import { WorkerTask } from '../../../types';
import { FastSweepNotification } from './fastSweepNotification';

type FastSweepNotificationTaskDeps = {
  config: Config;
  logger: Logger;
  fastSweepNotification: FastSweepNotification;
};

export const build__FastSweepNotificationTask = ({
  fastSweepNotification,
}: FastSweepNotificationTaskDeps): WorkerTask => ({
  name: 'fastSweepNotification',
  type: 'schedule',
  cadence: 'fast',
  run: async () => fastSweepNotification(),
});
