/**
 * The startup probe is an IoC factory now, and it reads through the unit of work
 * rather than a raw Knex handle — which means it has to open and settle its own
 * transaction, since nothing has begun one at boot. The fake below records that
 * boundary so the probe can't silently regress into querying a uow with no
 * transaction started.
 *
 * The probe is fail-fast by design: it logs a failed check AND rethrows, so a
 * worker that cannot reach Postgres or its bucket dies at boot instead of
 * spinning on a poll loop that can never do work. Every case therefore asserts
 * on the rejection, not just on the log line.
 *
 * S3 is mocked at the module boundary. `HeadBucketCommand` against a real client
 * reaches out to AWS (and, with no usable credentials, throws a
 * CredentialsProviderError) — which would make this suite fail for a reason that
 * has nothing to do with the probe.
 */
import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { UnitOfWork } from '@packages/media-core';

import type { Config } from '../config';

const s3Send = jest.fn<() => Promise<unknown>>();

const createFakeUow = (raw: () => Promise<unknown>) => {
  const boundary: { joined: number; completed: boolean[]; settled: boolean[] } = {
    joined: 0,
    completed: [],
    settled: [],
  };
  return {
    boundary,
    uow: {
      join: async () => {
        boundary.joined += 1;
      },
      beginIsolatedOnly: async () => {},
      db: () => ({ raw }),
      complete: async (ok: boolean) => {
        boundary.completed.push(ok);
      },
      settle: async (ok: boolean) => {
        boundary.settled.push(ok);
      },
      collectEvents: () => {},
      flagRollbackOnly: () => {},
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
  let build__LogMediaWorkerStartup: typeof import('../tasks/queue/mediaWorkers/logMediaWorkerStartup.js').build__LogMediaWorkerStartup;

  beforeAll(async () => {
    jest.unstable_mockModule('@aws-sdk/client-s3', () => ({
      S3Client: class {
        send = s3Send;
      },
      HeadBucketCommand: class {
        constructor(public readonly input: unknown) {}
      },
    }));
    ({ build__LogMediaWorkerStartup } =
      await import('../tasks/queue/mediaWorkers/logMediaWorkerStartup.js'));
  });

  beforeEach(() => {
    s3Send.mockReset();
    s3Send.mockResolvedValue({});
  });

  describe('When probes succeed', () => {
    it('should log configuration and connectivity checks', async () => {
      const logger = createLogger();
      const { uow } = createFakeUow(async () => ({ rows: [{ ok: 1 }] }));

      await build__LogMediaWorkerStartup({ config, logger, uow })();

      expect(logger.info).toHaveBeenCalledWith(
        'Media worker configuration',
        expect.objectContaining({ s3Bucket: 'my-bucket' }),
      );
      expect(logger.info).toHaveBeenCalledWith(
        'Postgres connectivity check succeeded',
        expect.any(Object),
      );
      expect(logger.info).toHaveBeenCalledWith(
        'S3 connectivity check succeeded',
        expect.any(Object),
      );
    });

    it('should run the Postgres probe inside a transaction it opens and commits', async () => {
      const logger = createLogger();
      const { uow, boundary } = createFakeUow(async () => ({ rows: [{ ok: 1 }] }));

      await build__LogMediaWorkerStartup({ config, logger, uow })();

      expect(boundary.joined).toBe(1);
      expect(boundary.completed).toEqual([true]);
      expect(boundary.settled).toEqual([]);
    });
  });

  describe('When the Postgres probe fails', () => {
    it('should report the failure, roll the probe transaction back, and abort the boot', async () => {
      const logger = createLogger();
      const { uow, boundary } = createFakeUow(() => Promise.reject(new Error('ECONNREFUSED')));

      const logMediaWorkerStartup = build__LogMediaWorkerStartup({ config, logger, uow });

      await expect(logMediaWorkerStartup()).rejects.toThrow('ECONNREFUSED');
      expect(logger.info).not.toHaveBeenCalledWith(
        'Postgres connectivity check succeeded',
        expect.any(Object),
      );
      expect(logger.error).toHaveBeenCalledWith(
        'Postgres connectivity check failed',
        expect.any(Error),
        expect.objectContaining({ host: 'db.example', database: 'photo_app' }),
      );
      // settle, not complete: the probe's own query is what threw, so the boundary
      // may or may not still be open and complete() would throw over the real error.
      expect(boundary.settled).toEqual([false]);
      expect(boundary.completed).toEqual([]);
      // Dead before it ever reaches the bucket check.
      expect(s3Send).not.toHaveBeenCalled();
    });
  });

  describe('When the S3 probe fails', () => {
    it('should report the failure and abort the boot after the Postgres check passed', async () => {
      const logger = createLogger();
      const { uow, boundary } = createFakeUow(async () => ({ rows: [{ ok: 1 }] }));
      s3Send.mockRejectedValue(new Error('NoSuchBucket'));

      const logMediaWorkerStartup = build__LogMediaWorkerStartup({ config, logger, uow });

      await expect(logMediaWorkerStartup()).rejects.toThrow('NoSuchBucket');
      expect(logger.error).toHaveBeenCalledWith(
        'S3 connectivity check failed',
        expect.any(Error),
        expect.objectContaining({ bucket: 'my-bucket', region: 'us-east-1' }),
      );
      // The Postgres boundary committed before S3 was touched — a bucket failure
      // must not leave a transaction dangling.
      expect(boundary.completed).toEqual([true]);
    });
  });
});
