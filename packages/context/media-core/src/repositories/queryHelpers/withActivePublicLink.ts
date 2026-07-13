import { Knex } from 'knex';

export const withActivePublicLink =
  (db: Knex, albumId: string, publicLinkId: string) =>
  (qb: Knex.QueryBuilder): void => {
    qb.whereExists(
      db
        .select(db.raw('1'))
        .from('accessGrant as ag')
        .where('ag.albumId', albumId)
        .where('ag.id', publicLinkId)
        .whereNull('ag.revokedAt')
        .andWhere((expiry) => {
          expiry.whereNull('ag.expiresAt').orWhere('ag.expiresAt', '>', db.raw('now()'));
        }),
    );
  };
