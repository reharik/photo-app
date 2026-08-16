import { Knex } from 'knex';
import { EntityId } from '../../types';

export const withLiveAuthorizationFilter =
  (db: Knex, table = 'accessGrant') =>
  (qb: Knex.QueryBuilder): void => {
    qb.whereNull(`${table}.revokedAt`).where((b) =>
      b.whereNull(`${table}.expiresAt`).orWhere(`${table}.expiresAt`, '>', db.raw('now()')),
    );
  };

export const withActiveGrants =
  (db: Knex, viewerId: EntityId, table?: string) =>
  (qb: Knex.QueryBuilder): void => {
    qb.where(`${table}.grantedToUser`, viewerId).modify(withLiveAuthorizationFilter(db, table));
  };
