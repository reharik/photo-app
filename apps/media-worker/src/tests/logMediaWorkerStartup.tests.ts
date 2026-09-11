/**
 * The startup probe queries the raw Knex handle directly — no transaction, no
 * unit of work. That is the right shape for it: it runs at boot, before any task
 * has a boundary of its own, and `uow.db()` throws outside one. A `select 1`
 * needs no transaction to be meaningful, so there is nothing here to open or
 * close and nothing about transaction lifecycle left to assert.
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
import type { Knex } from 'knex';

import type { Config } from '../config';

const s3Send = jest.fn<() => Promise<unknown>>();

/** Stands in for the injected Knex handle; only `raw` is ever reached. */
const createFakeDatabase = (raw: () => Promise<unknown>) => {
  const rawCalls: string[] = [];
  const database = {
    raw: (sql: string) => {
      rawCalls.push(sql);
      return raw();
    },
  } as unknown as Knex;
  return { database, rawCalls };
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
      const { database } = createFakeDatabase(async () => ({ rows: [{ ok: 1 }] }));

      await build__LogMediaWorkerStartup({ config, logger, database })();

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

    it('should probe Postgres with a plain select on the injected handle', async () => {
      const logger = createLogger();
      const { database, rawCalls } = createFakeDatabase(async () => ({ rows: [{ ok: 1 }] }));

      await build__LogMediaWorkerStartup({ config, logger, database })();

      // Exactly one probe query, and it goes straight to the pool. A probe that
      // reached for `uow.db()` instead would throw at boot, where nothing has
      // opened a boundary yet.
      expect(rawCalls).toEqual(['select 1 as ok']);
    });
  });

  describe('When the Postgres probe fails', () => {
    it('should report the failure and abort the boot', async () => {
      const logger = createLogger();
      const { database } = createFakeDatabase(() => Promise.reject(new Error('ECONNREFUSED')));

      const logMediaWorkerStartup = build__LogMediaWorkerStartup({ config, logger, database });

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
      // Dead before it ever reaches the bucket check.
      expect(s3Send).not.toHaveBeenCalled();
    });
  });

  describe('When the S3 probe fails', () => {
    it('should report the failure and abort the boot after the Postgres check passed', async () => {
      const logger = createLogger();
      const { database, rawCalls } = createFakeDatabase(async () => ({ rows: [{ ok: 1 }] }));
      s3Send.mockRejectedValue(new Error('NoSuchBucket'));

      const logMediaWorkerStartup = build__LogMediaWorkerStartup({ config, logger, database });

      await expect(logMediaWorkerStartup()).rejects.toThrow('NoSuchBucket');
      expect(logger.error).toHaveBeenCalledWith(
        'S3 connectivity check failed',
        expect.any(Error),
        expect.objectContaining({ bucket: 'my-bucket', region: 'us-east-1' }),
      );
      // Ordering: Postgres is probed first and passed, so the bucket is what failed.
      expect(rawCalls).toEqual(['select 1 as ok']);
    });
  });
});
