import { describe, expect, it } from '@jest/globals';

import type { Config } from '../config';
import type { IocGeneratedCradle } from '../di/generated/ioc-registry.types';
import { build__KnexConfig } from '../knexfile';

describe('build__KnexConfig', () => {
  describe('When given worker config', () => {
    it('should return a pg client config with connection and migrations', () => {
      const config: Config = {
        nodeEnv: 'test',
        mediaStorageRoot: '/tmp/media',
        postgresHost: 'db.example.test',
        postgresPort: 5433,
        postgresUser: 'u',
        postgresPassword: 'p',
        postgresDatabase: 'db',
        logLevel: 'error',
        awsRegion: 'us-east-1',
        s3Bucket: 'b',
        s3UploadUrlTtlSeconds: 900,
        s3DownloadUrlTtlSeconds: 900,
        mediaWorkerPollIntervalMs: 2000,
      };

      const knexConfig = build__KnexConfig({ config } as IocGeneratedCradle);

      expect(knexConfig.client).toBe('pg');
      expect(knexConfig.connection).toEqual(
        expect.objectContaining({
          host: 'db.example.test',
          port: 5433,
          user: 'u',
          password: 'p',
          database: 'db',
        }),
      );
      expect(knexConfig.migrations?.tableName).toBe('knex_migrations');
      expect(knexConfig.seeds?.directory).toContain('seeds');
    });
  });
});
