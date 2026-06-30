import { Logger } from '@packages/infrastructure';
import { Config } from '../../../config';
import { WorkerTask } from '../../../types';
import { NotificationBatcher } from './notificationBatcher';

type NotificationBatchTaskDeps = {
  config: Config;
  logger: Logger;
  notificationBatcher: NotificationBatcher;
};

export const build__NotificationBatchTask = ({
  notificationBatcher,
}: NotificationBatchTaskDeps): WorkerTask => ({
  name: 'notificationBatcher',
  type: 'schedule',
  cadence: 'slow',
  run: async () => notificationBatcher(),
});
