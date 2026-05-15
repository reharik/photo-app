import { AppErrorCollection } from '@packages/contracts';
import {
  Album,
  AlbumRepository,
  EntityId,
  MediaItem,
  MediaItemReadRepository,
  MediaItemRepository,
  MediaItemRow,
  ReadReactionService,
  User,
  UserRepository,
  WriteResult,
} from '../..';
import { fail, ok } from '../../domain/utilities/writeResponse';

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
  readReactionService: ReadReactionService,
): Promise<WriteResult<MediaItemRow>> => {
  const mediaItem = await mediaItemReadRepository.getForViewer({ mediaItemId, viewerId });
  if (!mediaItem) {
    return fail(AppErrorCollection.mediaItem.MediaItemNotFound);
  }
  const mediaItemWithReactions = readReactionService.withReactions([mediaItem]);
  return ok(mediaItemWithReactions[0]);
};
export const loadRequiredReadOnlyMediaItems = async (
  mediaItemIds: EntityId[],
  viewerId: EntityId,
  mediaItemReadRepository: MediaItemReadRepository,
  readReactionService: ReadReactionService,
): Promise<WriteResult<MediaItemRow[]>> => {
  const mediaItems = await mediaItemReadRepository.getManyForViewer({ mediaItemIds, viewerId });
  const mediaItemsWithReactions = readReactionService.withReactions(mediaItems);
  return mediaItemsWithReactions.length > 0
    ? ok(mediaItemsWithReactions)
    : fail(AppErrorCollection.mediaItem.MediaItemsNotFound);
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
