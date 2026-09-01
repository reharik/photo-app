import { Logger } from '@packages/infrastructure';
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
    let shuttingDown = false;

    const shutdown = async (signal: string) => {
      console.log(`[shutdown] called with signal: ${signal}`);
      if (shuttingDown) return;
      shuttingDown = true;

      setTimeout(() => {
        console.error('Shutdown timeout, forcing exit');
        process.exit(1);
      }, 5000).unref();

      try {
        await server.close(); // 1. stop new conns, drain in-flight
        await database.destroy(); // 2. close pg pool
        await container.dispose(); // 3. dispose the rest
      } finally {
        process.exit(0);
      }
    };

    process.on('SIGINT', () => void shutdown('SIGINT'));
    process.on('SIGTERM', () => void shutdown('SIGTERM'));

    process.on('unhandledRejection', (reason) => {
      if (reason instanceof Error) {
        logger.error('Unhandled promise rejection', reason);
        return;
      }
      logger.error('Unhandled promise rejection', { reason });
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', error);
    });
  };
