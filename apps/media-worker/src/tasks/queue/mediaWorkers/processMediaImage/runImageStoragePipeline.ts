import { MediaAssetKind } from '@packages/contracts';
import {
  buildMediaAssetStorageKey,
  buildMediaItemBaseStorageKey,
  EntityId,
  MediaProcessingJobRow,
  MediaStorage,
} from '@packages/media-core';
import { extractCaptureTime } from '../../../../infrastructure/exif/extractCaptureTime';
import { generateImageDerivatives } from '../imageDerivativeGenerator';
import { readStreamToBuffer } from '../readStreamToBuffer';

import { Logger } from '@packages/infrastructure';
import { Config } from '../../../../config';
import { PipelineAsset, PipelineJobWorkflow } from './processNextMediaImageJob';

export interface RunImageStoragePipeline {
  (job: MediaProcessingJobRow, ownerId: EntityId): Promise<PipelineJobWorkflow>;
}

type RunImageStoragePipelineDeps = { logger: Logger; config: Config; mediaStorage: MediaStorage };

export const build__RunImageStoragePipeline =
  ({ logger, config, mediaStorage }: RunImageStoragePipelineDeps): RunImageStoragePipeline =>
  async (job: MediaProcessingJobRow, ownerId: EntityId): Promise<PipelineJobWorkflow> => {
    const baseKey = buildMediaItemBaseStorageKey(ownerId, job.mediaItemId);
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
      return { status: 'stop', message: 'Original object not found in storage' };
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
    let originalAsset: PipelineAsset | undefined;
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

      originalAsset = {
        sizeBytes: derivatives.replacementOriginal.fileSizeBytes,
        mimeType: derivatives.replacementOriginal.mimeType,
        width: derivatives.replacementOriginal.width,
        height: derivatives.replacementOriginal.height,
        kind: MediaAssetKind.original,
      };
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

    const displayAsset = {
      sizeBytes: derivatives.display.fileSizeBytes,
      mimeType: derivatives.display.mimeType,
      width: derivatives.display.width,
      height: derivatives.display.height,
      kind: MediaAssetKind.display,
    };

    const thumbnailAsset = {
      sizeBytes: derivatives.thumbnail.fileSizeBytes,
      mimeType: derivatives.thumbnail.mimeType,
      width: derivatives.thumbnail.width,
      height: derivatives.thumbnail.height,
      kind: MediaAssetKind.thumbnail,
    };

    return {
      status: 'continue',
      pipelineResult: { capture, displayAsset, thumbnailAsset, originalAsset },
    };
  };
