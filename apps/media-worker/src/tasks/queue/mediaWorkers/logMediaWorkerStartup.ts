import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import type { Logger } from '@packages/infrastructure';

import { UnitOfWork } from '@packages/media-core';
import type { Config } from '../../../config';

export interface LogMediaWorkerStartup {
  (): Promise<void>;
}

type LogMediaWorkerStartupDeps = { config: Config; logger: Logger; uow: UnitOfWork };

export const build__LogMediaWorkerStartup =
  ({ config, logger, uow }: LogMediaWorkerStartupDeps): LogMediaWorkerStartup =>
  async () => {
    const explicitCredentialsConfigured = Boolean(
      config.awsAccessKeyId && config.awsSecretAccessKey,
    );

    logger.info('Media worker configuration', {
      nodeEnv: config.nodeEnv,
      logLevel: config.logLevel,
      postgresHost: config.postgresHost,
      postgresPort: config.postgresPort,
      postgresDatabase: config.postgresDatabase,
      s3Bucket: config.s3Bucket,
      awsRegion: config.awsRegion,
      explicitCredentialsConfigured,
      pollIntervalMs: config.mediaWorkerPollIntervalMs,
    });

    try {
      await uow.join();
      await uow.db().raw('select 1 as ok');
      await uow.complete(true);
      logger.info('Postgres connectivity check succeeded', {
        host: config.postgresHost,
        port: config.postgresPort,
        database: config.postgresDatabase,
      });
    } catch (e) {
      await uow.settle(false);
      logger.error('Postgres connectivity check failed', e, {
        host: config.postgresHost,
        port: config.postgresPort,
        database: config.postgresDatabase,
      });
      throw e;
    }

    const s3Client = new S3Client({ region: config.awsRegion });
    try {
      await s3Client.send(new HeadBucketCommand({ Bucket: config.s3Bucket }));
      logger.info('S3 connectivity check succeeded', {
        bucket: config.s3Bucket,
        region: config.awsRegion,
      });
    } catch (e) {
      logger.error('S3 connectivity check failed', e, {
        bucket: config.s3Bucket,
        region: config.awsRegion,
      });
      throw e;
    }
  };
