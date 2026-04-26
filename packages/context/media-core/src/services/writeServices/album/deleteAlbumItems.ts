import { AlbumOperation, AppErrorCollection } from '@packages/contracts';
import { loadRequiredAlbum } from '../../../application/support/resourceLoaders';
import { fail, ok } from '../../../domain/utilities/writeResponse';
import { AlbumRepository } from '../../../repositories/domainRepositories/albumRepository';
import { WriteResult } from '../../../types/types';
import { WriteServiceBase } from '../writeServiceBaseType';
import { DeleteAlbumItemsCommand, DeleteAlbumItemsResult } from './writeAlbum.types';

export interface DeleteAlbumItems extends WriteServiceBase {
  (input: DeleteAlbumItemsCommand): Promise<WriteResult<DeleteAlbumItemsResult>>;
}

type DeleteAlbumItemsDeps = {
  albumRepository: AlbumRepository;
};

export const buildDeleteAlbumItems = ({
  albumRepository,
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
    if (!member.role().can(AlbumOperation.removeItems)) {
      return fail(AlbumOperation.removeItems.deniedError);
    }

    const deleteResult = album.deleteItems(albumItemIds, viewerId);
    if (!deleteResult.success) {
      return deleteResult;
    }
    await albumRepository.save(album);
    return ok({ albumId: album.id(), albumItemIds });
  };
};
