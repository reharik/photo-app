import { AlbumMemberRole } from '@packages/contracts';
import { EntityId } from '../../../types';

export type CreateAlbumCommand = {
  title: string;
  description?: string;
};

export type CreateAlbumResult = {
  albumId: EntityId;
};

export type AddAlbumItemCommand = {
  albumId: EntityId;
  mediaItemId: EntityId;
};

export type AddAlbumItemResult = {
  albumId: EntityId;
  albumItemId: EntityId;
};

export type DeleteAlbumItemsCommand = {
  albumId: EntityId;
  albumItemIds: EntityId[];
};

export type DeleteAlbumItemsResult = {
  albumId: EntityId;
  albumItemIds: EntityId[];
};

export type ReorderAlbumItemsCommand = {
  albumId: EntityId;
  /** Desired order (album item ids, complete permutation of the album’s items). */
  albumItemIds: EntityId[];
};

export type ReorderAlbumItemsResult = {
  albumId: EntityId;
};

export type DeleteAlbumCommand = {
  albumId: EntityId;
};

export type DeleteAlbumResult = {
  albumId: EntityId;
};

export type SetCoverMediaCommand = {
  albumId: EntityId;
  albumItemId: EntityId;
};

export type SetCoverMediaResult = {
  albumId: EntityId;
};

export type UnsetCoverMediaCommand = {
  albumId: EntityId;
};

export type UnsetCoverMediaResult = {
  albumId: EntityId;
};

export type NewAlbumInAddMediaItems = {
  title: string;
  description?: string;
};

export type AddMediaItemsToAlbumCommand = {
  mediaItemIds: EntityId[];
  albumId?: EntityId;
  newAlbum?: NewAlbumInAddMediaItems;
};

export type AddMediaItemsToAlbumResult = {
  albumId: EntityId;
  albumItemIds: EntityId[];
};

export type AddAlbumMembersCommand = {
  albumId: string;
  userIds: EntityId[];
  role: AlbumMemberRole;
};

export type AddAlbumMembersResult = {
  albumId: EntityId;
  albumMemberIds: EntityId[];
};

export type RemoveAlbumMembersCommand = {
  albumId: string;
  albumMemberIds: EntityId[];
};

export type RemoveAlbumMembersResult = {
  albumId: EntityId;
  albumMemberIds: EntityId[];
};
