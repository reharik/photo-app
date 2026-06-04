import { SortDir } from '@packages/contracts';
import type { CollectionInfo } from '@packages/media-core';
import { type StandardEnumItem } from '@reharik/smart-enum';
import type { PageInfoInput } from '../generated/types.generated';

type GraphQlCollectionInfoInput<TSortByItem> = {
  pageInfo: PageInfoInput;
  sortBy: TSortByItem;
  sortDir: SortDir;
};

export const standardizeCollectionInput = <
  TSortByItem extends StandardEnumItem & { column: string },
>(
  input: GraphQlCollectionInfoInput<TSortByItem>,
): CollectionInfo<TSortByItem> => {
  const limit = Math.min(input.pageInfo.limit ?? 10, 100);
  const offset = input.pageInfo.offset ?? 0;

  if (input.sortBy == undefined || input.sortDir == undefined) {
    throw new Error('Invalid collection input: enum revival failed');
  }

  return {
    pageInfo: {
      limit,
      offset,
    },
    sortBy: input.sortBy,
    sortDir: input.sortDir,
  };
};
