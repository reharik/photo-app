import { Knex } from 'knex';
import { RunInTransaction } from 'src/infrastructure/repositories/runInTransaction';
import { tryAppendOneMediaToAlbum } from '../../../application/support/appendOneMediaToAlbum';
import {
  loadRequiredAlbum,
  loadRequiredReadOnlyMediaItem,
} from '../../../application/support/resourceLoaders';
import { ok } from '../../../domain/utilities/writeResponse';
import { AlbumRepository } from '../../../repositories/domainRepositories/albumRepository';
import { MediaItemReadRepository } from '../../../repositories/readRepositories/types';
import { WriteResult } from '../../../types/types';
import { WriteServiceBase } from '../writeServiceBaseType';
import { AddAlbumItemCommand, AddAlbumItemResult } from './writeAlbum.types';

export interface AddAlbumItem extends WriteServiceBase {
  (input: AddAlbumItemCommand, trx: Knex.Transaction): Promise<WriteResult<AddAlbumItemResult>>;
}

type AddAlbumItemDeps = {
  albumRepository: AlbumRepository;
  mediaItemReadRepository: MediaItemReadRepository;
  runInTransaction: RunInTransaction;
};

export const build__AddAlbumItem = ({
  albumRepository,
  mediaItemReadRepository,
  runInTransaction,
}: AddAlbumItemDeps): AddAlbumItem => {
  return async (
    input: AddAlbumItemCommand,
    trx: Knex.Transaction,
  ): Promise<WriteResult<AddAlbumItemResult>> => {
    const { viewerId, albumId, mediaItemId } = input;
    const r1 = await loadRequiredAlbum(albumId, albumRepository);
    if (!r1.success) {
      return r1;
    }
    const r2 = await loadRequiredReadOnlyMediaItem(mediaItemId, viewerId, mediaItemReadRepository);
    if (!r2.success) {
      return r2;
    }
    const album = r1.value;
    const mediaItem = r2.value;

    const r3 = tryAppendOneMediaToAlbum(album, mediaItem, mediaItemId, viewerId);
    if (!r3.success) {
      return r3;
    }
    const albumItem = r3.value;
    await runInTransaction(trx, async (db) => await albumRepository.save(album, db));

    return ok({
      albumId: album.id(),
      albumItemId: albumItem.id(),
    });
  };
};
