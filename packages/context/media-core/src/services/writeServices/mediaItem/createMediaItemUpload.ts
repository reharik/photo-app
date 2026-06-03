import { AppErrorCollection, MediaAssetKind } from '@packages/contracts';
import { Knex } from 'knex';
import { RunInTransaction } from 'src/infrastructure/repositories/runInTransaction';
import { AlbumRepository } from 'src/repositories/domainRepositories/albumRepository';
import {
  buildMediaAssetStorageKey,
  buildMediaItemBaseStorageKey,
  MediaStorage,
} from '../../../application/media/MediaStorage';
import { MediaItem } from '../../../domain/MediaItem/MediaItem';
import { fail, ok } from '../../../domain/utilities/writeResponse';
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
  albumRepository: AlbumRepository;
  mediaStorage: MediaStorage;
  runInTransaction: RunInTransaction;
};

export const build__CreateMediaItemUpload = ({
  mediaItemRepository,
  albumRepository,
  mediaStorage,
  runInTransaction,
}: CreateMediaItemUploadDeps): CreateMediaUpload => {
  return async (
    input: CreateMediaUploadCommand,
    trx?: Knex.Transaction,
  ): Promise<WriteResult<CreateMediaUploadResult>> => {
    const { viewerId, kind, mimeType, originalFileName, albumId } = input;
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
      storageKey: buildMediaAssetStorageKey(
        buildMediaItemBaseStorageKey(mediaItem.ownerId(), mediaItem.id()),
        MediaAssetKind.original,
      ),
      mimeType,
    });

    await runInTransaction(trx, async (db) => {
      await mediaItemRepository.save(mediaItem, db);
      if (albumId) {
        const album = await albumRepository.getById(albumId, db);
        if (!album) {
          return fail(AppErrorCollection.album.AlbumNotFound);
        }
        album.addItem(mediaItem.id(), viewerId);
        await albumRepository.save(album, db);
      }
    });

    return ok({
      mediaItemId: mediaItem.id(),
      status: mediaItem.status(),
      uploadTarget,
      albumId,
    });
  };
};
