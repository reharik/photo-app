import { describe, expect, it, jest } from '@jest/globals';
import { MediaAssetKind, MediaKind } from '@packages/contracts';
import {
  buildMediaAssetStorageKey,
  buildMediaItemBaseStorageKey,
  MediaItem,
  type RunInTransaction,
} from '@packages/media-core';
import type { Knex } from 'knex';

import { build__ProcessNextMediaDeletionJob } from '../application/processNextMediaDeletionJob';
import type { AppCradle } from '../generated/ioc-composed.js';

const ACTOR_ID = '11111111-1111-4111-8111-111111111111';
const JOB_ID = '22222222-2222-4222-8222-222222222222';
const MEDIA_ITEM_ID = '33333333-3333-4333-8333-333333333333';

const createUploadedPhoto = (): MediaItem => {
  const ownerId = ACTOR_ID;
  const item = MediaItem.create({ kind: MediaKind.photo, mimeType: 'image/jpeg' }, ownerId);
  item.completeUploadedWithMetadata(
    { sizeBytes: 10, mimeType: 'image/jpeg' },
    MediaKind.photo,
    ownerId,
  );
  return item;
};

describe('build__ProcessNextMediaDeletionJob', () => {
  const createCradle = (
    overrides: Partial<{
      claimNextAvailableJob: AppCradle['mediaDeletionJobRepository']['claimNextAvailableJob'];
      getById: AppCradle['mediaItemRepository']['getById'];
      deleteObject: AppCradle['mediaStorage']['deleteObject'];
      deleteItem: AppCradle['mediaItemRepository']['delete'];
      markSucceeded: AppCradle['mediaDeletionJobRepository']['markSucceeded'];
      markFailed: AppCradle['mediaDeletionJobRepository']['markFailed'];
      markPendingRetry: AppCradle['mediaDeletionJobRepository']['markPendingRetry'];
    }>,
  ): AppCradle => {
    const markSucceeded = jest.fn().mockResolvedValue(undefined);
    const markFailed = jest.fn().mockResolvedValue(undefined);
    const markPendingRetry = jest.fn().mockResolvedValue(undefined);
    const deleteObject = jest.fn().mockResolvedValue(undefined);
    const deleteItem = jest.fn().mockResolvedValue(undefined);
    const runInTransaction: RunInTransaction = jest.fn(async (_trx, fn) => fn({} as Knex.Transaction));

    return {
      config: { s3Bucket: 'test-bucket' } as AppCradle['config'],
      logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        http: jest.fn(),
        verbose: jest.fn(),
      },
      mediaDeletionJobRepository: {
        enqueueIfNoneActive: jest.fn(),
        claimNextAvailableJob:
          overrides.claimNextAvailableJob ?? jest.fn().mockResolvedValue(undefined),
        markSucceeded: overrides.markSucceeded ?? markSucceeded,
        markFailed: overrides.markFailed ?? markFailed,
        markPendingRetry: overrides.markPendingRetry ?? markPendingRetry,
      },
      mediaItemRepository: {
        getById: overrides.getById ?? jest.fn(),
        save: jest.fn(),
        delete: overrides.deleteItem ?? deleteItem,
      } as AppCradle['mediaItemRepository'],
      mediaStorage: {
        deleteObject: overrides.deleteObject ?? deleteObject,
      } as AppCradle['mediaStorage'],
      runInTransaction,
    } as AppCradle;
  };

  describe('When there is no available job', () => {
    it('should return idle', async () => {
      const cradle = createCradle({});
      const run = build__ProcessNextMediaDeletionJob(cradle);
      await expect(run()).resolves.toBe('idle');
      expect(cradle.mediaDeletionJobRepository.markSucceeded).not.toHaveBeenCalled();
    });
  });

  describe('When storage deletes succeed and the media item still exists', () => {
    it('should delete objects, remove the media row, and mark the job succeeded', async () => {
      const item = createUploadedPhoto();
      const baseKey = buildMediaItemBaseStorageKey(item.ownerId(), item.id());
      const cradle = createCradle({
        claimNextAvailableJob: jest.fn().mockResolvedValue({
          id: JOB_ID,
          mediaItemId: item.id(),
          storageKey: baseKey,
          createdBy: ACTOR_ID,
          attemptCount: 1,
        }),
        getById: jest.fn().mockResolvedValue(item),
      });
      const run = build__ProcessNextMediaDeletionJob(cradle);
      await expect(run()).resolves.toBe('processed');

      expect(cradle.mediaStorage.deleteObject).toHaveBeenCalledTimes(3);
      expect(cradle.mediaStorage.deleteObject).toHaveBeenCalledWith(
        buildMediaAssetStorageKey(baseKey, MediaAssetKind.original),
      );
      expect(cradle.mediaStorage.deleteObject).toHaveBeenCalledWith(
        buildMediaAssetStorageKey(baseKey, MediaAssetKind.display),
      );
      expect(cradle.mediaStorage.deleteObject).toHaveBeenCalledWith(
        buildMediaAssetStorageKey(baseKey, MediaAssetKind.thumbnail),
      );
      expect(cradle.mediaItemRepository.delete).toHaveBeenCalledWith(item, expect.anything());
      expect(cradle.mediaDeletionJobRepository.markSucceeded).toHaveBeenCalledWith(
        JOB_ID,
        ACTOR_ID,
      );
    });
  });

  describe('When storage deletes succeed but the media item row is already gone', () => {
    it('should still mark the job succeeded without calling delete on the repository', async () => {
      const baseKey = 'media/x/y';
      const cradle = createCradle({
        claimNextAvailableJob: jest.fn().mockResolvedValue({
          id: JOB_ID,
          mediaItemId: MEDIA_ITEM_ID,
          storageKey: baseKey,
          createdBy: ACTOR_ID,
          attemptCount: 1,
        }),
        getById: jest.fn().mockResolvedValue(undefined),
      });
      const run = build__ProcessNextMediaDeletionJob(cradle);
      await expect(run()).resolves.toBe('processed');

      expect(cradle.mediaItemRepository.delete).not.toHaveBeenCalled();
      expect(cradle.mediaDeletionJobRepository.markSucceeded).toHaveBeenCalledWith(
        JOB_ID,
        ACTOR_ID,
      );
    });
  });

  describe('When storage deletion throws and attempts remain', () => {
    it('should schedule a pending retry', async () => {
      const baseKey = 'media/x/y';
      const markPendingRetry = jest.fn().mockResolvedValue(undefined);
      const cradle = createCradle({
        claimNextAvailableJob: jest.fn().mockResolvedValue({
          id: JOB_ID,
          mediaItemId: MEDIA_ITEM_ID,
          storageKey: baseKey,
          createdBy: ACTOR_ID,
          attemptCount: 1,
        }),
        deleteObject: jest.fn().mockRejectedValue(new Error('s3 down')),
        markPendingRetry,
      });
      const run = build__ProcessNextMediaDeletionJob(cradle);
      await expect(run()).resolves.toBe('processed');

      expect(markPendingRetry).toHaveBeenCalledWith(
        JOB_ID,
        ACTOR_ID,
        'Error: s3 down',
        expect.any(Date),
      );
      expect(cradle.mediaDeletionJobRepository.markFailed).not.toHaveBeenCalled();
    });
  });

  describe('When storage deletion throws and max attempts are exhausted', () => {
    it('should mark the job failed', async () => {
      const baseKey = 'media/x/y';
      const cradle = createCradle({
        claimNextAvailableJob: jest.fn().mockResolvedValue({
          id: JOB_ID,
          mediaItemId: MEDIA_ITEM_ID,
          storageKey: baseKey,
          createdBy: ACTOR_ID,
          attemptCount: 8,
        }),
        deleteObject: jest.fn().mockRejectedValue(new Error('s3 down')),
      });
      const run = build__ProcessNextMediaDeletionJob(cradle);
      await expect(run()).resolves.toBe('processed');

      expect(cradle.mediaDeletionJobRepository.markFailed).toHaveBeenCalledWith(
        JOB_ID,
        ACTOR_ID,
        'Error: s3 down',
      );
      expect(cradle.mediaDeletionJobRepository.markPendingRetry).not.toHaveBeenCalled();
    });
  });
});
