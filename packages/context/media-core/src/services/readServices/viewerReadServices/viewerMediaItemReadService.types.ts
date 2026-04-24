import { MediaItemSortBy, SortDir } from '@packages/contracts';
import { CollectionInfo, EntityId, PageInfo } from '../../../types/types';

export type MediaItemListProjection = {
  nodes: MediaItemProjection[];
  pageInfo: PageInfo;
};

export type MediaAssetProjection = {
  id: EntityId;
  kind: string;
  url: string;
  mimeType: string;
  width?: number;
  height?: number;
  fileSizeBytes?: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export type MediaItemRow = {
  id: EntityId;
  ownerId: EntityId;
  kind: string;
  status: string;
  mimeType?: string;
  sizeBytes?: number;
  originalFileName?: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
  title?: string;
  description?: string;
  takenAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type MediaItemProjection = MediaItemRow & {
  tags: string[];
};

export interface MediaItemCollectionInfo extends CollectionInfo<MediaItemSortBy> {
  pageInfo: PageInfo;
  sortBy: MediaItemSortBy;
  sortDir: SortDir;
}
