import { AwilixContainer } from 'awilix';
import { AttachGlobalHandlers } from './attachGlobalHandlers';
import { RunMediaWorkerLoop } from './runMediaWorkerLoop';
import { LogMediaWorkerStartup } from './tasks/queue/mediaWorkers/logMediaWorkerStartup';

type AppDeps = {
  runMediaWorkerLoop: RunMediaWorkerLoop;
  logMediaWorkerStartup: LogMediaWorkerStartup;
  attachGlobalHandlers: AttachGlobalHandlers;
};
// app.ts
export interface App {
  (container: AwilixContainer): Promise<void>;
}

export const build__App =
  ({ runMediaWorkerLoop, logMediaWorkerStartup, attachGlobalHandlers }: AppDeps): App =>
  async (container) => {
    await logMediaWorkerStartup();
    const workerPromise = runMediaWorkerLoop.start();
    attachGlobalHandlers(workerPromise, container);
    await workerPromise;
  };
