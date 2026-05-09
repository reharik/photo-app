import { ViewerOperation } from '@packages/contracts';
import { ensureMemberCanEditAlbum } from '../../../application/support/albumguard';
import { loadRequiredAlbum } from '../../../application/support/resourceLoaders';
import { ok } from '../../../domain/utilities/writeResponse';
import { AlbumRepository } from '../../../repositories/domainRepositories/albumRepository';
import { MediaItemReadRepository } from '../../../repositories/readRepositories/mediaItemReadRepository';
import { WriteResult } from '../../../types/types';
import { WriteServiceBase } from '../writeServiceBaseType';
import { SetCoverMediaCommand, SetCoverMediaResult } from './writeAlbum.types';

export interface SetCoverMedia extends WriteServiceBase {
  (input: SetCoverMediaCommand): Promise<WriteResult<SetCoverMediaResult>>;
}

type SetCoverMediaDeps = {
  albumRepository: AlbumRepository;
  mediaItemReadRepository: MediaItemReadRepository;
};

export const build__SetCoverMedia = ({ albumRepository }: SetCoverMediaDeps): SetCoverMedia => {
  return async (input: SetCoverMediaCommand): Promise<WriteResult<SetCoverMediaResult>> => {
    const { viewerId, albumId, albumItemId } = input;
    const r1 = await loadRequiredAlbum(albumId, albumRepository);
    if (!r1.success) {
      return r1;
    }
    const album = r1.value;

    const r2 = ensureMemberCanEditAlbum(album, ViewerOperation.editCover, viewerId);
    if (!r2.success) {
      return r2;
    }

    const r3 = album.setCoverMedia(albumItemId, viewerId);
    if (!r3.success) {
      return r3;
    }
    await albumRepository.save(album, viewerId);

    return ok({
      albumId: album.id(),
    });
  };
};
