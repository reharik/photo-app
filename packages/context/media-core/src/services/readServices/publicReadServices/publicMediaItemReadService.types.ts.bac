import { MediaItemSortBy, SortDir } from '@packages/contracts';
import { CollectionInfo, EntityId, PageInfo } from '../../../types/types';

export type PublicMediaItemListProjection = {
  nodes: PublicMediaItemProjection[];
  pageInfo: PageInfo;
};

export type PublicMediaAssetProjection = {
  id: EntityId;
  kind: string;
  mimeType: string;
  width?: number;
  height?: number;
};

export type PublicMediaItemRow = {
  id: EntityId;
  kind: string;
  mimeType?: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
  title?: string;
};

export type PublicMediaItemProjection = PublicMediaItemRow & {
  tags: string[];
};

export interface PublicMediaItemCollectionInfo extends CollectionInfo<MediaItemSortBy> {
  pageInfo: PageInfo;
  sortBy: MediaItemSortBy;
  sortDir: SortDir;
}
