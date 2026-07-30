import { AppErrorCollection, fail, ok, Operation, WriteResult } from '@packages/contracts';
import { loadRequiredAlbum } from '../../../application/support/resourceLoaders';
import { AlbumRepository } from '../../../repositories/domainRepositories/albumRepository';
import { AlbumItemReadRepository } from '../../../repositories/readRepositories/albumItemReadRepository';
import { WriteServiceBase } from '../writeServiceBaseType';
import { DeleteAlbumItemsCommand, DeleteAlbumItemsResult } from './writeAlbum.types';

export interface DeleteAlbumItems extends WriteServiceBase {
  (input: DeleteAlbumItemsCommand): Promise<WriteResult<DeleteAlbumItemsResult>>;
}

type DeleteAlbumItemsDeps = {
  albumRepository: AlbumRepository;
  albumItemReadRepository: AlbumItemReadRepository;
};

export const build__DeleteAlbumItems = ({
  albumRepository,
  albumItemReadRepository,
}: DeleteAlbumItemsDeps): DeleteAlbumItems => {
  return async (input: DeleteAlbumItemsCommand): Promise<WriteResult<DeleteAlbumItemsResult>> => {
    const { viewerId, albumId, albumItemIds } = input;
    if (albumItemIds.length === 0) {
      return fail(AppErrorCollection.album.DeleteAlbumItemsNoItemIds);
    }
    const getResult = await loadRequiredAlbum(albumId, albumRepository);
    if (!getResult.success) {
      return getResult;
    }
    const album = getResult.value;
    const member = album.getAlbumMember(viewerId);
    if (!member) {
      return fail(AppErrorCollection.album.UserIsNotMember);
    }

    if (!member.role().can(Operation.removeItems)) {
      const items = await albumItemReadRepository.getAlbumItemsByIds({ albumId, albumItemIds });
      const notOwned = items.some((i) => i.mediaItemOwnerId !== viewerId);
      if (notOwned) {
        return fail(AppErrorCollection.album.MemberNotAllowedToDeleteAlbum);
      }
    }

    const deleteResult = album.deleteItems(albumItemIds, viewerId);
    if (!deleteResult.success) {
      return deleteResult;
    }
    await albumRepository.save(album);
    return ok({ albumId: album.id(), albumItemIds });
  };
};
