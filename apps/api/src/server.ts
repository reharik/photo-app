import type { Config } from './config.js';
import type { KoaServer } from './koaServer.js';

export interface Server {
  start(): Promise<void>;
  close(): Promise<void>;
}

type ServerDeps = {
  koaServer: KoaServer;
  config: Config;
  bootLogger: Logger;
};

export const build__Server = ({ koaServer, config, bootLogger }: ServerDeps): Server => {
  return {
    async start() {
      await new Promise<void>((resolve) => {
        koaServer.listen(config.serverPort, () => {
          bootLogger.info(`🚀 Server running on http://localhost:${config.serverPort}`, {
            port: config.serverPort,
            nodeEnv: config.nodeEnv,
          });
          resolve();
        });
      });
    },
    async close() {
      koaServer.closeIdleConnections?.();
      await new Promise<void>((resolve, reject) =>
        koaServer.close((err) => (err ? reject(err) : resolve())),
      );
    },
  };
};
