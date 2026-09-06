import { AuthorizationKind } from '@packages/contracts';
import { Knex } from 'knex';
import { withLiveAuthorizationFilter } from './withLiveAuthorizationFilter';

export const withActivePublicLink =
  (db: Knex, albumId: string, publicLinkId: string) =>
  (qb: Knex.QueryBuilder): void => {
    qb.whereExists(
      db
        .select(db.raw('1'))
        .from('accessGrant as ag')
        .where('ag.albumId', albumId)
        .where('ag.id', publicLinkId)
        .whereIn('ag.kind', [AuthorizationKind.public.value, AuthorizationKind.pending.value])
        .modify(withLiveAuthorizationFilter(db, 'ag')),
    );
  };
