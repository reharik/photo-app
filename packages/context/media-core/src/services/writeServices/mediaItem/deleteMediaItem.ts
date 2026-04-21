import { Knex } from 'knex';
import { ensureMediaItemOwnedByViewer } from '../../../application/support/mediaItemGuard';
import { loadRequiredMediaItem } from '../../../application/support/resourceLoaders';
import { ok } from '../../../domain/utilities/writeResponse';
import { AlbumRepository } from '../../../repositories/domainRepositories/albumRepository';
import { MediaItemRepository } from '../../../repositories/domainRepositories/mediaItemRepository';
import { AlbumReadRepository } from '../../../repositories/readRepositories/albumReadRepository';
import { WriteResult } from '../../../types/types';
import { DeleteMediaItemCommand, DeleteMediaItemResult } from '../mediaItem/writeMediaItem.types';
import { WriteServiceBase } from '../writeServiceBaseType';

export interface DeleteMediaItem extends WriteServiceBase {
  (input: DeleteMediaItemCommand): Promise<WriteResult<DeleteMediaItemResult>>;
}

type DeleteMediaItemDeps = {
  mediaItemRepository: MediaItemRepository;
  albumReadRepository: AlbumReadRepository;
  albumRepository: AlbumRepository;
  database: Knex;
};

export const buildDeleteMediaItem = ({
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
    const albumIds = await albumReadRepository.findAlbumIdsReferencingMediaItem({ mediaItemId });
    await database.transaction(async (trx) => {
      if (albumIds.length <= 0) {
        for (const albumId of albumIds) {
          const album = await albumRepository.getById(albumId);
          if (!album) {
            continue;
          }
          album.deleteItems([mediaItemId], viewerId);
          if (album.coverMediaId() === mediaItemId) {
            album.unsetCoverMedia(viewerId);
          }
          await albumRepository.save(album, { trx });
        }
      }

      await mediaItemRepository.delete(mediaItem, { trx });
    });
    return ok({ mediaItemId: mediaItem.id() });
  };
};
