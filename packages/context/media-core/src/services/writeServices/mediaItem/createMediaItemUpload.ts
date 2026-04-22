import { MediaAssetKind } from '@packages/contracts';
import { buildMediaAssetStorageKey, MediaStorage } from '../../../application/media/MediaStorage';
import { MediaItem } from '../../../domain/MediaItem/MediaItem';
import { ok } from '../../../domain/utilities/writeResponse';
import { MediaItemRepository } from '../../../repositories/domainRepositories/mediaItemRepository';
import { WriteResult } from '../../../types/types';
import { WriteServiceBase } from '../writeServiceBaseType';
import { CreateMediaUploadCommand, CreateMediaUploadResult } from './writeMediaItem.types';

export interface CreateMediaUpload extends WriteServiceBase {
  (input: CreateMediaUploadCommand): Promise<WriteResult<CreateMediaUploadResult>>;
}

const sanitizeOriginalFileName = (value: string | undefined): string | undefined => {
  if (value === undefined) {
    return undefined;
  }
  const t = value.trim();
  if (t.length === 0) {
    return undefined;
  }
  return t.length > 1024 ? t.slice(0, 1024) : t;
};

type CreateMediaItemUploadDeps = {
  mediaItemRepository: MediaItemRepository;
  mediaStorage: MediaStorage;
};

export const buildCreateMediaItemUpload = ({
  mediaItemRepository,
  mediaStorage,
}: CreateMediaItemUploadDeps): CreateMediaUpload => {
  return async (input: CreateMediaUploadCommand): Promise<WriteResult<CreateMediaUploadResult>> => {
    const { viewerId, kind, mimeType, originalFileName } = input;
    const mediaItem = MediaItem.create(
      {
        kind,
        mimeType,
        originalFileName: sanitizeOriginalFileName(originalFileName),
      },
      viewerId,
    );
    const result = mediaItem.addAsset(MediaAssetKind.original, mimeType);
    if (!result.success) {
      return result;
    }
    const uploadTarget = await mediaStorage.getUploadTarget({
      storageKey: buildMediaAssetStorageKey(mediaItem.storageKey(), MediaAssetKind.original),
      mimeType,
    });
    await mediaItemRepository.save(mediaItem);

    return ok({
      mediaItemId: mediaItem.id(),
      status: mediaItem.status(),
      uploadTarget,
    });
  };
};
