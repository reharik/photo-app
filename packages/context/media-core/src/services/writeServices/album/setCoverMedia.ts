import { ok, Operation, WriteResult } from '@packages/contracts';
import { ensureMemberCanEditAlbum } from '../../../application/support/albumguard';
import { loadRequiredAlbum } from '../../../application/support/resourceLoaders';
import { AlbumRepository } from '../../../repositories/domainRepositories/albumRepository';
import { WriteServiceBase } from '../writeServiceBaseType';
import { SetCoverMediaCommand, SetCoverMediaResult } from './writeAlbum.types';

export interface SetCoverMedia extends WriteServiceBase {
  (input: SetCoverMediaCommand): Promise<WriteResult<SetCoverMediaResult>>;
}

type SetCoverMediaDeps = {
  albumRepository: AlbumRepository;
};

export const build__SetCoverMedia = ({ albumRepository }: SetCoverMediaDeps): SetCoverMedia => {
  return async (input: SetCoverMediaCommand): Promise<WriteResult<SetCoverMediaResult>> => {
    const { viewerId, albumId, albumItemId } = input;
    const r1 = await loadRequiredAlbum(albumId, albumRepository);
    if (!r1.success) {
      return r1;
    }
    const album = r1.value;

    const r2 = ensureMemberCanEditAlbum(album, Operation.editCover, viewerId);
    if (!r2.success) {
      return r2;
    }

    const r3 = album.setCoverMedia(albumItemId, viewerId);
    if (!r3.success) {
      return r3;
    }
    await albumRepository.save(album);

    return ok({
      albumId: album.id(),
    });
  };
};
