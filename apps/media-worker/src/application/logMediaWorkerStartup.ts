import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import type { Logger } from '@packages/infrastructure';
import type { Knex } from 'knex';

import type { Config } from '../config';

const serializeProbeError = (e: unknown): string => {
  if (e instanceof Error) {
    return `${e.name}: ${e.message}`;
  }
  return String(e);
};

export const logMediaWorkerStartup = async ({
  config,
  logger,
  database,
}: {
  config: Config;
  logger: Logger;
  database: Knex;
}): Promise<void> => {
  const explicitCredentialsConfigured = Boolean(config.awsAccessKeyId && config.awsSecretAccessKey);

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
    await database.raw('select 1 as ok');
    logger.info('Postgres connectivity check succeeded', {
      host: config.postgresHost,
      port: config.postgresPort,
      database: config.postgresDatabase,
    });
  } catch (e) {
    if (e instanceof Error) {
      logger.error('Postgres connectivity check failed', e, {
        host: config.postgresHost,
        port: config.postgresPort,
        database: config.postgresDatabase,
      });
    } else {
      logger.error('Postgres connectivity check failed', {
        err: serializeProbeError(e),
        host: config.postgresHost,
        port: config.postgresPort,
        database: config.postgresDatabase,
      });
    }
  }

  const s3Client = new S3Client({ region: config.awsRegion });
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: config.s3Bucket }));
    logger.info('S3 connectivity check succeeded', {
      bucket: config.s3Bucket,
      region: config.awsRegion,
    });
  } catch (e) {
    if (e instanceof Error) {
      logger.error('S3 connectivity check failed', e, {
        bucket: config.s3Bucket,
        region: config.awsRegion,
      });
    } else {
      logger.error('S3 connectivity check failed', {
        err: serializeProbeError(e),
        bucket: config.s3Bucket,
        region: config.awsRegion,
      });
    }
  }
};
