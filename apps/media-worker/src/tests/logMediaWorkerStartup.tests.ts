import { describe, expect, it, jest } from '@jest/globals';

import { logMediaWorkerStartup } from '../application/logMediaWorkerStartup';
import type { Config } from '../config';

describe('logMediaWorkerStartup', () => {
  describe('When probes succeed', () => {
    it('should log configuration and connectivity checks', async () => {
      const logger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        http: jest.fn(),
        verbose: jest.fn(),
      };
      const database = {
        raw: jest.fn().mockResolvedValue({ rows: [{ ok: 1 }] }),
      };
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

      await logMediaWorkerStartup({ config, logger, database: database as never });

      expect(logger.info).toHaveBeenCalledWith(
        'Media worker configuration',
        expect.objectContaining({ s3Bucket: 'my-bucket' }),
      );
      expect(logger.info).toHaveBeenCalledWith(
        'Postgres connectivity check succeeded',
        expect.any(Object),
      );
    });
  });
});
