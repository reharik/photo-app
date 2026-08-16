import {
  AppErrorCollection,
  fail,
  MediaAssetKind,
  MediaKind,
  ok,
  OperationResult,
} from '@packages/contracts';
import {
  buildMediaAssetStorageKey,
  buildMediaItemBaseStorageKey,
  MediaStorage,
} from '../../../application/media/MediaStorage';
import { UnitOfWork } from '../../../infrastructure';
import { MediaItemRepository } from '../../../repositories/domainRepositories/mediaItemRepository';
import { MediaProcessingJobRepository } from '../../../repositories/mediaProcessingJob/mediaProcessingJobRepository';

import { WriteServiceBase } from '../writeServiceBaseType';
import {
  FinalizeMediaItemUploadCommand,
  FinalizeMediaItemUploadResult,
} from './writeMediaItem.types';

export interface FinalizeMediaItemUpload extends WriteServiceBase {
  (input: FinalizeMediaItemUploadCommand): Promise<OperationResult<FinalizeMediaItemUploadResult>>;
}

type FinalizeMediaItemUploadDeps = {
  mediaItemRepository: MediaItemRepository;
  mediaStorage: MediaStorage;
  mediaProcessingJobRepository: MediaProcessingJobRepository;
  uow: UnitOfWork;
};

export const build__FinalizeMediaItemUpload = ({
  mediaItemRepository,
  mediaStorage,
  mediaProcessingJobRepository,
  uow,
}: FinalizeMediaItemUploadDeps): FinalizeMediaItemUpload => {
  return async (
    input: FinalizeMediaItemUploadCommand,
  ): Promise<OperationResult<FinalizeMediaItemUploadResult>> => {
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

    await mediaItemRepository.save(mediaItem);

    if (mediaItem.kind().equals(MediaKind.photo)) {
      // Same transaction as mediaItemRepository.save above: the job row must not be
      // visible to the worker before the item's PROCESSING status commits.
      await mediaProcessingJobRepository.enqueueIfNoneActive(
        {
          mediaItemId: mediaItem.id(),
          actorId: viewerId,
        },
        uow,
      );
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
