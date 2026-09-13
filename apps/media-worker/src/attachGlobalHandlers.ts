import { Logger } from '@packages/infrastructure';
import { writeSync } from 'node:fs';
// attachGlobalHandlers.ts

/** Grep handle for the whole shutdown sequence in CloudWatch. */
export const TAG = '[shutdown:media-worker]';

/**
 * Straight to fd 1, bypassing winston. The Console transport writes through
 * process.stdout, which is ASYNC whenever stdout is a pipe — i.e. in every
 * container. A line logged immediately before process.exit() can be truncated
 * away, and the BEGIN/COMPLETE markers are precisely the ones that must survive.
 */
export const mark = (line: string): void => {
  try {
    writeSync(1, `${line}\n`);
  } catch {
    // stdout is gone; there is nothing left to report it with.
  }
};

export interface AttachGlobalHandlers {
  (shutdown: () => Promise<void>): void;
}

type AttachGlobalHandlersDeps = { logger: Logger };

export const build__AttachGlobalHandlers =
  ({ logger }: AttachGlobalHandlersDeps): AttachGlobalHandlers =>
  (shutdown) => {
    const run = (signal: string) => () => {
      const startedAt = Date.now();
      mark(`${TAG} SIGNAL ${signal} received`);
      void shutdown().then(
        () => {
          mark(`${TAG} COMPLETE in ${Date.now() - startedAt}ms, exiting 0`);
          process.exit(0);
        },
        (e) => {
          if (e instanceof Error) {
            logger.error(`${TAG} shutdown failed`, e);
          } else {
            logger.error(`${TAG} shutdown failed`, { err: String(e) });
          }
          mark(`${TAG} FAILED after ${Date.now() - startedAt}ms, exiting 1`);
          process.exit(1);
        },
      );
    };
    process.on('SIGINT', run('SIGINT'));
    process.on('SIGTERM', run('SIGTERM'));
  };
