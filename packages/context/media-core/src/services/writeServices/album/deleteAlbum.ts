import { AppErrorCollection, Operation } from '@packages/contracts';
import { Knex } from 'knex';
import { RunInTransaction } from 'src/infrastructure/repositories/runInTransaction';
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
  runInTransaction: RunInTransaction;
};

export const build__DeleteAlbum = ({
  albumRepository,
  runInTransaction,
}: DeleteAlbumDeps): DeleteAlbum => {
  return async (
    input: DeleteAlbumCommand,
    trx?: Knex.Transaction,
  ): Promise<WriteResult<DeleteAlbumResult>> => {
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
    if (!member.role().can(Operation.deleteAlbum)) {
      return fail(Operation.deleteAlbum.deniedError);
    }

    await runInTransaction(trx, async (db) => await albumRepository.delete(album, db));
    return ok({ albumId: album.id() });
  };
};
