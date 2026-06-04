import { AppErrorCollection } from '@packages/contracts';
import { Knex } from 'knex';
import { ensureMediaItemOwnedByViewer } from '../../../application/support/mediaItemGuard';
import { loadRequiredMediaItem } from '../../../application/support/resourceLoaders';
import { Album } from '../../../domain/Album/Album';
import { fail, ok } from '../../../domain/utilities/writeResponse';
import { RunInTransaction } from '../../../infrastructure/repositories/runInTransaction';
import { AlbumRepository } from '../../../repositories/domainRepositories/albumRepository';
import { MediaItemRepository } from '../../../repositories/domainRepositories/mediaItemRepository';
import { EntityId, WriteResult } from '../../../types/types';
import { WriteServiceBase } from '../writeServiceBaseType';
import { CreatePublicLinkForAlbum, CreatePublicLinkResponse } from './createPublicLinkForAlbum';

export type CreatePublicLinkForMediaItemsCommand = {
  viewerId: EntityId;
  mediaItemIds: EntityId[];
  name?: string;
  expiresAt?: Date;
};

export interface CreatePublicLinkForMediaItems extends WriteServiceBase {
  (
    input: CreatePublicLinkForMediaItemsCommand,
    trx?: Knex.Transaction,
  ): Promise<WriteResult<CreatePublicLinkResponse>>;
}

type CreatePublicLinkForMediaItemsDeps = {
  mediaItemRepository: MediaItemRepository;
  albumRepository: AlbumRepository;
  createPublicLinkForAlbum: CreatePublicLinkForAlbum;
  runInTransaction: RunInTransaction;
};

const dedupePreserveOrder = (ids: EntityId[]): EntityId[] => {
  const seen = new Set<EntityId>();
  const deduped: EntityId[] = [];
  for (const id of ids) {
    if (seen.has(id)) {
      continue;
    }
    seen.add(id);
    deduped.push(id);
  }
  return deduped;
};

export const build__CreatePublicLinkForMediaItems = ({
  mediaItemRepository,
  albumRepository,
  createPublicLinkForAlbum,
  runInTransaction,
}: CreatePublicLinkForMediaItemsDeps): CreatePublicLinkForMediaItems => {
  return async (
    input: CreatePublicLinkForMediaItemsCommand,
    trx?: Knex.Transaction,
  ): Promise<WriteResult<CreatePublicLinkResponse>> => {
    const mediaItemIds = dedupePreserveOrder(input.mediaItemIds);
    if (mediaItemIds.length === 0) {
      return fail(AppErrorCollection.mediaItem.DeleteMediaItemsEmptyList);
    }

    for (const mediaItemId of mediaItemIds) {
      const loadedMediaItem = await loadRequiredMediaItem(mediaItemId, mediaItemRepository);
      if (!loadedMediaItem.success) {
        return loadedMediaItem;
      }

      const ownershipResult = ensureMediaItemOwnedByViewer(
        loadedMediaItem.value.ownerId(),
        input.viewerId,
      );
      if (!ownershipResult.success) {
        return ownershipResult;
      }
    }
    const album = Album.create(
      {
        title: input.name ?? 'Public Link Album',
        isPublicLinkAlbum: true,
      },
      input.viewerId,
    );
    mediaItemIds.forEach((x) => {
      album.addItem(x, input.viewerId);
    });
    await runInTransaction(trx, async (db) => await albumRepository.save(album, db));
    const publicLinkResult = await createPublicLinkForAlbum(
      {
        viewerId: input.viewerId,
        albumId: album.id(),
        name: input.name,
        expiresAt: input.expiresAt,
      },
      trx,
    );
    if (!publicLinkResult.success) {
      return publicLinkResult;
    }
    return ok({ token: publicLinkResult.value.token });
  };
};
