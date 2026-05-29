import { Operation } from '@packages/contracts';
import { CreateTransaction } from 'src/infrastructure/repositories/runInTransaction';
import { ensureMemberCanEditAlbum } from '../../../application/support/albumguard';
import { loadRequiredAlbum } from '../../../application/support/resourceLoaders';
import { ok } from '../../../domain/utilities/writeResponse';
import { AlbumRepository } from '../../../repositories/domainRepositories/albumRepository';
import { WriteResult } from '../../../types/types';
import { WriteServiceBase } from '../writeServiceBaseType';
import { SetCoverMediaCommand, SetCoverMediaResult } from './writeAlbum.types';

export interface SetCoverMedia extends WriteServiceBase {
  (input: SetCoverMediaCommand): Promise<WriteResult<SetCoverMediaResult>>;
}

type SetCoverMediaDeps = {
  albumRepository: AlbumRepository;
  createTransaction: CreateTransaction;
};

export const build__SetCoverMedia = ({
  albumRepository,
  createTransaction,
}: SetCoverMediaDeps): SetCoverMedia => {
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
    await createTransaction(async (trx) => await albumRepository.save(album, trx));

    return ok({
      albumId: album.id(),
    });
  };
};
