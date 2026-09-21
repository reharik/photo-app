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
import { MediaItemRepository } from '../../../repositories/domainRepositories/mediaItemRepository';
import { MediaProcessingJobRepository } from '../../../repositories/mediaProcessingJob/mediaProcessingJobRepository';

import { EntityId } from '@packages/contracts';
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
  viewerId: EntityId;
};

export const build__FinalizeMediaItemUpload = ({
  mediaItemRepository,
  mediaStorage,
  mediaProcessingJobRepository,
  viewerId,
}: FinalizeMediaItemUploadDeps): FinalizeMediaItemUpload => {
  return async (
    input: FinalizeMediaItemUploadCommand,
  ): Promise<OperationResult<FinalizeMediaItemUploadResult>> => {
    const { mediaItemId } = input;
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
    // A zero-byte object means the client's PUT reached S3 with an empty body.
    // S3 answers 200 for that, so the upload "succeeds" client-side; without this
    // guard the item finalizes, enqueues a processing job, and only fails deep in
    // the worker on an undecodable file. Fail here instead, where the error is
    // still attributable to the upload. (See the WebKit service-worker bug that
    // made every iOS upload land as zero bytes.)
    if (objectMetadata.size === 0) {
      return fail(AppErrorCollection.mediaItem.MediaBytesEmpty);
    }
    // Backstop for the presigned PUT, which already signs Content-Length so storage rejects a
    // body of any other size. If a mismatched object lands anyway, refuse to finalize rather
    // than overwrite the claimed size (the quota reservation) with a different one. No state
    // change: the item stays PENDING and stops holding quota once the presign TTL lapses.
    if (objectMetadata.size !== mediaItem.sizeBytes()) {
      return fail(AppErrorCollection.mediaItem.UploadSizeMismatch);
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
      // this should be moved to a domainevent once we have persisted events

      // Same transaction as mediaItemRepository.save above: the job row must not be
      // visible to the worker before the item's PROCESSING status commits.
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
