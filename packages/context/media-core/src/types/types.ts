import type { SortDir } from '@packages/contracts';
import { StandardEnumItem } from '@reharik/smart-enum';

export type EntityId = string;
export type ActorId = string;

export type CollectionInfo<T extends StandardEnumItem & { column: string }> = {
  pageInfo: PageInfo;
  sortBy: T;
  sortDir: SortDir;
};

export type PageInfo = {
  limit: number;
  offset: number;
};
