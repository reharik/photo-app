import { ok, WriteResult } from '@packages/contracts';
import { deleteStoredAssetsForMediaItems } from '../../../application/media/deleteStoredAssetsForMediaItems';
import type { MediaStorage } from '../../../application/media/MediaStorage';
import { ensureMediaItemOwnedByViewer } from '../../../application/support/mediaItemGuard';
import { loadRequiredMediaItem } from '../../../application/support/resourceLoaders';
import { AlbumRepository } from '../../../repositories/domainRepositories/albumRepository';
import { MediaItemRepository } from '../../../repositories/domainRepositories/mediaItemRepository';
import { AlbumReadRepository } from '../../../repositories/readRepositories/types';
import { WriteServiceBase } from '../writeServiceBaseType';
import { deleteViewerOwnedMediaItemsFromLibraryInTransaction } from './deleteMediaLibraryInTransaction';
import { DeleteMediaItemCommand, DeleteMediaItemResult } from './writeMediaItem.types';

export interface DeleteMediaItem extends WriteServiceBase {
  (input: DeleteMediaItemCommand): Promise<WriteResult<DeleteMediaItemResult>>;
}

type DeleteMediaItemDeps = {
  mediaItemRepository: MediaItemRepository;
  albumReadRepository: AlbumReadRepository;
  albumRepository: AlbumRepository;
  mediaStorage: MediaStorage;
};

export const build__DeleteMediaItem = ({
  mediaItemRepository,
  albumRepository,
  albumReadRepository,
  mediaStorage,
}: DeleteMediaItemDeps): DeleteMediaItem => {
  return async (input: DeleteMediaItemCommand): Promise<WriteResult<DeleteMediaItemResult>> => {
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
    await deleteViewerOwnedMediaItemsFromLibraryInTransaction({
      viewerId,
      mediaItems: [mediaItem],
      albumReadRepository,
      albumRepository,
      mediaItemRepository,
    });

    await deleteStoredAssetsForMediaItems(mediaStorage, [mediaItem]);

    return ok({ mediaItemId: mediaItem.id() });
  };
};
