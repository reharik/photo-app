import { Knex } from 'knex';
import { ensureMediaItemOwnedByViewer } from '../../../application/support/mediaItemGuard';
import { loadRequiredMediaItem } from '../../../application/support/resourceLoaders';
import { ok } from '../../../domain/utilities/writeResponse';
import { AlbumRepository } from '../../../repositories/domainRepositories/albumRepository';
import { MediaItemRepository } from '../../../repositories/domainRepositories/mediaItemRepository';
import { AlbumReadRepository } from '../../../repositories/readRepositories/albumReadRepository';
import { WriteResult } from '../../../types/types';
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
  database: Knex;
};

export const build__DeleteMediaItem = ({
  mediaItemRepository,
  albumRepository,
  albumReadRepository,
  database,
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
      database,
    });
    return ok({ mediaItemId: mediaItem.id() });
  };
};
