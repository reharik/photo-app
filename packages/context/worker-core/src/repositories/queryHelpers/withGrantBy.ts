import { Knex } from 'knex';

const accessGrantFieldSelect = [
  'accessGrant.id as grantId',
  'accessGrant.createdAt as sharedAt',
  'accessGrant.grantedBy as sharedBy',
  'granter.firstName as sharedByFirstName',
  'granter.lastName as sharedByLastName',
];

export const withGrantedBy =
  (tableName: 'album' | 'mediaItem') =>
  (qb: Knex.QueryBuilder): void => {
    // 'accessGrant.' + tableName + 'Id' is constructing the specific key to use
    // based on what the target table name is. it looks a bit weird
    // and like accessGrant ( which is a table name ) + tableName is a typo, but it's intended.
    qb.leftJoin('user as granter', 'granter.id', 'accessGrant.grantedBy')
      .whereNotNull('accessGrant.' + tableName + 'Id')
      .select(...accessGrantFieldSelect);
  };
