import { describe, expect, it } from '@jest/globals';
import { build__MediaStorage, type MediaStorageDeps } from '@packages/media-core';

describe('build__MediaStorage', () => {
  describe('When built with bucket and region', () => {
    it('should return storage with expected operations', () => {
      const deps: MediaStorageDeps = {
        config: {
          s3Bucket: 'test-bucket',
          awsRegion: 'us-east-1',
          s3UploadUrlTtlSeconds: 900,
          s3DownloadUrlTtlSeconds: 900,
        },
      };
      const storage = build__MediaStorage(deps);

      expect(typeof storage.getObjectStream).toBe('function');
      expect(typeof storage.writeObject).toBe('function');
      expect(typeof storage.deleteObject).toBe('function');
      expect(typeof storage.getUploadTarget).toBe('function');
    });
  });
});
