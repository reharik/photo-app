import { EntityId, MediaAssetKind } from '@packages/contracts';
import {
  buildMediaAssetStorageKey,
  buildMediaItemBaseStorageKey,
  MediaProcessingJobRow,
  MediaStorage,
} from '@packages/worker-core';

import { Logger } from '@packages/infrastructure';
import { createReadStream } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Config } from '../../../../config';
import { generateVideoDerivatives } from '../videoDerivativeGenerator';
import { PipelineJobWorkflow } from './types';

export interface RunVideoStoragePipeline {
  (job: MediaProcessingJobRow, ownerId: EntityId): Promise<PipelineJobWorkflow>;
}

type RunVideoStoragePipelineDeps = { logger: Logger; config: Config; mediaStorage: MediaStorage };

export const build__RunVideoStoragePipeline =
  ({ logger, config, mediaStorage }: RunVideoStoragePipelineDeps): RunVideoStoragePipeline =>
  async (job: MediaProcessingJobRow, ownerId: EntityId): Promise<PipelineJobWorkflow> => {
    const baseKey = buildMediaItemBaseStorageKey(ownerId, job.mediaItemId);
    const originalKey = buildMediaAssetStorageKey(baseKey, MediaAssetKind.original);
    const dir = await mkdtemp(join(tmpdir(), 'video-'));
    const t0 = Date.now();
    const since = () => Date.now() - t0;
    try {
      logger.info(`S3 GetObject (original) ms: ${since()}`, {
        bucket: config.s3Bucket,
        key: originalKey,
        jobId: job.id,
        mediaItemId: job.mediaItemId,
      });

      const streamResult = await mediaStorage.getObjectStream(originalKey);
      if (!streamResult) {
        logger.warn('Media video job failed: original object missing in S3', {
          bucket: config.s3Bucket,
          key: originalKey,
          jobId: job.id,
          mediaItemId: job.mediaItemId,
        });
        return { status: 'stop', message: 'Original object not found in storage' };
      }

      logger.info(`Original object downloaded from S3 ms: ${since()}`, {
        jobId: job.id,
        mediaItemId: job.mediaItemId,
        mimeType: streamResult.mimeType,
      });

      const { display, thumbnail, original, capture, durationMs } = await generateVideoDerivatives(
        streamResult,
        dir,
      );

      logger.info(`Video derivatives generated ms: ${since()}`, {
        jobId: job.id,
        mediaItemId: job.mediaItemId,
        displayBytes: display.fileSizeBytes,
        thumbnailBytes: thumbnail.fileSizeBytes,
      });

      const displayKey = buildMediaAssetStorageKey(baseKey, MediaAssetKind.display);
      const thumbnailKey = buildMediaAssetStorageKey(baseKey, MediaAssetKind.thumbnail);

      const logDerivativeUpload = (
        storageKey: string,
        length: number,
        mimeType: string,
        time: number,
      ): void => {
        logger.info(`S3 PutObject (derivative) ms: ${time}`, {
          bucket: config.s3Bucket,
          key: storageKey,
          bodyType: 'Stream',
          contentType: mimeType,
          contentLength: length,
        });
      };

      logDerivativeUpload(displayKey, display.fileSizeBytes, display.mimeType, since());
      await mediaStorage.writeObject({
        storageKey: displayKey,
        body: createReadStream(display.path),
        mimeType: display.mimeType,
        contentLength: display.fileSizeBytes,
      });
      logDerivativeUpload(thumbnailKey, thumbnail.fileSizeBytes, thumbnail.mimeType, since());
      await mediaStorage.writeObject({
        storageKey: thumbnailKey,
        body: createReadStream(thumbnail.path),
        mimeType: thumbnail.mimeType,
        contentLength: thumbnail.fileSizeBytes,
      });

      const displayAsset = {
        sizeBytes: display.fileSizeBytes,
        mimeType: display.mimeType,
        width: display.width,
        height: display.height,
        kind: MediaAssetKind.display,
      };

      const thumbnailAsset = {
        sizeBytes: thumbnail.fileSizeBytes,
        mimeType: thumbnail.mimeType,
        width: thumbnail.width,
        height: thumbnail.height,
        kind: MediaAssetKind.thumbnail,
      };

      const originalAsset = {
        sizeBytes: original.fileSizeBytes,
        mimeType: original.mimeType,
        width: original.width,
        height: original.height,
        kind: MediaAssetKind.original,
      };
      return {
        status: 'continue',
        pipelineResult: { capture, durationMs, displayAsset, thumbnailAsset, originalAsset },
      };
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  };
