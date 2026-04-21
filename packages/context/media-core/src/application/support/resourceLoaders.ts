import { AppErrorCollection, ContractError } from '@packages/contracts';
import {
  Album,
  AlbumRepository,
  EntityId,
  MediaItem,
  MediaItemReadRepository,
  MediaItemRepository,
  MediaItemRow,
  WriteResult,
} from '../..';
import { fail, ok } from '../../domain/utilities/writeResponse';

export const loadRequiredAlbum = async (
  albumId: EntityId,
  albumRepository: AlbumRepository,
): Promise<WriteResult<Album, ContractError>> => {
  const album = await albumRepository.getById(albumId);
  return album ? ok(album) : fail(AppErrorCollection.album.AlbumNotFound);
};

export const loadRequiredReadOnlyMediaItem = async (
  mediaItemId: EntityId,
  viewerId: EntityId,
  mediaItemReadRepository: MediaItemReadRepository,
): Promise<WriteResult<MediaItemRow, ContractError>> => {
  const mediaItem = await mediaItemReadRepository.getForViewer({ mediaItemId, viewerId });
  return mediaItem ? ok(mediaItem) : fail(AppErrorCollection.mediaItem.MediaItemNotFound);
};
export const loadRequiredReadOnlyMediaItems = async (
  mediaItemIds: EntityId[],
  viewerId: EntityId,
  mediaItemReadRepository: MediaItemReadRepository,
): Promise<WriteResult<MediaItemRow[], ContractError>> => {
  const mediaItems = await mediaItemReadRepository.getManyForViewer({ mediaItemIds, viewerId });
  return mediaItems.length > 0
    ? ok(mediaItems)
    : fail(AppErrorCollection.mediaItem.MediaItemsNotFound);
};

export const loadRequiredMediaItem = async (
  mediaItemId: EntityId,
  mediaItemRepository: MediaItemRepository,
): Promise<WriteResult<MediaItem, ContractError>> => {
  const mediaItem = await mediaItemRepository.getById(mediaItemId);
  return mediaItem ? ok(mediaItem) : fail(AppErrorCollection.mediaItem.MediaItemNotFound);
};
