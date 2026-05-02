import { AlbumItemSortBy, AlbumSortBy, SortDir } from '@packages/contracts';
import { CollectionInfo, EntityId, PageInfo } from '../../../types/types';
import {
  MediaItemProjection,
  AuthzDecoratedItemProjection,
} from './viewerMediaItemReadService.types';

export type AlbumListProjection = {
  nodes: AlbumProjection[];
  pageInfo: PageInfo;
};

export type AlbumItemListProjection = {
  nodes: AlbumItemProjection[];
  pageInfo: PageInfo;
};

export type AlbumProjection = {
  id: string;
  viewerMemberRole?: string;
  title: string;
  description?: string;
  coverMediaId?: string;
  coverMedia?: MediaItemProjection;
  createdAt: Date;
  updatedAt: Date;
};

export type AlbumItemProjection = {
  id: string;
  /** Sparse bigint order index as string (GraphQL-safe). */
  orderIndex: string;
  createdAt: Date;
  updatedAt: Date;
  mediaItem: MediaItemProjection;
};

export type DecoratedAlbumItemProjection = {
  id: string;
  /** Sparse bigint order index as string (GraphQL-safe). */
  orderIndex: string;
  createdAt: Date;
  updatedAt: Date;
  viewerOperations: string[];
  mediaItem: MediaItemProjection & AuthzDecoratedItemProjection;
};

export type NamespacedMediaItemRow = {
  mediaItemId: EntityId;
  mediaItemOwnerId: EntityId;
  mediaItemKind: string;
  mediaItemStatus: string;
  mediaItemMimeType?: string;
  mediaItemSizeBytes?: number;
  mediaItemOriginalFileName?: string;
  mediaItemWidth?: number;
  mediaItemHeight?: number;
  mediaItemDurationSeconds?: number;
  mediaItemTitle?: string;
  mediaItemDescription?: string;
  mediaItemTakenAt?: Date;
  mediaItemCreatedAt: Date;
  mediaItemUpdatedAt: Date;
};

export type AlbumWithCoverRow = {
  id: string;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  viewerMemberRole?: string;
} & NamespacedMediaItemRow;

export type AlbumItemWithMediaRow = {
  id: EntityId;
  albumItemOrderIndex: string;
  createdAt: Date;
  updatedAt: Date;
} & NamespacedMediaItemRow;

export interface AlbumCollectionInfo extends CollectionInfo<AlbumSortBy> {
  pageInfo: PageInfo;
  sortBy: AlbumSortBy;
  sortDir: SortDir;
}

export interface AlbumItemCollectionInfo extends CollectionInfo<AlbumItemSortBy> {
  pageInfo: PageInfo;
  sortBy: AlbumItemSortBy;
  sortDir: SortDir;
}
