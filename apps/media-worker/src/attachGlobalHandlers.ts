import { attachShutdown, Logger } from '@packages/infrastructure';
import { AwilixContainer } from 'awilix';
import { Knex } from 'knex';
import { RunMediaWorkerLoop } from './runMediaWorkerLoop';

export interface AttachGlobalHandlers {
  (workerPromise: Promise<void>, container: AwilixContainer): void;
}
type AttachGlobalHandlersDeps = {
  database: Knex;
  logger: Logger;
  runMediaWorkerLoop: RunMediaWorkerLoop;
};

export const build__AttachGlobalHandlers =
  ({ logger, database, runMediaWorkerLoop }: AttachGlobalHandlersDeps): AttachGlobalHandlers =>
  (workerPromise, container) => {
    attachShutdown({
      tag: 'media-worker',
      logger,
      steps: [
        {
          name: 'draining worker loop',
          run: async () => {
            runMediaWorkerLoop.stop();
            await workerPromise;
          },
        },
        { name: 'closing pg pool', run: () => database.destroy() },
        { name: 'disposing container', run: () => container.dispose() },
      ],
    });
  };
