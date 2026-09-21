import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { build__MediaStorage } from '../application/media/s3MediaStorage';

// Presigning is offline (no request is sent), so dummy credentials are enough. They go in
// through the environment because build__MediaStorage constructs its own S3Client, and env
// credentials are first in the SDK's default provider chain.
const credentialEnvKeys = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_SESSION_TOKEN'];
const savedEnv: Record<string, string | undefined> = {};

beforeAll(() => {
  for (const key of credentialEnvKeys) {
    savedEnv[key] = process.env[key];
  }
  process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
  process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
  delete process.env.AWS_SESSION_TOKEN;
});

afterAll(() => {
  for (const key of credentialEnvKeys) {
    if (savedEnv[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = savedEnv[key];
    }
  }
});

describe('s3MediaStorage.getUploadTarget', () => {
  describe('When presigning an upload with a content length', () => {
    // S3 only enforces the claimed size if content-length is a signed header; a presigner
    // change that stopped signing it would silently let any size through.
    it('should sign content-length into the presigned PUT', async () => {
      const storage = build__MediaStorage({
        config: {
          s3Bucket: 'test-bucket',
          awsRegion: 'us-east-1',
          s3UploadUrlTtlSeconds: 900,
          s3DownloadUrlTtlSeconds: 900,
          s3DownloadUrlSigningBucketSeconds: 300,
        },
      });

      const target = await storage.getUploadTarget({
        storageKey: 'media/owner/item/original',
        mimeType: 'image/jpeg',
        contentLength: 12345,
      });

      const signedHeaders = new URL(target.url).searchParams.get('X-Amz-SignedHeaders');
      expect(signedHeaders?.split(';')).toContain('content-length');
    });
  });
});
