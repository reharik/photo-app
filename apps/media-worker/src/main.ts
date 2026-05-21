import dotenv from 'dotenv';

import { setDefaultSerializationMode } from '@reharik/smart-enum';
import { logMediaWorkerStartup } from './application/logMediaWorkerStartup';
import { destroyWorkerContainer, initializeWorkerContainer } from './container';
setDefaultSerializationMode('value');

// then the rest of your app bootstrap
const bootstrap = async (): Promise<void> => {
  dotenv.config();

  const container = initializeWorkerContainer();
  const logger = container.resolve('logger');
  const config = container.resolve('config');
  const database = container.resolve('database');
  const runMediaWorkerLoop = container.resolve('runMediaWorkerLoop');

  await logMediaWorkerStartup({ config, logger, database });

  let shuttingDown = false;
  const workerPromise = runMediaWorkerLoop.start();

  const shutdown = async (): Promise<void> => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    runMediaWorkerLoop.stop();
    try {
      await workerPromise;
    } catch (e) {
      if (e instanceof Error) {
        logger.error('Media worker shutdown wait failed', e);
      } else {
        logger.error('Media worker shutdown wait failed', { err: String(e) });
      }
    } finally {
      await destroyWorkerContainer();
    }
    process.exit(0);
  };

  process.on('SIGINT', () => {
    void shutdown();
  });
  process.on('SIGTERM', () => {
    void shutdown();
  });

  try {
    await workerPromise;
  } finally {
    await destroyWorkerContainer();
  }
};

void bootstrap();
