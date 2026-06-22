import { EntityId } from '../../../types';

export type CreateAlbumCommand = {
  viewerId: string;
  title: string;
  description?: string;
};

export type CreateAlbumResult = {
  albumId: EntityId;
};

export type AddAlbumItemCommand = {
  viewerId: EntityId;
  albumId: EntityId;
  mediaItemId: EntityId;
};

export type AddAlbumItemResult = {
  albumId: EntityId;
  albumItemId: EntityId;
};

export type DeleteAlbumItemsCommand = {
  viewerId: EntityId;
  albumId: EntityId;
  albumItemIds: EntityId[];
};

export type DeleteAlbumItemsResult = {
  albumId: EntityId;
  albumItemIds: EntityId[];
};

export type ReorderAlbumItemsCommand = {
  viewerId: EntityId;
  albumId: EntityId;
  /** Desired order (album item ids, complete permutation of the album’s items). */
  albumItemIds: EntityId[];
};

export type ReorderAlbumItemsResult = {
  albumId: EntityId;
};

export type DeleteAlbumCommand = {
  viewerId: EntityId;
  albumId: EntityId;
};

export type DeleteAlbumResult = {
  albumId: EntityId;
};

export type SetCoverMediaCommand = {
  viewerId: EntityId;
  albumId: EntityId;
  albumItemId: EntityId;
};

export type SetCoverMediaResult = {
  albumId: EntityId;
};

export type UnsetCoverMediaCommand = {
  viewerId: EntityId;
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
  viewerId: EntityId;
  mediaItemIds: EntityId[];
  albumId?: EntityId;
  newAlbum?: NewAlbumInAddMediaItems;
};

export type AddMediaItemsToAlbumResult = {
  albumId: EntityId;
  albumItemIds: EntityId[];
};
