import { IocGeneratedCradle } from './di/generated/ioc-registry.types';

export interface Server {
  start(): Promise<void>;
}

export const build__Server = ({ koaServer, config, logger }: IocGeneratedCradle): Server => {
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
