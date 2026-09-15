import {
  AppErrorCollection,
  EntityId,
  fail,
  MediaAssetKind,
  ok,
  OperationResult,
} from '@packages/contracts';
import { tryAppendOneMediaToAlbum } from '../../../application';
import {
  buildMediaAssetStorageKey,
  buildMediaItemBaseStorageKey,
  MediaStorage,
} from '../../../application/media/MediaStorage';
import { MediaItem } from '../../../domain/MediaItem/MediaItem';
import { AlbumRepository } from '../../../repositories/domainRepositories/albumRepository';
import { MediaItemRepository } from '../../../repositories/domainRepositories/mediaItemRepository';
import { WriteServiceBase } from '../writeServiceBaseType';
import { CreateMediaUploadCommand, CreateMediaUploadResult } from './writeMediaItem.types';

export interface CreateMediaUpload extends WriteServiceBase {
  (input: CreateMediaUploadCommand): Promise<OperationResult<CreateMediaUploadResult>>;
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
  albumRepository: AlbumRepository;
  mediaStorage: MediaStorage;
  viewerId: EntityId;
};

export const build__CreateMediaItemUpload = ({
  mediaItemRepository,
  albumRepository,
  mediaStorage,
  viewerId,
}: CreateMediaItemUploadDeps): CreateMediaUpload => {
  return async (
    input: CreateMediaUploadCommand,
  ): Promise<OperationResult<CreateMediaUploadResult>> => {
    const { kind, mimeType, originalFileName, albumId } = input;
    const mediaItem = MediaItem.create(
      {
        kind,
        mimeType,
        originalFileName: sanitizeOriginalFileName(originalFileName),
      },
      viewerId,
    );

    const uploadTarget = await mediaStorage.getUploadTarget({
      storageKey: buildMediaAssetStorageKey(
        buildMediaItemBaseStorageKey(mediaItem.ownerId(), mediaItem.id()),
        MediaAssetKind.original,
      ),
      mimeType,
    });

    await mediaItemRepository.save(mediaItem);
    // If albumId is passed that means that we are adding media directly
    // to the album. This bypasses the rule that an item must be in a ready state.
    // should probably find a way to wait on this
    if (albumId) {
      const album = await albumRepository.getById(albumId);
      if (!album) {
        return fail(AppErrorCollection.album.AlbumNotFound);
      }
      tryAppendOneMediaToAlbum(album, mediaItem, viewerId);
      await albumRepository.save(album);
    }
    return ok({
      mediaItemId: mediaItem.id(),
      status: mediaItem.status(),
      uploadTarget,
      albumId,
    });
  };
};
