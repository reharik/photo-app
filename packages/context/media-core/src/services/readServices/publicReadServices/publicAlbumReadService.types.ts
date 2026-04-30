import { AlbumItemSortBy, AlbumSortBy, SortDir } from '@packages/contracts';
import { CollectionInfo, EntityId, PageInfo } from '../../../types/types';
import { PublicMediaItemProjection } from './publicMediaItemReadService.types';

export type PublicAlbumListProjection = {
  nodes: PublicAlbumProjection[];
  pageInfo: PageInfo;
};

export type PublicAlbumItemListProjection = {
  nodes: PublicAlbumItemProjection[];
  pageInfo: PageInfo;
};

export type PublicAlbumProjection = {
  id: string;
  title: string;
  coverMediaId?: string;
  coverMedia?: PublicMediaItemProjection;
};

export type PublicAlbumItemProjection = {
  id: string;
  /** Sparse bigint order index as string (GraphQL-safe). */
  orderIndex: string;
  mediaItem: PublicMediaItemProjection;
};

export type PublicNamespacedMediaItemRow = {
  mediaItemId: EntityId;
  mediaItemKind: string;
  mediaItemMimeType?: string;
  mediaItemWidth?: number;
  mediaItemHeight?: number;
  mediaItemDurationSeconds?: number;
  mediaItemTitle?: string;
};

export type PublicAlbumWithCoverRow = {
  id: string;
  title: string;
} & PublicNamespacedMediaItemRow;

export type PublicAlbumItemWithMediaRow = {
  id: EntityId;
  publicAlbumItemOrderIndex: string;
} & PublicNamespacedMediaItemRow;

export interface PublicAlbumCollectionInfo extends CollectionInfo<AlbumSortBy> {
  pageInfo: PageInfo;
  sortBy: AlbumSortBy;
  sortDir: SortDir;
}

export interface PublicAlbumItemCollectionInfo extends CollectionInfo<AlbumItemSortBy> {
  pageInfo: PageInfo;
  sortBy: AlbumItemSortBy;
  sortDir: SortDir;
}
