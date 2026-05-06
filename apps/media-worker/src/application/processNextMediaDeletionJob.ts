import { MediaAssetKind } from '@packages/contracts';
import { buildMediaAssetStorageKey } from '@packages/media-core';

import type { IocGeneratedCradle } from '../di/generated/ioc-registry.types';

export type ProcessNextMediaDeletionJobResult = 'processed' | 'idle';

export type ProcessNextMediaDeletionJob = () => Promise<ProcessNextMediaDeletionJobResult>;

/** After this many claimed attempts, the job is marked failed (storage deletes remain idempotent if re-enqueued manually). */
const MAX_MEDIA_DELETION_JOB_ATTEMPTS = 8;

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

export const build__ProcessNextMediaDeletionJob = ({
  mediaDeletionJobRepository,
  mediaItemRepository,
  mediaStorage,
  logger,
}: IocGeneratedCradle): ProcessNextMediaDeletionJob => {
  return async (): Promise<ProcessNextMediaDeletionJobResult> => {
    const job = await mediaDeletionJobRepository.claimNextAvailableJob();
    if (!job) {
      return 'idle';
    }

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
      const baseKey = job.storageKey;
      const kinds = [MediaAssetKind.original, MediaAssetKind.display, MediaAssetKind.thumbnail];
      for (const kind of kinds) {
        const objectKey = buildMediaAssetStorageKey(baseKey, kind);
        await mediaStorage.deleteObject(objectKey);
      }

      const mediaItem = await mediaItemRepository.getById(job.mediaItemId);
      if (mediaItem) {
        await mediaItemRepository.delete(mediaItem);
      }

      await finishSucceeded();
      return 'processed';
    } catch (e) {
      const message = serializeError(e);
      if (e instanceof Error) {
        logger.error('Media deletion job failed', e);
      } else {
        logger.error('Media deletion job failed', { err: String(e) });
      }

      if (job.attemptCount >= MAX_MEDIA_DELETION_JOB_ATTEMPTS) {
        await finishFailedTerminal(message);
      } else {
        await finishRetry(message);
      }
      return 'processed';
    }
  };
};
