import { MediaAssetKind, MediaItemStatus, MediaKind } from '@packages/contracts';
import { buildMediaAssetStorageKey, buildMediaItemBaseStorageKey } from '@packages/media-core';

import type { IocGeneratedCradle } from '../di/generated/ioc-registry.types';
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

export const buildProcessNextMediaImageJob = ({
  config,
  mediaProcessingJobRepository,
  mediaItemRepository,
  mediaStorage,
  logger,
}: IocGeneratedCradle): ProcessNextMediaImageJob => {
  return async (): Promise<ProcessNextMediaImageJobResult> => {
    const job = await mediaProcessingJobRepository.claimNextAvailableJob();
    if (!job) {
      return 'idle';
    }

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
        await finishFailed('Media item not found');
        return 'processed';
      }

      if (mediaItem.status() === MediaItemStatus.ready) {
        await finishSucceeded();
        return 'processed';
      }

      if (mediaItem.kind() !== MediaKind.photo) {
        await finishFailed('Only photo media is supported for image processing');
        return 'processed';
      }

      if (mediaItem.status() !== MediaItemStatus.processing) {
        await finishFailed(`Media item not processable (status: ${mediaItem.status().value})`);
        return 'processed';
      }

      const ownerId = mediaItem.ownerId();
      const baseKey = buildMediaItemBaseStorageKey(ownerId, mediaItem.id());
      const originalKey = buildMediaAssetStorageKey(baseKey, MediaAssetKind.original);
      const streamResult = await mediaStorage.getObjectStream(originalKey);
      if (!streamResult) {
        await finishFailed('Original object not found in storage');
        return 'processed';
      }

      const originalBuffer = await readStreamToBuffer(streamResult.body);
      const derivatives = await generateImageDerivatives(originalBuffer);

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

      await mediaItemRepository.save(mediaItem);
      await finishSucceeded();
      return 'processed';
    } catch (e) {
      const message = serializeError(e);
      if (e instanceof Error) {
        logger.error('Media image processing failed', e);
      } else {
        logger.error('Media image processing failed', { err: String(e) });
      }
      await finishFailed(message);
      return 'processed';
    }
  };
};
