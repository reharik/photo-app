import { describe, expect, it, jest } from '@jest/globals';
import { MediaItemStatus, MediaKind } from '@packages/contracts';
import type {
  MediaItemRepository,
  MediaProcessingJobRepository,
  MediaProcessingJobRow,
  MediaStorage,
} from '@packages/media-core';
import { MAX_MEDIA_PROCESSING_JOB_ATTEMPTS, MediaItem } from '@packages/media-core';
import type { Logger } from '@packages/infrastructure';
import type { AwilixContainer } from 'awilix';

import type { Config } from '../config.js';
import type { AppCradle } from '../generated/ioc-composed.js';
import {
  build__ProcessNextMediaImageJob,
  build__RunNextMediaImageJob,
  type ProcessNextMediaImageJob,
} from '../tasks/queue/mediaWorkers/processNextMediaImageJob.js';

const ACTOR_ID = '11111111-1111-4111-8111-111111111111';
const MEDIA_ITEM_ID = '33333333-3333-4333-8333-333333333333';

const createUploadedPhoto = (): MediaItem => {
  const item = MediaItem.create({ kind: MediaKind.photo, mimeType: 'image/jpeg' }, ACTOR_ID);
  item.completeUploadedWithMetadata(
    { sizeBytes: 10, mimeType: 'image/jpeg' },
    MediaKind.photo,
    ACTOR_ID,
  );
  return item;
};

describe('build__ProcessNextMediaImageJob', () => {
  describe('When loadForProcessing is called', () => {
    it('should return not_found when the media item is missing', async () => {
      const processor = build__ProcessNextMediaImageJob({
        mediaItemRepository: {
          getById: jest.fn<MediaItemRepository['getById']>().mockResolvedValue(undefined),
          save: jest.fn(),
          delete: jest.fn(),
          ensureUserTagId: jest.fn(),
        },
      });

      await expect(processor.loadForProcessing(MEDIA_ITEM_ID)).resolves.toEqual({
        kind: 'not_found',
      });
    });

    it('should return already_ready when the item is ready', async () => {
      const item = createUploadedPhoto();
      item.markReadyAfterDerivatives({ displayWidth: 1, displayHeight: 1 }, ACTOR_ID);

      const processor = build__ProcessNextMediaImageJob({
        mediaItemRepository: {
          getById: jest.fn<MediaItemRepository['getById']>().mockResolvedValue(item),
          save: jest.fn(),
          delete: jest.fn(),
          ensureUserTagId: jest.fn(),
        },
      });

      await expect(processor.loadForProcessing(MEDIA_ITEM_ID)).resolves.toEqual({
        kind: 'already_ready',
      });
    });

    it('should classify a PENDING item as transient, not a terminal failure', async () => {
      const item = MediaItem.create({ kind: MediaKind.photo, mimeType: 'image/jpeg' }, ACTOR_ID);

      const processor = build__ProcessNextMediaImageJob({
        mediaItemRepository: {
          getById: jest.fn<MediaItemRepository['getById']>().mockResolvedValue(item),
          save: jest.fn(),
          delete: jest.fn(),
          ensureUserTagId: jest.fn(),
        },
      });

      const result = await processor.loadForProcessing(MEDIA_ITEM_ID);
      expect(result.kind).toBe('transient');
    });

    it('should classify an already-FAILED item as terminal without re-marking the item', async () => {
      const item = createUploadedPhoto();
      item.markProcessingFailed(ACTOR_ID);

      const processor = build__ProcessNextMediaImageJob({
        mediaItemRepository: {
          getById: jest.fn<MediaItemRepository['getById']>().mockResolvedValue(item),
          save: jest.fn(),
          delete: jest.fn(),
          ensureUserTagId: jest.fn(),
        },
      });

      await expect(processor.loadForProcessing(MEDIA_ITEM_ID)).resolves.toEqual({
        kind: 'failed',
        message: 'Media item already marked failed — not resurrecting',
        itemAlreadyTerminal: true,
      });
    });

    it('should return loaded when the item is processable', async () => {
      const item = createUploadedPhoto();
      const processor = build__ProcessNextMediaImageJob({
        mediaItemRepository: {
          getById: jest.fn<MediaItemRepository['getById']>().mockResolvedValue(item),
          save: jest.fn(),
          delete: jest.fn(),
          ensureUserTagId: jest.fn(),
        },
      });

      const result = await processor.loadForProcessing(MEDIA_ITEM_ID);
      expect(result.kind).toBe('loaded');
      if (result.kind === 'loaded') {
        expect(result.mediaItem.id()).toBe(item.id());
        expect(result.mediaItem.status().equals(MediaItemStatus.processing)).toBe(true);
      }
    });
  });

  describe('When markItemFailed is called', () => {
    it('should move a processing item to failed and persist it', async () => {
      const save = jest.fn<MediaItemRepository['save']>().mockResolvedValue(undefined);
      const item = createUploadedPhoto();
      const processor = build__ProcessNextMediaImageJob({
        mediaItemRepository: {
          getById: jest.fn<MediaItemRepository['getById']>().mockResolvedValue(item),
          save,
          delete: jest.fn(),
          ensureUserTagId: jest.fn(),
        },
      });

      await expect(processor.markItemFailed(MEDIA_ITEM_ID, ACTOR_ID)).resolves.toBe(true);
      expect(item.status().equals(MediaItemStatus.failed)).toBe(true);
      expect(save).toHaveBeenCalledWith(item);
    });

    it('should report nothing to mark when the item is missing', async () => {
      const save = jest.fn<MediaItemRepository['save']>().mockResolvedValue(undefined);
      const processor = build__ProcessNextMediaImageJob({
        mediaItemRepository: {
          getById: jest.fn<MediaItemRepository['getById']>().mockResolvedValue(undefined),
          save,
          delete: jest.fn(),
          ensureUserTagId: jest.fn(),
        },
      });

      await expect(processor.markItemFailed(MEDIA_ITEM_ID, ACTOR_ID)).resolves.toBe(false);
      expect(save).not.toHaveBeenCalled();
    });

    it('should not drag an already-ready item back to failed', async () => {
      const save = jest.fn<MediaItemRepository['save']>().mockResolvedValue(undefined);
      const item = createUploadedPhoto();
      item.markReadyAfterDerivatives({ displayWidth: 1, displayHeight: 1 }, ACTOR_ID);

      const processor = build__ProcessNextMediaImageJob({
        mediaItemRepository: {
          getById: jest.fn<MediaItemRepository['getById']>().mockResolvedValue(item),
          save,
          delete: jest.fn(),
          ensureUserTagId: jest.fn(),
        },
      });

      await expect(processor.markItemFailed(MEDIA_ITEM_ID, ACTOR_ID)).resolves.toBe(false);
      expect(item.status().equals(MediaItemStatus.ready)).toBe(true);
      expect(save).not.toHaveBeenCalled();
    });
  });

  describe('When saveProcessedItem is called', () => {
    it('should persist through the media item repository', async () => {
      const save = jest.fn<MediaItemRepository['save']>().mockResolvedValue(undefined);
      const item = createUploadedPhoto();
      const processor = build__ProcessNextMediaImageJob({
        mediaItemRepository: {
          getById: jest.fn(),
          save,
          delete: jest.fn(),
          ensureUserTagId: jest.fn(),
        },
      });

      await processor.saveProcessedItem(item);
      expect(save).toHaveBeenCalledWith(item);
    });
  });
});

describe('build__RunNextMediaImageJob (claim-guard classification)', () => {
  const createMockLogger = (): Logger =>
    ({
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      http: jest.fn(),
      verbose: jest.fn(),
      debug: jest.fn(),
    }) as unknown as Logger;

  const jobRow = (attemptCount: number): MediaProcessingJobRow => ({
    id: '44444444-4444-4444-8444-444444444444',
    mediaItemId: MEDIA_ITEM_ID,
    status: MediaItemStatus.processing,
    attemptCount,
    availableAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: ACTOR_ID,
    updatedBy: ACTOR_ID,
    startedAt: new Date(),
  });

  const createJobRepo = (job: MediaProcessingJobRow) => ({
    enqueueIfNoneActive: jest.fn<MediaProcessingJobRepository['enqueueIfNoneActive']>(),
    claimNextAvailableJob: jest
      .fn<MediaProcessingJobRepository['claimNextAvailableJob']>()
      .mockResolvedValue(job),
    markSucceeded: jest
      .fn<MediaProcessingJobRepository['markSucceeded']>()
      .mockResolvedValue(undefined),
    markFailed: jest.fn<MediaProcessingJobRepository['markFailed']>().mockResolvedValue(undefined),
    markPendingRetry: jest
      .fn<MediaProcessingJobRepository['markPendingRetry']>()
      .mockResolvedValue(undefined),
    releaseStalledJobs: jest.fn<MediaProcessingJobRepository['releaseStalledJobs']>(),
  });

  /** Fake container: withUnitOfWork resolves a no-op uow, then our processor. */
  const createFakeContainer = (processor: ProcessNextMediaImageJob) => {
    const unitOfWork = {
      id: 'test-uow',
      shouldRollback: false,
      start: async () => {},
      commit: async () => {},
      rollback: async () => {},
      db: () => {
        throw new Error('uow.db() must not be reached in these scenarios');
      },
      collectEvents: () => {},
    };
    const scope = {
      resolve: (key: string) => (key === 'unitOfWork' ? unitOfWork : processor),
      register: () => {},
    };
    return { createScope: () => scope } as unknown as AwilixContainer<AppCradle>;
  };

  const createRunner = (item: MediaItem, job: MediaProcessingJobRow) => {
    const processor = build__ProcessNextMediaImageJob({
      mediaItemRepository: {
        getById: jest.fn<MediaItemRepository['getById']>().mockResolvedValue(item),
        save: jest.fn<MediaItemRepository['save']>().mockResolvedValue(undefined),
        delete: jest.fn(),
        ensureUserTagId: jest.fn(),
      },
    });
    const jobRepo = createJobRepo(job);
    const runner = build__RunNextMediaImageJob({
      container: createFakeContainer(processor),
      config: {} as Config,
      logger: createMockLogger(),
      mediaProcessingJobRepository: jobRepo,
      mediaStorage: {} as MediaStorage,
    });
    return { runner, jobRepo };
  };

  describe('When a job is claimed against an already-READY item', () => {
    it('should mark the job succeeded — never failed — so the job table does not lie', async () => {
      const item = createUploadedPhoto();
      item.markReadyAfterDerivatives({ displayWidth: 1, displayHeight: 1 }, ACTOR_ID);
      const job = jobRow(1);
      const { runner, jobRepo } = createRunner(item, job);

      await expect(runner()).resolves.toBe('processed');

      expect(jobRepo.markSucceeded).toHaveBeenCalledWith(job.id, ACTOR_ID);
      expect(jobRepo.markFailed).not.toHaveBeenCalled();
      expect(jobRepo.markPendingRetry).not.toHaveBeenCalled();
    });
  });

  describe('When a job is claimed against a still-PENDING item', () => {
    it('should schedule a retry with backoff, not kill the job', async () => {
      const item = MediaItem.create({ kind: MediaKind.photo, mimeType: 'image/jpeg' }, ACTOR_ID);
      const job = jobRow(1);
      const { runner, jobRepo } = createRunner(item, job);

      await expect(runner()).resolves.toBe('processed');

      expect(jobRepo.markPendingRetry).toHaveBeenCalledWith(
        job.id,
        ACTOR_ID,
        'Media item not yet processable (status: PENDING)',
        expect.any(Date),
      );
      expect(jobRepo.markFailed).not.toHaveBeenCalled();
      expect(jobRepo.markSucceeded).not.toHaveBeenCalled();
    });

    it('should give up once the attempt cap is reached — a job must reach a terminal state', async () => {
      const item = MediaItem.create({ kind: MediaKind.photo, mimeType: 'image/jpeg' }, ACTOR_ID);
      const job = jobRow(MAX_MEDIA_PROCESSING_JOB_ATTEMPTS);
      const { runner, jobRepo } = createRunner(item, job);

      await expect(runner()).resolves.toBe('processed');

      expect(jobRepo.markFailed).toHaveBeenCalledWith(
        job.id,
        ACTOR_ID,
        'Media item not yet processable (status: PENDING)',
      );
      expect(jobRepo.markPendingRetry).not.toHaveBeenCalled();
    });
  });

  describe('When a job is claimed against an already-FAILED item', () => {
    it('should mark the job failed without trying to re-mark the item', async () => {
      const item = createUploadedPhoto();
      item.markProcessingFailed(ACTOR_ID);
      const save = jest.fn<MediaItemRepository['save']>().mockResolvedValue(undefined);
      const processor = build__ProcessNextMediaImageJob({
        mediaItemRepository: {
          getById: jest.fn<MediaItemRepository['getById']>().mockResolvedValue(item),
          save,
          delete: jest.fn(),
          ensureUserTagId: jest.fn(),
        },
      });
      const job = jobRow(1);
      const jobRepo = createJobRepo(job);
      const runner = build__RunNextMediaImageJob({
        container: createFakeContainer(processor),
        config: {} as Config,
        logger: createMockLogger(),
        mediaProcessingJobRepository: jobRepo,
        mediaStorage: {} as MediaStorage,
      });

      await expect(runner()).resolves.toBe('processed');

      expect(jobRepo.markFailed).toHaveBeenCalledWith(
        job.id,
        ACTOR_ID,
        'Media item already marked failed — not resurrecting',
      );
      // itemAlreadyTerminal: the runner must not attempt the item transition at all.
      expect(save).not.toHaveBeenCalled();
    });
  });
});
