import { Logger } from '@packages/infrastructure';
import { AwilixContainer } from 'awilix';
import dotenv from 'dotenv';
import type { Knex } from 'knex';
import { Cradle, createAppContainer } from './container';
import type { Server } from './server';

import { registerDomainEventHandlers, type EventPublisher } from '@packages/media-core';
import { DomainEventHandlers } from '@packages/media-core/iocTypes';

const attachGlobalHandlers = (
  database: Knex,
  logger: Logger,
  server: Server,
  container: AwilixContainer<Cradle>,
) => {
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

const bootstrap = async () => {
  dotenv.config();
  const container = createAppContainer();
  const database = container.resolve<Knex>('database');
  const logger = container.resolve<Logger>('logger');
  const server = container.resolve<Server>('server');
  const eventPublisher = container.resolve<EventPublisher>('eventPublisher');
  const domainEventHandlers = container.resolve<DomainEventHandlers>('domainEventHandlers');
  registerDomainEventHandlers(eventPublisher, domainEventHandlers, logger);
  attachGlobalHandlers(database, logger, server, container); // ← container now passed
  await server.start();
};

void bootstrap();
