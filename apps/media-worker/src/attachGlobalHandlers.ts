import { Logger } from '@packages/infrastructure';
// attachGlobalHandlers.ts
export interface AttachGlobalHandlers {
  (shutdown: () => Promise<void>): void;
}

type AttachGlobalHandlersDeps = { logger: Logger };

export const build__AttachGlobalHandlers =
  ({ logger }: AttachGlobalHandlersDeps): AttachGlobalHandlers =>
  (shutdown) => {
    const run = (signal: string) => () => {
      logger.info(`Received ${signal}, shutting down`);
      void shutdown().then(
        () => process.exit(0),
        (e) => {
          if (e instanceof Error) {
            logger.error('Shutdown failed', e);
          } else {
            logger.error('Shutdown failed', { err: String(e) });
          }
          process.exit(1);
        },
      );
    };
    process.on('SIGINT', run('SIGINT'));
    process.on('SIGTERM', run('SIGTERM'));
  };
