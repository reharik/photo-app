import { AppErrorCollection, Operation } from '@packages/contracts';
import { Knex } from 'knex';
import { loadRequiredAlbum } from '../../../application/support/resourceLoaders';
import { fail, ok } from '../../../domain/utilities/writeResponse';
import { RunInTransaction } from '../../../infrastructure/repositories/runInTransaction';
import { AlbumRepository } from '../../../repositories/domainRepositories/albumRepository';
import { WriteResult } from '../../../types/types';
import { WriteServiceBase } from '../writeServiceBaseType';
import { DeleteAlbumItemsCommand, DeleteAlbumItemsResult } from './writeAlbum.types';

export interface DeleteAlbumItems extends WriteServiceBase {
  (
    input: DeleteAlbumItemsCommand,
    trx?: Knex.Transaction,
  ): Promise<WriteResult<DeleteAlbumItemsResult>>;
}

type DeleteAlbumItemsDeps = {
  albumRepository: AlbumRepository;
  runInTransaction: RunInTransaction;
};

export const build__DeleteAlbumItems = ({
  albumRepository,
  runInTransaction,
}: DeleteAlbumItemsDeps): DeleteAlbumItems => {
  return async (
    input: DeleteAlbumItemsCommand,
    trx?: Knex.Transaction,
  ): Promise<WriteResult<DeleteAlbumItemsResult>> => {
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
    if (!member.role().can(Operation.removeItems)) {
      return fail(Operation.removeItems.deniedError);
    }

    const deleteResult = album.deleteItems(albumItemIds, viewerId);
    if (!deleteResult.success) {
      return deleteResult;
    }
    await runInTransaction(trx, async (db) => {
      await albumRepository.save(album, db);
    });
    return ok({ albumId: album.id(), albumItemIds });
  };
};
