import { Logger } from '@packages/infrastructure';
import { AwilixContainer } from 'awilix';
import type { Knex } from 'knex';
import { writeSync } from 'node:fs';
import type { Server } from './server';

/** Grep handle for the whole shutdown sequence in CloudWatch. */
const TAG = '[shutdown:api]';

const FORCE_EXIT_MS = 5000;

/**
 * Straight to fd 1, bypassing winston. The Console transport writes through
 * process.stdout, which is ASYNC whenever stdout is a pipe — i.e. in every
 * container. A line logged immediately before process.exit() can be truncated
 * away, and the BEGIN/COMPLETE markers are precisely the ones that must survive.
 */
const mark = (line: string): void => {
  try {
    writeSync(1, `${line}\n`);
  } catch {
    // stdout is gone; there is nothing left to report it with.
  }
};

export interface AttachGlobalHandlers {
  (container: AwilixContainer): Promise<void>;
}

type AttachGlobalHandlersDeps = { database: Knex; logger: Logger; server: Server };

export const build__AttachGlobalHandlers =
  ({ logger, database, server }: AttachGlobalHandlersDeps): AttachGlobalHandlers =>
  async (container: AwilixContainer) => {
    let shuttingDown = false;

    const shutdown = async (signal: string) => {
      if (shuttingDown) {
        logger.info(`${TAG} ${signal} ignored, shutdown already in progress`);
        return;
      }
      shuttingDown = true;

      const startedAt = Date.now();
      const elapsed = () => Date.now() - startedAt;
      mark(`${TAG} BEGIN (signal=${signal})`);

      setTimeout(() => {
        mark(`${TAG} TIMEOUT after ${FORCE_EXIT_MS}ms, forcing exit 1`);
        process.exit(1);
      }, FORCE_EXIT_MS).unref();

      try {
        logger.info(`${TAG} draining http server`);
        await server.close(); // 1. stop new conns, drain in-flight
        logger.info(`${TAG} http server drained (${elapsed()}ms)`);

        logger.info(`${TAG} closing pg pool`);
        await database.destroy(); // 2. close pg pool
        logger.info(`${TAG} pg pool closed (${elapsed()}ms)`);

        logger.info(`${TAG} disposing container`);
        await container.dispose(); // 3. dispose the rest
      } catch (e) {
        // Previously this threw into the finally below and the exit(0) discarded
        // it. Same outcome, but now the failure is on the record.
        logger.error(`${TAG} error during shutdown`, e instanceof Error ? e : { err: String(e) });
      } finally {
        mark(`${TAG} COMPLETE in ${elapsed()}ms, exiting 0`);
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
