import type { MediaItem } from '../../../domain/MediaItem/MediaItem';
import type { AlbumRepository } from '../../../repositories/domainRepositories/albumRepository';
import type { MediaItemRepository } from '../../../repositories/domainRepositories/mediaItemRepository';
import type { AlbumReadRepository } from '../../../repositories/readRepositories/types';
import type { EntityId } from '../../../types/types';

export type DeleteMediaLibraryInTransactionDeps = {
  albumReadRepository: AlbumReadRepository;
  albumRepository: AlbumRepository;
  mediaItemRepository: MediaItemRepository;
};

/**
 * Removes the given aggregates from every album that references them, then deletes the `media_item` rows.
 * Runs in a single DB transaction. Caller must have already verified existence and viewer ownership.
 */

/**
 * This is a strange one it's kind of a repository but it calls several other repositories
 * and acts across several domains.
 */
export const deleteViewerOwnedMediaItemsFromLibraryInTransaction = async ({
  viewerId,
  mediaItems,
  albumReadRepository,
  albumRepository,
  mediaItemRepository,
}: DeleteMediaLibraryInTransactionDeps & {
  viewerId: EntityId;
  mediaItems: MediaItem[];
}): Promise<void> => {
  const mediaItemIds = mediaItems.map((m) => m.id());

  const albumIds = new Set<EntityId>();
  for (const mediaItemId of mediaItemIds) {
    const refs = await albumReadRepository.findAlbumIdsReferencingMediaItem({ mediaItemId });
    for (const albumId of refs) {
      albumIds.add(albumId.id);
    }
  }

  for (const albumId of albumIds) {
    const album = await albumRepository.getById(albumId);
    if (!album) {
      continue;
    }

    for (const mediaItemId of mediaItemIds) {
      album.removeMediaItemFromAlbum(mediaItemId, viewerId);
    }
    await albumRepository.save(album);
  }

  for (const item of mediaItems) {
    await mediaItemRepository.delete(item);
  }
};
