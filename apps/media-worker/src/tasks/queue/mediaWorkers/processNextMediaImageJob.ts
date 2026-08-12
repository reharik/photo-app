import { MediaAssetKind, MediaItemStatus, MediaKind } from '@packages/contracts';
import type { Logger } from '@packages/infrastructure';
import {
  buildMediaAssetStorageKey,
  buildMediaItemBaseStorageKey,
  type EntityId,
  type MediaItem,
  type MediaItemRepository,
  type MediaProcessingJobRepository,
  type MediaProcessingJobRow,
  type MediaStorage,
  withUnitOfWork,
} from '@packages/media-core';
import type { AwilixContainer } from 'awilix';

import type { Config } from '../../../config.js';
import type { AppCradle } from '../../../generated/ioc-composed.js';
import { extractCaptureTime } from '../../../infrastructure/exif/extractCaptureTime.js';
import { generateImageDerivatives } from './imageDerivativeGenerator.js';
import { readStreamToBuffer } from './readStreamToBuffer.js';
import { WorkerJobProcessorBase } from './workerJobProcessorBaseType.js';

export type ProcessNextMediaImageJobResult = 'processed' | 'idle';

export type RunNextMediaImageJob = () => Promise<ProcessNextMediaImageJobResult>;

export type MediaImageJobLoadResult =
  | { kind: 'not_found' }
  | { kind: 'already_ready' }
  | { kind: 'failed'; message: string }
  | { kind: 'loaded'; mediaItem: MediaItem };

export type MediaImageStorageResult = { kind: 'failed'; message: string } | { kind: 'ok' };

export interface ProcessNextMediaImageJob extends WorkerJobProcessorBase {
  loadForProcessing: (mediaItemId: EntityId) => Promise<MediaImageJobLoadResult>;
  saveProcessedItem: (mediaItem: MediaItem) => Promise<void>;
  markItemFailed: (mediaItemId: EntityId, actorId: EntityId) => Promise<boolean>;
}

type ProcessNextMediaImageJobDeps = {
  mediaItemRepository: MediaItemRepository;
};

export const build__ProcessNextMediaImageJob = ({
  mediaItemRepository,
}: ProcessNextMediaImageJobDeps): ProcessNextMediaImageJob => {
  const loadForProcessing = async (mediaItemId: EntityId): Promise<MediaImageJobLoadResult> => {
    const mediaItem = await mediaItemRepository.getById(mediaItemId);
    if (!mediaItem) {
      return { kind: 'not_found' };
    }

    if (mediaItem.status().equals(MediaItemStatus.ready)) {
      return { kind: 'already_ready' };
    }

    if (!mediaItem.kind().equals(MediaKind.photo)) {
      return {
        kind: 'failed',
        message: 'Only photo media is supported for image processing',
      };
    }

    if (!mediaItem.status().equals(MediaItemStatus.processing)) {
      return {
        kind: 'failed',
        message: `Media item not processable (status: ${mediaItem.status().value})`,
      };
    }

    return { kind: 'loaded', mediaItem };
  };

  const saveProcessedItem = async (mediaItem: MediaItem): Promise<void> => {
    await mediaItemRepository.save(mediaItem);
  };

  /**
   * Terminal-failure bookkeeping: move the item off PROCESSING so the upload UI stops
   * polling. Returns false when there is nothing to mark (item gone, or already in a
   * status the transition does not apply to) — a dead job must not be resurrected by a
   * failure to record its own failure.
   */
  const markItemFailed = async (mediaItemId: EntityId, actorId: EntityId): Promise<boolean> => {
    const mediaItem = await mediaItemRepository.getById(mediaItemId);
    if (!mediaItem) {
      return false;
    }
    const result = mediaItem.markProcessingFailed(actorId);
    if (!result.success) {
      return false;
    }
    await mediaItemRepository.save(mediaItem);
    return true;
  };

  return {
    loadForProcessing,
    saveProcessedItem,
    markItemFailed,
  };
};

const serializeError = (e: unknown): string => {
  if (e instanceof Error) {
    return `${e.name}: ${e.message}`;
  }
  return String(e);
};

/** After this many claimed attempts a thrown (transient-looking) failure becomes terminal. */
const MAX_MEDIA_IMAGE_JOB_ATTEMPTS = 5;

const retryBackoffMs = (attemptCount: number): number => {
  const capped = Math.max(0, attemptCount - 1);
  return Math.min(60_000, 250 * 2 ** capped);
};

type RunImageStoragePipelineDeps = {
  config: Config;
  mediaStorage: MediaStorage;
  logger: Logger;
  job: MediaProcessingJobRow;
  mediaItem: MediaItem;
};

const runImageStoragePipeline = async ({
  config,
  mediaStorage,
  logger,
  job,
  mediaItem,
}: RunImageStoragePipelineDeps): Promise<MediaImageStorageResult> => {
  const ownerId = mediaItem.ownerId();
  const baseKey = buildMediaItemBaseStorageKey(ownerId, mediaItem.id());
  const originalKey = buildMediaAssetStorageKey(baseKey, MediaAssetKind.original);
  logger.info('S3 GetObject (original)', {
    bucket: config.s3Bucket,
    key: originalKey,
    jobId: job.id,
    mediaItemId: job.mediaItemId,
  });
  const streamResult = await mediaStorage.getObjectStream(originalKey);
  if (!streamResult) {
    logger.warn('Media image job failed: original object missing in S3', {
      bucket: config.s3Bucket,
      key: originalKey,
      jobId: job.id,
      mediaItemId: job.mediaItemId,
    });
    return { kind: 'failed', message: 'Original object not found in storage' };
  }

  const originalBuffer = await readStreamToBuffer(streamResult.body);
  logger.info('Original object downloaded from S3', {
    jobId: job.id,
    mediaItemId: job.mediaItemId,
    byteLength: originalBuffer.length,
    mimeType: streamResult.mimeType,
  });
  const [derivatives, capture] = await Promise.all([
    generateImageDerivatives(originalBuffer, logger),
    extractCaptureTime(originalBuffer),
  ]);

  logger.info('Image derivatives generated', {
    jobId: job.id,
    mediaItemId: job.mediaItemId,
    displayBytes: derivatives.display.buffer.length,
    thumbnailBytes: derivatives.thumbnail.buffer.length,
    hasReplacementOriginal: Boolean(derivatives.replacementOriginal),
  });

  const displayKey = buildMediaAssetStorageKey(baseKey, MediaAssetKind.display);
  const thumbnailKey = buildMediaAssetStorageKey(baseKey, MediaAssetKind.thumbnail);

  const logDerivativeUpload = (storageKey: string, body: Buffer, mimeType: string): void => {
    logger.info('S3 PutObject (derivative)', {
      bucket: config.s3Bucket,
      key: storageKey,
      bodyType: 'Buffer',
      contentType: mimeType,
      contentLength: body.length,
    });
  };

  if (derivatives.replacementOriginal) {
    logger.info('S3 PutObject (original replacement)', {
      bucket: config.s3Bucket,
      key: originalKey,
      bodyType: 'Buffer',
      contentType: derivatives.replacementOriginal.mimeType,
      contentLength: derivatives.replacementOriginal.fileSizeBytes,
    });

    await mediaStorage.writeObject({
      storageKey: originalKey,
      body: derivatives.replacementOriginal.buffer,
      mimeType: derivatives.replacementOriginal.mimeType,
    });

    mediaItem.updateAssetWithMetadata({
      sizeBytes: derivatives.replacementOriginal.fileSizeBytes,
      mimeType: derivatives.replacementOriginal.mimeType,
      width: derivatives.replacementOriginal.width,
      height: derivatives.replacementOriginal.height,
      kind: MediaAssetKind.original,
    });
  }

  logDerivativeUpload(displayKey, derivatives.display.buffer, derivatives.display.mimeType);
  await mediaStorage.writeObject({
    storageKey: displayKey,
    body: derivatives.display.buffer,
    mimeType: derivatives.display.mimeType,
  });
  logDerivativeUpload(thumbnailKey, derivatives.thumbnail.buffer, derivatives.thumbnail.mimeType);
  await mediaStorage.writeObject({
    storageKey: thumbnailKey,
    body: derivatives.thumbnail.buffer,
    mimeType: derivatives.thumbnail.mimeType,
  });

  mediaItem.addAsset(MediaAssetKind.display, derivatives.display.mimeType);
  mediaItem.updateAssetWithMetadata({
    sizeBytes: derivatives.display.fileSizeBytes,
    mimeType: derivatives.display.mimeType,
    width: derivatives.display.width,
    height: derivatives.display.height,
    kind: MediaAssetKind.display,
  });

  mediaItem.addAsset(MediaAssetKind.thumbnail, derivatives.thumbnail.mimeType);
  mediaItem.updateAssetWithMetadata({
    sizeBytes: derivatives.thumbnail.fileSizeBytes,
    mimeType: derivatives.thumbnail.mimeType,
    width: derivatives.thumbnail.width,
    height: derivatives.thumbnail.height,
    kind: MediaAssetKind.thumbnail,
  });

  const readyResult = mediaItem.markReadyAfterDerivatives(
    {
      displayWidth: derivatives.display.width,
      displayHeight: derivatives.display.height,
    },
    ownerId,
  );
  if (!readyResult.success) {
    return {
      kind: 'failed',
      message: `${readyResult.error.code}: ${readyResult.error.display}`,
    };
  }

  const captureResult = mediaItem.applyExifCaptureTime(capture);
  logger.info('EXIF capture time evaluated', {
    jobId: job.id,
    mediaItemId: job.mediaItemId,
    result: captureResult.kind === 'applied' ? 'applied' : `skipped:${captureResult.reason}`,
  });

  return { kind: 'ok' };
};

type RunNextMediaImageJobDeps = {
  container: AwilixContainer<AppCradle>;
  config: Config;
  logger: Logger;
  mediaProcessingJobRepository: MediaProcessingJobRepository;
  mediaStorage: MediaStorage;
};

export const build__RunNextMediaImageJob = ({
  container,
  config,
  logger,
  mediaProcessingJobRepository,
  mediaStorage,
}: RunNextMediaImageJobDeps): RunNextMediaImageJob => {
  return async (): Promise<ProcessNextMediaImageJobResult> => {
    const job = await mediaProcessingJobRepository.claimNextAvailableJob();
    if (!job) {
      return 'idle';
    }

    logger.info('Media image processing job claimed', {
      jobId: job.id,
      mediaItemId: job.mediaItemId,
      attemptCount: job.attemptCount,
    });

    const actorId = job.createdBy;

    const finishSucceeded = async (): Promise<void> => {
      await mediaProcessingJobRepository.markSucceeded(job.id, actorId);
    };

    /**
     * Terminal failure: the job row is the durable record, so mark it first — if the
     * item update then throws, we have a FAILED job to read rather than a claimed job
     * stuck in PROCESSING that nothing will ever retry. Moving the item off PROCESSING
     * is best-effort on top of that.
     */
    const finishFailed = async (message: string): Promise<void> => {
      await mediaProcessingJobRepository.markFailed(job.id, actorId, message);
      try {
        const marked = await withUnitOfWork(container, async (scope) => {
          const processor = scope.resolve('processNextMediaImageJob');
          return processor.markItemFailed(job.mediaItemId, actorId);
        });
        if (!marked) {
          logger.warn('Media item not moved to failed status', {
            jobId: job.id,
            mediaItemId: job.mediaItemId,
          });
        }
      } catch (e) {
        logger.error('Failed to mark media item as failed after job failure', {
          err: serializeError(e),
          jobId: job.id,
          mediaItemId: job.mediaItemId,
        });
      }
    };

    const finishRetry = async (message: string): Promise<void> => {
      const delay = retryBackoffMs(job.attemptCount);
      await mediaProcessingJobRepository.markPendingRetry(
        job.id,
        actorId,
        message,
        new Date(Date.now() + delay),
      );
      logger.warn('Media image processing job scheduled for retry', {
        jobId: job.id,
        mediaItemId: job.mediaItemId,
        attemptCount: job.attemptCount,
        retryDelayMs: delay,
        message,
      });
    };

    try {
      const loadResult = await withUnitOfWork(container, async (scope) => {
        const processor = scope.resolve('processNextMediaImageJob');
        return processor.loadForProcessing(job.mediaItemId);
      });

      if (loadResult.kind === 'not_found') {
        logger.warn('Media image job failed: media item not found', {
          jobId: job.id,
          mediaItemId: job.mediaItemId,
        });
        await finishFailed('Media item not found');
        return 'processed';
      }

      if (loadResult.kind === 'already_ready') {
        logger.info('Media image job skipped: item already ready', {
          jobId: job.id,
          mediaItemId: job.mediaItemId,
        });
        await finishSucceeded();
        return 'processed';
      }

      if (loadResult.kind === 'failed') {
        logger.warn('Media image job failed: validation failed', {
          jobId: job.id,
          mediaItemId: job.mediaItemId,
          message: loadResult.message,
        });
        await finishFailed(loadResult.message);
        return 'processed';
      }

      const storageResult = await runImageStoragePipeline({
        config,
        mediaStorage,
        logger,
        job,
        mediaItem: loadResult.mediaItem,
      });
      if (storageResult.kind === 'failed') {
        await finishFailed(storageResult.message);
        return 'processed';
      }

      await withUnitOfWork(container, async (scope) => {
        const processor = scope.resolve('processNextMediaImageJob');
        await processor.saveProcessedItem(loadResult.mediaItem);
      });

      await finishSucceeded();
      logger.info('Media image processing job succeeded', {
        jobId: job.id,
        mediaItemId: job.mediaItemId,
      });
      return 'processed';
    } catch (e) {
      const message = serializeError(e);
      if (e instanceof Error) {
        logger.error('Media image processing failed', e, {
          jobId: job.id,
          mediaItemId: job.mediaItemId,
          attemptCount: job.attemptCount,
        });
      } else {
        logger.error('Media image processing failed', {
          err: String(e),
          jobId: job.id,
          mediaItemId: job.mediaItemId,
          attemptCount: job.attemptCount,
        });
      }
      // A thrown error is transient-looking (S3, DB, decode) — retry with backoff and
      // only give up, and fail the item, once the attempts are exhausted. Deterministic
      // rejections above are terminal on the first pass and never reach here.
      if (job.attemptCount >= MAX_MEDIA_IMAGE_JOB_ATTEMPTS) {
        await finishFailed(message);
        logger.error('Media image processing job marked failed (terminal)', {
          jobId: job.id,
          mediaItemId: job.mediaItemId,
          attemptCount: job.attemptCount,
          message,
        });
      } else {
        await finishRetry(message);
      }
      return 'processed';
    }
  };
};
