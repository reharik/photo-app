import { AppErrorCollection, fail, ok, OperationResult } from '@packages/contracts';
import { dedupeIds } from '@packages/infrastructure';
import {
  ensureMediaItemInReadyState,
  ensureMediaItemOwnedByViewer,
} from '../../../application/support/mediaItemGuard';
import { loadRequiredMediaItem } from '../../../application/support/resourceLoaders';
import { Album } from '../../../domain/Album/Album';
import { WriteServices } from '../../../generated/ioc-registry.types';
import { AlbumRepository } from '../../../repositories/domainRepositories/albumRepository';
import { MediaItemRepository } from '../../../repositories/domainRepositories/mediaItemRepository';
import { EntityId } from '../../../types/types';
import { WriteServiceBase } from '../writeServiceBaseType';
import { CreatePublicLinkResponse } from './createPublicLinkForAlbum';

export type CreatePublicLinkForMediaItemsCommand = {
  viewerFirstName: string;
  viewerLastName: string;
  mediaItemIds: EntityId[];
  name?: string;
  expiresAt?: Date;
};

export interface CreatePublicLinkForMediaItems extends WriteServiceBase {
  (input: CreatePublicLinkForMediaItemsCommand): Promise<OperationResult<CreatePublicLinkResponse>>;
}

type CreatePublicLinkForMediaItemsDeps = {
  mediaItemRepository: MediaItemRepository;
  albumRepository: AlbumRepository;
  writeServices: WriteServices;
  viewerId: EntityId;
};

export const build__CreatePublicLinkForMediaItems = ({
  mediaItemRepository,
  albumRepository,
  writeServices,
  viewerId,
}: CreatePublicLinkForMediaItemsDeps): CreatePublicLinkForMediaItems => {
  return async (
    input: CreatePublicLinkForMediaItemsCommand,
  ): Promise<OperationResult<CreatePublicLinkResponse>> => {
    const mediaItemIds = dedupeIds(input.mediaItemIds);
    if (mediaItemIds.length === 0) {
      return fail(AppErrorCollection.mediaItem.DeleteMediaItemsEmptyList);
    }

    const album = Album.create(
      {
        title: input.name ?? `Photos from ${input.viewerFirstName}`,
        isShadowAlbum: true,
      },
      viewerId,
    );

    for (const mediaItemId of mediaItemIds) {
      const loadedMediaItem = await loadRequiredMediaItem(mediaItemId, mediaItemRepository);
      if (!loadedMediaItem.success) {
        return loadedMediaItem;
      }

      const ownershipResult = ensureMediaItemOwnedByViewer(
        loadedMediaItem.value.ownerId(),
        viewerId,
      );
      if (!ownershipResult.success) {
        return ownershipResult;
      }
      const isReady = ensureMediaItemInReadyState(loadedMediaItem.value);
      if (!isReady.success) {
        return isReady;
      }
      album.addItem(mediaItemId, viewerId, loadedMediaItem.value.kind());
    }

    await albumRepository.save(album);
    const publicLinkResult = await writeServices.createPublicLinkForAlbum({
      albumId: album.id(),
      name: input.name,
      expiresAt: input.expiresAt,
    });
    if (!publicLinkResult.success) {
      return publicLinkResult;
    }
    return ok({ token: publicLinkResult.value.token });
  };
};
