import { Config } from '../../config';
import { WorkerTask } from '../../types';
import { NotificationBatcher } from './notificationBatcher';

const intervalGate = (intervalMs: number) => {
  let lastRun = 0;
  return () => {
    const now = Date.now();
    if (now - lastRun >= intervalMs) {
      lastRun = now;
      return true;
    }
    return false;
  };
};

type NotificationBatchTaskDeps = {
  config: Config;
  notificationBatcher: NotificationBatcher;
};

export const build__NotificationSweepTask = ({
  config,
  notificationBatcher,
}: NotificationBatchTaskDeps): WorkerTask => ({
  name: 'notification-sweep',
  due: intervalGate(config.notificationSweepIntervalMs), // scheduled, not queue-probe
  run: async () => notificationBatcher(),
  order: 300,
});
