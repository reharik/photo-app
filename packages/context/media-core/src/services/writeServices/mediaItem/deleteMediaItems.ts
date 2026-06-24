import { AppErrorCollection, fail, ok, WriteResult } from '@packages/contracts';
import { dedupeIds } from '@packages/infrastructure';
import { deleteStoredAssetsForMediaItems } from '../../../application/media/deleteStoredAssetsForMediaItems';
import type { MediaStorage } from '../../../application/media/MediaStorage';
import { MediaItem } from '../../../domain/MediaItem/MediaItem';
import { AlbumRepository } from '../../../repositories/domainRepositories/albumRepository';
import { MediaItemRepository } from '../../../repositories/domainRepositories/mediaItemRepository';
import {
  AlbumReadRepository,
  MediaItemReadRepository,
} from '../../../repositories/readRepositories/types';
import { WriteServiceBase } from '../writeServiceBaseType';
import { deleteViewerOwnedMediaItemsFromLibraryInTransaction } from './deleteMediaLibraryInTransaction';
import { DeleteMediaItemsCommand, DeleteMediaItemsResult } from './writeMediaItem.types';

export interface DeleteMediaItems extends WriteServiceBase {
  (input: DeleteMediaItemsCommand): Promise<WriteResult<DeleteMediaItemsResult>>;
}

type DeleteMediaItemsDeps = {
  mediaItemRepository: MediaItemRepository;
  mediaItemReadRepository: MediaItemReadRepository;
  albumReadRepository: AlbumReadRepository;
  albumRepository: AlbumRepository;
  mediaStorage: MediaStorage;
};

export const build__DeleteMediaItems = ({
  mediaItemRepository,
  mediaItemReadRepository,
  albumReadRepository,
  albumRepository,
  mediaStorage,
}: DeleteMediaItemsDeps): DeleteMediaItems => {
  return async (input: DeleteMediaItemsCommand): Promise<WriteResult<DeleteMediaItemsResult>> => {
    const { viewerId } = input;
    const dedupedIds = dedupeIds(input.mediaItemIds);

    if (dedupedIds.length === 0) {
      return fail(AppErrorCollection.mediaItem.DeleteMediaItemsEmptyList);
    }

    const rows = await mediaItemReadRepository.getManyForViewer({
      mediaItemIds: dedupedIds,
      viewerId,
    });
    // All-or-nothing: `getManyForViewer` only returns rows owned by the viewer. Any missing or
    // not-owned id is absent here — do not open a transaction or delete anything until every id matches.
    const foundIdSet = new Set(rows.map((r) => r.id));
    const allRequestedIdsAccountedFor =
      foundIdSet.size === dedupedIds.length && dedupedIds.every((id) => foundIdSet.has(id));
    if (!allRequestedIdsAccountedFor) {
      return fail(AppErrorCollection.mediaItem.MediaItemNotFound);
    }

    const mediaItems: MediaItem[] = [];
    for (const id of dedupedIds) {
      const item = await mediaItemRepository.getById(id);
      if (!item) {
        return fail(AppErrorCollection.mediaItem.MediaItemNotFound);
      }
      mediaItems.push(item);
    }

    await deleteViewerOwnedMediaItemsFromLibraryInTransaction({
      viewerId,
      mediaItems,
      albumReadRepository,
      albumRepository,
      mediaItemRepository,
    });

    await deleteStoredAssetsForMediaItems(mediaStorage, mediaItems);

    return ok({ deletedMediaItemIds: dedupedIds });
  };
};
