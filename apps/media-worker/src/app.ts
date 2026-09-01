import { Logger } from '@packages/infrastructure';
import { Knex } from 'knex';
import { AttachGlobalHandlers } from './attachGlobalHandlers';
import { RunMediaWorkerLoop } from './runMediaWorkerLoop';
import { LogMediaWorkerStartup } from './tasks/queue/mediaWorkers/logMediaWorkerStartup';

export interface App {
  (): Promise<void>;
}

type AppDeps = {
  logger: Logger;
  database: Knex;
  runMediaWorkerLoop: RunMediaWorkerLoop;
  logMediaWorkerStartup: LogMediaWorkerStartup;
  attachGlobalHandlers: AttachGlobalHandlers;
};

// app.ts
export const build__App =
  ({
    logger,
    database,
    runMediaWorkerLoop,
    logMediaWorkerStartup,
    attachGlobalHandlers,
  }: AppDeps): App =>
  async () => {
    await logMediaWorkerStartup();

    const workerPromise = runMediaWorkerLoop.start();

    let shuttingDown = false;
    const shutdown = async (): Promise<void> => {
      if (shuttingDown) return;
      shuttingDown = true;
      runMediaWorkerLoop.stop();
      try {
        await workerPromise;
      } catch (e) {
        if (e instanceof Error) {
          logger.error('Media worker shutdown wait failed', e);
        } else {
          logger.error('Media worker shutdown wait failed', { err: String(e) });
        }
      } finally {
        await database.destroy();
      }
    };

    attachGlobalHandlers(shutdown);

    await workerPromise.finally(shutdown);
  };
