import { AppErrorCollection, fail, ok, WriteResult } from '@packages/contracts';
import {
  Album,
  AlbumRepository,
  DBMediaItemRow,
  EntityId,
  MediaItem,
  MediaItemReadRepository,
  MediaItemRepository,
  User,
  UserRepository,
} from '../..';

export const loadRequiredAlbum = async (
  albumId: EntityId,
  albumRepository: AlbumRepository,
): Promise<WriteResult<Album>> => {
  const album = await albumRepository.getById(albumId);
  return album ? ok(album) : fail(AppErrorCollection.album.AlbumNotFound);
};

export const loadRequiredReadOnlyMediaItem = async (
  mediaItemId: EntityId,
  viewerId: EntityId,
  mediaItemReadRepository: MediaItemReadRepository,
): Promise<WriteResult<DBMediaItemRow>> => {
  const mediaItem = await mediaItemReadRepository.getForViewer({ mediaItemId, viewerId });
  if (!mediaItem) {
    return fail(AppErrorCollection.mediaItem.MediaItemNotFound);
  }

  return ok(mediaItem);
};
export const loadRequiredReadOnlyMediaItems = async (
  mediaItemIds: EntityId[],
  viewerId: EntityId,
  mediaItemReadRepository: MediaItemReadRepository,
): Promise<WriteResult<DBMediaItemRow[]>> => {
  const mediaItems = await mediaItemReadRepository.getManyForViewer({ mediaItemIds, viewerId });
  return ok(mediaItems);
};

export const loadRequiredMediaItem = async (
  mediaItemId: EntityId,
  mediaItemRepository: MediaItemRepository,
): Promise<WriteResult<MediaItem>> => {
  const mediaItem = await mediaItemRepository.getById(mediaItemId);
  return mediaItem ? ok(mediaItem) : fail(AppErrorCollection.mediaItem.MediaItemNotFound);
};

export const ensureUserExists = async (
  handle: string,
  userRepository: UserRepository,
): Promise<WriteResult<User>> => {
  const user = await userRepository.getByHandle(handle);
  return user ? ok(user) : fail(AppErrorCollection.user.UserNotFound);
};
