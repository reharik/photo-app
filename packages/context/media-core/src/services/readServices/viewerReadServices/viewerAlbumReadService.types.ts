import {
  AlbumItemSortBy,
  AlbumMemberRole,
  AlbumSortBy,
  MediaItemStatus,
  MediaKind,
  SharePermission,
  SortDir,
  ViewerOperation,
} from '@packages/contracts';
import { CollectionInfo, EntityId, PageInfo } from '../../../types/types';
import {
  AuthzDecoratedItemProjection,
  MediaItemProjection,
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
  viewerMemberRole?: AlbumMemberRole;
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
  viewerOperations: ViewerOperation[];
  mediaItem: MediaItemProjection & AuthzDecoratedItemProjection;
};

export type NamespacedMediaItemRow = {
  mediaItemId: EntityId;
  mediaItemOwnerId: EntityId;
  mediaItemKind: MediaKind;
  mediaItemStatus: MediaItemStatus;
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
  viewerMemberRole?: AlbumMemberRole;
} & NamespacedMediaItemRow;

export type AlbumItemWithMediaRow = {
  id: EntityId;
  albumItemOrderIndex: string;
  createdAt: Date;
  updatedAt: Date;
  viewerMemberRole?: AlbumMemberRole;
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

export type AuthorizationProjection = {
  id: EntityId;
  grantedToUserId?: EntityId;
  permission: SharePermission;
  label?: string;
  expiresAt?: Date;
  revokedAt?: Date;
  createdAt?: Date;
};

export type SharedWithMeItemProjection = {
  id: EntityId;
  sharedAt: Date;
  sharedBy: EntityId;
  mediaItem: MediaItemProjection;
};

export type NestedItemProjection = { id: string; mediaItem: MediaItemProjection };
