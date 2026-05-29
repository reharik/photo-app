import { AppErrorCollection } from '@packages/contracts';
import { CreateTransaction } from 'src/infrastructure/repositories/runInTransaction';
import { tryAppendOneMediaToAlbum } from '../../../application/support/appendOneMediaToAlbum';
import {
  loadRequiredAlbum,
  loadRequiredReadOnlyMediaItems,
} from '../../../application/support/resourceLoaders';
import { Album } from '../../../domain/Album/Album';
import { fail, ok } from '../../../domain/utilities/writeResponse';
import { AlbumRepository } from '../../../repositories/domainRepositories/albumRepository';
import { MediaItemReadRepository } from '../../../repositories/readRepositories/types';
import { EntityId, WriteResult } from '../../../types/types';
import { WriteServiceBase } from '../writeServiceBaseType';
import { AddMediaItemsToAlbumCommand, AddMediaItemsToAlbumResult } from './writeAlbum.types';

export interface AddMediaItemsToAlbum extends WriteServiceBase {
  (input: AddMediaItemsToAlbumCommand): Promise<WriteResult<AddMediaItemsToAlbumResult>>;
}

type AddMediaItemsToAlbumDeps = {
  albumRepository: AlbumRepository;
  mediaItemReadRepository: MediaItemReadRepository;
  createTransaction: CreateTransaction;
};

const dedupeMediaIdsPreserveOrder = (ids: EntityId[]): EntityId[] => {
  const seen = new Set<EntityId>();
  const out: EntityId[] = [];
  for (const id of ids) {
    if (seen.has(id)) {
      continue;
    }
    seen.add(id);
    out.push(id);
  }
  return out;
};

export const build__AddMediaItemsToAlbum = ({
  albumRepository,
  mediaItemReadRepository,
  createTransaction,
}: AddMediaItemsToAlbumDeps): AddMediaItemsToAlbum => {
  return async (
    input: AddMediaItemsToAlbumCommand,
  ): Promise<WriteResult<AddMediaItemsToAlbumResult>> => {
    const { viewerId, newAlbum } = input;
    const mediaItemIds = dedupeMediaIdsPreserveOrder(input.mediaItemIds);

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

    await createTransaction(async (trx) => await albumRepository.save(album, trx));

    return ok({
      albumId: album.id(),
      albumItemIds,
    });
  };
};
