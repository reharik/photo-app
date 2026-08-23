import { ok, Operation, OperationResult } from '@packages/contracts';
import { ensureMemberCanEditAlbum } from '../../../application/support/albumguard';
import { loadRequiredAlbum } from '../../../application/support/resourceLoaders';
import { AlbumRepository } from '../../../repositories/domainRepositories/albumRepository';
import { EntityId } from '../../../types';
import { WriteServiceBase } from '../writeServiceBaseType';
import { UnsetCoverMediaCommand, UnsetCoverMediaResult } from './writeAlbum.types';

export interface UnsetCoverMedia extends WriteServiceBase {
  (input: UnsetCoverMediaCommand): Promise<OperationResult<UnsetCoverMediaResult>>;
}

type UnsetCoverMediaDeps = {
  albumRepository: AlbumRepository;
  viewerId: EntityId;
};

export const build__UnsetCoverMedia = ({
  albumRepository,
  viewerId,
}: UnsetCoverMediaDeps): UnsetCoverMedia => {
  return async (input: UnsetCoverMediaCommand): Promise<OperationResult<UnsetCoverMediaResult>> => {
    const { albumId } = input;
    const r1 = await loadRequiredAlbum(albumId, albumRepository);
    if (!r1.success) {
      return r1;
    }
    const album = r1.value;
    const r2 = ensureMemberCanEditAlbum(album, Operation.editCover, viewerId);
    if (!r2.success) {
      return r2;
    }

    const r3 = album.unsetCoverMedia(viewerId);
    if (!r3.success) {
      return r3;
    }
    await albumRepository.save(album);

    return ok({
      albumId: album.id(),
    });
  };
};
