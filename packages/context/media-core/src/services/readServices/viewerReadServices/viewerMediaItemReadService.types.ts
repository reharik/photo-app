import {
  MediaAssetKind,
  MediaAssetStatus,
  MediaItemSortBy,
  MediaItemStatus,
  MediaKind,
  SortDir,
  ViewerOperation,
} from '@packages/contracts';
import { CollectionInfo, EntityId, PageInfo } from '../../../types/types';

export type MediaItemListProjection = {
  nodes: MediaItemProjection[];
  pageInfo: PageInfo;
};

export type MediaAssetProjection = {
  id: EntityId;
  kind: MediaAssetKind;
  url: string;
  mimeType: string;
  width?: number;
  height?: number;
  fileSizeBytes?: number;
  status: MediaAssetStatus;
  createdAt: Date;
  updatedAt: Date;
};

export interface MediaItemRow {
  id: EntityId;
  ownerId: EntityId;
  kind: MediaKind;
  status: MediaItemStatus;
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
}

export interface MediaItemProjection extends MediaItemRow {
  tags: string[];
}

export interface MediaItemCollectionInfo extends CollectionInfo<MediaItemSortBy> {
  pageInfo: PageInfo;
  sortBy: MediaItemSortBy;
  sortDir: SortDir;
}

export interface AuthzDecoratedItemProjection {
  id: EntityId;
  ownerId: EntityId;
  viewerIsOwner: boolean;
  viewerOperations: ViewerOperation[];
}
