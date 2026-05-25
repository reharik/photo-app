import { Logger } from '@packages/infrastructure';
import dotenv from 'dotenv';
import type { Knex } from 'knex';
import { initializeContainer } from './container';
import type { Server } from './server';

const attachGlobalHandlers = (database: Knex, logger: Logger, server: Server) => {
  let shuttingDown = false;

  const shutdown = async (signal: string) => {
    console.log(`[shutdown] called with signal: ${signal}`);
    if (shuttingDown) return;
    shuttingDown = true;

    // Force-exit if cleanup takes too long
    setTimeout(() => {
      console.error('Shutdown timeout, forcing exit');
      process.exit(1);
    }, 5000).unref();

    try {
      await new Promise((resolve) => server.close(resolve));
      await database.destroy();
    } finally {
      process.exit(0);
    }
  };

  process.on('SIGINT', () => {
    void shutdown();
  });

  process.on('SIGTERM', () => {
    void shutdown();
  });

  process.on('unhandledRejection', (reason) => {
    if (reason instanceof Error) {
      logger.error('Unhandled promise rejection', reason);
      return;
    }

    logger.error('Unhandled promise rejection', { reason });
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', error);

    // optional but recommended in prod:
    // process.exit(1);
  });
};

const bootstrap = async () => {
  dotenv.config();

  const container = initializeContainer();

  const database = container.resolve<Knex>('database');
  const logger = container.resolve<Logger>('logger');
  const server = container.resolve<Server>('server');
  attachGlobalHandlers(database, logger, server);

  await server.start();
};

void bootstrap();
