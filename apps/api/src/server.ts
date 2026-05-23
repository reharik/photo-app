import type { AppCradle } from './di/generated/ioc-composed.js';

export interface Server {
  start(): Promise<void>;
}

export const build__Server = ({ koaServer, config, logger }: AppCradle): Server => {
  return {
    async start() {
      await new Promise<void>((resolve) => {
        koaServer.listen(config.serverPort, () => {
          logger.info(`🚀 Server running on http://localhost:${config.serverPort}`, {
            port: config.serverPort,
            nodeEnv: config.nodeEnv,
          });
          resolve();
        });
      });
    },
  };
};
