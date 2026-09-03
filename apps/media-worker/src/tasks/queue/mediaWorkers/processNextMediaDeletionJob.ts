import { MediaAssetKind } from '@packages/contracts';
import type { Logger } from '@packages/infrastructure';
import {
  buildMediaAssetStorageKey,
  UnitOfWork,
  type MediaDeletionJobRepository,
  type MediaDeletionJobRow,
  type MediaItemRepository,
  type MediaStorage,
} from '@packages/media-core';

import type { Config } from '../../../config.js';
import { WorkerTaskOutcome } from '../../../types.js';
import { WorkerJobProcessorBase } from './workerJobProcessorBaseType.js';

export type RunNextMediaDeletionJob = () => Promise<WorkerTaskOutcome>;

export interface ProcessNextMediaDeletionJob extends WorkerJobProcessorBase {
  deleteMediaItemIfPresent: (mediaItemId: string) => Promise<boolean>;
}

type ProcessNextMediaDeletionJobDeps = {
  mediaItemRepository: MediaItemRepository;
};

export const build__ProcessNextMediaDeletionJob = ({
  mediaItemRepository,
}: ProcessNextMediaDeletionJobDeps): ProcessNextMediaDeletionJob => {
  const deleteMediaItemIfPresent = async (mediaItemId: string): Promise<boolean> => {
    const mediaItem = await mediaItemRepository.getById(mediaItemId);
    if (!mediaItem) {
      return false;
    }
    await mediaItemRepository.delete(mediaItem);
    return true;
  };

  return {
    deleteMediaItemIfPresent,
  };
};

const serializeError = (e: unknown): string => {
  if (e instanceof Error) {
    return `${e.name}: ${e.message}`;
  }
  return String(e);
};

type RunNextMediaDeletionJobDeps = {
  config: Config;
  logger: Logger;
  mediaDeletionJobRepository: MediaDeletionJobRepository;
  mediaStorage: MediaStorage;
  uow: UnitOfWork;
  processNextMediaDeletionJob: ProcessNextMediaDeletionJob;
};

const deleteStorageObjects = async ({
  config,
  mediaStorage,
  logger,
  job,
}: {
  config: Config;
  mediaStorage: MediaStorage;
  logger: Logger;
  job: MediaDeletionJobRow;
}): Promise<void> => {
  const baseKey = job.storageKey;
  const kinds = [MediaAssetKind.original, MediaAssetKind.display, MediaAssetKind.thumbnail];
  for (const kind of kinds) {
    const objectKey = buildMediaAssetStorageKey(baseKey, kind);
    logger.info('S3 DeleteObject', {
      bucket: config.s3Bucket,
      key: objectKey,
      jobId: job.id,
    });
    await mediaStorage.deleteObject(objectKey);
  }
};

export const build__RunNextMediaDeletionJob = ({
  config,
  logger,
  mediaDeletionJobRepository,
  mediaStorage,
  uow,
  processNextMediaDeletionJob,
}: RunNextMediaDeletionJobDeps): RunNextMediaDeletionJob => {
  return async (): Promise<WorkerTaskOutcome> => {
    // claimNextAvailableJob manages it's own UOW lifecycle
    const job = await mediaDeletionJobRepository.claimNextAvailableJob();
    if (!job) {
      return 'idle';
    }

    logger.info('Media deletion job claimed', {
      jobId: job.id,
      mediaItemId: job.mediaItemId,
      storageKey: job.storageKey,
      attemptCount: job.attemptCount,
    });

    const actorId = job.createdBy;

    try {
      await deleteStorageObjects({ config, mediaStorage, logger, job });

      await uow.join();

      const rowDeleted = await processNextMediaDeletionJob.deleteMediaItemIfPresent(
        job.mediaItemId,
      );

      if (rowDeleted) {
        logger.info('Media item row deleted', {
          mediaItemId: job.mediaItemId,
          jobId: job.id,
        });
      } else {
        logger.warn('Media item row not found during deletion; storage objects removed', {
          mediaItemId: job.mediaItemId,
          jobId: job.id,
        });
      }

      await mediaDeletionJobRepository.markSucceeded(job.id, actorId);
      await uow.complete(true);
      logger.info('Media deletion job succeeded', { jobId: job.id, mediaItemId: job.mediaItemId });
      return 'processed';
    } catch (e) {
      const message = serializeError(e);
      logger.error('Media deletion job failed', e, {
        jobId: job.id,
        mediaItemId: job.mediaItemId,
        storageKey: job.storageKey,
        attemptCount: job.attemptCount,
      });

      const outcome = await mediaDeletionJobRepository.markPendingRetry(job.id, actorId, message);
      if (outcome === 'exhausted') {
        logger.error('Media deletion job marked failed (attempts exhausted)', {
          jobId: job.id,
          message,
        });
      } else {
        logger.warn('Media deletion job scheduled for retry', { jobId: job.id, message });
      }
      await uow.complete(true);
      return 'processed';
    }
  };
};
