import { Operation } from '@packages/contracts';
import { Knex } from 'knex';
import { ensureMemberCanEditAlbum } from '../../../application/support/albumguard';
import { loadRequiredAlbum } from '../../../application/support/resourceLoaders';
import { ok } from '../../../domain/utilities/writeResponse';
import { RunInTransaction } from '../../../infrastructure/repositories/runInTransaction';
import { AlbumRepository } from '../../../repositories/domainRepositories/albumRepository';
import { WriteResult } from '../../../types/types';
import { WriteServiceBase } from '../writeServiceBaseType';
import { UnsetCoverMediaCommand, UnsetCoverMediaResult } from './writeAlbum.types';

export interface UnsetCoverMedia extends WriteServiceBase {
  (input: UnsetCoverMediaCommand): Promise<WriteResult<UnsetCoverMediaResult>>;
}

type UnsetCoverMediaDeps = {
  albumRepository: AlbumRepository;
  runInTransaction: RunInTransaction;
};

export const build__UnsetCoverMedia = ({
  albumRepository,
  runInTransaction,
}: UnsetCoverMediaDeps): UnsetCoverMedia => {
  return async (
    input: UnsetCoverMediaCommand,
    trx?: Knex.Transaction,
  ): Promise<WriteResult<UnsetCoverMediaResult>> => {
    const { viewerId, albumId } = input;
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
    await runInTransaction(trx, async (db) => await albumRepository.save(album, db));

    return ok({
      albumId: album.id(),
    });
  };
};
