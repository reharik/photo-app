import { StandardEnumItem } from '@reharik/smart-enum';
import { Knex } from 'knex';
import { CollectionInfo } from '../../types';

export const withCollectionInfo =
  <T extends StandardEnumItem & { column: string; nullsLast: string; table: string }>(
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
        collectionInfo.sortBy.nullsLast === 'false' ? 'first' : 'last',
      )
      .orderBy(`${collectionInfo.sortBy.table}.id`, 'asc');
  };
