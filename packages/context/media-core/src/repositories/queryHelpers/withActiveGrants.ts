import { Knex } from 'knex';
import { EntityId } from '../../types';

export const withActiveGrants =
  (db: Knex, viewerId: EntityId) =>
  (qb: Knex.QueryBuilder): void => {
    activeGrantChecks(qb, db, viewerId, 'accessGrant');
  };

export const activeGrantChecks = (
  qb: Knex.QueryBuilder,
  db: Knex,
  viewerId: EntityId,
  table: string,
) =>
  qb
    .where(`${table}.grantedToUser`, viewerId)
    .whereNull(`${table}.revokedAt`)
    .where((b) =>
      b.whereNull(`${table}.expiresAt`).orWhere(`${table}.expiresAt`, '>', db.raw('now()')),
    );
