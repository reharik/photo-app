import { AppErrorCollection, fail, ok, WriteResult } from '@packages/contracts';
import { dedupeIds } from '@packages/infrastructure';
import { Knex } from 'knex';
import { ensureMediaItemOwnedByViewer } from '../../../application/support/mediaItemGuard';
import { loadRequiredMediaItem } from '../../../application/support/resourceLoaders';
import { Album } from '../../../domain/Album/Album';
import { RunInTransaction } from '../../../infrastructure/repositories/runInTransaction';
import { AlbumRepository } from '../../../repositories/domainRepositories/albumRepository';
import { MediaItemRepository } from '../../../repositories/domainRepositories/mediaItemRepository';
import { EntityId } from '../../../types/types';
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
    const mediaItemIds = dedupeIds(input.mediaItemIds);
    if (mediaItemIds.length === 0) {
      return fail(AppErrorCollection.mediaItem.DeleteMediaItemsEmptyList);
    }

    const album = Album.create(
      {
        title: input.name ?? 'Public Link Album',
        isPublicLinkAlbum: true,
      },
      input.viewerId,
    );

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
      album.addItem(mediaItemId, input.viewerId, loadedMediaItem.value.kind());
    }

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
