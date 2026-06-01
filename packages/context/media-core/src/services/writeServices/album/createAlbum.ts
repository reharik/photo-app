import { Knex } from 'knex';
import { RunInTransaction } from 'src/infrastructure/repositories/runInTransaction';
import { Album } from '../../../domain/Album/Album';
import { ok } from '../../../domain/utilities/writeResponse';
import { AlbumRepository } from '../../../repositories/domainRepositories/albumRepository';
import { WriteResult } from '../../../types/types';
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
