import { describe, expect, it, jest } from '@jest/globals';
import { MediaItemStatus, MediaKind } from '@packages/contracts';
import type { Logger } from '@packages/infrastructure';
import type { MediaItemRepository, MediaProcessingJobRow, MediaStorage } from '@packages/media-core';
import { MediaItem, MediaProcessingJobStatus } from '@packages/media-core';
import type { Knex } from 'knex';
import { Readable } from 'node:stream';

import { build__ProcessNextMediaImageJob } from '../application/processNextMediaImageJob';
import type { Config } from '../config.js';
import type { MediaProcessingJobRepository } from '../repositories/domainRepositories/mediaProcessingJobRepository.js';

type ProcessNextMediaImageJobDeps = Parameters<typeof build__ProcessNextMediaImageJob>[0];

type MockLogger = Logger & {
  info: jest.Mock;
  error: jest.Mock;
  warn: jest.Mock;
  debug: jest.Mock;
  http: jest.Mock;
  verbose: jest.Mock;
};

const createMockLogger = (): MockLogger => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  http: jest.fn(),
  verbose: jest.fn(),
});

const createMockDatabase = (): Knex => {
  const transaction = jest.fn(async (callback: (trx: Knex.Transaction) => Promise<unknown>) =>
    callback({} as Knex.Transaction),
  );
  return { transaction } as unknown as Knex;
};

const MINIMAL_PNG_1X1 = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
  0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
  0x42, 0x60, 0x82,
]);

const ACTOR_ID = '11111111-1111-4111-8111-111111111111';
const JOB_ID = '22222222-2222-4222-8222-222222222222';
const MEDIA_ITEM_ID = '33333333-3333-4333-8333-333333333333';

const testJob = (overrides: Partial<MediaProcessingJobRow> = {}): MediaProcessingJobRow => ({
  id: JOB_ID,
  mediaItemId: MEDIA_ITEM_ID,
  status: MediaProcessingJobStatus.processing,
  attemptCount: 1,
  availableAt: new Date('2020-01-01T00:00:00.000Z'),
  createdAt: new Date('2020-01-01T00:00:00.000Z'),
  updatedAt: new Date('2020-01-01T00:00:00.000Z'),
  createdBy: ACTOR_ID,
  updatedBy: ACTOR_ID,
  ...overrides,
});

const createUploadedPhoto = (): MediaItem => {
  const ownerId = ACTOR_ID;
  const item = MediaItem.create({ kind: MediaKind.photo, mimeType: 'image/jpeg' }, ownerId);
  item.completeUploadedWithMetadata(
    { sizeBytes: MINIMAL_PNG_1X1.length, mimeType: 'image/png' },
    MediaKind.photo,
    ownerId,
  );
  return item;
};

describe('build__ProcessNextMediaImageJob', () => {
  const baseConfig = {
    s3Bucket: 'test-bucket',
  } as Config;

  const createDeps = (
    overrides: Partial<{
      claimNextAvailableJob: MediaProcessingJobRepository['claimNextAvailableJob'];
      getById: MediaItemRepository['getById'];
      getObjectStream: MediaStorage['getObjectStream'];
      writeObject: MediaStorage['writeObject'];
      save: MediaItemRepository['save'];
      markSucceeded: MediaProcessingJobRepository['markSucceeded'];
      markFailed: MediaProcessingJobRepository['markFailed'];
    }>,
  ): ProcessNextMediaImageJobDeps => {
    const markSucceeded = jest
      .fn<MediaProcessingJobRepository['markSucceeded']>()
      .mockResolvedValue(undefined);
    const markFailed = jest
      .fn<MediaProcessingJobRepository['markFailed']>()
      .mockResolvedValue(undefined);
    const save = jest.fn<MediaItemRepository['save']>().mockResolvedValue(undefined);
    const writeObject = jest.fn<MediaStorage['writeObject']>().mockResolvedValue(undefined);

    return {
      config: baseConfig,
      logger: createMockLogger(),
      database: createMockDatabase(),
      mediaProcessingJobRepository: {
        claimNextAvailableJob:
          overrides.claimNextAvailableJob ??
          jest.fn<MediaProcessingJobRepository['claimNextAvailableJob']>().mockResolvedValue(undefined),
        enqueueIfNoneActive: jest.fn<MediaProcessingJobRepository['enqueueIfNoneActive']>(),
        markSucceeded: overrides.markSucceeded ?? markSucceeded,
        markFailed: overrides.markFailed ?? markFailed,
      },
      mediaItemRepository: {
        getById: overrides.getById ?? jest.fn<MediaItemRepository['getById']>(),
        save: overrides.save ?? save,
      } as MediaItemRepository,
      mediaStorage: {
        getObjectStream: overrides.getObjectStream ?? jest.fn<MediaStorage['getObjectStream']>(),
        writeObject: overrides.writeObject ?? writeObject,
      } as MediaStorage,
    };
  };

  describe('When there is no available job', () => {
    it('should return idle', async () => {
      const cradle = createDeps({});
      const run = build__ProcessNextMediaImageJob(cradle);
      await expect(run()).resolves.toBe('idle');
      expect(cradle.mediaProcessingJobRepository.markSucceeded).not.toHaveBeenCalled();
      expect(cradle.mediaProcessingJobRepository.markFailed).not.toHaveBeenCalled();
    });
  });

  describe('When the media item does not exist', () => {
    it('should mark the job failed', async () => {
      const cradle = createDeps({
        claimNextAvailableJob: jest
          .fn<MediaProcessingJobRepository['claimNextAvailableJob']>()
          .mockResolvedValue(testJob()),
        getById: jest.fn<MediaItemRepository['getById']>().mockResolvedValue(undefined),
      });
      const run = build__ProcessNextMediaImageJob(cradle);
      await run();
      expect(cradle.mediaProcessingJobRepository.markFailed).toHaveBeenCalledWith(
        JOB_ID,
        ACTOR_ID,
        'Media item not found',
      );
    });
  });

  describe('When the media item is already ready', () => {
    it('should mark the job succeeded without reading storage', async () => {
      const ownerId = ACTOR_ID;
      const item = MediaItem.create({ kind: MediaKind.photo, mimeType: 'image/jpeg' }, ownerId);
      item.completeUploadedWithMetadata(
        { sizeBytes: 1, mimeType: 'image/jpeg' },
        MediaKind.photo,
        ownerId,
      );
      const ready = item.markReadyAfterDerivatives(
        { displayWidth: 10, displayHeight: 10 },
        ownerId,
      );
      expect(ready.success).toBe(true);

      const getObjectStream = jest.fn<MediaStorage['getObjectStream']>();
      const cradle = createDeps({
        claimNextAvailableJob: jest
          .fn<MediaProcessingJobRepository['claimNextAvailableJob']>()
          .mockResolvedValue(testJob({ mediaItemId: item.id() })),
        getById: jest.fn<MediaItemRepository['getById']>().mockResolvedValue(item),
        getObjectStream,
      });
      const run = build__ProcessNextMediaImageJob(cradle);
      await run();
      expect(getObjectStream).not.toHaveBeenCalled();
      expect(cradle.mediaProcessingJobRepository.markSucceeded).toHaveBeenCalledWith(
        JOB_ID,
        ACTOR_ID,
      );
    });
  });

  describe('When a stale job is claimed for a video that is already ready', () => {
    it('should mark the job succeeded without image processing', async () => {
      const ownerId = ACTOR_ID;
      const item = MediaItem.create({ kind: MediaKind.video, mimeType: 'video/mp4' }, ownerId);
      item.completeUploadedWithMetadata(
        { sizeBytes: 100, mimeType: 'video/mp4' },
        MediaKind.video,
        ownerId,
      );
      expect(item.status()).toBe(MediaItemStatus.ready);

      const getObjectStream = jest.fn<MediaStorage['getObjectStream']>();
      const cradle = createDeps({
        claimNextAvailableJob: jest
          .fn<MediaProcessingJobRepository['claimNextAvailableJob']>()
          .mockResolvedValue(testJob({ mediaItemId: item.id() })),
        getById: jest.fn<MediaItemRepository['getById']>().mockResolvedValue(item),
        getObjectStream,
      });
      const run = build__ProcessNextMediaImageJob(cradle);
      await run();
      expect(getObjectStream).not.toHaveBeenCalled();
      expect(cradle.mediaProcessingJobRepository.markSucceeded).toHaveBeenCalledWith(
        JOB_ID,
        ACTOR_ID,
      );
    });
  });

  describe('When a job targets a non-photo item that is not ready', () => {
    it('should mark the job failed', async () => {
      const cradle = createDeps({
        claimNextAvailableJob: jest
          .fn<MediaProcessingJobRepository['claimNextAvailableJob']>()
          .mockResolvedValue(testJob()),
        getById: jest.fn<MediaItemRepository['getById']>().mockResolvedValue({
          id: () => MEDIA_ITEM_ID,
          kind: () => MediaKind.video,
          status: () => MediaItemStatus.processing,
          ownerId: () => ACTOR_ID,
        } as unknown as MediaItem),
      });
      const run = build__ProcessNextMediaImageJob(cradle);
      await run();
      expect(cradle.mediaProcessingJobRepository.markFailed).toHaveBeenCalledWith(
        JOB_ID,
        ACTOR_ID,
        'Only photo media is supported for image processing',
      );
    });
  });

  describe('When the media item is not in uploaded status', () => {
    it('should mark the job failed', async () => {
      const ownerId = ACTOR_ID;
      const item = MediaItem.create({ kind: MediaKind.photo, mimeType: 'image/jpeg' }, ownerId);

      const cradle = createDeps({
        claimNextAvailableJob: jest
          .fn<MediaProcessingJobRepository['claimNextAvailableJob']>()
          .mockResolvedValue(testJob({ mediaItemId: item.id() })),
        getById: jest.fn<MediaItemRepository['getById']>().mockResolvedValue(item),
      });
      const run = build__ProcessNextMediaImageJob(cradle);
      await run();
      expect(cradle.mediaProcessingJobRepository.markFailed).toHaveBeenCalledWith(
        JOB_ID,
        ACTOR_ID,
        expect.stringMatching(/Media item not processable/),
      );
    });
  });

  describe('When the original object is missing from storage', () => {
    it('should mark the job failed', async () => {
      const item = createUploadedPhoto();
      const cradle = createDeps({
        claimNextAvailableJob: jest
          .fn<MediaProcessingJobRepository['claimNextAvailableJob']>()
          .mockResolvedValue(testJob({ mediaItemId: item.id() })),
        getById: jest.fn<MediaItemRepository['getById']>().mockResolvedValue(item),
        getObjectStream: jest
          .fn<MediaStorage['getObjectStream']>()
          .mockResolvedValue(undefined),
      });
      const run = build__ProcessNextMediaImageJob(cradle);
      await run();
      expect(cradle.mediaProcessingJobRepository.markFailed).toHaveBeenCalledWith(
        JOB_ID,
        ACTOR_ID,
        'Original object not found in storage',
      );
    });
  });

  describe('When processing a photo upload succeeds end-to-end', () => {
    it('should write derivatives, save the item, and mark the job succeeded', async () => {
      const item = createUploadedPhoto();
      const getObjectStream = jest.fn<MediaStorage['getObjectStream']>().mockResolvedValue({
        body: Readable.from(MINIMAL_PNG_1X1),
      });

      const cradle = createDeps({
        claimNextAvailableJob: jest
          .fn<MediaProcessingJobRepository['claimNextAvailableJob']>()
          .mockResolvedValue(testJob({ mediaItemId: item.id() })),
        getById: jest.fn<MediaItemRepository['getById']>().mockResolvedValue(item),
        getObjectStream,
      });
      const run = build__ProcessNextMediaImageJob(cradle);
      await run();

      expect(cradle.mediaStorage.writeObject).toHaveBeenCalledTimes(2);
      expect(cradle.mediaItemRepository.save).toHaveBeenCalledTimes(1);
      expect(cradle.mediaProcessingJobRepository.markSucceeded).toHaveBeenCalledWith(
        JOB_ID,
        ACTOR_ID,
      );
      expect(cradle.mediaProcessingJobRepository.markFailed).not.toHaveBeenCalled();
    });
  });

  describe('When writing a derivative to storage fails', () => {
    it('should mark the job failed', async () => {
      const item = createUploadedPhoto();
      const writeObject = jest
        .fn<MediaStorage['writeObject']>()
        .mockRejectedValue(new Error('put failed'));

      const cradle = createDeps({
        claimNextAvailableJob: jest
          .fn<MediaProcessingJobRepository['claimNextAvailableJob']>()
          .mockResolvedValue(testJob({ mediaItemId: item.id() })),
        getById: jest.fn<MediaItemRepository['getById']>().mockResolvedValue(item),
        getObjectStream: jest.fn<MediaStorage['getObjectStream']>().mockResolvedValue({
          body: Readable.from(MINIMAL_PNG_1X1),
        }),
        writeObject,
      });
      const run = build__ProcessNextMediaImageJob(cradle);
      await run();

      expect(cradle.mediaProcessingJobRepository.markFailed).toHaveBeenCalledWith(
        JOB_ID,
        ACTOR_ID,
        expect.stringContaining('put failed'),
      );
      expect(cradle.mediaItemRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('When getObjectStream throws', () => {
    it('should mark the job failed and log', async () => {
      const item = createUploadedPhoto();
      const cradle = createDeps({
        claimNextAvailableJob: jest
          .fn<MediaProcessingJobRepository['claimNextAvailableJob']>()
          .mockResolvedValue(testJob({ mediaItemId: item.id() })),
        getById: jest.fn<MediaItemRepository['getById']>().mockResolvedValue(item),
        getObjectStream: jest
          .fn<MediaStorage['getObjectStream']>()
          .mockRejectedValue(new Error('s3 down')),
      });
      const run = build__ProcessNextMediaImageJob(cradle);
      await run();
      expect(cradle.logger.error).toHaveBeenCalled();
      expect(cradle.mediaProcessingJobRepository.markFailed).toHaveBeenCalledWith(
        JOB_ID,
        ACTOR_ID,
        expect.stringContaining('s3 down'),
      );
    });
  });
});
