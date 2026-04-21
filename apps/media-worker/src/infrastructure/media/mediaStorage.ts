import { s3MediaStorage, type MediaStorage } from '@packages/media-core';
import { IocGeneratedCradle } from '../../di/generated/ioc-registry.types';

export const buildMediaStorage = ({ config }: IocGeneratedCradle): MediaStorage => {
  return s3MediaStorage({
    bucket: config.s3Bucket,
    region: config.awsRegion,
    uploadUrlTtlSeconds: config.s3UploadUrlTtlSeconds,
    downloadUrlTtlSeconds: config.s3DownloadUrlTtlSeconds,
  });
};
