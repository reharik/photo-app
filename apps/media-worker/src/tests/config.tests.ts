import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';

import { build__Config } from '../config';

const ENV_KEYS = [
  'NODE_ENV',
  'POSTGRES_HOST',
  'POSTGRES_PORT',
  'POSTGRES_USER',
  'POSTGRES_PASSWORD',
  'POSTGRES_DB',
  'MEDIA_STORAGE_ROOT',
  'LOG_LEVEL',
  'LOG_JSON_FILE_PATH',
  'AWS_REGION',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'S3_BUCKET',
  'S3_UPLOAD_URL_TTL_SECONDS',
  'S3_DOWNLOAD_URL_TTL_SECONDS',
  'MEDIA_WORKER_POLL_MS',
  'JWT_SECRET',
] as const;

describe('build__Config', () => {
  const snapshot: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {};

  beforeEach(() => {
    for (const key of ENV_KEYS) {
      snapshot[key] = process.env[key];
    }
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      const prev = snapshot[key];
      if (prev === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = prev;
      }
    }
  });

  describe('When NODE_ENV is not set', () => {
    it('should default nodeEnv to development', () => {
      delete process.env.NODE_ENV;
      process.env.POSTGRES_HOST = '127.0.0.1';
      const config = build__Config();
      expect(config.nodeEnv).toBe('development');
    });
  });

  describe('When NODE_ENV is production', () => {
    it('should use info log level by default', () => {
      process.env.NODE_ENV = 'production';
      process.env.POSTGRES_HOST = '127.0.0.1';
      delete process.env.LOG_LEVEL;
      const config = build__Config();
      expect(config.logLevel).toBe('info');
    });
  });

  describe('When NODE_ENV is invalid', () => {
    it('should throw', () => {
      process.env.NODE_ENV = 'not-a-real-env';
      process.env.POSTGRES_HOST = '127.0.0.1';
      expect(() => build__Config()).toThrow(/Invalid value/);
    });
  });

  describe('When optional numeric env vars are set', () => {
    it('should parse poll interval and S3 TTLs', () => {
      process.env.POSTGRES_HOST = '127.0.0.1';
      process.env.MEDIA_WORKER_POLL_MS = '5000';
      process.env.S3_UPLOAD_URL_TTL_SECONDS = '120';
      process.env.S3_DOWNLOAD_URL_TTL_SECONDS = '240';
      const config = build__Config();
      expect(config.mediaWorkerPollIntervalMs).toBe(5000);
      expect(config.s3UploadUrlTtlSeconds).toBe(120);
      expect(config.s3DownloadUrlTtlSeconds).toBe(240);
    });
  });
});
