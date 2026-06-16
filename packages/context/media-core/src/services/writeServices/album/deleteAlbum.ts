import { AppErrorCollection, fail, ok, Operation, WriteResult } from '@packages/contracts';
import { Knex } from 'knex';
import { loadRequiredAlbum } from '../../../application/support/resourceLoaders';
import { RunInTransaction } from '../../../infrastructure/repositories/runInTransaction';
import { AlbumRepository } from '../../../repositories/domainRepositories/albumRepository';
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
