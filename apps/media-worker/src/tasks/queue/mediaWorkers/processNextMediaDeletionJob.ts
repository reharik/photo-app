import { MediaAssetKind } from '@packages/contracts';
import type { Logger } from '@packages/infrastructure';
import {
  buildMediaAssetStorageKey,
  type MediaDeletionJobRepository,
  type MediaDeletionJobRow,
  type MediaItemRepository,
  type MediaStorage,
  withUnitOfWork,
} from '@packages/media-core';
import type { AwilixContainer } from 'awilix';

import type { Config } from '../../../config.js';
import type { AppCradle } from '../../../generated/ioc-composed.js';
import { WorkerJobProcessorBase } from './workerJobProcessorBaseType.js';

export type ProcessNextMediaDeletionJobResult = 'processed' | 'idle';

export type RunNextMediaDeletionJob = () => Promise<ProcessNextMediaDeletionJobResult>;

/** After this many claimed attempts, the job is marked failed (storage deletes remain idempotent if re-enqueued manually). */
const MAX_MEDIA_DELETION_JOB_ATTEMPTS = 8;

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

const retryBackoffMs = (attemptCount: number): number => {
  const capped = Math.max(0, attemptCount - 1);
  return Math.min(60_000, 250 * 2 ** capped);
};

type RunNextMediaDeletionJobDeps = {
  container: AwilixContainer<AppCradle>;
  config: Config;
  logger: Logger;
  mediaDeletionJobRepository: MediaDeletionJobRepository;
  mediaStorage: MediaStorage;
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
  container,
  config,
  logger,
  mediaDeletionJobRepository,
  mediaStorage,
}: RunNextMediaDeletionJobDeps): RunNextMediaDeletionJob => {
  return async (): Promise<ProcessNextMediaDeletionJobResult> => {
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

    const finishSucceeded = async (): Promise<void> => {
      await mediaDeletionJobRepository.markSucceeded(job.id, actorId);
    };

    const finishFailedTerminal = async (message: string): Promise<void> => {
      await mediaDeletionJobRepository.markFailed(job.id, actorId, message);
    };

    const finishRetry = async (message: string): Promise<void> => {
      const delay = retryBackoffMs(job.attemptCount);
      await mediaDeletionJobRepository.markPendingRetry(
        job.id,
        actorId,
        message,
        new Date(Date.now() + delay),
      );
    };

    try {
      await deleteStorageObjects({ config, mediaStorage, logger, job });

      const rowDeleted = await withUnitOfWork(container, async (scope) => {
        const processor = scope.resolve('processNextMediaDeletionJob');
        return processor.deleteMediaItemIfPresent(job.mediaItemId);
      });

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

      await finishSucceeded();
      logger.info('Media deletion job succeeded', { jobId: job.id, mediaItemId: job.mediaItemId });
      return 'processed';
    } catch (e) {
      const message = serializeError(e);
      if (e instanceof Error) {
        logger.error('Media deletion job failed', e, {
          jobId: job.id,
          mediaItemId: job.mediaItemId,
          storageKey: job.storageKey,
          attemptCount: job.attemptCount,
        });
      } else {
        logger.error('Media deletion job failed', {
          err: String(e),
          jobId: job.id,
          mediaItemId: job.mediaItemId,
          storageKey: job.storageKey,
          attemptCount: job.attemptCount,
        });
      }

      if (job.attemptCount >= MAX_MEDIA_DELETION_JOB_ATTEMPTS) {
        await finishFailedTerminal(message);
        logger.error('Media deletion job marked failed (terminal)', {
          jobId: job.id,
          attemptCount: job.attemptCount,
          message,
        });
      } else {
        const delay = retryBackoffMs(job.attemptCount);
        await finishRetry(message);
        logger.warn('Media deletion job scheduled for retry', {
          jobId: job.id,
          attemptCount: job.attemptCount,
          retryDelayMs: delay,
          message,
        });
      }
      return 'processed';
    }
  };
};
