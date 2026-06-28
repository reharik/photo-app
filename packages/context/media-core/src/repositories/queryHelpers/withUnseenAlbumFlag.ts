import { UnseenActivityType } from '@packages/contracts';
import { Knex } from 'knex';
import { EntityId } from '../../types';

// queryFragments/unseenActivity.ts
export const withUnseenAlbumFlag =
  (db: Knex, viewerId: EntityId, kinds?: UnseenActivityType[]) =>
  (qb: Knex.QueryBuilder): void => {
    qb.select(
      db('unseenActivity as ua')
        .select(db.raw('1'))
        .whereRaw('ua.album_id = album.id')
        .where('ua.viewer_id', viewerId)
        .modify((sub) => {
          if (kinds) sub.whereIn('ua.activity_kind', kinds);
        })
        .as('has_unseen'),
    );
  };
