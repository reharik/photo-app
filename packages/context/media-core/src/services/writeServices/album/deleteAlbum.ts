import { AppErrorCollection, ViewerOperation } from '@packages/contracts';
import { loadRequiredAlbum } from '../../../application/support/resourceLoaders';
import { fail, ok } from '../../../domain/utilities/writeResponse';
import { AlbumRepository } from '../../../repositories/domainRepositories/albumRepository';
import { WriteResult } from '../../../types/types';
import { WriteServiceBase } from '../writeServiceBaseType';
import { DeleteAlbumCommand, DeleteAlbumResult } from './writeAlbum.types';

export interface DeleteAlbum extends WriteServiceBase {
  (input: DeleteAlbumCommand): Promise<WriteResult<DeleteAlbumResult>>;
}

type DeleteAlbumDeps = {
  albumRepository: AlbumRepository;
};

export const build__DeleteAlbum = ({ albumRepository }: DeleteAlbumDeps): DeleteAlbum => {
  return async (input: DeleteAlbumCommand): Promise<WriteResult<DeleteAlbumResult>> => {
    const { viewerId, albumId } = input;
    const getResult = await loadRequiredAlbum(albumId, albumRepository);
    if (!getResult.success) {
      return getResult;
    }
    const album = getResult.value;
    const member = album.getAlbumMember(viewerId);
    if (!member) {
      return fail(AppErrorCollection.album.UserIsNotMember);
    }
    if (!member.role().can(ViewerOperation.deleteAlbum)) {
      return fail(ViewerOperation.deleteAlbum.deniedError);
    }

    await albumRepository.delete(album);
    return ok({ albumId: album.id() });
  };
};
