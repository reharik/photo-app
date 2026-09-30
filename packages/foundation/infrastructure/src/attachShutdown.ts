// packages/foundation/infrastructure/src/shutdown.ts
import { writeSync } from 'node:fs';
import { Logger } from './logger';

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

export type ShutdownStep = {
  name: string;
  run: () => Promise<void>;
};

export type ShutdownConfig = {
  /** Appears in every line as [shutdown:<tag>] — the CloudWatch grep handle. */
  tag: string;
  logger: Logger;
  /** Hard ceiling on the drain. A hung step must not hang the process. */
  forceExitMs?: number;
  /** Run in order: stop taking new work first, close resources last. */
  steps: ShutdownStep[];
};

/**
 * Single owner of process lifetime. Signals drain and exit 0; uncaught
 * exceptions and unhandled rejections drain and exit 1. The logger must NOT
 * also handle exceptions (coreLogger: handleExceptions false) or winston's
 * own backstop will exit before this drain finishes.
 */
export const attachShutdown = ({
  tag,
  logger,
  forceExitMs = 5000,
  steps,
}: ShutdownConfig): void => {
  const TAG = `[shutdown:${tag}]`;
  let shuttingDown = false;

  const shutdown = async (reason: string, exitCode: number): Promise<void> => {
    if (shuttingDown) {
      logger.info(`${TAG} ${reason} ignored, shutdown already in progress`);
      return;
    }
    shuttingDown = true;

    let code = exitCode;
    const startedAt = Date.now();
    const elapsed = () => Date.now() - startedAt;
    mark(`${TAG} BEGIN (reason=${reason})`);

    setTimeout(() => {
      mark(`${TAG} TIMEOUT after ${forceExitMs}ms, forcing exit 1`);
      process.exit(1);
    }, forceExitMs).unref();

    try {
      for (const step of steps) {
        logger.info(`${TAG} ${step.name}`);
        try {
          await step.run();
          logger.info(`${TAG} ${step.name} — done (${elapsed()}ms)`);
        } catch (e) {
          // Keep going: a failed step must not strand the resources later steps release.
          logger.error(
            `${TAG} ${step.name} — failed (${elapsed()}ms)`,
            e instanceof Error ? e : { err: String(e) },
          );
          code = 1; // a drain that threw is not a clean shutdown
        }
      }
    } finally {
      mark(`${TAG} COMPLETE in ${elapsed()}ms, exiting ${code}`);
      process.exit(code);
    }
  };

  process.on('SIGINT', () => void shutdown('SIGINT', 0));
  process.on('SIGTERM', () => void shutdown('SIGTERM', 0));

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', error);
    void shutdown('uncaughtException', 1);
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', reason instanceof Error ? reason : { reason });
    void shutdown('unhandledRejection', 1);
  });
};
