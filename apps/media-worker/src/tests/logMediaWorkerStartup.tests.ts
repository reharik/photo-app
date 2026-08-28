import { describe, expect, it, jest } from '@jest/globals';
import type { UnitOfWork } from '@packages/media-core';

import type { Config } from '../config';
import { build__LogMediaWorkerStartup } from '../tasks/queue/mediaWorkers/logMediaWorkerStartup';

/**
 * The startup probe is an IoC factory now, and it reads through the unit of work
 * rather than a raw Knex handle — which means it has to open and settle its own
 * transaction, since nothing has begun one at boot. This fake records that
 * boundary so the probe can't silently regress into querying a uow with no
 * transaction started (which the probe's own catch would swallow as a
 * connectivity failure).
 */
const createFakeUow = (raw: () => Promise<unknown>) => {
  const boundary: { begun: number; completed: boolean[] } = { begun: 0, completed: [] };
  return {
    boundary,
    uow: {
      begin: async () => {
        boundary.begun += 1;
      },
      db: () => ({ raw }),
      complete: async (ok: boolean) => {
        boundary.completed.push(ok);
      },
    } as unknown as UnitOfWork,
  };
};

const createLogger = () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  http: jest.fn(),
  verbose: jest.fn(),
});

const config = {
  nodeEnv: 'production',
  logLevel: 'info',
  postgresHost: 'db.example',
  postgresPort: 5432,
  postgresDatabase: 'photo_app',
  s3Bucket: 'my-bucket',
  awsRegion: 'us-east-1',
  mediaWorkerPollIntervalMs: 2000,
} as Config;

describe('logMediaWorkerStartup', () => {
  describe('When probes succeed', () => {
    it('should log configuration and connectivity checks', async () => {
      const logger = createLogger();
      const { uow } = createFakeUow(async () => ({ rows: [{ ok: 1 }] }));

      const logMediaWorkerStartup = build__LogMediaWorkerStartup({
        config,
        logger,
        uow,
      });
      await logMediaWorkerStartup();

      expect(logger.info).toHaveBeenCalledWith(
        'Media worker configuration',
        expect.objectContaining({ s3Bucket: 'my-bucket' }),
      );
      expect(logger.info).toHaveBeenCalledWith(
        'Postgres connectivity check succeeded',
        expect.any(Object),
      );
    });

    it('should run the Postgres probe inside a transaction it opens and commits', async () => {
      const logger = createLogger();
      const { uow, boundary } = createFakeUow(async () => ({ rows: [{ ok: 1 }] }));

      const logMediaWorkerStartup = build__LogMediaWorkerStartup({
        config,
        logger,
        uow,
      });
      await logMediaWorkerStartup();

      expect(boundary.begun).toBe(1);
      expect(boundary.completed).toEqual([true]);
    });
  });

  describe('When the Postgres probe fails', () => {
    it('should report the failure and roll the probe transaction back', async () => {
      const logger = createLogger();
      const { uow, boundary } = createFakeUow(() => Promise.reject(new Error('ECONNREFUSED')));

      const logMediaWorkerStartup = build__LogMediaWorkerStartup({
        config,
        logger,
        uow,
      });
      await logMediaWorkerStartup();

      expect(logger.info).not.toHaveBeenCalledWith(
        'Postgres connectivity check succeeded',
        expect.any(Object),
      );
      expect(logger.error).toHaveBeenCalledWith(
        'Postgres connectivity check failed',
        expect.any(Error),
        expect.objectContaining({ host: 'db.example', database: 'photo_app' }),
      );
      expect(boundary.completed).toEqual([false]);
    });
  });
});
