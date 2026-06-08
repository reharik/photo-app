import { MediaAssetKind, MediaItemStatus, MediaKind } from '@packages/contracts';
import type { Logger } from '@packages/infrastructure';
import {
  buildMediaAssetStorageKey,
  buildMediaItemBaseStorageKey,
  type MediaItemRepository,
  type MediaStorage,
} from '@packages/media-core';

import { Knex } from 'knex';
import type { Config } from '../config.js';
import { extractCaptureTime } from '../infrastructure/exif/extractCaptureTime.js';
import type { MediaProcessingJobRepository } from '../repositories/domainRepositories/mediaProcessingJobRepository.js';
import { generateImageDerivatives } from './imageDerivativeGenerator';
import { readStreamToBuffer } from './readStreamToBuffer';

export type ProcessNextMediaImageJobResult = 'processed' | 'idle';

export type ProcessNextMediaImageJob = () => Promise<ProcessNextMediaImageJobResult>;

const serializeError = (e: unknown): string => {
  if (e instanceof Error) {
    return `${e.name}: ${e.message}`;
  }
  return String(e);
};

type ProcessNextMediaImageJobDeps = {
  config: Config;
  mediaProcessingJobRepository: MediaProcessingJobRepository;
  mediaItemRepository: MediaItemRepository;
  mediaStorage: MediaStorage;
  database: Knex;
  logger: Logger;
};

export const build__ProcessNextMediaImageJob = ({
  config,
  mediaProcessingJobRepository,
  mediaItemRepository,
  mediaStorage,
  database,
  logger,
}: ProcessNextMediaImageJobDeps): ProcessNextMediaImageJob => {
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

    const finishFailed = async (message: string): Promise<void> => {
      await mediaProcessingJobRepository.markFailed(job.id, actorId, message);
    };

    try {
      const mediaItem = await mediaItemRepository.getById(job.mediaItemId);
      if (!mediaItem) {
        logger.warn('Media image job failed: media item not found', {
          jobId: job.id,
          mediaItemId: job.mediaItemId,
        });
        await finishFailed('Media item not found');
        return 'processed';
      }

      if (mediaItem.status().equals(MediaItemStatus.ready)) {
        logger.info('Media image job skipped: item already ready', {
          jobId: job.id,
          mediaItemId: job.mediaItemId,
        });
        await finishSucceeded();
        return 'processed';
      }

      if (!mediaItem.kind().equals(MediaKind.photo)) {
        logger.warn('Media image job failed: unsupported media kind', {
          jobId: job.id,
          mediaItemId: job.mediaItemId,
          kind: mediaItem.kind().value,
        });
        await finishFailed('Only photo media is supported for image processing');
        return 'processed';
      }

      if (!mediaItem.status().equals(MediaItemStatus.processing)) {
        logger.warn('Media image job failed: item not in processing status', {
          jobId: job.id,
          mediaItemId: job.mediaItemId,
          status: mediaItem.status().value,
        });
        await finishFailed(`Media item not processable (status: ${mediaItem.status().value})`);
        return 'processed';
      }

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
        await finishFailed('Original object not found in storage');
        return 'processed';
      }

      const originalBuffer = await readStreamToBuffer(streamResult.body);
      logger.info('Original object downloaded from S3', {
        jobId: job.id,
        mediaItemId: job.mediaItemId,
        byteLength: originalBuffer.length,
        mimeType: streamResult.mimeType,
      });
      const [derivatives, capture] = await Promise.all([
        generateImageDerivatives(originalBuffer),
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
      logDerivativeUpload(
        thumbnailKey,
        derivatives.thumbnail.buffer,
        derivatives.thumbnail.mimeType,
      );
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
        await finishFailed(`${readyResult.error.code}: ${readyResult.error.display}`);
        return 'processed';
      }

      const captureResult = mediaItem.applyExifCaptureTime(capture);
      logger.info('EXIF capture time evaluated', {
        jobId: job.id,
        mediaItemId: job.mediaItemId,
        result: captureResult.kind === 'applied' ? 'applied' : `skipped:${captureResult.reason}`,
      });

      await database.transaction(async (trx) => await mediaItemRepository.save(mediaItem, trx));
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
      await finishFailed(message);
      return 'processed';
    }
  };
};
