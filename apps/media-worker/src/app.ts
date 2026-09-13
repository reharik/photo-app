import { Logger } from '@packages/infrastructure';
import { Knex } from 'knex';
import { AttachGlobalHandlers, TAG } from './attachGlobalHandlers';
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
      if (shuttingDown) {
        logger.info(`${TAG} shutdown already in progress`);
        return;
      }
      shuttingDown = true;
      const startedAt = Date.now();
      const elapsed = () => Date.now() - startedAt;

      logger.info(`${TAG} BEGIN, waiting for the in-flight job to finish`);
      runMediaWorkerLoop.stop();
      try {
        await workerPromise;
        logger.info(`${TAG} worker loop drained (${elapsed()}ms)`);
      } catch (e) {
        if (e instanceof Error) {
          logger.error(`${TAG} worker loop drain failed`, e);
        } else {
          logger.error(`${TAG} worker loop drain failed`, { err: String(e) });
        }
      } finally {
        logger.info(`${TAG} closing pg pool`);
        await database.destroy();
        logger.info(`${TAG} drain finished in ${elapsed()}ms`);
      }
    };

    attachGlobalHandlers(shutdown);

    await workerPromise.finally(shutdown);
  };
