import { AppErrorCollection, fail, ok, WriteResult } from '@packages/contracts';
import { dedupeIds } from '@packages/infrastructure';
import { Knex } from 'knex';
import { tryAppendOneMediaToAlbum } from '../../../application/support/appendOneMediaToAlbum';
import {
  loadRequiredAlbum,
  loadRequiredReadOnlyMediaItems,
} from '../../../application/support/resourceLoaders';
import { Album } from '../../../domain/Album/Album';
import { RunInTransaction } from '../../../infrastructure/repositories/runInTransaction';
import { AlbumRepository } from '../../../repositories/domainRepositories/albumRepository';
import { MediaItemReadRepository } from '../../../repositories/readRepositories/types';
import { EntityId } from '../../../types/types';
import { WriteServiceBase } from '../writeServiceBaseType';
import { AddMediaItemsToAlbumCommand, AddMediaItemsToAlbumResult } from './writeAlbum.types';

export interface AddMediaItemsToAlbum extends WriteServiceBase {
  (
    input: AddMediaItemsToAlbumCommand,
    trx?: Knex.Transaction,
  ): Promise<WriteResult<AddMediaItemsToAlbumResult>>;
}

type AddMediaItemsToAlbumDeps = {
  albumRepository: AlbumRepository;
  mediaItemReadRepository: MediaItemReadRepository;
  runInTransaction: RunInTransaction;
};

export const build__AddMediaItemsToAlbum = ({
  albumRepository,
  mediaItemReadRepository,
  runInTransaction,
}: AddMediaItemsToAlbumDeps): AddMediaItemsToAlbum => {
  return async (
    input: AddMediaItemsToAlbumCommand,
    trx?: Knex.Transaction,
  ): Promise<WriteResult<AddMediaItemsToAlbumResult>> => {
    const { viewerId, newAlbum } = input;
    const mediaItemIds = dedupeIds(input.mediaItemIds);

    if (mediaItemIds.length === 0) {
      return fail(AppErrorCollection.album.AddMediaToAlbumEmptyMediaList);
    }

    const hasExistingTarget = input.albumId != null;
    const hasNewAlbumTarget = newAlbum != null;
    if (hasExistingTarget === hasNewAlbumTarget) {
      return fail(AppErrorCollection.album.AddMediaToAlbumInvalidTarget);
    }

    let album: Album;

    if (hasExistingTarget) {
      const rAlbum = await loadRequiredAlbum(input.albumId as EntityId, albumRepository);
      if (!rAlbum.success) {
        return rAlbum;
      }
      album = rAlbum.value;
    } else {
      album = Album.create(
        {
          title: newAlbum!.title,
        },
        viewerId,
      );
    }

    const albumItemIds: EntityId[] = [];

    const rMedias = await loadRequiredReadOnlyMediaItems(
      mediaItemIds,
      viewerId,
      mediaItemReadRepository,
    );
    if (!rMedias.success) {
      return rMedias;
    }
    for (const rMedia of rMedias.value) {
      const append = tryAppendOneMediaToAlbum(album, rMedia, rMedia.id, viewerId);
      if (!append.success) {
        return append;
      }
      albumItemIds.push(append.value.id());
    }

    await runInTransaction(trx, async (db) => await albumRepository.save(album, db));

    return ok({
      albumId: album.id(),
      albumItemIds,
    });
  };
};
