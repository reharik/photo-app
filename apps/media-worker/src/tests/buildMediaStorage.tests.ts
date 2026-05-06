import { describe, expect, it } from '@jest/globals';

import type { IocGeneratedCradle } from '../di/generated/ioc-registry.types';
import { build__MediaStorage } from '../infrastructure/media/mediaStorage';

describe('build__MediaStorage', () => {
  describe('When built with bucket and region', () => {
    it('should return storage with expected operations', () => {
      const storage = build__MediaStorage({
        config: {
          s3Bucket: 'test-bucket',
          awsRegion: 'us-east-1',
          s3UploadUrlTtlSeconds: 900,
          s3DownloadUrlTtlSeconds: 900,
        } as IocGeneratedCradle['config'],
      } as IocGeneratedCradle);

      expect(typeof storage.getObjectStream).toBe('function');
      expect(typeof storage.writeObject).toBe('function');
      expect(typeof storage.deleteObject).toBe('function');
      expect(typeof storage.getUploadTarget).toBe('function');
    });
  });
});
