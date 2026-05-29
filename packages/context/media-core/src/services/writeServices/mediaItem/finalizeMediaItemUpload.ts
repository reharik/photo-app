import { AppErrorCollection, MediaAssetKind, MediaKind } from '@packages/contracts';
import { Knex } from 'knex';
import { MediaProcessingJobRepository } from 'src/repositories/MediaProcessingJob/MediaProcessingJobRepository';
import {
  buildMediaAssetStorageKey,
  buildMediaItemBaseStorageKey,
  MediaStorage,
} from '../../../application/media/MediaStorage';
import { fail, ok } from '../../../domain/utilities/writeResponse';
import { MediaItemRepository } from '../../../repositories/domainRepositories/mediaItemRepository';
import type { WriteResult } from '../../../types/types';
import { WriteServiceBase } from '../writeServiceBaseType';
import {
  FinalizeMediaItemUploadCommand,
  FinalizeMediaItemUploadResult,
} from './writeMediaItem.types';

export interface FinalizeMediaItemUpload extends WriteServiceBase {
  (input: FinalizeMediaItemUploadCommand): Promise<WriteResult<FinalizeMediaItemUploadResult>>;
}

type FinalizeMediaItemUploadDeps = {
  mediaItemRepository: MediaItemRepository;
  mediaStorage: MediaStorage;
  mediaProcessingJobRepository: MediaProcessingJobRepository;
  database: Knex;
};

export const build__FinalizeMediaItemUpload = ({
  mediaItemRepository,
  mediaStorage,
  mediaProcessingJobRepository,
  database,
}: FinalizeMediaItemUploadDeps): FinalizeMediaItemUpload => {
  return async (
    input: FinalizeMediaItemUploadCommand,
  ): Promise<WriteResult<FinalizeMediaItemUploadResult>> => {
    const { viewerId, mediaItemId } = input;
    const mediaItem = await mediaItemRepository.getById(mediaItemId);
    if (!mediaItem) {
      return fail(AppErrorCollection.mediaItem.MediaItemNotFound);
    }
    if (mediaItem.ownerId() !== viewerId) {
      return fail(AppErrorCollection.mediaItem.MediaItemNotOwnedByViewer);
    }

    const originalAssetStorageKey = buildMediaAssetStorageKey(
      buildMediaItemBaseStorageKey(mediaItem.ownerId(), mediaItem.id()),
      MediaAssetKind.original,
    );
    const objectMetadata = await mediaStorage.getObjectMetadata(originalAssetStorageKey);
    if (!objectMetadata) {
      return fail(AppErrorCollection.mediaItem.MediaBytesNotFound);
    }

    const result = mediaItem.updateAssetWithMetadata({
      kind: MediaAssetKind.original,
      sizeBytes: objectMetadata.size,
      mimeType: objectMetadata.mimeType,
    });
    if (!result.success) {
      return result;
    }

    const finalized = mediaItem.completeUploadedWithMetadata(
      {
        sizeBytes: objectMetadata.size,
        mimeType: objectMetadata.mimeType,
      },
      mediaItem.kind(),
      viewerId,
    );
    if (!finalized.success) {
      return finalized;
    }

    await database.transaction(async (trx) => {
      await mediaItemRepository.save(mediaItem, trx);
    });

    if (mediaItem.kind() === MediaKind.photo) {
      await mediaProcessingJobRepository.enqueueIfNoneActive({
        mediaItemId: mediaItem.id(),
        actorId: viewerId,
      });
    }

    return ok({
      mediaItemId: mediaItem.id(),
      status: mediaItem.status(),
      mimeType: objectMetadata.mimeType ?? mediaItem.mimeType(),
      size: objectMetadata.size,
      kind: mediaItem.kind(),
    });
  };
};
