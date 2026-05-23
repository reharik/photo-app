import type { Logger } from '@packages/infrastructure';

import type { Config } from './config.js';
import type { KoaServer } from './koaServer.js';

export interface Server {
  start(): Promise<void>;
}

type ServerDeps = {
  koaServer: KoaServer;
  config: Config;
  logger: Logger;
};

export const build__Server = ({ koaServer, config, logger }: ServerDeps): Server => {
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
