import { ok, WriteResult } from '@packages/contracts';
import { Knex } from 'knex';
import { Album } from '../../../domain/Album/Album';
import { RunInTransaction } from '../../../infrastructure/repositories/runInTransaction';
import { AlbumRepository } from '../../../repositories/domainRepositories/albumRepository';
import { WriteServiceBase } from '../writeServiceBaseType';
import { CreateAlbumCommand, CreateAlbumResult } from './writeAlbum.types';
export interface CreateAlbum extends WriteServiceBase {
  (input: CreateAlbumCommand, trx?: Knex.Transaction): Promise<WriteResult<CreateAlbumResult>>;
}

type CreateAlbumDeps = {
  albumRepository: AlbumRepository;
  runInTransaction: RunInTransaction;
};

export const build__CreateAlbum = ({
  albumRepository,
  runInTransaction,
}: CreateAlbumDeps): CreateAlbum => {
  return async (
    input: CreateAlbumCommand,
    trx?: Knex.Transaction,
  ): Promise<WriteResult<CreateAlbumResult>> => {
    const { viewerId, title } = input;
    const album = Album.create(
      {
        title,
      },
      viewerId,
    );

    await runInTransaction(trx, async (db) => await albumRepository.save(album, db));

    return ok({
      albumId: album.id(),
    });
  };
};
