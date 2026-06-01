import { Knex } from 'knex';
import { RunInTransaction } from 'src/infrastructure/repositories/runInTransaction';
import { deleteStoredAssetsForMediaItems } from '../../../application/media/deleteStoredAssetsForMediaItems';
import type { MediaStorage } from '../../../application/media/MediaStorage';
import { ensureMediaItemOwnedByViewer } from '../../../application/support/mediaItemGuard';
import { loadRequiredMediaItem } from '../../../application/support/resourceLoaders';
import { ok } from '../../../domain/utilities/writeResponse';
import { AlbumRepository } from '../../../repositories/domainRepositories/albumRepository';
import { MediaItemRepository } from '../../../repositories/domainRepositories/mediaItemRepository';
import { AlbumReadRepository } from '../../../repositories/readRepositories/types';
import { WriteResult } from '../../../types/types';
import { WriteServiceBase } from '../writeServiceBaseType';
import { deleteViewerOwnedMediaItemsFromLibraryInTransaction } from './deleteMediaLibraryInTransaction';
import { DeleteMediaItemCommand, DeleteMediaItemResult } from './writeMediaItem.types';

export interface DeleteMediaItem extends WriteServiceBase {
  (
    input: DeleteMediaItemCommand,
    trx?: Knex.Transaction,
  ): Promise<WriteResult<DeleteMediaItemResult>>;
}

type DeleteMediaItemDeps = {
  mediaItemRepository: MediaItemRepository;
  albumReadRepository: AlbumReadRepository;
  albumRepository: AlbumRepository;
  runInTransaction: RunInTransaction;
  mediaStorage: MediaStorage;
};

export const build__DeleteMediaItem = ({
  mediaItemRepository,
  albumRepository,
  albumReadRepository,
  runInTransaction,
  mediaStorage,
}: DeleteMediaItemDeps): DeleteMediaItem => {
  return async (
    input: DeleteMediaItemCommand,
    trx?: Knex.Transaction,
  ): Promise<WriteResult<DeleteMediaItemResult>> => {
    const { viewerId, mediaItemId } = input;
    const getResult = await loadRequiredMediaItem(mediaItemId, mediaItemRepository);
    if (!getResult.success) {
      return getResult;
    }
    const mediaItem = getResult.value;
    const ensureResult = ensureMediaItemOwnedByViewer(mediaItem.ownerId(), viewerId);
    if (!ensureResult.success) {
      return ensureResult;
    }
    await runInTransaction(
      trx,
      async (db) =>
        await deleteViewerOwnedMediaItemsFromLibraryInTransaction({
          viewerId,
          mediaItems: [mediaItem],
          albumReadRepository,
          albumRepository,
          mediaItemRepository,
          trx: db,
        }),
    );

    await deleteStoredAssetsForMediaItems(mediaStorage, [mediaItem]);

    return ok({ mediaItemId: mediaItem.id() });
  };
};
