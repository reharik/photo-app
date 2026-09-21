import {
  AppErrorCollection,
  ContractError,
  EntityId,
  fail,
  MediaAssetKind,
  ok,
  Operation,
  OperationResult,
} from '@packages/contracts';
import { ScopedLogger } from '@packages/infrastructure';
import { ensureMemberCanEditAlbum } from '../../../application';
import {
  buildMediaAssetStorageKey,
  buildMediaItemBaseStorageKey,
  MediaStorage,
} from '../../../application/media/MediaStorage';
import { Album } from '../../../domain';
import { MediaItem } from '../../../domain/MediaItem/MediaItem';
import { AlbumRepository } from '../../../repositories/domainRepositories/albumRepository';
import { MediaItemRepository } from '../../../repositories/domainRepositories/mediaItemRepository';
import { MediaAssetReadRepository } from '../../../repositories/readRepositories/mediaAssetReadRepository';
import { WriteServiceBase } from '../writeServiceBaseType';
import { CreateMediaUploadCommand, CreateMediaUploadResult } from './writeMediaItem.types';

export interface CreateMediaUpload extends WriteServiceBase {
  (input: CreateMediaUploadCommand[]): Promise<OperationResult<CreateMediaUploadResult[]>>;
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
  scopedLogger: ScopedLogger;
  mediaAssetReadRepository: MediaAssetReadRepository;
};

export const build__CreateMediaItemUpload = ({
  mediaItemRepository,
  albumRepository,
  mediaStorage,
  viewerId,
  scopedLogger,
  mediaAssetReadRepository,
}: CreateMediaItemUploadDeps): CreateMediaUpload => {
  return async (
    input: CreateMediaUploadCommand[],
  ): Promise<OperationResult<CreateMediaUploadResult[]>> => {
    // Don't trust the transport's SafeInt scalar: a zero, negative, or fractional claim
    // would shrink the quota check below and the reservation written to size_bytes.
    if (!input.every(({ size }) => Number.isSafeInteger(size) && size > 0)) {
      return fail(AppErrorCollection.mediaItem.InvalidUploadSize);
    }

    const usage = await mediaAssetReadRepository.getStorageUsage();
    const uploadSize = input.reduce((acc, x) => (acc += x.size), 0);
    if ((usage?.storageRemainingBytes || 0) < uploadSize) {
      return fail(ContractError.InsufficientStorageSpace);
    }

    let album: Album | undefined;
    const albumId = input.find((x) => x.albumId)?.albumId;
    if (albumId) {
      album = await albumRepository.getById(albumId);
      const canEdit = album && ensureMemberCanEditAlbum(album, Operation.addItems, viewerId);
      if (!album || !canEdit?.success) {
        scopedLogger.error(`Upload proceeding without album ${albumId}`);
        album = undefined;
      }
    }

    const result: CreateMediaUploadResult[] = [];
    for (let i = 0; i < input.length; i++) {
      const item = input[i];

      const { kind, mimeType, originalFileName, clientId, size } = item;
      const mediaItem = MediaItem.create(
        {
          kind,
          mimeType,
          originalFileName: sanitizeOriginalFileName(originalFileName),
          // Claimed size reserves quota while the item is PENDING; finalize overwrites it
          // with the HeadObject size of what actually landed in storage.
          sizeBytes: size,
        },
        viewerId,
      );

      const uploadTarget = await mediaStorage.getUploadTarget({
        storageKey: buildMediaAssetStorageKey(
          buildMediaItemBaseStorageKey(mediaItem.ownerId(), mediaItem.id()),
          MediaAssetKind.original,
        ),
        mimeType,
        contentLength: size,
      });

      await mediaItemRepository.save(mediaItem);
      // If albumId is passed that means that we are adding media directly
      // to the album. This bypasses the rule that an item must be in a ready state.
      // should probably find a way to wait on this
      if (album) {
        const added = album.addItem(mediaItem.id(), viewerId, mediaItem.kind());
        if (!added.success) {
          scopedLogger.error(added.error.display);
        }
      }

      result.push({
        mediaItemId: mediaItem.id(),
        status: mediaItem.status(),
        uploadTarget,
        clientId,
      });
    }
    if (album) {
      await albumRepository.save(album);
    }
    return ok(result);
  };
};
