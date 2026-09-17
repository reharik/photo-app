import { StandardEnumItem } from '@reharik/smart-enum';
import { Knex } from 'knex';
import { CollectionInfo } from '../../types';

export const withCollectionInfo =
  <T extends StandardEnumItem & { column: string; nulls: string; table: string }>(
    db: Knex,
    collectionInfo: CollectionInfo<T>,
  ) =>
  (qb: Knex.QueryBuilder): void => {
    qb.select(db.raw('COUNT(*) OVER ()::int AS "totalCount"'))
      .limit(collectionInfo.pageInfo.limit)
      .offset(collectionInfo.pageInfo.offset)
      .orderBy(
        `${collectionInfo.sortBy.table}.${collectionInfo.sortBy.column}`,
        collectionInfo.sortDir.value,
        collectionInfo.sortBy.nulls,
      )
      .orderBy(`${collectionInfo.sortBy.table}.id`, 'asc');
  };
