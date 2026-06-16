import type { SortDir } from '@packages/contracts';
import { StandardEnumItem } from '@reharik/smart-enum';

export type EntityId = string;
export type ActorId = string;

export type StripFactory<T> = {
  [K in keyof T as K extends `${infer Name}Factory`
    ? Name
    : // eslint-disable-next-line @typescript-eslint/no-explicit-any
      never]: T[K] extends (...args: any[]) => infer R ? R : never;
};

export type CollectionInfo<T extends StandardEnumItem & { column: string }> = {
  pageInfo: PageInfo;
  sortBy: T;
  sortDir: SortDir;
};

export type PageInfo = {
  limit: number;
  offset: number;
};
