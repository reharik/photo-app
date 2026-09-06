import { AppErrorCollection, fail, ok, Operation, OperationResult } from '@packages/contracts';
import { loadRequiredAlbum } from '../../../application/support/resourceLoaders';
import { AlbumRepository } from '../../../repositories/domainRepositories/albumRepository';
import { EntityId } from '../../../types';
import { WriteServiceBase } from '../writeServiceBaseType';
import { DeleteAlbumCommand, DeleteAlbumResult } from './writeAlbum.types';

export interface DeleteAlbum extends WriteServiceBase {
  (input: DeleteAlbumCommand): Promise<OperationResult<DeleteAlbumResult>>;
}

type DeleteAlbumDeps = {
  albumRepository: AlbumRepository;
  viewerId: EntityId;
};

export const build__DeleteAlbum = ({ viewerId, albumRepository }: DeleteAlbumDeps): DeleteAlbum => {
  return async (input: DeleteAlbumCommand): Promise<OperationResult<DeleteAlbumResult>> => {
    const { albumId } = input;
    const getResult = await loadRequiredAlbum(albumId, albumRepository);
    if (!getResult.success) {
      return getResult;
    }
    const album = getResult.value;
    const member = album.getAlbumMemberByUserId(viewerId);
    if (!member) {
      return fail(AppErrorCollection.album.UserIsNotMember);
    }
    if (!member.role().can(Operation.deleteAlbum)) {
      return fail(Operation.deleteAlbum.deniedError);
    }

    await albumRepository.delete(album);
    return ok({ albumId: album.id() });
  };
};
