import { Logger, attachShutdown } from '@packages/infrastructure';
import { AwilixContainer } from 'awilix';
import type { Knex } from 'knex';
import type { Server } from './server';

export interface AttachGlobalHandlers {
  (container: AwilixContainer): Promise<void>;
}

type AttachGlobalHandlersDeps = { database: Knex; logger: Logger; server: Server };

export const build__AttachGlobalHandlers =
  ({ logger, database, server }: AttachGlobalHandlersDeps): AttachGlobalHandlers =>
  async (container: AwilixContainer) => {
    attachShutdown({
      tag: 'api',
      logger,
      steps: [
        { name: 'draining http server', run: () => server.close() },
        { name: 'closing pg pool', run: () => database.destroy() },
        { name: 'disposing container', run: () => container.dispose() },
      ],
    });
  };
